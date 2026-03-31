import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import OpenAI from "openai";
import { BaileysProvider } from "builderbot-provider-sherpa";
import { createBot, createProvider, createFlow, MemoryDB } from "@builderbot/bot";
import { httpInject } from "@builderbot-plugins/openai-assistants";
import { YCloudProvider } from "./providers/YCloudProvider";
import { setAdapterProvider, setGroupProvider, getAdapterProvider, getGroupProvider } from "./providers/instances";
import { RailwayApi } from "./Api-RailWay/Railway";


// --- Utils & Handlers ---
import { restoreSessionFromDb, startSessionSync, deleteSessionFromDb } from "./utils/sessionSync";
import { ErrorReporter } from "./utils/errorReporter";
import { updateMain } from "./addModule/updateMain";
import { WebChatManager } from "./utils-web/WebChatManager";
import { HistoryHandler } from "./utils/historyHandler";
import { registerProcessCallback, handleQueue, userQueues, userLocks } from "./utils/queueManager";

// --- Managers & Routes ---
import { registerBackofficeRoutes, processSendMessage, BackofficeDependencies } from "./routes/backoffice.routes";
import { registerRailwayRoutes } from "./routes/railway.routes";
import { registerWebchatRoutes } from "./routes/webchat.routes";
import { registerStaticRoutes } from "./routes/static.routes";
import { initSocketIO } from "./sockets/socket.manager";
import { registerProviderEvents, hasActiveSession } from "./providers/provider.manager";
import { startHumanInactivityWorker } from "./workers/humanInactivity.worker";
import { AiManager } from "./utils/ai.manager";
import { smartBodyParser, compatibilityLayer, rootRedirect } from "./middleware/global";
import { backofficeAuth } from "./middleware/auth";
import * as pkgBodyParser from 'body-parser';

// --- Flows ---
import { welcomeFlowTxt } from "./Flows/welcomeFlowTxt";
import { welcomeFlowVoice } from "./Flows/welcomeFlowVoice";
import { welcomeFlowImg } from "./Flows/welcomeFlowImg";
import { welcomeFlowVideo } from "./Flows/welcomeFlowVideo";
import { welcomeFlowDoc } from "./Flows/welcomeFlowDoc";
import { locationFlow } from "./Flows/locationFlow";
import { idleFlow } from "./Flows/idleFlow";
import { welcomeFlowButton } from "./Flows/welcomeFlowButton";

// Global instances (live bindings)
let adapterProvider = null;
let groupProvider = null;
let errorReporter = null;
let aiManagerInstance = null;
export { adapterProvider, groupProvider, errorReporter, aiManagerInstance };

// @ts-ignore
const bodyParser = pkgBodyParser.default || pkgBodyParser;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const webChatManager = new WebChatManager();
const openaiMain = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const openaiVision = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_IMG });
const ASSISTANT_ID = process.env.ASSISTANT_ID || "";
const PORT = process.env.PORT || 8080;

// Multer config
const upload = multer({ 
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
            const dir = "uploads/";
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
        }
    })
});

// Error handling setup
function registerSafeErrorHandlers() {
    process.removeAllListeners("uncaughtException");
    process.removeAllListeners("unhandledRejection");
    process.on("uncaughtException", (error) => {
        console.error(`⚠️ [UncaughtException] ${new Date().toISOString()}:`, error);
    });
    process.on("unhandledRejection", (reason) => {
        console.error(`⚠️ [UnhandledRejection] ${new Date().toISOString()}:`, reason);
    });
}

/**
 * Main function for Bot and Server Orchestration
 */
