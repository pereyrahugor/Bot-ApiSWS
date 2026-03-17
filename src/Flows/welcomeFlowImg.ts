import { addKeyword, EVENTS } from "@builderbot/bot";
import { welcomeFlowVideo } from "./welcomeFlowVideo";
import { reset } from "../utils/timeOut";
import { userQueues, userLocks, handleQueue } from "../utils/queueManager";
import { processImageWithVision } from "../utils/processImageWithVision";
import fs from 'fs';
import path from 'path';
import { HistoryHandler } from "../utils/historyHandler";

const setTime = Number(process.env.timeOutCierre) * 60 * 1000;

const welcomeFlowImg = addKeyword(EVENTS.MEDIA).addAction(
    async (ctx, { flowDynamic, provider, gotoFlow, state }) => {
        const userId = ctx.from;

        // Verificar si es una imagen (y no un video)
        const mimetype = ctx?.media?.mimetype || ctx?.message?.imageMessage?.mimetype || "";
        if (mimetype.includes('video')) {
            return gotoFlow(welcomeFlowVideo);
        }

        // Filtrar contactos ignorados
        if (
            /@broadcast$/.test(userId) ||
            /@newsletter$/.test(userId) ||
            /@channel$/.test(userId) ||
            /@lid$/.test(userId)
        ) {
            return;
        }

        reset(ctx, gotoFlow, setTime);

        // Asegurar que la carpeta temp exista
        if (!fs.existsSync("./temp/")) {
            fs.mkdirSync("./temp/", { recursive: true });
        }

        try {
            if (!provider) {
                await flowDynamic("No se encontró el provider para descargar la imagen.");
                return;
            }

            // Guardar imagen en uploads para que sea persistente y accesible desde el backoffice
            const localPath = await provider.saveFile(ctx, { path: "./uploads/" });
            if (!localPath) {
                await flowDynamic("No se pudo guardar la imagen recibida.");
                return;
            }

            // Eliminar imagen anterior si existe para no acumular archivos
            const oldImage = state.get('lastImage');
            if (oldImage && typeof oldImage === 'string' && fs.existsSync(oldImage)) {
                try { fs.unlinkSync(oldImage); } catch (e) { /* ignore */ }
            }

            await state.update({ lastImage: localPath });
            const buffer = fs.readFileSync(localPath);
            
            // Guardar en el historial para que sea visible en el backoffice
            const fileName = path.basename(localPath);
            await HistoryHandler.saveMessage(ctx.from, 'user', `/uploads/${fileName}`, 'image');

            await flowDynamic("Analizando imagen...");

            // Usar la utilidad centralizada processImageWithVision
            const result = await processImageWithVision(buffer);

            // Enviar el mensaje al asistente principal para que lo procese y mantenga el contexto
            ctx.body = `[Imagen recibida]: ${result}`;

            // Reencolar el mensaje para que lo procese el flujo principal (texto)
            if (!userQueues.has(userId)) {
                userQueues.set(userId, []);
            }
            userQueues.get(userId).push({ ctx, flowDynamic, state, provider, gotoFlow });
            
            if (!userLocks.get(userId) && userQueues.get(userId).length === 1) {
                await handleQueue(userId);
            }

        } catch (err) {
            // console.error("Error procesando imagen:", err);
            await flowDynamic("Ocurrió un error al analizar la imagen.");
        }
    }
);

export { welcomeFlowImg };