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
    userId: string = 'unknown'
): Promise<string> => {
    return safeToAsk(assistantId, message, state, userId);
};

/**
 * Capa 1: Verificación Proactiva (compatibilidad hacia atrás)
 */
export async function waitForActiveRuns(_threadId: string, _maxAttempts = 5) {
    // Ya no se requiere polling de runs con la nueva API
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
    errorReporter?: any
) {
    if (errorReporter && typeof errorReporter.reportError === 'function') {
        await errorReporter.reportError(new Error("Reintentando solicitud con nuevo contexto..."), userId, `https://wa.me/${userId.replace(/[^0-9]/g, '')}`);
    }
    return await safeToAsk(assistantId, message, state, userId, errorReporter);
}

/**
 * Petición Segura con Reintentos (safeToAsk)
 * Modelo por defecto: gpt-5.4-nano
 */
export const safeToAsk = async (
    _assistantId: string,
    message: string,
    state: any,
    userId: string = 'unknown',
    errorReporter?: any,
    maxRetries = 3
): Promise<string> => {
    const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

    // 1. Obtener System Prompt (Prioridad: DB > ENV > Default)
    const dbPrompt = await HistoryHandler.getSetting('ASSISTANT_PROMPT');
    const systemPrompt = dbPrompt || process.env.ASSISTANT_PROMPT || "";

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

    if (systemPrompt) {
        messages.push({
            role: "system",
            content: systemPrompt
        });
    }

    if (history && history.length > 0) {
        for (const h of history) {
            if (!h.content || typeof h.content !== 'string' || !h.content.trim()) continue;
            // Omitir mensajes de sistema o errores
            if (h.content.startsWith('[Error]') || h.content.startsWith('⚠️')) continue;
            
            const role = h.role === 'assistant' ? 'assistant' : 'user';
            messages.push({
                role: role,
                content: h.content
            });
        }
    }

    // Mensaje actual (incluye instrucciones dinámicas y contexto del cliente)
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
