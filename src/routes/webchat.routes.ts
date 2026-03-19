import { getArgentinaDatetimeString } from "../utils/ArgentinaTime";
import { AssistantResponseProcessor } from "../utils/AssistantResponseProcessor";

export interface WebchatDependencies {
    webChatManager: any;
    openaiVision: any; // Si se usa para análisis de imagen
    ASSISTANT_ID: string;
    processUserMessage: any;
}

/**
 * Registra las rutas para el Webchat.
 */
export const registerWebchatRoutes = (app: any, deps: WebchatDependencies) => {
    const { webChatManager, ASSISTANT_ID } = deps;

    app.post('/webchat-api', async (req: any, res: any) => {
        if (!req.body || !req.body.message) {
            return res.status(400).json({ error: "Falta 'message'" });
        }
        try {
            const message = req.body.message;
            let ip = '';
            const xff = req.headers['x-forwarded-for'];
            if (typeof xff === 'string') ip = xff.split(',')[0];
            else ip = req.ip || '';

            const { getOrCreateThreadId, sendMessageToThread, deleteThread } = await import('../utils-web/openaiThreadBridge');
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
                    get: (key: string) => key === 'thread_id' ? session.thread_id : undefined,
                    update: async () => { },
                    clear: async () => session.clear(),
                };

                const webChatAdapterFn = async (assistantId: string, message: string, state: any, fallback: string, userId: string, threadId: string) => {
                    const now = getArgentinaDatetimeString();
                    const systemContext = `[CONTEXTO_SISTEMA]
Fecha y hora actual: ${now}
Contacto del usuario: ${userId}
[/CONTEXTO_SISTEMA]

${message}`;
                    return await sendMessageToThread(threadId, systemContext, assistantId);
                };

                const reply = await webChatAdapterFn(ASSISTANT_ID, message, state, "", ip, threadId);

                // flowDynamic para capturar la respuesta acumulada
                const flowDynamic = async (arr: any) => {
                    const text = Array.isArray(arr) ? arr.map((a: any) => a.body).join('\n') : arr;
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
};
