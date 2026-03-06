import { executeDbQuery } from "./utils/dbHandler";
// ...existing imports y lógica del bot...
// import { exec } from 'child_process';
import "dotenv/config";
import path from 'path';
import serve from 'serve-static';
import { Server } from 'socket.io';
import fs from 'fs';
import polka from 'polka';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import QRCode from 'qrcode';
// Estado global para encender/apagar el bot
let botEnabled = true;
import { createBot, createProvider, createFlow, addKeyword, EVENTS } from "@builderbot/bot";
import { MemoryDB } from "@builderbot/bot";
import { BaileysProvider } from "builderbot-provider-sherpa";
import { restoreSessionFromDb, startSessionSync, deleteSessionFromDb, isSessionInDb } from "./utils/sessionSync";
import { toAsk, httpInject } from "@builderbot-plugins/openai-assistants";
import { typing } from "./utils/presence";
import { idleFlow } from "./Flows/idleFlow";
import { welcomeFlowTxt } from "./Flows/welcomeFlowTxt";
import { welcomeFlowVoice } from "./Flows/welcomeFlowVoice";
import { welcomeFlowImg } from "./Flows/welcomeFlowImg";
import { welcomeFlowVideo } from "./Flows/welcomeFlowVideo";
import { welcomeFlowDoc } from "./Flows/welcomeFlowDoc";
import { locationFlow } from "./Flows/locationFlow";
import { AssistantResponseProcessor, waitForActiveRuns, cancelRun } from "./utils/AssistantResponseProcessor";
import { updateMain } from "./addModule/updateMain";
import { ErrorReporter } from "./utils/errorReporter";
import { HistoryHandler, historyEvents } from "./utils/historyHandler";
import * as sessionSync from "./utils/sessionSync";
// import { AssistantBridge } from './utils-web/AssistantBridge';
import { WebChatManager } from './utils-web/WebChatManager';
import { fileURLToPath } from 'url';
import { getArgentinaDatetimeString } from "./utils/ArgentinaTime";
import { RailwayApi } from "./Api-RailWay/Railway";
import { userQueues, userLocks, handleQueue, registerProcessCallback } from "./utils/queueManager";


//import { imgResponseFlow } from "./Flows/imgResponse";
//import { listImg } from "./addModule/listImg";
//import { testAuth } from './utils/test-google-auth.js';

// Definir __dirname para ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Instancia global de WebChatManager para sesiones webchat
const webChatManager = new WebChatManager();
// Eliminado: processUserMessageWeb. Usar lógica principal para ambos canales.

/** Puerto en el que se ejecutará el servidor (Railway usa 8080 por defecto) */
const PORT = process.env.PORT || 8080;
/** ID del asistente de OpenAI */
export const ASSISTANT_ID = process.env.ASSISTANT_ID;
const ID_GRUPO_RESUMEN = process.env.ID_GRUPO_RESUMEN ?? "";







// Listener para generar el archivo QR manualmente cuando se solicite
export let adapterProvider;
let errorReporter;

const TIMEOUT_MS = 30000;

// Control de timeout por usuario para evitar ejecuciones automáticas superpuestas
const userTimeouts = new Map();

