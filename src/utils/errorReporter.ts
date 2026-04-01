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
        if (!this.provider || !this.groupId) {
            console.warn("⚠️ [ErrorReporter] No se puede reportar el error (falta provider o groupId)");
            return;
        }

        const errorMessage = `🤖 *Error Detectado*\n\n` +
                             `👤 *Usuario:* ${userId}\n` +
                             `🔗 *Enlace:* ${userLink}\n\n` +
                             `❌ *Error:* ${error.message || String(error)}\n\n` +
                             `⚠️ _Se recomienda verificar manualmente._`;

        try {
            // Intentar usar sendText como método más directo para mensajes planos si existe
            if ((this.provider as any).sendText) {
                await (this.provider as any).sendText(this.groupId, errorMessage);
            } else {
                await this.provider.sendMessage(this.groupId, errorMessage, {});
            }
        } catch (sendError) {
            console.error("❌ [ErrorReporter] Fallo crítico al enviar reporte al grupo:", sendError?.message || sendError);
        }
    }
}

export { ErrorReporter };