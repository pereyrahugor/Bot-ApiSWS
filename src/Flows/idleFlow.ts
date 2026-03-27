import { addKeyword, EVENTS } from '@builderbot/bot';
import { safeToAsk } from '../utils/openaiHelper';
import { errorReporter } from "../app";
import { GenericResumenData, extraerDatosResumen } from '~/utils/extractJsonData';
import { addToSheet } from '~/utils/googleSheetsResumen';
import fs from 'fs';
import { ReconectionFlow } from './reconectionFlow';
import { sendToGroup, sendImageToGroup, sendVideoToGroup } from '../utils/groupSender';
import { procesarAccionesResumen } from '../utils/resumenProcessor';
import { AssistantResponseProcessor } from '../utils/AssistantResponseProcessor';

//** Variables de entorno para el envio de msj de resumen a grupo de WS */
const ASSISTANT_ID = process.env.ASSISTANT_ID ?? '';
const ID_GRUPO_RESUMEN = process.env.ID_GRUPO_RESUMEN ?? '';
const ID_GRUPO_RESUMEN_2 = process.env.ID_GRUPO_RESUMEN_2 ?? '';
const msjCierre: string = process.env.msjCierre as string;

// Función auxiliar para reenviar media
async function sendMediaToGroup(state: any, targetGroup: string, data: any) {
    const fotoOVideoRaw = data["Foto o video"] || '';
    const debeEnviar = /s[ií]+/i.test(fotoOVideoRaw);

    if (debeEnviar) {
        const lastImage = state.get('lastImage');
        const lastVideo = state.get('lastVideo');

        if (lastImage && typeof lastImage === 'string') {
            if (fs.existsSync(lastImage)) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await sendImageToGroup(targetGroup, lastImage, "");
                try {
                    fs.unlinkSync(lastImage);
                    await state.update({ lastImage: null });
                } catch (e) { console.error('Error borrando img:', e.message); }
            }
        }

        if (lastVideo && typeof lastVideo === 'string') {
            if (fs.existsSync(lastVideo)) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await sendVideoToGroup(targetGroup, lastVideo, "");
                try {
                    fs.unlinkSync(lastVideo);
                    await state.update({ lastVideo: null });
                } catch (e) { console.error('Error borrando video:', e.message); }
            }
        }
    }
}

//** Flow para cierre de conversación, generación de resumen y envio a grupo de WS */
const idleFlow = addKeyword(EVENTS.ACTION).addAction(
    async (ctx, { endFlow, provider, state, flowDynamic, gotoFlow }) => {
        const userId = ctx.from;
        // Filtrar contactos ignorados antes de procesar el flujo
        if (
            /@broadcast$/.test(userId) ||
            /@newsletter$/.test(userId) ||
            /@channel$/.test(userId) ||
            /@lid$/.test(userId)
        ) {
            // console.log(`idleFlow ignorado por filtro de contacto: ${userId}`);
            return endFlow();
        }

        // console.log("Ejecutando idleFlow...");

        try {
            // Obtener el resumen del asistente de OpenAI con reintentos y reporte de errores
            const resumen = await safeToAsk(ASSISTANT_ID, "GET_RESUMEN", state, userId, errorReporter) as string;

            if (!resumen) {
                // console.warn("No se pudo obtener el resumen.");
                return endFlow();
            }

                let data: GenericResumenData;
                try {
                    data = JSON.parse(resumen);
                } catch (error) {
                    data = extraerDatosResumen(resumen);
                }

                // NUEVA LÓGICA: Procesar acciones automáticas basadas en el resumen
                const { updatedResumen, feedback } = await procesarAccionesResumen(resumen);
                const finalResumenText = updatedResumen;

                // Si se realizaron acciones, informar al asistente para que se lo diga al usuario
                if (feedback.length > 0) {
                    for (const fItem of feedback) {
                        const feedbackMsg = `NOTIFICACIÓN DEL BOT: El bot ha completado tareas automáticas basadas en el resumen de la conversación para ayudarte a finalizar el trámite: ${fItem}. Por favor, infórmaselo al usuario con tus propias palabras amablemente indicando los datos (ID de incidencia, o usuario y contraseña si corresponde).`;
                        // Se pide al asistente que genere un mensaje final para el usuario
                        const assistantFeedback = await safeToAsk(ASSISTANT_ID, feedbackMsg, state, userId, errorReporter) as string;
                        // Procesar la respuesta del asistente para que el usuario reciba el mensaje final
                        // Llamamos al procesador regular de respuestas del asistente
                        if (assistantFeedback) {
                            await AssistantResponseProcessor.procesarRespuestaAsistente(assistantFeedback, ctx, flowDynamic, state, provider, gotoFlow, (id, msg, st, u, reporter) => safeToAsk(id, msg, st, u, reporter), ASSISTANT_ID);
                        }
                    }
                }

                // Limpieza robusta de caracteres invisibles y espacios
                const tipo = (data.tipo ?? '').replace(/[^A-Z0-9_]/gi, '').toUpperCase();
                data.linkWS = `https://wa.me/${ctx.from.replace(/[^0-9]/g, '')}`;

                if (tipo === 'NO_REPORTAR_BAJA') {
                    // ... (sin cambios relevantes, pero usando data.linkWS arriba)
                    await addToSheet(data);
                    return endFlow();
                } else if (tipo === 'NO_REPORTAR_SEGUIR') {
                    const reconFlow = new ReconectionFlow({
                        ctx, state, provider, flowDynamic, gotoFlow, maxAttempts: 3,
                        onSuccess: async () => {/* ... */},
                        onFail: async () => { await addToSheet(data); }
                    });
                    return await reconFlow.start();
                } else if (tipo === 'SI_REPORTAR_SEGUIR' || tipo === 'SI_RESUMEN_G2' || tipo === 'SI_RESUMEN') {
                    const groupTarget = (tipo === 'SI_RESUMEN_G2') ? ID_GRUPO_RESUMEN_2 : ID_GRUPO_RESUMEN;
                    const resumenConLink = `${finalResumenText}\n\n🔗 [Chat del usuario](${data.linkWS})`;
                    try {
                        await sendToGroup(groupTarget, resumenConLink);
                        await sendMediaToGroup(state, groupTarget, data);
                    } catch (err: any) {}
                    await addToSheet(data);
                    if (tipo === 'SI_REPORTAR_SEGUIR') {
                        const reconFlow = new ReconectionFlow({
                            ctx, state, provider, flowDynamic, gotoFlow, maxAttempts: 3,
                            onSuccess: async () => {/* ... */},
                            onFail: async () => {}
                        });
                        return await reconFlow.start();
                    }
                } else {
                    const resumenConLink = `${finalResumenText}\n\n🔗 [Chat del usuario](${data.linkWS})`;
                    try {
                        await provider.sendText(ID_GRUPO_RESUMEN, resumenConLink);
                        await sendMediaToGroup(state, ID_GRUPO_RESUMEN, data);
                    } catch (err: any) {}
                    await addToSheet(data);
                    return;
                }
        } catch (error) {
            // console.error("Error al obtener el resumen de OpenAI:", error);
            return endFlow();
        }
    });

export { idleFlow };