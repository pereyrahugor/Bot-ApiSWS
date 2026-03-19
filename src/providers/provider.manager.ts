import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { EVENTS } from "@builderbot/bot";
import { isSessionInDb } from "../utils/sessionSync";
import { obtenerTextoDelMensaje, obtenerMensajeUnwrapped } from "../utils/messageHelper";

/**
 * Registra los listeners de los proveedores (YCloud/Baileys) para QR, fallos y mensajes entrantes.
 */
export const registerProviderEvents = (provider: any, isGroupProvider: boolean = false) => {
    let isGeneratingQR = false;
    const prefix = isGroupProvider ? '[GroupProvider]' : '[AdapterProvider]';

    // Listen para generar el archivo QR (Solo relevante para Baileys)
    provider.on('require_action', async (payload: any) => {
        try {
            if (isGeneratingQR) return;
            isGeneratingQR = true;
            let qrString = null;
            if (typeof payload === 'string') {
                qrString = payload;
            } else if (payload && typeof payload === 'object') {
                if (payload.qr) qrString = payload.qr;
                else if (payload.code) qrString = payload.code;
            }
            if (qrString && typeof qrString === 'string') {
                console.log(`${prefix} ⚡ QR detectado. Generando imagen...`);
                const qrFilename = isGroupProvider ? 'bot.groups.qr.png' : 'bot.qr.png';
                const qrPath = path.join(process.cwd(), qrFilename);
                await QRCode.toFile(qrPath, qrString, {

                    color: { dark: '#000000', light: '#ffffff' },
                    scale: 4,
                    margin: 2
                });
            }
        } catch (err) {
            console.error(`❌ ${prefix} Error generating QR image:`, err);
        } finally {
            isGeneratingQR = false;
        }
    });

    provider.on('host_failure', (payload: any) => {
        console.warn(`⚠️ ${prefix} HOST_FAILURE: Problema de conexión con WhatsApp.`, payload);
    });

    provider.on('message', (ctx: any) => {
        // Para YCloud, el mensaje ya viene pre-formateado en su handleWebhook
        // Pero para Baileys (grupos) necesitamos normalizarlo aquí
        if (isGroupProvider) {
            // 1. Desenvolver el mensaje
            const message = obtenerMensajeUnwrapped(ctx);
            if (message) {
                ctx.message = message;
            }
            
            // 2. Extraer texto base
            const textoExtraido = obtenerTextoDelMensaje(message);

            // Si el body está vacío o es un evento genérico, lo reemplazamos por el texto extraído
            if (!ctx.body || ctx.body === '' || ctx.body === '_event_media_' || ctx.body === '_event_document_' || ctx.body === '_event_voice_note_') {
                ctx.body = textoExtraido;
            }

            // Detección de tipos especiales
            const isLocation = message?.locationMessage || message?.liveLocationMessage;
            const isOrder = message?.orderMessage || message?.productMessage;
            const isAd = message?.extendedTextMessage?.contextInfo?.externalAdReply;
            const isButton = message?.buttonsResponseMessage || 
                             message?.templateButtonReplyMessage || 
                             message?.interactiveResponseMessage ||
                             message?.listResponseMessage;
            
            if (isLocation) {
                ctx.type = EVENTS.LOCATION;
                ctx.body = ctx.body || '_event_location_';
            } else if (isOrder) {
                ctx.type = EVENTS.ACTION;
                ctx.body = message?.orderMessage ? `Orden: ${message.orderMessage.orderId}` : 'Producto en catálogo';
            } else if (isButton) {
                if (message?.buttonsResponseMessage) {
                    ctx.body = message.buttonsResponseMessage.selectedDisplayText || message.buttonsResponseMessage.selectedId;
                } else if (message?.templateButtonReplyMessage) {
                    ctx.body = message.templateButtonReplyMessage.selectedDisplayText || message.templateButtonReplyMessage.selectedId;
                } else if (message?.listResponseMessage) {
                    ctx.body = message.listResponseMessage.title || message.listResponseMessage.singleSelectReply?.selectedRowId;
                } else if (message?.interactiveResponseMessage) {
                    const interactive = message.interactiveResponseMessage;
                    if (interactive.nativeFlowResponseMessage) {
                        try {
                            const params = JSON.parse(interactive.nativeFlowResponseMessage.paramsJson);
                            ctx.body = params.id || params.flow_token || 'flow_response';
                        } catch (e) { ctx.body = 'flow_interaction'; }
                    } else if (interactive.buttonReply) {
                        ctx.body = interactive.buttonReply.title || interactive.buttonReply.id;
                    } else if (interactive.listReply) {
                        ctx.body = interactive.listReply.title || interactive.listReply.id;
                    }
                }
                ctx.type = EVENTS.ACTION;
            } else if (isAd || message?.extendedTextMessage) {
                const extText = message?.extendedTextMessage;
                if (!ctx.body || ctx.body === '') {
                    ctx.body = extText?.text || '';
                }
                
                if (isAd) {
                    const adTitle = isAd.title || '';
                    const adBody = isAd.body || '';
                    ctx.body = `${ctx.body} [Contexto Anuncio: ${adTitle} - ${adBody}]`.trim();
                }
            } else if (ctx.type === 'desconocido' || !ctx.body) {
                 if (message?.contactMessage || message?.contactsArrayMessage) {
                     ctx.type = EVENTS.ACTION;
                     ctx.body = 'Contacto Compartido';
                 }
            }
        }
    });

    provider.on('ready', () => {
        console.log(`✅ ${prefix} READY: El proveedor está conectado y operativo.`);
        const qrFilename = isGroupProvider ? 'bot.groups.qr.png' : 'bot.qr.png';
        const qrPath = path.join(process.cwd(), qrFilename);
        if (fs.existsSync(qrPath)) {
            try {
                fs.unlinkSync(qrPath);
                console.log(`${prefix} 🗑️ QR antiguo eliminado al conectar.`);
            } catch (e) {}
        }
    });
    
    provider.on('auth_failure', (payload: any) => {
        console.error(`❌ ${prefix} AUTH_FAILURE: Error de autenticación.`, payload);
    });
};