const main = async () => {
    console.log(`\n🚀 [Server] Iniciando aplicación...`);
    console.log(`   - Proyecto: ${process.env.RAILWAY_PROJECT_NAME || 'Unknown'}`);
    console.log(`   - Project ID: ${process.env.RAILWAY_PROJECT_ID || 'local-dev'}`);
    console.log(`   - Puerto: ${PORT}`);
    console.log(`   - Assistant ID: ${ASSISTANT_ID ? 'Configurado' : '⚠️ Faltante'}`);

    // 1. Storage cleanup and session restoration
    try {
        await restoreSessionFromDb();
        console.log(`✅ [Session] Restauración de sesión completada.`);
    } catch (err) {
        console.error(`❌ [Session] Error crítico en restoreSessionFromDb:`, err);
    }
    
    const qrPath = path.join(process.cwd(), "bot.qr.png");

    // 2. Initialize Providers
    // Proveedor principal (YCloud)
    adapterProvider = createProvider(YCloudProvider, {});
    setAdapterProvider(adapterProvider);

    // Proveedor de grupos (Baileys)
    groupProvider = createProvider(BaileysProvider, {
        version: [2, 3000, 1030817285],
        groupsIgnore: false,
        readStatus: false,
        disableHttpServer: true,
        handleHistory: false,
    });
    setGroupProvider(groupProvider);

    // 3. Register Provider Events
    registerProviderEvents(adapterProvider); // YCloud
    registerProviderEvents(groupProvider, true); // Baileys Grupos

    // 🚀 Iniciar motor secundario manualmente (Baileys para Grupos)
    // Usamos 5 segundos para que YCloud (el motor principal) ya esté estable.
    setTimeout(async () => {
        try {
            if (!groupProvider) {
                console.error('❌ [GroupSync] groupProvider no existe al momento de iniciar.');
                return;
            }
            console.log('📡 [GroupSync] Creando entorno de motor secundario...');
            
            // Forzar el inicio si tiene el método initVendor ( Builderbot 1.3.5 )
            if (groupProvider.initVendor) {
                console.log('🚀 [GroupSync] Llamando a initVendor()...');
                await groupProvider.initVendor();
                console.log('✅ [GroupSync] .initVendor() ejecutado exitosamente.');
            } else {
                const gpAny = groupProvider;
                if (gpAny.init) {
                    console.log('🚀 [GroupSync] Llamando a .init()...');
                    await gpAny.init();
                } else {
                    console.warn('⚠️ [GroupSync] El proveedor no contiene métodos de inicio (initVendor/init).');
                }
            }
        } catch (err) {
            console.error('❌ [GroupSync] Error crítico al arrancar motor de grupos:', err);
        }
    }, 5000);

    // 4. Initialize Data and Error Reporter
    errorReporter = new ErrorReporter(groupProvider, process.env.ID_GRUPO_RESUMEN || "");
    await updateMain();


    const app = adapterProvider.server;
    if (app) {
        // 5. Polka/Express Server setup & Early Middlewares
        console.log("🛠️ [POLKA MIDDLEWARES - INITIAL]:", app.middlewares?.length || 0);
        app.onError = (err, _req, res) => {
            console.error("🔥 [POLKA ERROR]:", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message || "Internal Server Error" }));
        };

        // APLICAR COMPATIBILIDAD AL INICIO
        app.use(compatibilityLayer);

        // 🛡️ MASTER-INTERCEPTOR (Síncrono para evitar loop de Polka)
        app.use((req, res, next) => {
            const fullUrl = req.url.split('?')[0];
            
            // WEBHOOK YCLOUD (Bypass Total)
            if (fullUrl === '/webhook' && req.method === 'POST') {
                return adapterProvider.handleWebhook(req, res);
            }

            // BACKOFFICE SEND-MESSAGE (Bypass Total para evitar consumo de stream)
            if (fullUrl === '/api/backoffice/send-message' && req.method === 'POST') {
                return backofficeAuth(req, res, () => {
                    const deps = { adapterProvider, HistoryHandler, openaiMain, upload };
                    const contentType = req.headers['content-type'] || '';

                    if (contentType.includes('multipart/form-data')) {
                        upload.single('file')(req, res, (err) => {
                            if (err) return res.status(errorReporter ? 500 : 400).json({ success: false, error: err.message });
                            const { chatId, message } = req.body;
                            const reqAny = req;
                            processSendMessage(req, res, chatId || '', message || '', reqAny.file, deps);
                        });
                    } else {
                        bodyParser.json()(req, res, () => {
                            const { chatId, message } = req.body;
                            processSendMessage(req, res, chatId || '', message || '', null, deps);
                        });
                    }
                });
            }
            next();
        });

        
        app.use(rootRedirect);
        
        registerBackofficeRoutes(app, {
            adapterProvider,
            HistoryHandler,
            openaiMain,
            upload
        });
    }

    // 6. Initialize AI Manager and flows
    const aiManager = new AiManager(openaiMain, ASSISTANT_ID, errorReporter, {
        welcomeFlowTxt, welcomeFlowVoice, welcomeFlowButton
    });
    aiManagerInstance = aiManager;

    registerProcessCallback(async (item) => {
        const { ctx, flowDynamic, state, provider, gotoFlow } = item;
        await aiManager.processUserMessage(ctx, { flowDynamic, state, provider, gotoFlow });
    });

    // 7. Initialize Bot Instance
    const adapterFlow = createFlow([
        welcomeFlowTxt, welcomeFlowVoice, welcomeFlowImg, 
        welcomeFlowVideo, welcomeFlowDoc, locationFlow, 
        idleFlow, welcomeFlowButton
    ]);
    const adapterDB = new MemoryDB();

    const { httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB
    });

    registerSafeErrorHandlers();
    startSessionSync();

    // 8. Middlewares y Plugins post-Bot
    if (app) {
        // Plugins y Middlewares Globales de Body-Parsing
        httpInject(app);
        app.use(smartBodyParser);

        // 9. Register Other Routes
        registerRailwayRoutes(app, { RailwayApi });
        registerWebchatRoutes(app, { webChatManager, openaiVision, ASSISTANT_ID, processUserMessage: aiManager.processUserMessage });
        registerStaticRoutes(app, { __dirname });

        // API Health & Info
        app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
        app.get("/api/assistant-name", backofficeAuth, (_req, res) => res.json({ name: process.env.ASSISTANT_NAME || "Bot" }));
        
        app.get("/api/dashboard-status", backofficeAuth, async (_req, res) => {
            
            const adapterStatus = await hasActiveSession(getAdapterProvider());
            const groupStatus = await hasActiveSession(getGroupProvider());
            res.json({
                ...groupStatus, 
                adapter: adapterStatus,
                group: groupStatus
            });
        });

        // API Session Control
        app.post("/api/delete-session", backofficeAuth, async (_req, res) => {
            try {
                await deleteSessionFromDb();
                res.json({ success: true });
            } catch (err) {
                res.status(500).json({ success: false, error: err.message });
            }
        });

        // 🛡️ QR Routes for Dashboard
        app.get("/api/qr", backofficeAuth, (_req, res) => {
            if (fs.existsSync(qrPath)) {
                res.setHeader('Content-Type', 'image/png');
                fs.createReadStream(qrPath).pipe(res);
            } else {
                res.status(404).json({ success: false, message: "QR not found" });
            }
        });

        // Servir front-end del Dashboard
        const staticDir = path.join(__dirname, "html");
        console.log("📂 [Static] Servidendo dashboard desde:", staticDir);
        // app.use("/", express.static(staticDir)); // Nota: Polka usa middlewares de forma distinta
        
        // 🚀 Start the HTTP server — builderbot requires you to call httpServer(port) explicitly
        httpServer(+PORT);

        // WebSocket initialization — wait for Polka's http.Server to be ready
        // builderbot's initAll() uses .then() chains, so app.server isn't available immediately
        const waitForServer = () => {
            const check = () => {
                const rawHttpServer = (app as any).server;
                if (rawHttpServer) {
                    console.log('📡 [Socket.IO] http.Server detectado, inicializando...');
                    initSocketIO(rawHttpServer, { adapterProvider, groupProvider });
                } else {
                    setTimeout(check, 500);
                }
            };
            check();
        };
        waitForServer();
        startHumanInactivityWorker(15);

        console.log(`✅ [Server] Listo en puerto ${PORT}`);
    }
};

main();

export const processUserMessage = async (ctx, items) => {
    if (!aiManagerInstance) throw new Error("AiManager not initialized");
    return await aiManagerInstance.processUserMessage(ctx, items);
};
