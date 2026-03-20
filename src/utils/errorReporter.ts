import { sendToGroup } from './groupSender';

class ErrorReporter {
    private groupId: string;

    constructor(_provider: any, groupId: string) {
        this.groupId = groupId;
    }


    async reportError(error: Error, _userId: string, userLink: string) {
        const errorMessage = `Error externo, se interrumpio la conexion con OpenAI. Verificar el chat manualmente\n${userLink}`;

        try {
            await sendToGroup(this.groupId, errorMessage);
        } catch (sendError) {
            console.error("Error al enviar el mensaje de error al grupo:", sendError);
        }
    }
}

export { ErrorReporter };