// Wrapper seguro para toAsk que SIEMPRE verifica runs activos e inyecta contexto (Fecha/Hora/Contacto)
export const safeToAsk = async (assistantId: string, message: string, state: any, userId?: string) => {
    const threadId = state && typeof state.get === 'function' && state.get('thread_id');

    // Inyectar contexto de fecha, hora y contacto en cada mensaje
    const currentDatetimeArg = getArgentinaDatetimeString();
    let contextHeader = `[CONTEXTO_SISTEMA]:\n- Fecha/Hora: ${currentDatetimeArg}`;
    
    // Intentar obtener el contacto si no viene como argumento
    const effectiveUserId = userId || (state && typeof state.get === 'function' ? state.get('from') : undefined);
    if (effectiveUserId) {
        contextHeader += `\n- Contacto: ${effectiveUserId}`;
    }
    contextHeader += `\n[/CONTEXTO_SISTEMA]`;

    const finalMessage = `${contextHeader}\n\n${message}`;

    // Mecanismo de Backoff Loop (3 intentos) para absorber saturación API
    let lastError: any;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            if (threadId) {
                await waitForActiveRuns(threadId);
            }
            return await toAsk(assistantId, finalMessage, state);
        } catch (err: any) {
            lastError = err;
            console.error(`[safeToAsk] Error en intento ${attempt}:`, err.message);

            // Si detectamos el error de run activo con el ID, intentamos cancelarlo
            const runMatch = err.message && err.message.match(/run_(?:\w+)/);
            if (runMatch && threadId) {
                const activeRunId = runMatch[0];
                console.log(`[safeToAsk] Detectado run activo bloqueante: ${activeRunId}. Solicitando cancelación...`);
                await cancelRun(threadId, activeRunId);
            }

            // Si hay un run activo o rate limit, esperar con backoff
            if (err.message && (err.message.includes('run') || err.message.includes('active') || err.message.includes('rate_limit'))) {
                const waitTime = attempt * 2000;
                console.log(`[safeToAsk] Problema detectado. Reintentando en ${waitTime}ms...`);
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }
            throw err;
        }
    }
    throw lastError;
};

export const getAssistantResponse = async (assistantId, message, state, fallbackMessage, userId, thread_id = null) => {
    // Si hay un timeout previo, lo limpiamos
    if (userTimeouts.has(userId)) {
        clearTimeout(userTimeouts.get(userId));
        userTimeouts.delete(userId);
    }

    let timeoutResolve;
    const timeoutPromise = new Promise((resolve) => {
        timeoutResolve = resolve;
        const timeoutId = setTimeout(async () => {
            console.warn("⏱ Timeout alcanzado. Reintentando con mensaje de control...");
            // Pasamos userId para asegurar que safeToAsk incluya el contexto del contacto
            resolve(await safeToAsk(assistantId, fallbackMessage ?? message, state, userId));
            userTimeouts.delete(userId);
        }, TIMEOUT_MS);
        userTimeouts.set(userId, timeoutId);
    });

    // Lanzamos la petición a OpenAI pasando userId para el contexto
    const askPromise = safeToAsk(assistantId, message, state, userId).then((result) => {
        if (userTimeouts.has(userId)) {
            clearTimeout(userTimeouts.get(userId));
            userTimeouts.delete(userId);
        }
        timeoutResolve(result);
        return result;
    });

    return Promise.race([askPromise, timeoutPromise]);
};

