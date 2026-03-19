import { Server } from 'socket.io';

export interface SocketDependencies {
    processUserMessage: any;
    historyEvents: any;
}

/**
 * Inicializa Socket.IO y enlaza eventos de historial.
 */
export const initSocketIO = (serverInstance: any, deps: SocketDependencies) => {
    if (!serverInstance) {
        console.error('❌ [ERROR] No se pudo obtener serverInstance para Socket.IO');
        return;
    }
    console.log('✅ [DEBUG] Inicializando Socket.IO...');
    const io = new Server(serverInstance, { cors: { origin: '*' } });

    // Inyectar el socket server en el objeto app para acceso global si es necesario
    if (serverInstance.app) {
        serverInstance.app.io = io;
    }

    // Enlazar eventos de HistoryHandler con Socket.IO para tiempo real
    deps.historyEvents.on('new_message', (payload: any) => {
        io.emit('new_message', payload);
    });

    deps.historyEvents.on('bot_toggled', (payload: any) => {
        io.emit('bot_toggled', payload);
    });

    io.on('connection', (socket) => {
        console.log('💬 Cliente web conectado');
        socket.on('message', async (msg) => {
            try {
                let ip = '';
                const xff = socket.handshake.headers['x-forwarded-for'];
                if (typeof xff === 'string') ip = xff.split(',')[0];
                else if (Array.isArray(xff)) ip = xff[0];
                else ip = socket.handshake.address || '';

                // Usar historial en memoria básico para webchat vía socket
                if (!(global as any).webchatHistories) (global as any).webchatHistories = {};
                const historyKey = `webchat_${ip}`;
                if (!(global as any).webchatHistories[historyKey]) (global as any).webchatHistories[historyKey] = [];
                const _history = (global as any).webchatHistories[historyKey];

                const state = {
                    get: (key: string) => key === 'history' ? _history : undefined,
                    update: async (msg: string, role = 'user') => {
                        _history.push({ role, content: msg });
                        if (_history.length > 20) _history.shift();
                    },
                    clear: async () => { _history.length = 0; }
                };

                let replyText = '';
                const flowDynamic = async (arr: any) => {
                    const text = Array.isArray(arr) ? arr.map((a: any) => a.body).join('\n') : arr;
                    replyText = replyText ? replyText + "\n\n" + text : text;
                };

                if (msg.trim().toLowerCase() === "#reset") {
                    await state.clear();
                    replyText = "🔄 Chat reiniciado.";
                } else {
                    await deps.processUserMessage({ from: ip, body: msg, type: 'webchat' }, { flowDynamic, state, provider: undefined, gotoFlow: () => { } });
                }
                socket.emit('reply', replyText);
            } catch (err) {
                console.error('Error Socket.IO:', err);
                socket.emit('reply', 'Error procesando mensaje.');
            }
        });

        socket.on('disconnect', () => {
            console.log('💬 Cliente web desconectado');
        });
    });

    return io;
};
