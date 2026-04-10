
import { BaileysProvider } from 'builderbot-provider-sherpa';
import makeWASocket, { 
    DisconnectReason, 
    makeCacheableSignalKeyStore,
    isJidUser 
} from '@whiskeysockets/baileys';
import { useSupabaseAuthState } from '../utils/supabaseAdapter';
import { EventEmitter } from 'events';
import pino from 'pino';

// Logger compatible con Baileys
const logger = pino({ level: 'error' });

/**
 * Provider personalizado extendiendo de Sherpa/Baileys para inyectar Supabase Auth.
 */
export class SupabaseBaileysProvider extends BaileysProvider {
    saveCreds: any = null;
    clearSession: any = null;
    private initialized = false;

    constructor(args: any = {}) {
        super(args);
        console.log('[SupabaseBaileysProvider] 🏗️ Constructor instanciado. Forzando initProvider...');
        this.initProvider();
    }

    protected async initProvider() {
        if (this.initialized) {
             console.log('[SupabaseBaileysProvider] ⚠️ initProvider ya fue iniciado. Omitiendo duplicado.');
             return;
        }
        this.initialized = true;

        console.log('[SupabaseBaileysProvider] 🚀 Iniciando Provider Personalizado...');
        
        // 1. Cargar Auth State desde Supabase
        const projectId = process.env.RAILWAY_PROJECT_ID || 'local-dev';
        const botName = process.env.BOT_NAME || 'Unknown Bot';
        console.log(`[SupabaseBaileysProvider] Project ID: ${projectId} - Cargando sesión de Supabase...`);

        const { state, saveCreds, clearSession } = await useSupabaseAuthState(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY!,
            projectId,
            'default', // session ID
            botName    // bot Name
        );
        
        console.log('[SupabaseBaileysProvider] ✅ Sesión cargada (o inicializada vacía). Creando Socket...');
        
        this.saveCreds = saveCreds;
        this.clearSession = clearSession;

        // 2. Crear Socket usando la configuración base más nuestro auth
        // OJO: Al sobreescribir initProvider, somos responsables de crear this.vendor
        this.vendor = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger as any),
            },
            logger: logger as any,
            printQRInTerminal: false,
            generateHighQualityLinkPreview: true,
            // Heredar argumentos que se pasaron al constructor
            ...this.globalVendorArgs
        }) as any;

        // 3. Re-implementar listeners críticos 
        // (Al crear un nuevo vendor, los listeners originales de la clase base no se adjuntan automáticamente)
        
        this.vendor.ev.on('creds.update', this.saveCreds);

        this.vendor.ev.on('connection.update', async (update: any) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.emit('require_action', {
                    title: 'Escanea el código QR',
                    instructions: [
                        `Debes escanear el QR Code para vincular el bot de proyecto ${process.env.RAILWAY_PROJECT_ID || 'local'}.`,
                        `Recuerda que el QR caduca en 60 segundos`,
                    ],
                    payload: { qr },
                });
            }

            if (connection === 'open') {
                this.emit('ready', true);
                console.log(`[SupabaseBaileysProvider] ✅ Bot conectado exitosamente (Proyecto: ${process.env.RAILWAY_PROJECT_ID}).`);
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    console.log('[SupabaseBaileysProvider] 🔄 Reconectando...');
                    // Llamar recursivamente a este initProvider para reconectar
                    this.initProvider();
                } else {
                    console.log('[SupabaseBaileysProvider] ❌ Desconectado (Logout). Limpiando sesión en DB...');
                    if (this.clearSession) await this.clearSession();
                    this.emit('auth_failure', { instructions: ['Sesión cerrada. Escanea de nuevo.'] });
                    this.initProvider(); 
                }
            }
        });

        this.vendor.ev.on('messages.upsert', async ({ messages, type }: any) => {
            if (type !== 'notify') return;

            for (const msg of messages) {
                if (msg.key.fromMe) continue;
                if (!msg.message) continue;

                // Extraer body con lógica estándar
                const body = 
                    msg.message?.conversation || 
                    msg.message?.extendedTextMessage?.text || 
                    msg.message?.imageMessage?.caption || 
                    msg.message?.videoMessage?.caption ||
                    '';
                
                const from = msg.key.remoteJid;
                
                // Extraer el tipo real
                const messageType = Object.keys(msg.message || {})[0] || 'text';
                
                // Mapear tipos nativos a tipos estándar de BuilderBot
                const typeMapping: any = {
                    audioMessage: 'voice',
                    imageMessage: 'image',
                    videoMessage: 'video',
                    documentMessage: 'document',
                    locationMessage: 'location',
                    buttonsResponseMessage: 'buttons',
                    templateButtonReplyMessage: 'buttons',
                    contactMessage: 'contact'
                };

                const type = typeMapping[messageType] || 'text';

                // Si el body está vacío (común en audios/imágenes sin caption), ponemos un placeholder
                const finalBody = body || (type !== 'text' ? `_event_${type}_` : '');

                // Mapear eventos nativos de Baileys al formato de BuilderBot
                const payload = {
                    body: finalBody,
                    from,
                    phoneNumber: from?.split('@')[0],
                    name: msg.pushName || 'User',
                    type,
                    payload: msg 
                };

                this.emit('message', payload);
            }
        });
    }
}