export const processUserMessage = async (
    ctx,
    { flowDynamic, state, provider, gotoFlow }
) => {
    await typing(ctx, provider);
    try {
        const body = ctx.body && ctx.body.trim();


        // Guardar mensaje del usuario en el historial
        if (ctx.from) {
            await HistoryHandler.saveMessage(ctx.from, 'user', body || '');
        }

        // Comando para encender el bot (Individual o Global)
        if (body === "#ON#" || body === "#GLOBAL_ON#") {
            const isGlobal = body === "#GLOBAL_ON#";
            if (isGlobal) {
                botEnabled = true;
                await flowDynamic([{ body: "🤖 Bot activado GLOBALMENTE." }]);
            } else {
                await HistoryHandler.toggleBot(ctx.from, true);
                await flowDynamic([{ body: "🤖 Bot activado para este chat." }]);
            }
            return state;
        }

        // Comando para apagar el bot
        if (body === "#OFF#") {
            await HistoryHandler.toggleBot(ctx.from, false);
            await flowDynamic([{ body: "🛑 Bot desactivado para este contacto. No responderé hasta recibir #ON#." }]);
            return state;
        }

        // Comando para actualizar datos desde sheets
        if (body === "#ACTUALIZAR#") {
            try {
                await updateMain();
                await flowDynamic([{ body: "🔄 Datos actualizados desde Google." }]);
            } catch (err) {
                await flowDynamic([{ body: "❌ Error al actualizar datos desde Google." }]);
            }
            return state;
        }

        // Si el bot está apagado para este usuario, ignorar
        const isEnabled = await HistoryHandler.isBotEnabled(ctx.from);
        if (!isEnabled || !botEnabled) {
            return;
        }

        // Ignorar mensajes de listas de difusión, newsletters, canales o contactos @lid
        if (ctx.from) {
            if (/@broadcast$/.test(ctx.from) || /@newsletter$/.test(ctx.from) || /@channel$/.test(ctx.from)) {
                console.log('Mensaje de difusión/canal ignorado:', ctx.from);
                return;
            }
            if (/@lid$/.test(ctx.from)) {
                console.log('Mensaje de contacto @lid ignorado:', ctx.from);
                // Reportar al admin
                const assistantName = process.env.ASSISTANT_NAME || 'Asistente demo';
                const assistantId = process.env.ASSISTANT_ID || 'ID no definido';
                if (provider && typeof provider.sendMessage === 'function') {
                    await provider.sendMessage(
                        '+5491130792789',
                        `⚠️ Mensaje recibido de contacto @lid (${ctx.from}). El bot no responde a estos contactos. Asistente: ${assistantName} | ID: ${assistantId}`
                    );
                }
                return;
            }
        }

        // Interceptar trigger de imagen antes de pasar al asistente
        // if (body === "#TestImg#") {
        //     // Usar el flow de imagen para responder y detener el flujo
        //     return gotoFlow(imgResponseFlow);
        // }

        // Usar el nuevo wrapper para obtener respuesta y thread_id
        const response = (await getAssistantResponse(ASSISTANT_ID, ctx.body, state, "Por favor, reenvia el msj anterior ya que no llego al usuario.", ctx.from, ctx.thread_id)) as string;
        console.log('🔍 DEBUG RAW ASSISTANT MSG (WhatsApp):', JSON.stringify(response));

        // Delegar procesamiento al AssistantResponseProcessor (Maneja DB_QUERY y envios)
        await AssistantResponseProcessor.analizarYProcesarRespuestaAsistente(
            response,
            ctx,
            flowDynamic,
            state,
            provider,
            gotoFlow,
            getAssistantResponse,
            ASSISTANT_ID
        );

        // Si es un contacto con nombre, intentamos guardar el nombre (si no lo tenemos)
        // en algún lugar, o manejarlo como variable de sesión.
        // Aquí podrías agregar lógica para actualizar nombre en sheet si el asistente lo extrajo.
        return state;

    } catch (error) {
        console.error("Error al procesar el mensaje del usuario:", error);

        // Enviar reporte de error al grupo de WhatsApp
        await errorReporter.reportError(
            error,
            ctx.from,
            `https://wa.me/${ctx.from}`
        );

        // 📌 Manejo de error: volver al flujo adecuado
        if (ctx.type === EVENTS.VOICE_NOTE) {
            return gotoFlow(welcomeFlowVoice);
        } else {
            return gotoFlow(welcomeFlowTxt);
        }
    }
};



registerProcessCallback(async (item) => {
    const { ctx, flowDynamic, state, provider, gotoFlow } = item;
    await processUserMessage(ctx, { flowDynamic, state, provider, gotoFlow });
});

// La función handleQueue ya está importada de queueManager y sabe procesar vía el callback registrado.

const handleQueueWrapper = handleQueue;


// Función auxiliar para verificar si existe sesión activa (Local o Remota)
const hasActiveSession = async () => {
    try {
        // 1. Verificar si el proveedor está realmente conectado
        // En builderbot-provider-sherpa (Baileys), el socket suele estar en vendor
        const isReady = !!(adapterProvider?.vendor?.user || adapterProvider?.globalVendorArgs?.sock?.user);

        // 2. Verificar localmente
        const sessionsDir = path.join(process.cwd(), 'bot_sessions');
        let localActive = false;
        if (fs.existsSync(sessionsDir)) {
            const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json'));
            // creds.json es el archivo crítico para Baileys
            localActive = files.includes('creds.json');
        }

        // Si está conectado, es la prioridad máxima
        if (isReady) return { active: true, source: 'connected' };

        // Si tiene creds.json, es muy probable que se conecte pronto
        if (localActive) return { active: true, source: 'local' };

        // 3. Si no hay nada local, verificar en DB
        const remoteActive = await isSessionInDb();
        if (remoteActive) {
            return {
                active: false,
                hasRemote: true,
                message: 'Sesión encontrada en la nube. El bot está intentando restaurarla. Si el QR aparece, puedes escanearlo para generar una nueva.'
            };
        }

        return { active: false, hasRemote: false };
    } catch (error) {
        console.error('Error verificando sesión:', error);
        return { active: false, error: error instanceof Error ? error.message : String(error) };
    }
};

