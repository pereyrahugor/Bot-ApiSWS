import { createClient } from "@supabase/supabase-js";
import { EventEmitter } from "events";
import dotenv from "dotenv";
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);
export { supabase };

// Emitter para notificar cambios en tiempo real a otros módulos (como el de WebSockets)
export const historyEvents = new EventEmitter();

// Identificador único para este bot específico
const PROJECT_ID = process.env.RAILWAY_PROJECT_ID || "local-dev";
const PROJECT_IDENTIFIER = PROJECT_ID; // Unificamos para evitar discrepancias entre tablas

console.log(`[History] Project ID: ${PROJECT_ID}`);
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.warn("⚠️ [Supabase] Missing SUPABASE_URL or SUPABASE_KEY. History may fail.");
}

export interface Chat {
    id: string; // WAID (Teléfono) o identificador de Webchat
    user_id?: string | null; // BSUID (Meta Business-Scoped User ID)
    project_id: string;
    type: 'whatsapp' | 'webchat';
    name: string | null;
    email: string | null;
    notes: string | null;
    source: string | null;
    bot_enabled: boolean;
    last_message_at: string;
    last_human_message_at: string | null;
    metadata: any;
    assigned_to?: string | null;
    cuit_dni?: string | null;
    tax_status?: string | null;
    address?: string | null;
    offered_product?: string | null;
    is_lead?: boolean;
}

export interface Message {
    id?: string;
    chat_id: string;
    project_id: string;
    agent_id?: string; // Nuevo: Soporte para multi-agentes
    role: 'user' | 'assistant' | 'system';
    content: string;
    type: 'text' | 'image' | 'audio' | 'video' | 'location' | 'document';
    created_at?: string;
}

export class HistoryHandler {

    static async initDatabase() {
        if (!supabase) return;
        console.log('🔍 [HistoryHandler] Verificando tablas de historial...');
        // (Lógica de inicialización de tablas omitida para brevedad si ya existe, 
        // pero asegurando que HistoryHandler tiene los métodos que siguen)
    }
    
    static async getOrCreateChat(chatId: string, type: 'whatsapp' | 'webchat', name: string | null = null, userId: string | null = null): Promise<Chat | null> {
        try {
            let data: Chat | null = null;
            if (userId) {
                const { data: byUserId } = await supabase.from('chats').select('*').eq('user_id', userId).eq('project_id', PROJECT_ID).maybeSingle();
                data = byUserId;
            }
            if (!data) {
                const { data: byChatId } = await supabase.from('chats').select('*').eq('id', chatId).eq('project_id', PROJECT_ID).maybeSingle();
                data = byChatId;
                if (data && userId && !data.user_id) {
                    await supabase.from('chats').update({ user_id: userId }).eq('id', chatId).eq('project_id', PROJECT_ID);
                    data.user_id = userId;
                }
            }
            if (!data) {
                const { data: newData, error: insertError } = await supabase.from('chats').insert({
                    id: chatId, user_id: userId, project_id: PROJECT_ID, type, name, bot_enabled: true, last_message_at: new Date().toISOString()
                }).select().single();
                if (insertError) throw insertError;
                return newData;
            }
            if (name && !data.name) {
                await supabase.from('chats').update({ name }).eq('id', chatId).eq('project_id', PROJECT_ID);
            }
            return data;
        } catch (err) {
            console.error('[HistoryHandler] Error en getOrCreateChat:', err);
            return null;
        }
    }

    static async saveMessage(chatId: string, role: 'user' | 'assistant' | 'system', content: string, type: string = 'text', contactName: string | null = null, userId: string | null = null) {
        try {
            await this.getOrCreateChat(chatId, chatId.includes('@') ? 'whatsapp' : 'webchat', contactName, userId);
            
            const messageData: any = {
                chat_id: chatId, 
                project_id: PROJECT_ID, 
                role, 
                content, 
                type, 
                created_at: new Date().toISOString()
            };

            // Intentar con agent_id si está configurado
            if (process.env.ASSISTANT_ID) {
                messageData.agent_id = process.env.ASSISTANT_ID;
            }

            const { error } = await supabase.from('messages').insert(messageData);
            if (error) throw error;

            await supabase.from('chats').update({ last_message_at: new Date().toISOString() }).eq('id', chatId).eq('project_id', PROJECT_ID);
            historyEvents.emit('new_message', { chatId, role, content, type });
        } catch (err) {
            console.error('[HistoryHandler] Error en saveMessage:', err);
        }
    }

    /**
     * Persiste el contexto del cliente en la base de datos (Supabase)
     */
    static async saveClientContext(chatId: string, data: any) {
        try {
            console.log(`[History] 💾 Guardando contexto cliente para ${chatId}...`);
            const updateData: any = {
                name: data.nombre || null,
                email: data.email || null,
                address: data.direccion || data.address || null,
                cuit_dni: data.numCliente || data.cuit_dni || null,
                tax_status: data.tax_status || null,
                offered_product: data.offered_product || null,
                is_lead: true
            };
            
            const { error } = await supabase.from('chats').update(updateData).eq('id', chatId).eq('project_id', PROJECT_ID);
            if (error) throw error;
        } catch (err) {
            console.error('[HistoryHandler] Error en saveClientContext:', err);
        }
    }

