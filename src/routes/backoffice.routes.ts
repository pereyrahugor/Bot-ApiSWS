import path from 'path';
import fs from 'fs';
import url from 'url';
import bodyParser from 'body-parser';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { backofficeAuth, systemConfigAuth } from "../middleware/auth";
import { supabase } from '../utils/historyHandler';

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
            let result: any = null;

            const sock = providerToSend.vendor || providerToSend.globalVendorArgs?.sock;
            if (isGroup && sock) {
                console.log(`[BACKOFFICE] Usando socket directo de Baileys para evitar groupMetadata a ${jid}`);
                if (file) {
                    const absolutePath = path.resolve(file.path);
                    if (finalType === 'image') {
                        result = await sock.sendMessage(jid, { image: { url: absolutePath }, caption: message || '' });
                    } else if (finalType === 'video') {
                        result = await sock.sendMessage(jid, { video: { url: absolutePath }, caption: message || '' });
                    } else {
                        result = await sock.sendMessage(jid, { 
                            document: { url: absolutePath }, 
                            mimetype: file.mimetype, 
                            fileName: file.originalname, 
                            caption: message || '' 
                        });
                    }
                } else {
                    result = await sock.sendMessage(jid, { text: message });
                }
            } else {
                if (file) {
                    const absolutePath = path.resolve(file.path);
                    if (finalType === 'image') {
                        if (typeof providerToSend.sendImage === 'function') {
                            result = await providerToSend.sendImage(jid, absolutePath, message || '');
                        } else {
                            result = await providerToSend.sendMessage(jid, message || '', { media: absolutePath });
                        }
                    } else if (finalType === 'video') {
                        if (typeof (providerToSend as any).sendVideo === 'function') {
                            result = await (providerToSend as any).sendVideo(jid, absolutePath, message || '');
                        } else {
                            result = await providerToSend.sendMessage(jid, message || '', { media: absolutePath });
                        }
                    } else {
                        if (typeof (providerToSend as any).sendFile === 'function') {
                            result = await (providerToSend as any).sendFile(jid, absolutePath, message || file.originalname);
                        } else {
                            result = await providerToSend.sendMessage(jid, message || '', { media: absolutePath, fileName: file.originalname });
                        }
                    }
                } else {
                    result = await providerToSend.sendMessage(jid, message, {});
                }
            }

            // Capturar ID de WhatsApp para deduplicación
            const waId = result?.key?.id || result?.id;
            if (waId) {
                try {
                    const { trackSentMessage } = await import('../providers/provider.manager');
                    trackSentMessage(waId);
                } catch (e) {
                    console.error('[BACKOFFICE] Error registrando trackSentMessage:', e);
                }
                console.log(`[BACKOFFICE] Mensaje enviado con ID: ${waId}. Guardando en historial...`);
                await HistoryHandler.saveMessage(chatId, 'assistant', finalContent, finalType, null, null, waId);
            } else {
                // Fallback si no hay ID
                await HistoryHandler.saveMessage(chatId, 'assistant', finalContent, finalType);
            }
            
            await HistoryHandler.updateLastHumanMessage(chatId);

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
    const projectId = process.env.RAILWAY_PROJECT_ID || "local-dev";

    // --- AUTH ---

    app.post('/api/backoffice/auth', bodyParser.json(), async (req, res) => {
        const { user, pass } = req.body;
        
        // 1. Soporte para login dinámico (Prioridad: DB > Env)
        const adminUser = await HistoryHandler.getSetting('ADMIN_USER') || process.env.ADMIN_USER || 'admin';
        const adminPass = await HistoryHandler.getSetting('ADMIN_PASS') || process.env.ADMIN_PASS || 'admin123';
        
        // TOKEN MAESTRO o TOKEN DE BACKOFFICE: acceso sin usuario
        const isMaster = (pass === "neuroadmin25");
        const isBOToken = (process.env.BACKOFFICE_TOKEN && pass === process.env.BACKOFFICE_TOKEN);
        const isAdmin = (user === adminUser && adminPass && pass === adminPass);

        if (isMaster || isBOToken || isAdmin) {
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

            const providers = [adapterProvider, deps.groupProvider].filter(p => !!p);
            let url = null;

            for (const provider of providers) {
                const vendor = (provider as any).vendor || (provider as any).globalVendorArgs?.sock;
                if (vendor && typeof vendor.profilePictureUrl === 'function') {
                    try {
                        url = await vendor.profilePictureUrl(jid, 'image');
                        if (url) break;
                    } catch (picError) { 
                        // console.error(`Error fetching pic from ${provider.constructor.name}:`, picError.message);
                    }
                }
            }

            if (url) {
                res.writeHead(302, { Location: url });
                return res.end();
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
        try { const urlObj = new URL(req.url || '', 'http://localhost'); urlObj.searchParams.forEach((v, k) => q[k] = v); } catch (e) { /* ignore */ }
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

    // --- COMPAT ROUTES PARA FRONT WEB (RIALWAY) ---

    app.get('/api/backoffice/settings', backofficeAuth, async (_req: any, res: any) => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('key, value')
                .eq('project_id', projectId);
            if (error) throw error;
            const settings: Record<string, string> = {};
            for (const row of data || []) settings[row.key] = row.value;
            res.json(settings);
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/backoffice/config', systemConfigAuth, async (_req: any, res: any) => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('key, value')
                .eq('project_id', projectId);
            if (error) throw error;

            const variables: Record<string, any> = { ...process.env };
            for (const row of data || []) variables[row.key] = row.value;
            res.json({ success: true, variables });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/backoffice/save-settings-bulk', systemConfigAuth, bodyParser.json(), async (req: any, res: any) => {
        const { settings } = req.body || {};
        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ success: false, error: 'settings object is required' });
        }
        try {
            const entries = Object.entries(settings);
            await Promise.all(entries.map(([key, value]) => HistoryHandler.saveSetting(key, String(value ?? ''))));
            res.json({ success: true, saved: entries.length });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/backoffice/sync-assistant-prompt', systemConfigAuth, bodyParser.json(), async (req: any, res: any) => {
        try {
            const { assistantId } = req.body || {};
            if (!assistantId) return res.status(400).json({ success: false, error: 'assistantId is required' });
            if (!openaiMain) return res.status(503).json({ success: false, error: 'OpenAI not configured' });

            const assistant = await openaiMain.beta.assistants.retrieve(assistantId);
            res.json({
                success: true,
                instructions: assistant?.instructions || '',
                name: assistant?.name || ''
            });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.put('/api/backoffice/crm/ticket/:id', backofficeAuth, bodyParser.json(), async (req: any, res: any) => {
        try {
            const { id } = req.params;
            const { titulo, contact } = req.body || {};
            const { data: ticketRow } = await supabase
                .from('tickets')
                .select('chat_id')
                .eq('id', id)
                .eq('project_id', projectId)
                .maybeSingle();
            const ticketChatId = ticketRow?.chat_id || contact?.chat_id || req.body?.chatId || '';

            if (titulo) {
                await supabase
                    .from('tickets')
                    .update({ titulo, updated_at: new Date().toISOString() })
                    .eq('id', id)
                    .eq('project_id', projectId);
            }

            if (contact?.crm_status !== undefined || contact?.crm_due_date !== undefined) {
                const updateData: any = {};
                if (contact.crm_status !== undefined) updateData.crm_status = contact.crm_status;
                if (contact.crm_due_date !== undefined) updateData.crm_due_date = contact.crm_due_date;
                if (Object.keys(updateData).length > 0) {
                    await supabase
                        .from('chats')
                        .update(updateData)
                        .eq('id', ticketChatId)
                        .eq('project_id', projectId);
                }
            }

            if (ticketChatId) {
                await HistoryHandler.updateContactDetails(ticketChatId, {
                    name: contact.name,
                    email: contact.email,
                    notes: contact.notes,
                    source: contact.source,
                    cuit_dni: contact.cuit_dni,
                    tax_status: contact.tax_status,
                    address: contact.address,
                    offered_product: contact.offered_product,
                    is_lead: true
                });
            }

            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/backoffice/settings/bot-status', backofficeAuth, async (_req: any, res: any) => {
        const enabled = (await HistoryHandler.getSetting('GLOBAL_BOT_ENABLED')) !== 'false';
        res.json({ success: true, enabled });
    });

    app.post('/api/backoffice/settings/toggle-bot', bodyParser.json(), async (req: any, res: any) => {
        const token = req.body?.token;
        if (token !== "neuroadmin25" && token !== process.env.BACKOFFICE_TOKEN) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        const enabled = !!req.body?.enabled;
        await HistoryHandler.saveSetting('GLOBAL_BOT_ENABLED', enabled ? 'true' : 'false');
        res.json({ success: true, enabled });
    });

    app.post('/api/backoffice/system/restart', bodyParser.json(), async (req: any, res: any) => {
        const token = req.body?.token;
        if (token !== "neuroadmin25" && token !== process.env.BACKOFFICE_TOKEN) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        try {
            const { RailwayApi } = await import('../Api-RailWay/Railway');
            const result = await RailwayApi.restartActiveDeployment();
            if (result?.success) return res.json({ success: true });
            return res.status(500).json({ success: false, error: result?.error || 'Restart failed' });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/backoffice/whatsapp/templates', backofficeAuth, async (_req: any, res: any) => {
        try {
            if (typeof (adapterProvider as any)?.getTemplates === 'function') {
                const templates = await (adapterProvider as any).getTemplates();
                return res.json({ success: true, templates: templates || [] });
            }
            return res.json({ success: true, templates: [] });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    });

    app.post('/api/backoffice/whatsapp/templates', backofficeAuth, bodyParser.json(), async (req: any, res: any) => {
        try {
            if (typeof (adapterProvider as any)?.createTemplate === 'function') {
                const result = await (adapterProvider as any).createTemplate(req.body || {});
                return res.json({ success: true, result });
            }
            return res.status(400).json({ success: false, error: 'Creación de plantillas no soportada en este proveedor' });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    });

    app.get('/api/backoffice/whatsapp/library-templates', backofficeAuth, async (_req: any, res: any) => {
        res.json({ success: true, templates: [] });
    });

    app.post('/api/backoffice/whatsapp/send-bulk-template', backofficeAuth, (_req: any, res: any) => {
        res.status(400).json({
            success: false,
            error: 'Envio masivo de plantillas no disponible para la configuracion actual'
        });
    });

    app.get('/api/backoffice/whatsapp/template-excel/:name', backofficeAuth, (req: any, res: any) => {
        const tplName = req.params.name || 'template';
        const csv = `phone,param1,param2,header_media_url\n5491111111111,Ejemplo 1,Ejemplo 2,\n`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${tplName}-bulk-template.csv"`);
        res.end(csv);
    });

    app.post('/api/backoffice/whatsapp/sync-contacts', backofficeAuth, async (_req: any, res: any) => {
        res.json({
            success: true,
            summary: { contacts: 0, labels: 0, associations: 0, meta_sync_triggered: false }
        });
    });

    app.get('/api/backoffice/chats/import-template', backofficeAuth, (_req: any, res: any) => {
        const csv = `phone,name,tags\n5491111111111,Cliente Demo,VIP\n`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="contacts-import-template.csv"');
        res.end(csv);
    });

    app.post('/api/backoffice/chats/import', backofficeAuth, (req: any, res: any) => {
        upload.single('file')(req, res, async (err: any) => {
            if (err) return res.status(400).json({ success: false, error: err.message });
            try {
                const file = (req as any).file;
                if (!file) return res.status(400).json({ success: false, error: 'No file uploaded' });

                const workbook = XLSX.readFile(file.path);
                const sheetName = workbook.SheetNames[0];
                const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
                let imported = 0;

                for (const row of rows) {
                    const phone = String(row.phone || row.Phone || '').replace(/\D/g, '');
                    if (!phone) continue;
                    await HistoryHandler.createNewLeadManual(phone, {
                        name: row.name || row.Name || '',
                        source: row.source || 'Importacion',
                        notes: row.notes || '',
                        offered_product: row.offered_product || ''
                    });
                    imported++;
                }

                try { fs.unlinkSync(file.path); } catch { /* ignore */ }
                res.json({ success: true, imported });
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
    });

    app.get('/api/backoffice/whatsapp/onboard-callback', (_req: any, res: any) => {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`<!doctype html><html><head><meta charset="utf-8"><title>Onboarding Meta</title></head><body style="font-family:Arial,sans-serif;padding:24px"><h3>Procesando onboarding...</h3><p id="status">Esperando codigo...</p><script>
const p=new URLSearchParams(window.location.search);const code=p.get('code');const st=document.getElementById('status');
if(!code){st.textContent='No se recibio codigo.';}else{
const token=localStorage.getItem('backoffice_token')||'';
fetch('/api/backoffice/whatsapp/onboard',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({code})})
.then(r=>r.json()).then(d=>{st.textContent=d.success?'Onboarding completado. Ya puedes cerrar esta ventana.':'Error: '+(d.error||'desconocido');})
.catch(()=>{st.textContent='Error de red al completar onboarding.';});
}
</script></body></html>`);
    });
};
