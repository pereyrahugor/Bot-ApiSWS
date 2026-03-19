import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import OpenAI from "openai";
import { BaileysProvider } from "builderbot-provider-sherpa";
import { createBot, createProvider, createFlow, MemoryDB } from "@builderbot/bot";
import { httpInject } from "@builderbot-plugins/openai-assistants";
import * as bodyParser from 'body-parser';

// --- Utils & Handlers ---
import { restoreSessionFromDb, startSessionSync } from "./utils/sessionSync";
import { ErrorReporter } from "./utils/errorReporter";
import { updateMain } from "./addModule/updateMain";
import { WebChatManager } from "./utils-web/WebChatManager";
import { HistoryHandler, historyEvents } from "./utils/historyHandler";
import { registerProcessCallback, handleQueue, userQueues, userLocks } from "./utils/queueManager";

// --- Managers & Routes ---
import { registerBackofficeRoutes, processSendMessage, BackofficeDependencies } from "./routes/backoffice.routes";
import { registerRailwayRoutes } from "./routes/railway.routes";
import { registerWebchatRoutes } from "./routes/webchat.routes";
import { registerStaticRoutes } from "./routes/static.routes";
import { initSocketIO } from "./sockets/socket.manager";
import { AiManager } from "./managers/ai.manager";
import { smartBodyParser, compatibilityLayer, rootRedirect } from "./middleware/global";
import { backofficeAuth } from "./middleware/auth";
import { startHumanInactivityWorker } from "./workers/humanInactivity.worker";

// --- Flows ---
import { welcomeFlowTxt } from "./Flows/welcomeFlowTxt";
import { welcomeFlowVoice } from "./Flows/welcomeFlowVoice";
import { welcomeFlowImg } from "./Flows/welcomeFlowImg";
import { welcomeFlowVideo } from "./Flows/welcomeFlowVideo";
import { welcomeFlowDoc } from "./Flows/welcomeFlowDoc";
import { locationFlow } from "./Flows/locationFlow";
import { idleFlow } from "./Flows/idleFlow";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global instances
export let adapterProvider: any;
export let errorReporter: any;
export let aiManagerInstance: AiManager;
const webChatManager = new WebChatManager();
const openaiMain = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ASSISTANT_ID = process.env.ASSISTANT_ID!;
const PORT = process.env.PORT || 8080;
const ID_GRUPO_RESUMEN = process.env.ID_GRUPO_RESUMEN || "";

// Multer config
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = "uploads/";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        cb(null, fileName);
    }
});
const upload = multer({ storage });

function registerSafeErrorHandlers() {
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
    // 1. Initial cleanup and session restoration
    const oldQr = path.join(process.cwd(), 'bot.qr.png');
    if (fs.existsSync(oldQr)) {
        try { fs.unlinkSync(oldQr); } catch (e) {}
    }
    await restoreSessionFromDb();

    // 2. Initialize Provider
    adapterProvider = createProvider(BaileysProvider, {
        version: [2, 3000, 1030817285],
        groupsIgnore: false,
        readStatus: false,
        disableHttpServer: true,
    });

    // 3. Initialize Error Reporter and Data
    errorReporter = new ErrorReporter(adapterProvider, ID_GRUPO_RESUMEN);
    await updateMain();

    const app = adapterProvider.server;
    if (app) {
        // 4. Server configuration & Early Middlewares
        app.onError = (err: any, _req: any, res: any) => {
            console.error("🔥 [POLKA ERROR]:", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message || "Internal Server Error" }));
        };

        // Compatibility layer (res.json, res.send, etc)
        app.use(compatibilityLayer);

        // --- MASTER INTERCEPTOR FOR STREAMS (CRITICAL) ---
        app.use(async (req: any, res: any, next: any) => {
            const fullUrl = req.url.split('?')[0];
            
            if (fullUrl === '/api/backoffice/send-message' && req.method === 'POST') {
                console.log("🛡️ [MASTER-INTERCEPTOR] Capture detected for /api/backoffice/send-message. Bypassing global parsers...");
                
                return backofficeAuth(req, res, () => {
                    const deps: BackofficeDependencies = { adapterProvider, HistoryHandler, openaiMain, upload };
                    const contentType = req.headers['content-type'] || '';

                    if (contentType.includes('multipart/form-data')) {
                        return upload.single('file')(req, res, (err: any) => {
                            if (err) {
                                console.error("❌ [MASTER-INTERCEPTOR] Multer Error:", err.message);
                                return res.status(400).end(JSON.stringify({ success: false, error: `Error de archivo: ${err.message}` }));
                            }
                            const { chatId, message } = req.body;
                            return processSendMessage(req, res, chatId, message, (req as any).file, deps);
                        });
                    } else {
                        return bodyParser.json()(req, res, () => {
                            const { chatId, message } = req.body;
                            return processSendMessage(req, res, chatId || '', message || '', null, deps);
                        });
                    }
                });
            }
            next();
        });

        app.use(rootRedirect);
    }

    // 5. Initialize AI Manager and flows
    const aiManager = new AiManager(ASSISTANT_ID, errorReporter, {
        welcomeFlowTxt, welcomeFlowVoice
    });
    aiManagerInstance = aiManager;

    registerProcessCallback(async (item: any) => {
        const { ctx, flowDynamic, state, provider, gotoFlow } = item;
        await aiManager.processUserMessage(ctx, { flowDynamic, state, provider, gotoFlow });
    });

    // 6. Initialize Bot Instance
    const adapterFlow = createFlow([
        welcomeFlowTxt, welcomeFlowVoice, welcomeFlowImg, 
        welcomeFlowVideo, welcomeFlowDoc, locationFlow, idleFlow
    ]);
    const adapterDB = new MemoryDB();

    const { httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB
    });

    registerSafeErrorHandlers();
    startSessionSync();

    // 7. Middlewares & Plugins post-Bot
    if (app) {
        httpInject(app);
        app.use(smartBodyParser);

        // Register Routes
        registerBackofficeRoutes(app, { adapterProvider, HistoryHandler, openaiMain, upload });
        registerRailwayRoutes(app, { RailwayApi: (await import("./Api-RailWay/Railway")).RailwayApi });
        registerWebchatRoutes(app, { webChatManager, openaiVision: openaiMain, ASSISTANT_ID, processUserMessage: aiManager.processUserMessage.bind(aiManager) });
        registerStaticRoutes(app, { __dirname });

        // Health Info
        app.get("/health", (_req: any, res: any) => res.json({ status: "ok", time: new Date().toISOString() }));
    }

    // 8. Start Workers
    startHumanInactivityWorker(15);

    // 9. Start Server and Socket.IO
    try {
        httpServer(+PORT);
        setTimeout(() => {
            if (app?.server) {
                console.log("✅ [Socket.IO] app.server detected, initializing...");
                initSocketIO(app.server, { 
                    processUserMessage: aiManager.processUserMessage.bind(aiManager),
                    historyEvents
                });
            }
        }, 1500);
    } catch (err) {
        console.error("❌ [FATAL] Error starting server:", err);
    }
};

main().catch(err => {
    console.error('❌ [FATAL] Error in main function:', err);
});

export {
    handleQueue, userQueues, userLocks
};

export const processUserMessage = async (ctx: any, items: any) => {
    if (!aiManagerInstance) throw new Error("AiManager not initialized");
    return await aiManagerInstance.processUserMessage(ctx, items);
};
