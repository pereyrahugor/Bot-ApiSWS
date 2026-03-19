import path from 'path';
import fs from 'fs';
import bodyParser from 'body-parser';
import { backofficeAuth } from "../middleware/auth";

/**
 * Registra las rutas del backoffice en la instancia de Polka.
 */
export interface BackofficeDependencies {
    adapterProvider: any;
    HistoryHandler: any;
    openaiMain: any;
    upload: any;
}

/** Función unificada para procesar el envío de mensajes e historial */
export const processSendMessage = async (
    req: any, 
    res: any, 
    chatId: string, 
    message: string, 
    file: any,
    deps: BackofficeDependencies
) => {
    const { adapterProvider, HistoryHandler, openaiMain } = deps;
    // 1. Determinar tipo y contenido
    let finalType: 'text' | 'image' | 'video' | 'document' = 'text';
    if (file) {
        if (file.mimetype.startsWith('image/')) finalType = 'image';
        else if (file.mimetype.startsWith('video/')) finalType = 'video';
        else finalType = 'document';
    }
    
    const fileUrl = file ? `/uploads/${file.filename}` : '';
    const finalContent = file ? fileUrl : (message || '');

    try {
        if (!adapterProvider) {
            return res.status(503).json({ success: false, error: 'WhatsApp provider not initialized' });
        }

        console.log(`[BACKOFFICE] Procesando envío para ${chatId}...`);
        
        // 2. GUARDAR PRIMERO (Feedback instantáneo)
        await HistoryHandler.saveMessage(chatId, 'assistant', finalContent, finalType);
        
        // Actualizar el timestamp de último mensaje humano para el worker de inactividad
        // En Bot-ApiSWS el HistoryHandler.saveMessage ya actualiza last_message_at,
        // pero necesitamos resetear el timer de inactividad si el humano interviene.
        await HistoryHandler.updateLastHumanMessage(chatId);

        // 3. Inyectar en thread OpenAI (silencioso)
        HistoryHandler.getThreadId(chatId).then((threadId: string) => {
            if (threadId && (message || file)) {
                openaiMain.beta.threads.messages.create(threadId, {
                    role: 'assistant',
                    content: `[Mensaje enviado por operador humano]: ${message || '[Media]'}`
                }).catch((e: any) => console.error('[BACKOFFICE] Error inyectando contexto OpenAI:', e));
            }
        }).catch(() => {});

        // 4. ENVIAR A WHATSAPP
        try {
            const jid = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;
            if (file) {
                const absolutePath = path.resolve(file.path);
                if (finalType === 'image') {
                    if (typeof adapterProvider.sendImage === 'function') {
                        await adapterProvider.sendImage(jid, absolutePath, message || '');
                    } else {
                        await adapterProvider.sendMessage(jid, message || '', { media: absolutePath });
                    }
                } else if (finalType === 'video') {
                    if (typeof (adapterProvider as any).sendVideo === 'function') {
                        await (adapterProvider as any).sendVideo(jid, absolutePath, message || '');
                    } else {
                        await adapterProvider.sendMessage(jid, message || '', { media: absolutePath });
                    }
                } else {
                    if (typeof (adapterProvider as any).sendFile === 'function') {
                        await (adapterProvider as any).sendFile(jid, absolutePath, message || file.originalname);
                    } else {
                        await adapterProvider.sendMessage(jid, message || '', { media: absolutePath, fileName: file.originalname });
                    }
                }
            } else {
                await adapterProvider.sendMessage(jid, message, {});
            }
            res.json({ success: true, fileUrl: file ? fileUrl : undefined });
        } catch (waError) {
            console.error('[BACKOFFICE] Error enviando a Whatsapp:', waError);
            res.json({ 
                success: true, 
                fileUrl: file ? fileUrl : undefined,
                warning: 'El mensaje se guardó en el historial pero falló el envío a WhatsApp (¿Bot conectado?)' 
            });
        }

    } catch (e: any) {
        console.error('❌ Error crítico en processSendMessage:', e);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: e.message });
        }
    }
};

/**
 * Registra las rutas del backoffice en la instancia de Polka.
 */