/**
 * Verifica si existe una sesión activa (Local o Remota).
 */
export const hasActiveSession = async (provider: any) => {
    try {
        // 1. Detectar si es YCloud (Chequeo de propiedades internas del adaptador)
        const isYCloud = provider?.options?.apiKey || provider?.arg?.apiKey || (provider?.constructor?.name === 'YCloudProvider');
        
        // 2. Estado de conexión real (Baileys o genérico)
        const isReady = !!(provider?.vendor?.user || provider?.globalVendorArgs?.sock?.user);

        // Si es YCloud, lo consideramos activo si el objeto existe (es una API sin estado persistente de socket)
        if (isYCloud) return { active: true, source: 'api', providerType: 'ycloud' };

        const sessionsDir = path.join(process.cwd(), 'bot_sessions');
        let localActive = false;
        if (fs.existsSync(sessionsDir)) {
            const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json'));
            localActive = files.includes('creds.json');
        }

        if (isReady) return { active: true, source: 'connected', providerType: 'baileys' };

        if (localActive) {
            return { 
                active: false, 
                source: 'local', 
                providerType: 'baileys', 
                message: 'Conectando con WhatsApp (Local)...' 
            };
        }

        const remoteActive = await isSessionInDb();
        const qrFilename = (isYCloud) ? 'bot.qr.png' : 'bot.groups.qr.png';
        const hasQr = fs.existsSync(path.join(process.cwd(), qrFilename));

        return { 
            active: false, 
            hasRemote: remoteActive, 
            qr: hasQr,
            providerType: isYCloud ? 'ycloud' : 'baileys',
            message: remoteActive ? 'Sesión remota detectada. Descargando...' : (hasQr ? 'Esperando vinculación' : 'Iniciando motor...')
        };
    } catch (error) {
        return { active: false, error: error instanceof Error ? error.message : String(error) };
    }
};
