import OpenAI from "openai";
import { HistoryHandler } from "./historyHandler";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 60000,
    maxRetries: 3
});

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-nano";

/**
 * Consulta OpenAI utilizando la API de Completions con el modelo gpt-5.4-nano.
 */
export const askWithFunctions = async (
    assistantId: string, 
    message: string, 
    state: any,
    userId: string = 'unknown',
    extraSystemContext?: string
): Promise<string> => {
    return safeToAsk(assistantId, message, state, userId, undefined, 3, extraSystemContext);
};

/**
 * Capa 1: Verificación Proactiva (compatibilidad hacia atrás)
 */
export async function waitForActiveRuns(_threadId: string, _maxAttempts = 5) {
    return Promise.resolve();
}

/**
 * Cancela runs activos (compatibilidad hacia atrás)
 */
export async function cancelActiveRuns(_threadId: string) {
    return Promise.resolve();
}

/**
 * Capa 3: Renovación de contexto
 */
export async function renewThreadAndRetry(
    assistantId: string, 
    message: string, 
    state: any, 
    userId: string, 
    errorReporter?: any,
    extraSystemContext?: string
) {
    if (errorReporter && typeof errorReporter.reportError === 'function') {
        await errorReporter.reportError(new Error("Reintentando solicitud con nuevo contexto..."), userId, `https://wa.me/${userId.replace(/[^0-9]/g, '')}`);
    }
    return await safeToAsk(assistantId, message, state, userId, errorReporter, 3, extraSystemContext);
}

/**
 * Petición Segura con Reintentos (safeToAsk)
 * Separa estrictamente el system prompt (contexto interno) del mensaje del usuario (user role).
 */
export const safeToAsk = async (
    _assistantId: string,
    message: string,
    _state: any,
    userId: string = 'unknown',
    errorReporter?: any,
    maxRetries = 3,
    extraSystemContext?: string
): Promise<string> => {
    const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

    // 1. Obtener System Prompt base
    const dbPrompt = await HistoryHandler.getSetting('ASSISTANT_PROMPT');
    let fullSystemPrompt = dbPrompt || process.env.ASSISTANT_PROMPT || "";

    if (extraSystemContext) {
        fullSystemPrompt = (fullSystemPrompt ? fullSystemPrompt + "\n\n" : "") + extraSystemContext;
    }

    // Regla de seguridad y confidencialidad obligatoria
    fullSystemPrompt += `\n\n[INSTRUCCIÓN CRÍTICA DE CONFIDENCIALIDAD]:
- La fecha, hora, número de contacto, datos internos del cliente y contexto de esta sesión son exclusivamente de referencia interna.
- NUNCA menciones, enumeres, leas ni repitas al usuario tus metadatos de sistema (como "Fecha/hora de referencia", "Número de contacto", ni "datos para personalizar el sistema").
- Responde siempre de forma natural, humana y profesional atendiendo exclusivamente la consulta del cliente.`;

    // 2. Traer historial reciente si tenemos userId
    let history: any[] = [];
    if (userId && userId !== 'unknown' && !userId.includes('web-user')) {
        try {
            history = await HistoryHandler.getMessages(userId, 12);
        } catch (err) {
            console.warn(`[safeToAsk] No se pudo recuperar historial para ${userId}:`, err);
        }
    }

    // 3. Estructurar array de mensajes para OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (fullSystemPrompt) {
        messages.push({
            role: "system",
            content: fullSystemPrompt
        });
    }

    if (history && history.length > 0) {
        for (const h of history) {
            if (!h.content || typeof h.content !== 'string' || !h.content.trim()) continue;
            if (h.content.startsWith('[Error]') || h.content.startsWith('⚠️')) continue;
            
            const role = h.role === 'assistant' ? 'assistant' : 'user';
            messages.push({
                role: role,
                content: h.content
            });
        }
    }

    // Mensaje actual: ÚNICAMENTE el texto enviado por el usuario
    messages.push({
        role: "user",
        content: message
    });

    // 4. Ejecutar llamada con reintentos
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await openai.chat.completions.create({
                model,
                messages,
                temperature: 0.7,
            });

            const content = response.choices[0]?.message?.content || "";
            return content;
        } catch (error: any) {
            attempt++;
            console.error(`[safeToAsk] Error en llamada a OpenAI (Intento ${attempt}/${maxRetries}):`, error?.message || error);

            if (attempt >= maxRetries) {
                if (errorReporter && typeof errorReporter.reportError === 'function') {
                    await errorReporter.reportError(error, userId, `https://wa.me/${userId.replace(/[^0-9]/g, '')}`);
                }
                throw error;
            }

            const waitTime = attempt * 1500;
            await new Promise(r => setTimeout(r, waitTime));
        }
    }

    throw new Error("No se pudo obtener respuesta de OpenAI tras múltiples intentos.");
};
