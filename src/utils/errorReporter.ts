import { EVENTS } from "@builderbot/bot";
import { BaileysProvider } from "@builderbot/provider-baileys";

class ErrorReporter {
    private provider: BaileysProvider;
    private groupId: string;

    constructor(provider: BaileysProvider, groupId: string) {
        this.provider = provider;
        this.groupId = groupId;
    }

    async reportError(error: Error, userId: string, userLink: string) {
        try {
            // 1. Verificaciones básicas de configuración
            if (!this.provider || !this.groupId) {
                return;
            }

            // 2. Verificación de estado de conexión (evitar 'Cannot read properties of undefined (reading id)')
            // El error suele venir de que this.provider.vendor es undefined si no hay sesión activa.
            const isReady = !!(
                (this.provider as any).vendor?.user || 
                (this.provider as any).globalVendorArgs?.sock?.user
            );

            if (!isReady) {
                console.warn("⚠️ [ErrorReporter] El proveedor no está conectado. No se puede enviar el reporte.");
                return;
            }

            const errorMessage = `🤖 *Error Detectado*\n\n` +
                                 `👤 *Usuario:* ${userId}\n` +
                                 `🔗 *Enlace:* ${userLink}\n\n` +
                                 `❌ *Error:* ${error.message || String(error)}\n\n` +
                                 `⚠️ _Se recomienda verificar manualmente._`;

            // 3. Intento de envío con fallback
            try {
                if ((this.provider as any).sendText) {
                    await (this.provider as any).sendText(this.groupId, errorMessage);
                } else {
                    await this.provider.sendMessage(this.groupId, errorMessage, {});
                }
            } catch (sendError) {
                console.error("❌ [ErrorReporter] Error interno al intentar enviar reporte:", sendError?.message || sendError);
            }
        } catch (fatal) {
            // Este bloque asegura que NADA que pase aquí rompa el flujo principal del bot
            console.error("🔥 [ErrorReporter] Error fatal inesperado:", fatal?.message || fatal);
        }
    }
}

export { ErrorReporter };