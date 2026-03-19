import { ProviderClass } from '@builderbot/bot';
import axios from 'axios';

/**
 * Proveedor especializado para YCloud (Meta Cloud API alternative)
 */
class YCloudProvider extends ProviderClass {
    globalVendorArgs: any;

    constructor(args: any = {}) {
        super();
        this.globalVendorArgs = args;
    }

    protected initProvider() {
        console.log('🌐 [YCloudProvider] Inicializado. Esperando Webhooks en /webhook');
    }

    public async initVendor() {
        this.vendor = {};
        setTimeout(() => {
            this.emit('ready', true);
        }, 100);
        return this.vendor;
    }

    public beforeHttpServerInit() {}
    public afterHttpServerInit() {}

    public busEvents = () => {
        return [];
    };

    public saveFile() {
        return Promise.resolve('no-file');
    }

    /**
     * Envía mensajes a través de la API de YCloud
     */
    public async sendMessage(number: string, message: string, options: any = {}): Promise<any> {
        const apiKey = process.env.YCLOUD_API_KEY;
        const fromNumber = process.env.YCLOUD_WABA_NUMBER;

        if (!apiKey || !fromNumber) {
            console.error('❌ [YCloudProvider] Error: Falta YCLOUD_API_KEY o YCLOUD_WABA_NUMBER');
            return;
        }

        const url = 'https://api.ycloud.com/v2/whatsapp/messages';
        const cleanNumber = number.replace(/\D/g, '');

        const body: any = {
            from: fromNumber.replace(/\D/g, ''),
            to: cleanNumber,
            type: 'text',
            text: { body: message }
        };

        // Soporte básico para archivos si se implementa en el futuro
        if (options.media) {
            console.warn('⚠️ [YCloudProvider] El envío de media directo no está implementado aún en este adaptador.');
        }

        try {
            const response = await axios.post(url, body, {
                headers: {
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json'
                }
            });
            // Log mínimo solo para seguimiento
            if (response.status !== 200 && response.status !== 201) {
                console.warn(`📤 [YCloud] Status: ${response.status} para ${cleanNumber}`);
            }
            return response.data;
        } catch (error: any) {
            console.error('❌ [YCloud] Error API:', error?.response?.data || error.message);
            return null;
        }

    }

    /**
     * Procesa el Webhook entrante
     */
    public handleWebhook = (req: any, res: any) => {
        try {
            const body = req.body;
            
            // Responder 200 OK inmediatamente
            if (!res.headersSent) {
                res.statusCode = 200;
                res.end('OK');
            }

            if (!body) return;

            // Procesamiento asíncrono
            setImmediate(() => {
                this.processIncomingMessage(body);
            });
        } catch (e) {
            console.error('❌ [YCloudProvider] Error en handleWebhook:', e);
        }
    }

    private processIncomingMessage = (body: any) => {
        try {
            const wabaNumberEnv = process.env.YCLOUD_WABA_NUMBER;
            const myWabaNumber = wabaNumberEnv?.replace(/\D/g, '');

            // 1. Formato Nativo de YCloud
            if (body.type === 'whatsapp.inbound_message.received' && body.whatsappInboundMessage) {
                const msg = body.whatsappInboundMessage;
                
                // Filtro de número destino
                if (myWabaNumber && msg.to && msg.to.replace(/\D/g, '') !== myWabaNumber) {
                    return;
                }

                const formatedMessage = {
                    body: msg.text?.body || 
                          msg.interactive?.button_reply?.title || 
                          msg.interactive?.list_reply?.title || 
                          msg.button?.text || '',
                    from: msg.wa_id || msg.from.replace('+', ''),
                    phoneNumber: msg.from.replace('+', ''),
                    name: msg.customerProfile?.name || 'User',
                    type: msg.type,
                    payload: msg
                };

                this.emit('message', formatedMessage);
            }
            // 2. Formato Meta Cloud API
            else if (body.object === 'whatsapp_business_account' || body.entry) {
                body.entry?.forEach((entry: any) => {
                    entry.changes?.forEach((change: any) => {
                        const value = change.value;
                        if (value?.messages) {
                            
                            // Filtro de número destino (Phone Number ID o Display Number)
                            if (myWabaNumber && value.metadata) {
                                const destId = value.metadata.phone_number_id;
                                const destNum = value.metadata.display_phone_number?.replace(/\D/g, '');
                                if (destId !== myWabaNumber && destNum !== myWabaNumber) return;
                            }

                            const contact = value.contacts?.[0];
                            const wa_id = contact?.wa_id;

                            value.messages.forEach((msg: any) => {
                                const formatedMessage = {
                                    body: msg.text?.body || 
                                          msg.interactive?.button_reply?.title || 
                                          msg.interactive?.list_reply?.title || 
                                          msg.button?.text || '',
                                    from: wa_id || msg.from.replace('+', ''),
                                    phoneNumber: msg.from.replace('+', ''),
                                    name: contact?.profile?.name || msg.profile?.name || 'User',
                                    type: msg.type,
                                    payload: msg
                                };
                                this.emit('message', formatedMessage);
                            });
                        }
                    });
                });
            }
        } catch (e) {
            console.error('❌ [YCloudProvider] Error procesando mensaje entrante:', e);
        }
    }
}

export { YCloudProvider };
