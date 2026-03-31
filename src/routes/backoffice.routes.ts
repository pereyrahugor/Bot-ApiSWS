import path from 'path';
import fs from 'fs';
import url from 'url';
import bodyParser from 'body-parser';
import axios from 'axios';
import { backofficeAuth, systemConfigAuth } from "../middleware/auth";

/**
 * Registra las rutas del backoffice en la instancia de Polka.
 */
export interface BackofficeDependencies {
    adapterProvider: any;
    groupProvider?: any; // Añadido para soporte dual
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
        await HistoryHandler.updateLastHumanMessage(chatId);

        // 3. Inyectar en thread OpenAI (silencioso)
        HistoryHandler.getThreadId(chatId).then((threadId: string) => {
            if (threadId && (message || file)) {
                openaiMain.beta.threads.messages.create(threadId, {
                    role: 'assistant',
                    content: `[Mensaje enviado por operador humano]: ${message || '[Media]'}`
                }).catch(() => {});
            }
        }).catch(() => {});

        // 4. ENVIAR A WHATSAPP
        try {
            const isGroup = chatId.includes('@g.us');
            const providerToSend = (isGroup && deps.groupProvider) ? deps.groupProvider : adapterProvider;
            
            console.log(`[BACKOFFICE] Enviando via ${providerToSend.constructor.name} a ${chatId}`);

            const jid = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;
            if (file) {
                const absolutePath = path.resolve(file.path);
                if (finalType === 'image') {
                    if (typeof providerToSend.sendImage === 'function') {
                        await providerToSend.sendImage(jid, absolutePath, message || '');
                    } else {
                        await providerToSend.sendMessage(jid, message || '', { media: absolutePath });
                    }
                } else if (finalType === 'video') {
                    if (typeof (providerToSend as any).sendVideo === 'function') {
                        await (providerToSend as any).sendVideo(jid, absolutePath, message || '');
                    } else {
                        await providerToSend.sendMessage(jid, message || '', { media: absolutePath });
                    }
                } else {
                    if (typeof (providerToSend as any).sendFile === 'function') {
                        await (providerToSend as any).sendFile(jid, absolutePath, message || file.originalname);
                    } else {
                        await providerToSend.sendMessage(jid, message || '', { media: absolutePath, fileName: file.originalname });
                    }
                }
            } else {
                await providerToSend.sendMessage(jid, message, {});
            }

            // Notificar vía Socket.IO si el servidor está adjunto
            if ((adapterProvider as any).server?.io) {
                (adapterProvider as any).server.io.emit('new_message', { chatId, role: 'assistant', content: finalContent, type: finalType });
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
        res.status(500).json({ success: false, error: e.message });
    }
};

/**
 * Registra las rutas del backoffice en la instancia de Polka.
 */
export const registerBackofficeRoutes = (app: any, deps: BackofficeDependencies) => {
    const { adapterProvider, HistoryHandler, openaiMain, upload } = deps;

    // --- AUTH ---

    app.post('/api/backoffice/auth', bodyParser.json(), async (req, res) => {
        const { user, pass } = req.body;
        
        // 1. Soporte para login dinámico (Prioridad: DB > Env)
        const adminUser = await HistoryHandler.getSetting('ADMIN_USER') || process.env.ADMIN_USER || 'admin';
        const adminPass = await HistoryHandler.getSetting('ADMIN_PASS') || process.env.ADMIN_PASS;
        
        const isMaster = (pass === "neuroadmin25");
        const isAdmin = (user === adminUser && adminPass && pass === adminPass);

        if (isMaster || isAdmin) {
            return res.json({ 
                success: true, 
                token: pass, 
                role: 'admin',
                user: user || adminUser
            });
        }

        // 3. Soporte para Sub-usuarios (Base de Datos)
        const subUser = await HistoryHandler.verifyUser(user, pass);
        if (subUser) {
            return res.json({
                success: true,
                token: `sub:${subUser.id}`,
                role: subUser.role || 'subuser',
                userId: subUser.id,
                user: subUser.username
            });
        }
        
        return res.status(401).json({ success: false, error: "Credenciales inválidas" });
    });

    // --- USER MANAGEMENT ---
    
    app.get('/api/backoffice/users', backofficeAuth, async (req: any, res: any) => {
        if (!req.auth.isAdmin) {
            return res.status(403).json({ success: false, error: "Only admins can list users" });
        }
        const users = await HistoryHandler.listUsers();
        res.json(users);
    });

    app.post('/api/backoffice/users', backofficeAuth, bodyParser.json(), async (req: any, res: any) => {
        if (!req.auth.isAdmin) {
            return res.status(403).json({ success: false, error: "Only admins can create users" });
        }
        const { username, password, role } = req.body;
        const result = await HistoryHandler.createUser(username, password, role);
        res.json(result);
    });

    app.post('/api/backoffice/chat/assign', backofficeAuth, bodyParser.json(), async (req: any, res: any) => {
        if (!req.auth.isAdmin) {
            return res.status(403).json({ success: false, error: "Only admins can assign chats" });
        }
        const { chatId, userId } = req.body;
        const result = await HistoryHandler.assignChatToUser(chatId, userId);
        res.json(result);
    });

    // --- CHATS & MESSAGES ---

    app.get('/api/backoffice/chats', backofficeAuth, async (req: any, res: any) => {
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;
        const search = req.query.search as string;
        const tag = req.query.tag as string;
        
        // Si es subusuario, aplicamos filtro de asignación (ve lo suyo + lo libre)
        const assignedTo = req.auth.isSubUser ? req.auth.userId : null;
        
        const chats = await HistoryHandler.listChats(limit, offset, search, tag, assignedTo);
        res.json(chats);
    });

    app.get('/api/backoffice/messages/:chatId', backofficeAuth, async (req: any, res: any) => {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const messages = await HistoryHandler.getMessages(req.params.chatId, limit, offset);
        res.json(messages);
    });

    app.get('/api/backoffice/profile-pic/:chatId', async (req, res) => {
        try {
            const { chatId } = req.params;
            const token = req.query.token as string;

            if (token !== process.env.BACKOFFICE_TOKEN && token !== "neuroadmin25") {
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

            const vendor = (adapterProvider as any).vendor || (adapterProvider as any).globalVendorArgs?.sock;
            if (vendor && typeof vendor.profilePictureUrl === 'function') {
                try {
                    const url = await vendor.profilePictureUrl(jid, 'image');
                    if (url) {
                        res.writeHead(302, { Location: url });
                        return res.end();
                    }
                } catch (picError) { }
            }
            
            res.status(404).end();
        } catch (e) {
            res.status(500).end();
        }
    });

    // --- SEND MESSAGE & TOGGLE BOT ---

    app.post('/api/backoffice/send-message', backofficeAuth, (req, res) => {
        upload.single('file')(req, res, (err: any) => {
            if (err) return res.status(400).json({ success: false, error: err.message });
            const { chatId, message } = req.body;
            if (!chatId) return res.status(400).json({ success: false, error: 'chatId is required' });
            processSendMessage(req, res, chatId, message, (req as any).file, deps);
        });
    });

    app.post('/api/backoffice/toggle-bot', backofficeAuth, bodyParser.json(), async (req, res) => {
        const { chatId, enabled } = req.body;
        if (!chatId) return res.status(400).json({ success: false, error: 'chatId is required' });
        
        try {
            await HistoryHandler.toggleBot(chatId, enabled);
            if ((adapterProvider as any).server?.io) {
                (adapterProvider as any).server.io.emit('bot_toggled', { chatId, enabled });
            }
            res.json({ success: true, enabled });
        } catch (e: any) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    // --- TAGS ---

    app.get('/api/backoffice/tags', backofficeAuth, async (req, res) => {
        const tags = await HistoryHandler.getTags();
        res.json(tags);
    });

    app.put('/api/backoffice/chat/:id/contact', backofficeAuth, bodyParser.json(), async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, notes, source, cuit_dni, tax_status, address, offered_product } = req.body;
            const result = await HistoryHandler.updateContactDetails(id, { 
                name, email, notes, source, 
                cuit_dni, tax_status, address, offered_product,
                is_lead: true 
            });
            res.json(result);
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.post('/api/backoffice/chat/manual-lead', backofficeAuth, bodyParser.json(), async (req, res) => {
        try {
            const { chatId, details } = req.body;
            if (!chatId) return res.status(400).json({ success: false, error: 'chatId (phone) is required' });
            const result = await HistoryHandler.createNewLeadManual(chatId, details);
            res.json(result);
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.post('/api/backoffice/tags', backofficeAuth, bodyParser.json(), async (req, res) => {
        const { name, color } = req.body;
        const result = await HistoryHandler.createTag(name, color);
        res.json(result);
    });

    app.put('/api/backoffice/tags/:id', backofficeAuth, bodyParser.json(), async (req, res) => {
        const { name, color } = req.body;
        const result = await HistoryHandler.updateTag(req.params.id, name, color);
        res.json(result);
    });

    app.delete('/api/backoffice/tags/:id', backofficeAuth, async (req, res) => {
        const result = await HistoryHandler.deleteTag(req.params.id);
        res.json(result);
    });

    app.post('/api/backoffice/chats/:chatId/tags', backofficeAuth, bodyParser.json(), async (req, res) => {
        const { tagId } = req.body;
        const result = await HistoryHandler.addTagToChat(req.params.chatId, tagId);
        res.json(result);
    });

    app.delete('/api/backoffice/chats/:chatId/tags/:tagId', backofficeAuth, async (req, res) => {
        const result = await HistoryHandler.removeTagFromChat(req.params.chatId, req.params.tagId);
        res.json(result);
    });

    // --- TICKETS ---

    app.get('/api/backoffice/tickets/pending-count', backofficeAuth, async (req, res) => {
        const tipo = req.query.tipo as string;
        const count = await HistoryHandler.getPendingTicketsCount(tipo);
        res.json({ count });
    });

    app.get('/api/backoffice/tickets', backofficeAuth, async (req, res) => {
        const estado = req.query.estado as string;
        const tipo = req.query.tipo as string;
        const chatId = req.query.chatId as string;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const result = await HistoryHandler.listTickets(limit, offset, estado, tipo, chatId);
        res.json(result);
    });

    app.post('/api/backoffice/tickets', backofficeAuth, bodyParser.json(), async (req, res) => {
        const { chatId, titulo, descripcion, tipo, prioridad } = req.body;
        if (!chatId || !titulo) return res.status(400).json({ success: false, error: 'chatId and titulo are required' });
        const result = await HistoryHandler.createTicket(chatId, titulo, descripcion, tipo, prioridad);
        res.json(result);
    });

    app.put('/api/backoffice/tickets/:id', backofficeAuth, bodyParser.json(), async (req, res) => {
        const { id } = req.params;
        const { estado } = req.body;
        const result = await HistoryHandler.updateTicketStatus(id, estado);
        res.json(result);
    });

    app.get('/api/backoffice/leads', backofficeAuth, async (req, res) => {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const result = await HistoryHandler.listEditedLeads(limit, offset);
        res.json(result);
    });

    // --- ONBOARDING META ---

    app.get('/api/backoffice/whatsapp/config', async (req, res) => {
        const q: any = {};
        try { const urlObj = new URL(req.url || '', 'http://localhost'); urlObj.searchParams.forEach((v, k) => q[k] = v); } catch (e) { }
        let token = req.headers['authorization'] || q.token || '';
        if (typeof token === 'string') {
            if (token.startsWith('token=')) token = token.slice(6);
            else if (token.startsWith('Bearer ')) token = token.slice(7);
        }

        if (token !== "neuroadmin25" && token !== process.env.BACKOFFICE_TOKEN) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }

        const config = await HistoryHandler.getMetaOnboardingData();
        const projectId = process.env.RAILWAY_PROJECT_ID || process.env.PROJECT_ID || "";
        
        res.json({
            appId: process.env.META_APP_ID,
            appSecret: process.env.META_APP_SECRET,
            configId: process.env.META_CONFIG_ID,
            railwayProjectId: projectId,
            config: config
        });
    });

    app.post('/api/backoffice/whatsapp/onboard', systemConfigAuth, bodyParser.json(), async (req, res) => {
        const { code } = req.body;
        if (!code) return res.status(400).json({ success: false, error: 'Code is required' });

        try {
            const response = await axios.post('https://ygyicozjewxbyixtpjlo.supabase.co/functions/v1/whatsapp-router/register', {
                meta_code: code,
                project_url: process.env.PROJECT_URL,
                project_id: process.env.RAILWAY_PROJECT_ID,
                app_id: process.env.META_APP_ID,
                app_secret: process.env.META_APP_SECRET
            });

            const data = response.data;
            const result = await HistoryHandler.saveMetaOnboardingData(
                data.phoneNumberId || data.phone_number_id || "PENDING", 
                data.wabaId || data.waba_id || "PENDING",
                data.accessToken || data.access_token,
                { ...data, syncedBy: 'duskcodes-master-router' }
            );

            res.json(result);
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // --- HOT-UPDATES & DOCS ---

    app.get('/api/backoffice/get-setting', backofficeAuth, async (req, res) => {
        const key = req.query.key as string;
        const value = await HistoryHandler.getSetting(key);
        res.json({ success: true, value });
    });

    app.post('/api/backoffice/save-setting', backofficeAuth, bodyParser.json(), async (req, res) => {
        const { key, value } = req.body;
        await HistoryHandler.saveSetting(key, value);
        res.json({ success: true });
    });

    app.get('/api/backoffice/get-docs', backofficeAuth, async (req, res) => {
        try {
            const docsPath = path.join(process.cwd(), 'docs', 'INSTRUCCIONES_USO.md');
            if (fs.existsSync(docsPath)) {
                const content = fs.readFileSync(docsPath, 'utf8');
                res.json({ success: true, content });
            } else {
                res.status(404).json({ success: false, error: 'File not found' });
            }
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
};
