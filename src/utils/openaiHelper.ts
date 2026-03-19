import OpenAI from "openai";
import { HistoryHandler } from "./historyHandler";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Función central para interactuar con Assistants API usando Tool Outputs (Function Calling)
 */
export const askWithFunctions = async (assistantId: string, message: string, state: any): Promise<string> => {
    let threadId = state && typeof state.get === 'function' ? state.get('thread_id') : null;
    
    // 1. Obtiene o crea el Thread
    if (!threadId) {
        const thread = await openai.beta.threads.create();
        threadId = thread.id;
        if (state && typeof state.update === 'function') {
            await state.update({ thread_id: threadId });
        }
    }

    // 2. Envía el mensaje del usuario al Thread
    await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message
    });

    // Función recursiva que evalúa el estado de la comunicación iterativamente
    const handleRunStatus = async (run: OpenAI.Beta.Threads.Runs.Run): Promise<string> => {
        // A) OpenAI completó la respuesta generativa en modo "Respuesta de Texto"
        if (run.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(run.thread_id);
            const latestMessage = messages.data.filter(m => m.role === 'assistant')[0];
            return latestMessage && latestMessage.content[0].type === 'text' ? latestMessage.content[0].text.value : '';
        } 
        
        // B) OpenAI entró en modo Tool Call (Function Calling)
        else if (run.status === 'requires_action') {
            const toolCalls = run.required_action?.submit_tool_outputs?.tool_calls;
            if (!toolCalls) return '';

            // Ejecutar tool outputs (aunque en este proyecto se suelen manejar via AssistantResponseProcessor,
            // mantenemos la estructura por si se usan Tools de OpenAI nativas)
            const toolOutputs = await Promise.all(toolCalls.map(async (toolCall: any) => {
                const funcName = toolCall.function.name;
                let result = JSON.stringify({ error: `Function ${funcName} not implemented in tools but might be handled by processor` });
                
                return {
                    tool_call_id: toolCall.id,
                    output: result,
                };
            }));
            
            const newRun = await openai.beta.threads.runs.submitToolOutputsAndPoll(
               threadId,
               run.id,
               { tool_outputs: toolOutputs }
            );
            
            return handleRunStatus(newRun);
        } else if (['cancelled', 'failed', 'expired'].includes(run.status)) {
            console.error(`[askWithFunctions] Run falló o fue cancelado, estado: ${run.status}`);
            throw new Error(`Execution ended with status: ${run.status}`);
        } else {
            // Espera activa de estado
            await new Promise(r => setTimeout(r, 2000));
            const polledRun = await openai.beta.threads.runs.retrieve(threadId, run.id);
            return handleRunStatus(polledRun);
        }
    };

    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
        assistant_id: assistantId
    });

    return await handleRunStatus(run);
};

export async function cancelRun(threadId: string, runId: string) {
    try {
        await openai.beta.threads.runs.cancel(threadId, runId);
    } catch (e: any) {
        console.error(`[openaiHelper] Error cancelando run ${runId}:`, e.message);
    }
}

/**
 * Capa 1: Verificación Proactiva (waitForActiveRuns)
 */
export async function waitForActiveRuns(threadId: string, maxAttempts = 5) {
    if (!threadId) return;
    try {
        let attempt = 0;
        while (attempt < maxAttempts) {
            const runs = await openai.beta.threads.runs.list(threadId, { limit: 5 });
            const activeRun = runs.data.find(r => 
                ['in_progress', 'queued', 'requires_action'].includes(r.status)
            );

            if (activeRun) {
                if (activeRun.status === 'requires_action' && attempt >= 2) {
                    await openai.beta.threads.runs.cancel(threadId, activeRun.id);
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempt++;
            } else {
                return;
            }
        }
    } catch (error) {}
}

/**
 * Capa 3: Renovación Automática de Hilo
 */
export async function renewThreadAndRetry(
    assistantId: string, 
    message: string, 
    state: any, 
    userId: string, 
    errorReporter?: any
) {
    if (errorReporter && typeof errorReporter.reportError === 'function') {
        await errorReporter.reportError(new Error("Hilo bloqueado. Renovando automáticamente..."), userId, `https://wa.me/${userId}`);
    }

    const history = await HistoryHandler.getMessages(userId, 10);
    
    const threadOptions: any = {};
    if (history && history.length > 0) {
        threadOptions.messages = history
            .filter(m => m.content && m.content.trim() !== '')
            .map(m => ({ 
                role: m.role === 'assistant' ? 'assistant' : 'user', 
                content: m.content 
            }));
    }

    const newThread = await openai.beta.threads.create(threadOptions);

    if (state && typeof state.update === 'function') {
        await state.update({ thread_id: newThread.id });
    }
    
    return await askWithFunctions(assistantId, message, state);
}

/**
 * Capa 2: Petición Segura con Reintentos (safeToAsk)
 */
export const safeToAsk = async (
    assistantId: string,
    message: string,
    state: any,
    userId: string = 'unknown',
    errorReporter?: any,
    maxRetries = 5
) => {
    const SAFE_TIMEOUT = 120000; 
    
    return Promise.race([
        (async () => {
            let attempt = 0;
            while (attempt < maxRetries) {
                const threadId = state && typeof state.get === 'function' && state.get('thread_id');
                
                if (threadId) {
                    await waitForActiveRuns(threadId);
                }

                try {
                    return await askWithFunctions(assistantId, message, state);
                } catch (err: any) {
                    attempt++;
                    const errorMessage = err?.message || String(err);

                    if (errorMessage.includes('while a run') && errorMessage.includes('is active') && threadId) {
                        const runIdMatch = errorMessage.match(/run_[a-zA-Z0-9]+/);
                        if (runIdMatch) {
                            try {
                                await openai.beta.threads.runs.cancel(threadId, runIdMatch[0]);
                                await new Promise(r => setTimeout(r, 3000));
                                continue; 
                            } catch (cancelErr) {}
                        }
                    }

                    if (attempt >= maxRetries) {
                        return await renewThreadAndRetry(assistantId, message, state, userId, errorReporter);
                    }
                    
                    const waitTime = attempt * 2000;
                    await new Promise(r => setTimeout(r, waitTime));
                }
            }
        })(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_SAFE_TO_ASK')), SAFE_TIMEOUT))
    ]) as Promise<string>;
};