export const registerBackofficeRoutes = (app: any, deps: BackofficeDependencies) => {
    const { adapterProvider, HistoryHandler, openaiMain, upload } = deps;

    // --- AUTH ---

    app.post('/api/backoffice/auth', bodyParser.json(), (req: any, res: any) => {
        const { token } = req.body;
        const serverToken = process.env.BACKOFFICE_TOKEN || 'RIALWAY_PASS_2024';
        if (token === serverToken) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, error: "Invalid token" });
        }
    });

    // --- CHATS & MESSAGES ---

    app.get('/api/backoffice/chats', backofficeAuth, async (req: any, res: any) => {
        const chats = await HistoryHandler.listChats();
        res.json(chats);
    });

    app.get('/api/backoffice/messages/:chatId', backofficeAuth, async (req: any, res: any) => {
        const messages = await HistoryHandler.getMessages(req.params.chatId);
        res.json(messages);
    });

    app.get('/api/backoffice/profile-pic/:chatId', async (req: any, res: any) => {
        try {
            const { chatId } = req.params;
            const token = req.query.token as string;

            if (token !== (process.env.BACKOFFICE_TOKEN || 'RIALWAY_PASS_2024')) {
                res.status(401).end();
                return;
            }

            if (!adapterProvider) {
                res.status(500).end();
                return;
            }

            let jid = chatId;
            if (chatId.match(/^\d+$/) && !chatId.includes('@')) {
                jid = `${chatId}@s.whatsapp.net`;
            }

            const vendor = (adapterProvider as any).vendor || adapterProvider.globalVendorArgs?.sock;
            if (vendor && typeof vendor.profilePictureUrl === 'function') {
                try {
                    const url = await vendor.profilePictureUrl(jid, 'image');
                    if (url) {
                        res.writeHead(302, { Location: url });
                        return res.end();
                    }
                } catch (picError) {}
            }
            
            res.status(404).end();
        } catch (e) {
            console.error('[ProfilePic] Error:', e);
            res.status(500).end();
        }
    });

    // --- SEND MESSAGE & TOGGLE BOT ---

    app.post('/api/backoffice/send-message', backofficeAuth, (req: any, res: any) => {
        upload.single('file')(req, res, (err: any) => {
            if (err) {
                console.error("❌ [BACKOFFICE] Error de Multer:", err);
                return res.status(400).json({ success: false, error: `Error de archivo: ${err.message}` });
            }
            const { chatId, message } = req.body;
            if (!chatId) return res.status(400).json({ success: false, error: 'chatId is required' });
            
            processSendMessage(req, res, chatId, message, (req as any).file, deps);
        });
    });

    app.post('/api/backoffice/toggle-bot', backofficeAuth, bodyParser.json(), async (req: any, res: any) => {
        const { chatId, enabled } = req.body;
        if (!chatId) return res.status(400).json({ success: false, error: 'chatId is required' });
        
        try {
            await HistoryHandler.toggleBot(chatId, enabled);
            // Notificar via socket se hace fuera o inyectando el Manager
            if (app.io) {
                app.io.emit('bot_toggled', { chatId, enabled });
            }
            res.json({ success: true, enabled });
        } catch (e: any) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    // --- TAGS ---

    app.get('/api/backoffice/tags', backofficeAuth, async (req: any, res: any) => {
        const tags = await HistoryHandler.getTags();
        res.json(tags);
    });

    app.post('/api/backoffice/tags', backofficeAuth, bodyParser.json(), async (req: any, res: any) => {
        const { name, color } = req.body;
        const result = await HistoryHandler.createTag(name, color);
        res.json(result);
    });

    app.put('/api/backoffice/tags/:id', backofficeAuth, bodyParser.json(), async (req: any, res: any) => {
        const { name, color } = req.body;
        const result = await HistoryHandler.updateTag(req.params.id, name, color);
        res.json(result);
    });

    app.delete('/api/backoffice/tags/:id', backofficeAuth, async (req: any, res: any) => {
        const result = await HistoryHandler.deleteTag(req.params.id);
        res.json(result);
    });

    app.post('/api/backoffice/chats/:chatId/tags', backofficeAuth, bodyParser.json(), async (req: any, res: any) => {
        const { tagId } = req.body;
        const result = await HistoryHandler.addTagToChat(req.params.chatId, tagId);
        res.json(result);
    });

    app.delete('/api/backoffice/chats/:chatId/tags/:tagId', backofficeAuth, async (req: any, res: any) => {
        const result = await HistoryHandler.removeTagFromChat(req.params.chatId, req.params.tagId);
        res.json(result);
    });
};