// Main function to initialize the bot and load Google Sheets data
const main = async () => {
    // 0. Ejecutar script de inicialización de funciones (solo si no existen)


    // 1. Limpiar QR antiguo al inicio
    const qrPath = path.join(process.cwd(), 'bot.qr.png');
    if (fs.existsSync(qrPath)) {
        try {
            fs.unlinkSync(qrPath);
            console.log('🗑️ [Init] QR antiguo eliminado.');
        } catch (e) {
            console.error('⚠️ [Init] No se pudo eliminar QR antiguo:', e);
        }
    }

    // 2. Restaurar sesión desde DB ANTES de inicializar el provider
    // Esto asegura que Baileys encuentre los archivos al arrancar
    try {
        await restoreSessionFromDb();
        // Pequeña espera para asegurar que el sistema de archivos se asiente
        await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
        console.error('[Init] Error restaurando sesión desde DB:', e);
    }

    // 3. Inicializar Provider ÚNICO
    adapterProvider = createProvider(BaileysProvider, {
        version: [2, 3000, 1030817285],
        groupsIgnore: false,
        readStatus: false,
        disableHttpServer: true,
        // Forzar el uso de la carpeta bot_sessions explícitamente si el provider lo permite
        // o asegurar que no haya conflictos de caché
    });

    // 4. Listeners del Provider
    adapterProvider.on('require_action', async (payload: any) => {
        console.log('⚡ [Provider] require_action received. Payload:', payload);
        let qrString = null;
        if (typeof payload === 'string') {
            qrString = payload;
        } else if (payload && typeof payload === 'object') {
            if (payload.qr) qrString = payload.qr;
            else if (payload.code) qrString = payload.code;
        }
        if (qrString && typeof qrString === 'string') {
            console.log('⚡ [Provider] QR Code detected (length: ' + qrString.length + '). Generating image...');
            try {
                const qrPath = path.join(process.cwd(), 'bot.qr.png');
                await QRCode.toFile(qrPath, qrString, {
                    color: { dark: '#000000', light: '#ffffff' },
                    scale: 4,
                    margin: 2
                });
                console.log(`✅ [Provider] QR Image saved to ${qrPath}`);
            } catch (err) {
                console.error('❌ [Provider] Error generating QR image:', err);
            }
        }
    });

    adapterProvider.on('message', (payload) => { console.log('⚡ [Provider] message received'); });
    adapterProvider.on('ready', () => {
        console.log('✅ [Provider] READY: El bot está conectado y operativo.');
    });
    adapterProvider.on('auth_failure', (payload) => {
        console.log('❌ [Provider] AUTH_FAILURE: Error de autenticación.', payload);
    });

    // Evento adicional para detectar desconexiones
    adapterProvider.on('host_failure', (payload) => {
        console.log('⚠️ [Provider] HOST_FAILURE: Problema de conexión con WhatsApp.', payload);
    });

    errorReporter = new ErrorReporter(adapterProvider, ID_GRUPO_RESUMEN);

    console.log("📌 Inicializando datos desde Google Sheets...");
    await updateMain();

    console.log('🚀 [Init] Iniciando createBot...');
    const adapterFlow = createFlow([welcomeFlowTxt, welcomeFlowVoice, welcomeFlowImg, welcomeFlowVideo, welcomeFlowDoc, locationFlow, idleFlow]);
    const adapterDB = new MemoryDB();

    const { httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    console.log('🔍 [DEBUG] createBot httpServer:', !!httpServer);
    console.log('🔍 [DEBUG] adapterProvider.server:', !!adapterProvider.server);

    // Iniciar sincronización periódica de sesión hacia Supabase
    startSessionSync();

    // Inicializar servidor Polka propio para WebChat y QR
    const app = adapterProvider.server;

    // Middleware para parsear JSON en el body
    app.use(bodyParser.json());

    // 1. Middleware de compatibilidad (res.json, res.send, res.sendFile, etc)
    app.use((req, res, next) => {
        res.status = (code) => { res.statusCode = code; return res; };
        res.send = (body) => {
            if (res.headersSent) return res;
            if (typeof body === 'object') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(body || null));
            } else {
                res.end(body || '');
            }
            return res;
        };
        res.json = (data) => {
            if (res.headersSent) return res;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data || null));
            return res;
        };
        res.sendFile = (filepath) => {
            if (res.headersSent) return;
            try {
                if (fs.existsSync(filepath)) {
                    const ext = path.extname(filepath).toLowerCase();
                    const mimeTypes = {
                        '.html': 'text/html',
                        '.js': 'application/javascript',
                        '.css': 'text/css',
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.gif': 'image/gif',
                        '.svg': 'image/svg+xml',
                        '.json': 'application/json'
                    };
                    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
                    fs.createReadStream(filepath)
                        .on('error', (err) => {
                            console.error(`[ERROR] Stream error in sendFile (${filepath}):`, err);
                            if (!res.headersSent) {
                                res.statusCode = 500;
                                res.end('Internal Server Error');
                            }
                        })
                        .pipe(res);
                } else {
                    console.error(`[ERROR] sendFile: File not found: ${filepath}`);
                    res.statusCode = 404;
                    res.end('Not Found');
                }
            } catch (e) {
                console.error(`[ERROR] Error in sendFile (${filepath}):`, e);
                if (!res.headersSent) {
                    res.statusCode = 500;
                    res.end('Internal Error');
                }
            }
        };
        next();
    });

    // 2. Middleware de logging y redirección de raíz
    app.use((req, res, next) => {
        console.log(`[REQUEST] ${req.method} ${req.url}`);
        try {
            if (req.url === "/" || req.url === "") {
                console.log('[DEBUG] Redirigiendo raíz (/) a /dashboard via middleware');
                res.writeHead(302, { 'Location': '/dashboard' });
                return res.end();
            }
            next();
        } catch (err) {
            console.error('❌ [ERROR] Crash en cadena de middleware:', err);
            if (!res.headersSent) {
                res.statusCode = 500;
                res.end('Internal Server Error');
            }
        }
    });

    // 3. Función para servir páginas HTML con reemplazo dinámico (Multitenancy Visual)
    function serveHtmlPage(route: string, filename: string) {
        const handler = (req, res) => {
            console.log(`[DEBUG] Serving HTML for ${req.url} -> ${filename} (Dynamic)`);
            try {
                const possiblePaths = [
                    path.join(process.cwd(), 'src', 'html', filename),
                    path.join(process.cwd(), filename),
                    path.join(process.cwd(), 'src', filename),
                    path.join(__dirname, 'html', filename),
                    path.join(__dirname, filename),
                    path.join(__dirname, '..', 'src', 'html', filename)
                ];

                let htmlPath = null;
                for (const p of possiblePaths) {
                    if (fs.existsSync(p) && fs.lstatSync(p).isFile()) {
                        htmlPath = p;
                        break;
                    }
                }

                if (htmlPath) {
                    // Cargar archivo y reemplazar placeholders dinamicamente
                    let content = fs.readFileSync(htmlPath, 'utf-8');
                    const assistantName = process.env.ASSISTANT_NAME || process.env.RAILWAY_PROJECT_NAME || "Bot RialWay";
                    
                    // Sustituciones dinámicas
                    content = content.replace(/{{ASSISTANT_NAME}}/g, assistantName);
                    content = content.replace(/{{PROJECT_NAME}}/g, assistantName);
                    
                    // Inyección específica para Backoffice (según referencia)
                    if (filename === 'backoffice.html') {
                        content = content.replace(
                            '<h2 style="margin:0; font-size: 1.2rem;">Backoffice</h2>',
                            `<h2 style="margin:0; font-size: 1.2rem;">Backoffice - ${assistantName}</h2>`
                        );
                    }

                    res.setHeader('Content-Type', 'text/html');
                    res.end(content);
                } else {
                    console.error(`[ERROR] File not found: ${filename}`);
                    res.status(404).send('HTML no encontrado en el servidor');
                }
            } catch (err) {
                console.error(`[ERROR] Failed to serve ${filename}:`, err);
                res.status(500).send('Error interno al servir HTML');
            }
        };
        app.get(route, handler);
        if (route !== "/" && !route.includes('.')) {
            app.get(route + '/', handler);
        }
    }

    // Inyectar rutas del plugin
    httpInject(app);

    // Registrar páginas HTML
    serveHtmlPage("/dashboard", "dashboard.html");
    serveHtmlPage("/login", "login.html");
    serveHtmlPage("/backoffice", "backoffice.html");
    serveHtmlPage("/webchat", "webchat.html");
    serveHtmlPage("/webreset", "webreset.html");
    serveHtmlPage("/variables", "variables.html");

    // Servir archivos estáticos
    app.use("/js", serve(path.join(process.cwd(), "src", "js")));
    app.use("/style", serve(path.join(process.cwd(), "src", "style")));
    app.use("/assets", serve(path.join(process.cwd(), "src", "assets")));

    // Servir el código QR
    app.get("/qr.png", (req, res) => {
        const qrPath = path.join(process.cwd(), 'bot.qr.png');
        if (fs.existsSync(qrPath)) {
            res.setHeader('Content-Type', 'image/png');
            fs.createReadStream(qrPath).pipe(res);
        } else {
            res.statusCode = 404;
            res.end('QR not found');
        }
    });

    // --- API Backoffice Middleware y Rutas ---
    const backofficeAuth = (req, res, next) => {
        const tokenHeader = req.headers['authorization'] || '';
        const tokenQuery = req.query.token || '';
        const serverToken = process.env.BACKOFFICE_TOKEN || 'RIALWAY_PASS_2024';
        
        // Soportar "token=VALOR" o simplemente "VALOR"
        const cleanToken = (t: string) => t.replace('token=', '').trim();
        
        if (cleanToken(tokenHeader) === serverToken || cleanToken(tokenQuery as string) === serverToken) {
            return next();
        }
        res.status(401).json({ error: 'Unauthorized' });
    };

    // APIs Públicas de Acceso
    app.get('/api/dashboard-status', async (req, res) => {
        try {
            // Verificar si el archivo creds.json existe
            const credsExists = fs.existsSync(path.join(process.cwd(), 'bot_sessions', 'creds.json'));
            const fullBackupExists = await sessionSync.hasFullBackup();
            
            // Intentar obtener número de teléfono del estado (si el proveedor lo expone)
            let phoneNumber = null;
            if (adapterProvider && adapterProvider.vendor && adapterProvider.vendor.user) {
                phoneNumber = adapterProvider.vendor.user.id.split(':')[0].split('@')[0];
            }

            res.json({
                active: credsExists,
                source: credsExists ? 'connected' : 'waiting',
                hasRemote: fullBackupExists,
                phoneNumber: phoneNumber,
                message: fullBackupExists ? "Restaurando desde backup..." : "Esperando vinculación..."
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/backoffice/auth', async (req, res) => {
        try {
            const { token } = req.body;
            const serverToken = process.env.BACKOFFICE_TOKEN || 'RIALWAY_PASS_2024';
            if (token === serverToken) {
                res.json({ success: true });
            } else {
                res.status(401).json({ success: false });
            }
        } catch (e) {
            res.status(500).json({ success: false });
        }
    });

    // APIs Privadas
    app.get('/api/backoffice/chats', backofficeAuth, async (req, res) => {
        const chats = await HistoryHandler.listChats();
        res.json(chats);
    });

    app.get('/api/backoffice/messages/:chatId', backofficeAuth, async (req, res) => {
        const messages = await HistoryHandler.getMessages(req.params.chatId);
        res.json(messages);
    });

    app.get('/api/backoffice/profile-pic/:chatId', backofficeAuth, async (req, res) => {
        try {
            const jid = req.params.chatId.includes('@') ? req.params.chatId : `${req.params.chatId}@s.whatsapp.net`;
            const url = await adapterProvider.vendor.profilePictureUrl(jid, 'image');
            res.json({ url });
        } catch (e) {
            res.json({ url: null });
        }
    });

    app.post('/api/backoffice/toggle-bot', backofficeAuth, async (req, res) => {
        const { chatId, enabled } = req.body;
        const result = await HistoryHandler.toggleBot(chatId, enabled);
        res.json(result);
    });

    app.post('/api/backoffice/send-message', backofficeAuth, async (req, res) => {
        try {
            const { chatId, message } = req.body;
            const jid = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;
            
            // Enviar vía Baileys
            await adapterProvider.sendMessage(jid, message, {});
            
            // Guardar en historial como assistant
            await HistoryHandler.saveMessage(chatId, 'assistant', message, 'text');
            
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        }
    });

    // API Endpoints
    app.get('/api/assistant-name', (req, res) => {
        const assistantName = process.env.ASSISTANT_NAME || 'Asistente demo';
        res.json({ name: assistantName });
    });

    app.get('/api/dashboard-status', async (req, res) => {
        const status = await hasActiveSession();
        res.json(status);
    });

    app.post('/api/delete-session', async (req, res) => {
        try {
            await deleteSessionFromDb();
            res.json({ success: true });
        } catch (err) {
            console.error('Error en /api/delete-session:', err);
            res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
        }
    });

    app.post("/api/restart-bot", async (req, res) => {
        console.log('POST /api/restart-bot recibido');
        try {
            const result = await RailwayApi.restartActiveDeployment();
            if (result.success) {
                res.json({ success: true, message: "Reinicio solicitado correctamente." });
            } else {
                res.status(500).json({ success: false, error: result.error || "Error desconocido" });
            }
        } catch (err: any) {
            console.error('Error en /api/restart-bot:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.get("/api/variables", async (req, res) => {
        try {
            const variables = await RailwayApi.getVariables();
            if (variables) {
                res.json({ success: true, variables });
            } else {
                res.status(500).json({ success: false, error: "No se pudieron obtener las variables de Railway" });
            }
        } catch (err: any) {
            console.error('Error en GET /api/variables:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.post("/api/update-variables", async (req, res) => {
        try {
            const { variables } = req.body;
            if (!variables || typeof variables !== 'object') {
                return res.status(400).json({ success: false, error: "Variables no proporcionadas o formato inválido" });
            }

            console.log("[API] Actualizando variables en Railway...");
            const updateResult = await RailwayApi.updateVariables(variables);

            if (!updateResult.success) {
                return res.status(500).json({ success: false, error: updateResult.error });
            }

            console.log("[API] Variables actualizadas. Solicitando reinicio...");
            const restartResult = await RailwayApi.restartActiveDeployment();

            if (restartResult.success) {
                res.json({ success: true, message: "Variables actualizadas y reinicio solicitado." });
            } else {
                res.json({ success: true, message: "Variables actualizadas, pero falló el reinicio automático.", warning: restartResult.error });
            }
        } catch (err: any) {
            console.error('Error en POST /api/update-variables:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Socket.IO initialization function
    const initSocketIO = (serverInstance) => {
        if (!serverInstance) {
            console.error('❌ [ERROR] No se pudo obtener serverInstance para Socket.IO');
            return;
        }
        console.log('✅ [DEBUG] Inicializando Socket.IO...');
        const io = new Server(serverInstance, { cors: { origin: '*' } });

        // Enlazar eventos de HistoryHandler con Socket.IO para tiempo real
        historyEvents.on('new_message', (payload) => {
            io.emit('new_message', payload);
        });

        historyEvents.on('bot_toggled', (payload) => {
            io.emit('bot_toggled', payload);
        });

        io.on('connection', (socket) => {
            console.log('💬 Cliente web conectado');
            socket.on('message', async (msg) => {
                try {
                    let ip = '';
                    const xff = socket.handshake.headers['x-forwarded-for'];
                    if (typeof xff === 'string') ip = xff.split(',')[0];
                    else if (Array.isArray(xff)) ip = xff[0];
                    else ip = socket.handshake.address || '';

                    if (!global.webchatHistories) global.webchatHistories = {};
                    const historyKey = `webchat_${ip}`;
                    if (!global.webchatHistories[historyKey]) global.webchatHistories[historyKey] = [];
                    const _history = global.webchatHistories[historyKey];

                    const state = {
                        get: (key) => key === 'history' ? _history : undefined,
                        update: async (msg, role = 'user') => {
                            _history.push({ role, content: msg });
                            if (_history.length > 10) _history.shift();
                        },
                        clear: async () => { _history.length = 0; }
                    };

                    let replyText = '';
                    const flowDynamic = async (arr) => {
                        if (Array.isArray(arr)) replyText = arr.map(a => a.body).join('\n');
                        else if (typeof arr === 'string') replyText = arr;
                    };

                    if (msg.trim().toLowerCase() === "#reset") {
                        await state.clear();
                        replyText = "🔄 Chat reiniciado.";
                    } else {
                        await processUserMessage({ from: ip, body: msg, type: 'webchat' }, { flowDynamic, state, provider: undefined, gotoFlow: () => { } });
                    }
                    socket.emit('reply', replyText);
                } catch (err) {
                    console.error('Error Socket.IO:', err);
                    socket.emit('reply', 'Error procesando mensaje.');
                }
            });
        });
    };

    app.post('/webchat-api', async (req, res) => {
        if (!req.body || !req.body.message) {
            return res.status(400).json({ error: "Falta 'message'" });
        }
        try {
            const message = req.body.message;
            let ip = '';
            const xff = req.headers['x-forwarded-for'];
            if (typeof xff === 'string') ip = xff.split(',')[0];
            else ip = req.ip || '';

            const { getOrCreateThreadId, sendMessageToThread, deleteThread } = await import('./utils-web/openaiThreadBridge');
            const session = webChatManager.getSession(ip);
            let replyText = '';

            if (message.trim().toLowerCase() === "#reset") {
                await deleteThread(session);
                session.clear();
                replyText = "🔄 Chat reiniciado.";
            } else {
                const threadId = await getOrCreateThreadId(session);
                session.addUserMessage(message);

                const state = {
                    get: (key) => key === 'thread_id' ? session.thread_id : undefined,
                    update: async () => { },
                    clear: async () => session.clear(),
                };

                const webChatAdapterFn = async (assistantId, message, state, fallback, userId, threadId) => {
                    const now = getArgentinaDatetimeString();
                    const systemContext = `[CONTEXTO_SISTEMA]
Fecha y hora actual: ${now}
Contacto del usuario: ${userId}
[/CONTEXTO_SISTEMA]

${message}`;
                    return await sendMessageToThread(threadId, systemContext, assistantId);
                };

                const reply = await webChatAdapterFn(ASSISTANT_ID, message, state, "", ip, threadId);

                const flowDynamic = async (arr) => {
                    const text = Array.isArray(arr) ? arr.map(a => a.body).join('\n') : arr;
                    replyText = replyText ? replyText + "\n\n" + text : text;
                };

                await AssistantResponseProcessor.analizarYProcesarRespuestaAsistente(
                    reply,
                    { type: 'webchat', from: ip, thread_id: threadId, body: message },
                    flowDynamic,
                    state,
                    undefined,
                    () => { },
                    webChatAdapterFn,
                    ASSISTANT_ID
                );
                session.addAssistantMessage(replyText);
            }
            res.json({ reply: replyText });
        } catch (err) {
            console.error('Error /webchat-api:', err);
            res.status(500).json({ reply: 'Error interno.' });
        }
    });

    // Iniciar servidor
    try {
        console.log(`🚀 [INFO] Iniciando servidor en puerto ${PORT}...`);
        httpServer(+PORT);
        console.log(`✅ [INFO] Servidor escuchando en puerto ${PORT}`);
        if (app.server) {
            initSocketIO(app.server);
        }
    } catch (err) {
        console.error('❌ [ERROR] Error al iniciar servidor:', err);
    }

    console.log('✅ [INFO] Main function completed');
};

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Opcional: reiniciar proceso si es crítico
    // process.exit(1);
});

export {
    welcomeFlowTxt, welcomeFlowVoice, welcomeFlowImg, welcomeFlowVideo, welcomeFlowDoc, locationFlow,
    handleQueue, userQueues, userLocks,
};

main().catch(err => {
    console.error('❌ [FATAL] Error en la función main:', err);
});

//ok
//restored - Commit 210290e
