import axios from 'axios';
import { supabase } from '../utils/historyHandler';
import { backofficeAuth } from '../middleware/auth';

/**
 * Obtiene costo de OpenAI para un mes y aplica factor comercial.
 */
async function getOpenAICost(adminKey: string, year: number, month: number) {
    try {
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
        const now = new Date();

        const res = await axios.get('https://api.openai.com/v1/organization/costs', {
            headers: { Authorization: `Bearer ${adminKey}` },
            params: {
                start_time: Math.floor(startOfMonth.getTime() / 1000),
                end_time: Math.floor(Math.min(endOfMonth.getTime(), now.getTime()) / 1000)
            }
        });

        let total = 0;
        if (Array.isArray(res.data?.data)) {
            for (const bucket of res.data.data) {
                for (const result of bucket?.results || []) {
                    if (result?.amount?.value) total += Number(result.amount.value) || 0;
                }
            }
        }

        return Number((total * 1.5).toFixed(2));
    } catch (err) {
        console.error(`[Dashboard] Error OpenAI costs ${year}-${month + 1}:`, err);
        return 0;
    }
}

export const registerDashboardRoutes = (app: any) => {
    app.get('/api/dashboard/openai-usage', backofficeAuth, async (_req: any, res: any) => {
        try {
            const adminKey = process.env.OPENAI_ADMIN_API_KEY || '';
            if (!adminKey || adminKey === 'PENDING') {
                return res.status(400).json({
                    success: false,
                    error: 'OPENAI_ADMIN_API_KEY no configurada o en estado PENDING'
                });
            }

            const now = new Date();
            const usageData: Record<string, number> = {};
            for (let i = 3; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const label = date.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
                usageData[label] = await getOpenAICost(adminKey, date.getFullYear(), date.getMonth());
            }

            res.json({ success: true, data: usageData });
        } catch (err) {
            console.error('[Dashboard] openai-usage error:', err);
            res.status(500).json({ success: false, error: 'Fallo al obtener uso de OpenAI' });
        }
    });

    app.get('/api/dashboard/stats', backofficeAuth, async (_req: any, res: any) => {
        try {
            const projectId = process.env.RAILWAY_PROJECT_ID || 'local-dev';

            const { data: chats } = await supabase
                .from('chats')
                .select('is_lead, source')
                .eq('project_id', projectId);

            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);
            const { count: msgCountLast24h } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', projectId)
                .gt('created_at', yesterday.toISOString());

            const { data: roleStats } = await supabase
                .from('messages')
                .select('role')
                .eq('project_id', projectId);

            const { data: tickets } = await supabase
                .from('tickets')
                .select('estado, tipo')
                .eq('project_id', projectId);

            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            const { data: auditoria } = await supabase
                .from('auditoria_acciones')
                .select('usuario, created_at')
                .eq('project_id', projectId)
                .gt('created_at', lastWeek.toISOString());

            const { data: recentMsgs } = await supabase
                .from('messages')
                .select('chat_id, role, created_at')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(100);

            const totalChats = chats?.length || 0;
            const totalLeads = chats?.filter((c: any) => c.is_lead)?.length || 0;
            const conversionRate = totalChats > 0 ? (totalLeads / totalChats) * 100 : 0;

            const totalMessages = roleStats?.length || 0;
            const botMessages = roleStats?.filter((m: any) => m.role === 'assistant')?.length || 0;
            const proactivity = totalMessages > 0 ? (botMessages / totalMessages) * 100 : 0;

            const funnel = (tickets || []).reduce((acc: any, t: any) => {
                const key = t.estado || 'Sin Estado';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            const categories = (tickets || []).reduce((acc: any, t: any) => {
                const key = t.tipo || 'Sin Tipo';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            const productivity = (auditoria || []).reduce((acc: any, a: any) => {
                const key = a.usuario || 'Sin usuario';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            const sources = (chats || []).reduce((acc: any, c: any) => {
                const key = c.source || 'Directo/WA';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            let totalGap = 0;
            let gapsFound = 0;
            if (recentMsgs && recentMsgs.length > 1) {
                for (let i = 0; i < recentMsgs.length - 1; i++) {
                    const current = recentMsgs[i];
                    const prev = recentMsgs[i + 1];
                    if (current.role === 'assistant' && prev.role === 'user' && current.chat_id === prev.chat_id) {
                        const gapMin = (new Date(current.created_at).getTime() - new Date(prev.created_at).getTime()) / 60000;
                        if (gapMin > 0 && gapMin < 60) {
                            totalGap += gapMin;
                            gapsFound++;
                        }
                    }
                }
            }

            const avgResponseTime = gapsFound > 0 ? (totalGap / gapsFound).toFixed(1) : '1.2';

            res.json({
                success: true,
                stats: {
                    conversionRate: conversionRate.toFixed(1),
                    totalChats,
                    totalLeads,
                    msgCountLast24h: msgCountLast24h || 0,
                    proactivity: proactivity.toFixed(1),
                    funnel,
                    categories,
                    productivity,
                    sources,
                    avgResponseTime
                }
            });
        } catch (err) {
            console.error('[Dashboard] stats error:', err);
            res.status(500).json({ success: false, error: 'Fallo al obtener estadísticas' });
        }
    });
};
