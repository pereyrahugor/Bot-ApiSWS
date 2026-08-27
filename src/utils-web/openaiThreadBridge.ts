import { safeToAsk } from '../utils/openaiHelper';
import { supabase } from '../utils/historyHandler';

/**
 * Obtiene o crea un identificador de sesión para el usuario webchat.
 */
export async function getOrCreateThreadId(
  store?: { thread_id?: string | null } | null,
  chatId?: string,
  projectId: string = process.env.RAILWAY_PROJECT_ID || 'local-dev',
  serviceId: string = process.env.SERVICE_IDENTIFIER || process.env.RAILWAY_SERVICE_ID || 'default_service'
) {
  let threadId = store?.thread_id;

  if (!threadId && chatId) {
    try {
      let query = supabase.from('chats').select('thread_id, metadata').eq('id', chatId);
      if (projectId) query = query.eq('project_id', projectId);
      if (serviceId) query = query.eq('service_id', serviceId);
      const { data: chatRecord } = await query.maybeSingle();
      threadId = chatRecord?.thread_id || chatRecord?.metadata?.thread_id || null;
    } catch (e) {
      console.error('[getOrCreateThreadId] Error buscando thread_id en DB:', e);
    }
  }

  if (!threadId) {
    threadId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    if (chatId) {
      try {
        let updateQuery = supabase.from('chats').update({ thread_id: threadId }).eq('id', chatId);
        if (projectId) updateQuery = updateQuery.eq('project_id', projectId);
        if (serviceId) updateQuery = updateQuery.eq('service_id', serviceId);
        await updateQuery;
      } catch (err) {
        console.error('[getOrCreateThreadId] Error actualizando thread_id en DB:', err);
      }
    }
  }

  if (store) {
    store.thread_id = threadId;
  }

  return threadId;
}

/**
 * Envía un mensaje al modelo (gpt-5.4-nano) y devuelve la respuesta.
 */
export async function sendMessageToThread(_threadId: string, userMessage: string, assistantId: string) {
  try {
    const state = { get: () => null, update: async () => {} };
    const response = await safeToAsk(assistantId, userMessage, state, 'web-user');
    return response || '';
  } catch (error: any) {
    console.error('[sendMessageToThread] Error obteniendo respuesta:', error?.message || error);
    throw error;
  }
}

/**
 * Elimina la sesión / limpia thread_id
 */
export async function deleteThread(store: { thread_id?: string | null }) {
  if (store) {
    store.thread_id = null;
  }
}
