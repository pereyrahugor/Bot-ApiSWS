import { addKeyword, EVENTS } from "@builderbot/bot";
import { BaileysProvider } from "@builderbot/provider-baileys";
import { MemoryDB } from "@builderbot/bot";
import { reset } from "~/utils/timeOut";
import { userQueues, userLocks, handleQueue } from "~/utils/queueManager"; 
import { transcribeAudioFile } from "~/utils/audioTranscriptior";
import path from "path";
import fs from "fs";

// Si se define timeOutCierre en minutos en .env, se multiplica por 60*1000 para obtener milisegundos
const setTime = Number(process.env.timeOutCierre) * 60 * 1000;

export const welcomeFlowVoice = addKeyword<BaileysProvider, MemoryDB>(EVENTS.VOICE_NOTE)
    .addAction(async (ctx, { gotoFlow, flowDynamic, state, provider }) => {
        const userId = ctx.from;

        // Filtrar contactos ignorados antes de agregar a la cola
        if (
            /@broadcast$/.test(userId) ||
            /@newsletter$/.test(userId) ||
            /@channel$/.test(userId) ||
            /@lid$/.test(userId)
        ) {
            console.log(`Mensaje de voz ignorado por filtro de contacto: ${userId}`);
            return;
        }

        // --- FILTRO DE ECO / MENSAJES PROPIOS ---
        const botNumber = (process.env.YCLOUD_WABA_NUMBER || '').replace(/\D/g, '');
        const senderNumber = (userId || '').replace(/\D/g, '');
        
        if (ctx.key?.fromMe || (botNumber && senderNumber === botNumber)) {
            return;
        }

        console.log(`🎙️ Mensaje de voz recibido de ${userId}`);

        reset(ctx, gotoFlow, setTime);

        // Asegurar que userQueues tenga un array inicializado para este usuario
        if (!userQueues.has(userId)) {
            userQueues.set(userId, []);
        }


        // 📌 Definir ruta donde se guardarán los audios
        const audioFolder = path.join("./temp/voiceNote/");

        // 📌 Crear la carpeta si no existe
        if (!fs.existsSync(audioFolder)) {
            fs.mkdirSync(audioFolder, { recursive: true });
            console.log("📂 Carpeta 'temp/voiceNote' creada.");
        }

        // Guardar el archivo de audio localmente
        const localPath = await provider.saveFile(ctx, { path: "./temp/voiceNote/" });
        
        if (!localPath || localPath === 'no-file') {
            console.error("❌ [welcomeFlowVoice] No se pudo guardar el archivo de audio.");
            // No podemos procesar si no hay archivo
            return;
        }

        console.log(`📂 Ruta del archivo de audio: ${localPath}`);

        try {
            // Transcribir el audio antes de procesarlo
            const transcription = await transcribeAudioFile(`${localPath}`);

            if (!transcription) {
                console.warn("⚠️ [welcomeFlowVoice] Transcripción vacía o fallida.");
                await flowDynamic("⚠️ No pude transcribir el audio. Inténtalo de nuevo o escribe tu mensaje.");
            } else {
                console.log(`📝 Transcripción: ${transcription}`);
                ctx.body = transcription;

                // Enviar la transcripción al asistente
                const queue = userQueues.get(userId);
                queue.push({ ctx, flowDynamic, state, provider, gotoFlow });

                if (!userLocks.get(userId) && queue.length === 1) {
                    await handleQueue(userId);
                }
            }
        } catch (error) {
            console.error("❌ [welcomeFlowVoice] Error durante la transcripción:", error);
        } finally {
            // Eliminar el archivo temporal solo si existe y no es 'no-file'
            if (localPath && localPath !== 'no-file' && fs.existsSync(localPath)) {
                fs.unlink(localPath, (err) => {
                    if (err) {
                        console.error(`❌ Error al eliminar el archivo: ${localPath}`, err);
                    } else {
                        console.log(`🗑️ Archivo temporal eliminado: ${localPath}`);
                    }
                });
            }
        }
    });