    static async updateContactDetails(chatId: string, details: any) {
        try {
            const { error } = await supabase.from('chats').update(details).eq('id', chatId).eq('project_id', PROJECT_ID);
            if (error) throw error;
            return { success: true };
        } catch (err: any) {
            console.error('[HistoryHandler] Error en updateContactDetails:', err);
            return { success: false, error: err.message };
        }
    }

    static async createNewLeadManual(chatId: string, details: any) {
        try {
            const { error: chatErr } = await supabase.from('chats').upsert({
                id: chatId, project_id: PROJECT_ID, ...details, is_lead: true, created_at: new Date().toISOString()
            }, { onConflict: 'id,project_id' });
            if (chatErr) throw chatErr;
            const { data: ticket, error: ticketErr } = await supabase.from('tickets').insert({
                chat_id: chatId, project_id: PROJECT_ID, titulo: `Lead: ${details.name || chatId}`,
                descripcion: details.notes || 'Lead creado manualmente', tipo: details.offered_product || 'Nuevo Lead',
                prioridad: 'Media', estado: 'Abierto', created_at: new Date().toISOString()
            }).select().single();
            if (ticketErr) throw ticketErr;
            return { success: true, ticket };
        } catch (err: any) {
            console.error('[HistoryHandler] Error en createNewLeadManual:', err);
            return { success: false, error: err.message };
        }
    }

    static async isBotEnabled(chatId: string): Promise<boolean> {
        try {
            const { data } = await supabase.from('chats').select('bot_enabled').eq('id', chatId).eq('project_id', PROJECT_ID).maybeSingle();
            return data ? data.bot_enabled : true;
        } catch (err) { return true; }
    }

    static async toggleBot(chatId: string, enabled: boolean) {
        try {
            const updateData: any = { bot_enabled: enabled };
            if (enabled === false) updateData.last_human_message_at = new Date().toISOString();
            const { error } = await supabase.from('chats').update(updateData).eq('id', chatId).eq('project_id', PROJECT_ID);
            if (error) throw error;
            historyEvents.emit('bot_toggled', { chatId, enabled });
            return { success: true };
        } catch (err: any) { return { success: false, error: err.message }; }
    }

