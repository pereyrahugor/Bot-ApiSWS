import { supabase, HistoryHandler, historyEvents } from "../utils/historyHandler";

/**
 * Worker que reactiva el bot si el humano no responde en el tiempo especificado.
 */
export const startHumanInactivityWorker = (minutes = 15) => {
    console.log(`🕒 [Worker] Iniciando monitor de inactividad humana (${minutes} min)...`);
    
    return setInterval(async () => {
        try {
            // Obtener chats donde el bot está desactivado
            const { data: chats } = await supabase
                .from('chats')
                .select('*')
                .eq('project_id', process.env.RAILWAY_PROJECT_ID || 'default_project')
                .eq('bot_enabled', false);

            const now = new Date();
            for (const chat of (chats || [])) {
                if (chat.last_human_message_at) {
                    const lastHuman = new Date(chat.last_human_message_at);
                    const diffMin = (now.getTime() - lastHuman.getTime()) / 60000;
                    
                    if (diffMin >= minutes) {
                        console.log(`🕒 [Worker] Reactivando bot para ${chat.id} (${Math.round(diffMin)} min inactivo)`);
                        await HistoryHandler.toggleBot(chat.id, true);
                        historyEvents.emit('bot_toggled', { chatId: chat.id, enabled: true });
                    }
                } else {
                    // Si no hay fecha (null), reactivamos por precaución
                    await HistoryHandler.toggleBot(chat.id, true);
                    historyEvents.emit('bot_toggled', { chatId: chat.id, enabled: true });
                }
            }
        } catch (e) {
            console.error('[Worker] Error checking human inactivity:', e);
        }
    }, 60000); // Revisar cada minuto
};
