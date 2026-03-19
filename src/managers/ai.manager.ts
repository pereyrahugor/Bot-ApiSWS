import { typing } from "../utils/presence";
import { HistoryHandler } from "../utils/historyHandler";
import { EVENTS } from "@builderbot/bot";
import { getArgentinaDatetimeString } from "../utils/ArgentinaTime";
import { safeToAsk } from "../utils/openaiHelper";
import { AssistantResponseProcessor } from "../utils/AssistantResponseProcessor";
import { updateMain } from "../addModule/updateMain";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AiManager {
    private userTimeouts = new Map<string, NodeJS.Timeout>();
    private readonly TIMEOUT_MS = 30000;
    private botEnabledGlobal = true;

    constructor(
        private openaiMain: any,
        private assistantId: string,
        private errorReporter: any,
        private flows: {
            welcomeFlowTxt: any;
            welcomeFlowVoice: any;
            welcomeFlowButton?: any;
        }
    ) {}

    public getAssistantResponse = async (assistantId: string, message: string, state: any, fallbackMessage: string | undefined, userId: string, thread_id: string | null = null) => {
        const currentDatetimeArg = getArgentinaDatetimeString();
        let systemPrompt = `Fecha, hora y día de la semana de referencia: ${currentDatetimeArg}`;
        
        if (process.env.EXTRA_SYSTEM_PROMPT) {
            systemPrompt += `\nInstrucción de refuerzo: ${process.env.EXTRA_SYSTEM_PROMPT}`;
        }

        if (fallbackMessage) systemPrompt += `\n${fallbackMessage}`;
        if (userId) systemPrompt += `\nNúmero de contacto: ${userId}`;
        
        const finalMessage = systemPrompt + "\n" + message;

        if (this.userTimeouts.has(userId)) {
            clearTimeout(this.userTimeouts.get(userId)!);
            this.userTimeouts.delete(userId);
        }

        return new Promise((resolve) => {
            const timeoutId = setTimeout(async () => {
                console.warn(`⏱ Timeout de OpenAI (60s) alcanzado para ${userId}.`);
                // En timeout, intentamos un safeToAsk directo con fallback
                const result = await safeToAsk(assistantId, fallbackMessage ?? message, state, userId, this.errorReporter);
                resolve(result);
                this.userTimeouts.delete(userId);
            }, this.TIMEOUT_MS * 2); // 60s
            this.userTimeouts.set(userId, timeoutId);

            safeToAsk(assistantId, finalMessage, state, userId, this.errorReporter)
                .then(result => {
                    if (this.userTimeouts.has(userId)) {
                        clearTimeout(this.userTimeouts.get(userId)!);
                        this.userTimeouts.delete(userId);
                    }
                    resolve(result);
                })
                .catch(error => {
                    if (this.userTimeouts.has(userId)) {
                        clearTimeout(this.userTimeouts.get(userId)!);
                        this.userTimeouts.delete(userId);
                    }
                    console.error(`[AiManager] Error en safeToAsk para ${userId}:`, error);
                    resolve(fallbackMessage || "Lo siento, hubo un error procesando tu solicitud.");
                });
        });
    };

    public processUserMessage = async (ctx: any, { flowDynamic, state, provider, gotoFlow }: any) => {
        await typing(ctx, provider);
        try {
            const body = ctx.body && ctx.body.trim();

            // Guardar mensaje del usuario en el historial
            if (ctx.from) {
                await HistoryHandler.saveMessage(ctx.from, 'user', body || (ctx.type === EVENTS.VOICE_NOTE ? "[Audio]" : "[Media]"));
            }

            // COMANDOS DE CONTROL
            if (body === "#ON#" || body === "#GLOBAL_ON#") {
                const isGlobal = body === "#GLOBAL_ON#";
                const msg = isGlobal ? "🤖 Bot activado GLOBALMENTE." : "🤖 Bot activado para este chat.";
                if (isGlobal) {
                    this.botEnabledGlobal = true;
                } else {
                    await HistoryHandler.toggleBot(ctx.from, true);
                }
                await HistoryHandler.saveMessage(ctx.from, 'assistant', msg, 'text');
                await flowDynamic([{ body: msg }]);
                return state;
            }

            if (body === "#OFF#") {
                const msg = "🛑 Bot desactivado para este contacto. No responderé hasta recibir #ON#.";
                await HistoryHandler.toggleBot(ctx.from, false);
                await HistoryHandler.saveMessage(ctx.from, 'assistant', msg, 'text');
                await flowDynamic([{ body: msg }]);
                return state;
            }

            if (body === "#ACTUALIZAR#") {
                try {
                    await updateMain();
                    await flowDynamic([{ body: "🔄 Datos actualizados desde Google." }]);
                } catch (err) {
                    await flowDynamic([{ body: "❌ Error al actualizar datos desde Google." }]);
                }
                return state;
            }

            // Verificar si el bot está activo para este usuario
            const isEnabledForUser = await HistoryHandler.isBotEnabled(ctx.from);
            if (!isEnabledForUser || !this.botEnabledGlobal) {
                // Inyectar mensaje al thread de OpenAI sin crear run
                try {
                    const threadId = await HistoryHandler.getThreadId(ctx.from);
                    if (threadId) {
                        await openai.beta.threads.messages.create(threadId, {
                            role: 'user',
                            content: body || '[Media]'
                        });
                        console.log(`[CONTEXTO] Mensaje inyectado al thread ${threadId} (bot desactivado)`);
                    }
                } catch (e) {
                    console.error('[AiManager] Error inyectando mensaje al thread:', e);
                }
                return state;
            }

            // Filtros de broadcast, newsletter, channel, lid
            if (ctx.from) {
                if (/@broadcast$/.test(ctx.from) || /@newsletter$/.test(ctx.from) || /@channel$/.test(ctx.from)) return;
                if (/@lid$/.test(ctx.from)) {
                    if (provider && typeof provider.sendMessage === 'function') {
                        const assistantName = process.env.ASSISTANT_NAME || 'Asistente';
                        await provider.sendMessage('+5491130792789', `⚠️ @lid contacto: ${ctx.from} | Asistente: ${assistantName}`);
                    }
                    return;
                }
            }

            const response = (await this.getAssistantResponse(
                this.assistantId, 
                ctx.body, 
                state, 
                "Por favor, reenvia el msj anterior ya que no llego al usuario.", 
                ctx.from, 
                ctx.thread_id
            )) as string;

            await AssistantResponseProcessor.procesarRespuestaAsistente(
                response,
                ctx,
                flowDynamic,
                state,
                provider,
                gotoFlow,
                this.getAssistantResponse.bind(this),
                this.assistantId
            );

            // Persistir thread_id
            const currentThreadId = state && typeof state.get === 'function' ? state.get('thread_id') : null;
            if (currentThreadId && ctx.from) {
                await HistoryHandler.saveThreadId(ctx.from, currentThreadId);
            }

            return state;

        } catch (error: any) {
            console.error("[AiManager] Error procesando mensaje:", error);
            await this.errorReporter.reportError(error, ctx.from, `https://wa.me/${ctx.from}`);

            if (ctx.type === EVENTS.VOICE_NOTE) return gotoFlow(this.flows.welcomeFlowVoice);
            return gotoFlow(this.flows.welcomeFlowTxt);
        }
    };
}