    static async listChats(limit: number = 20, offset: number = 0, search?: string, tagId?: string, assignedTo?: string | null) {
        try {
            let query = supabase.from('chats').select('*, chat_tags(tag_id, tags(*))').eq('project_id', PROJECT_ID);
            if (assignedTo) query = query.or(`assigned_to.eq.${assignedTo},assigned_to.is.null`);
            if (search) query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%,email.ilike.%${search}%,notes.ilike.%${search}%,source.ilike.%${search}%`);
            const { data, error } = await query.order('last_message_at', { ascending: false }).range(offset, offset + limit - 1);
            if (error) throw error;
            return (data || []).map(chat => ({
                ...chat, tags: chat.chat_tags ? chat.chat_tags.map((ct: any) => ct.tags).filter((t: any) => t !== null) : []
            }));
        } catch (err) { return []; }
    }

    static async getMessages(chatId: string, limit: number = 50, offset: number = 0) {
        try {
            const { data, error } = await supabase.from('messages').select('*').eq('chat_id', chatId).eq('project_id', PROJECT_ID).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
            if (error) throw error;
            return (data || []).reverse();
        } catch (err) { return []; }
    }

    // --- Tag Management ---
    static async getTags() {
        const { data } = await supabase.from('tags').select('*').eq('project_id', PROJECT_ID).order('name');
        return data || [];
    }
    static async createTag(name: string, color: string) {
        const { data, error } = await supabase.from('tags').insert({ name, color, project_id: PROJECT_ID }).select().single();
        return error ? { success: false, error: error.message } : { success: true, tag: data };
    }
    static async deleteTag(id: string) {
        const { error } = await supabase.from('tags').delete().eq('id', id).eq('project_id', PROJECT_ID);
        return { success: !error };
    }
    static async addTagToChat(chatId: string, tagId: string) {
        const { error } = await supabase.from('chat_tags').insert({ chat_id: chatId, tag_id: tagId, project_id: PROJECT_ID });
        return { success: !error };
    }
    static async removeTagFromChat(chatId: string, tagId: string) {
        const { error } = await supabase.from('chat_tags').delete().eq('chat_id', chatId).eq('tag_id', tagId).eq('project_id', PROJECT_ID);
        return { success: !error };
    }

    static async updateLastHumanMessage(chatId: string) {
        await supabase.from('chats').update({ last_human_message_at: new Date().toISOString() }).eq('id', chatId).eq('project_id', PROJECT_ID);
    }

    static async saveThreadId(chatId: string, threadId: string) {
        const { data } = await supabase.from('chats').select('metadata').eq('id', chatId).eq('project_id', PROJECT_ID).maybeSingle();
        const updatedMetadata = { ...(data?.metadata || {}), thread_id: threadId };
        await supabase.from('chats').update({ metadata: updatedMetadata }).eq('id', chatId).eq('project_id', PROJECT_ID);
    }

    static async getThreadId(chatId: string): Promise<string | null> {
        const { data } = await supabase.from('chats').select('metadata').eq('id', chatId).eq('project_id', PROJECT_ID).maybeSingle();
        return data?.metadata?.thread_id || null;
    }

    static async createTicket(chatId: string, titulo: string, descripcion: string, tipo: string = 'Soporte', prioridad: string = 'Media') {
        const { data, error } = await supabase.from('tickets').insert({
            chat_id: chatId, project_id: PROJECT_ID, titulo, descripcion, tipo, prioridad, estado: 'Abierto'
        }).select().single();
        if (!error) historyEvents.emit('ticket_updated', { chatId, ticket: data });
        return error ? { success: false, error: error.message } : { success: true, ticket: data };
    }

    static async getPendingTicketsCount(tipo?: string) {
        let query = supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('project_id', PROJECT_ID).in('estado', ['Abierto', 'En progreso']);
        if (tipo) query = query.eq('tipo', tipo);
        const { count } = await query;
        return count || 0;
    }

    static async listTickets(limit: number = 50, offset: number = 0, estado?: string, tipo?: string, chatId?: string) {
        let query = supabase.from('tickets').select('*, chats(name, id)').eq('project_id', PROJECT_ID);
        if (chatId) query = query.eq('chat_id', chatId);
        if (estado) query = query.eq('estado', estado);
        else query = query.in('estado', ['Abierto', 'En progreso']);
        if (tipo) query = query.eq('tipo', tipo);
        const { data, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
        return data || [];
    }

    static async updateTicketStatus(ticketId: string, nuevoEstado: string) {
        const { data, error } = await supabase.from('tickets').update({ estado: nuevoEstado, updated_at: new Date().toISOString() }).eq('id', ticketId).eq('project_id', PROJECT_ID).select().maybeSingle();
        if (!error) historyEvents.emit('ticket_updated', data);
        return error ? { success: false, error: error.message } : { success: true, data };
    }

    static async listEditedLeads(limit: number = 50, offset: number = 0) {
        const { data } = await supabase.from('chats').select('*').eq('project_id', PROJECT_ID).eq('is_lead', true).order('last_human_message_at', { ascending: false }).range(offset, offset + limit - 1);
        return data || [];
    }

    static async saveMetaOnboardingData(phoneId: string, wabaId: string, token: string, extra: any = {}) {
        const { data, error } = await supabase.from('meta_onboarding').upsert({
            project_id: PROJECT_ID, waba_id: wabaId, phone_number_id: phoneId, access_token: token, onboarding_data: extra, status: 'active', updated_at: new Date().toISOString()
        }, { onConflict: 'project_id' }).select().single();
        return error ? { success: false, error: error.message } : { success: true, data };
    }

    static async getMetaOnboardingData() {
        const { data } = await supabase.from('meta_onboarding').select('*').eq('project_id', PROJECT_ID).maybeSingle();
        return data;
    }

    static async saveSetting(key: string, value: string) {
        await supabase.from('settings').upsert({ project_id: PROJECT_IDENTIFIER, key, value, updated_at: new Date().toISOString() }, { onConflict: 'project_id,key' });
    }

    static async getSetting(key: string): Promise<string | null> {
        const { data } = await supabase.from('settings').select('value').eq('project_id', PROJECT_IDENTIFIER).eq('key', key).single();
        return data?.value || null;
    }

    // --- User Management (New) ---
    static async verifyUser(username: string, pass: string) {
        const { data } = await supabase.from('users').select('*').eq('project_id', PROJECT_ID).eq('username', username).eq('password', pass).maybeSingle();
        return data;
    }
    static async listUsers() {
        const { data } = await supabase.from('users').select('id, username, role, created_at').eq('project_id', PROJECT_ID);
        return data || [];
    }
    static async createUser(username: string, pass: string, role: string = 'subuser') {
        const { data, error } = await supabase.from('users').insert({ project_id: PROJECT_ID, username, password: pass, role }).select().single();
        return error ? { success: false, error: error.message } : { success: true, user: data };
    }
    static async assignChatToUser(chatId: string, userId: string | null) {
        const { error } = await supabase.from('chats').update({ assigned_to: userId }).eq('id', chatId).eq('project_id', PROJECT_ID);
        return { success: !error };
    }
}
