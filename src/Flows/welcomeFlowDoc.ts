import { addKeyword, EVENTS } from "@builderbot/bot";
import { BaileysProvider } from "@builderbot/provider-baileys";
import { MemoryDB } from "@builderbot/bot";
import { reset } from "~/utils/timeOut";
import { handleQueue, userQueues, userLocks } from "~/app";
import { processImageWithVision } from "../utils/processImageWithVision";
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const setTime = Number(process.env.timeOutCierre) * 60 * 1000;

// Función para convertir PDF a imágenes PNG usando pdftoppm (Poppler)
function extraerPaginasComoPNG(pdfPath: string, outputDir: string): string[] {
    // Genera imágenes page-1.png, page-2.png, ... en outputDir
    const outPrefix = path.join(outputDir, 'page');
    try {
        // En Windows, pdftoppm funciona igual si está en el PATH
        execSync(`pdftoppm -png "${pdfPath}" "${outPrefix}"`);
        // Buscar los archivos generados
        const files = fs.readdirSync(outputDir)
            .filter(f => f.startsWith('page-') && f.endsWith('.png'))
            .map(f => path.join(outputDir, f));
        return files;
    } catch (e) {
        // console.error("Error ejecutando pdftoppm:", e);
        return [];
    }
}

export const welcomeFlowDoc = addKeyword<BaileysProvider, MemoryDB>(EVENTS.DOCUMENT)
    .addAction(async (ctx, { flowDynamic, provider, state, gotoFlow }) => {
        const userId = ctx.from;
        let localPath = null;
        let outputDir = null;
        const imagenesGeneradas = [];
        
        try {
            const mimetype = ctx?.media?.mimetype || ctx?.message?.documentMessage?.mimetype;
            const isPDF = mimetype === "application/pdf";

            if (!isPDF) {
                // Si no es PDF, lo ignoramos o podrías manejar otros tipos aquí
                return;
            }

            // Asegurar que la carpeta temp exista
            if (!fs.existsSync("./temp/")) {
                fs.mkdirSync("./temp/", { recursive: true });
            }

            // Guardar el PDF en temp
            localPath = await provider.saveFile(ctx, { path: "./temp/" });
            if (!localPath) {
                await flowDynamic("No se pudo guardar el documento recibido.");
                return;
            }

            reset(ctx, gotoFlow, setTime);

            // Convertir cada página del PDF a imagen (png) usando pdftoppm (Poppler)
            outputDir = path.join("./temp", `pdf_${Date.now()}`);
            fs.mkdirSync(outputDir, { recursive: true });
            
            const imagenes = extraerPaginasComoPNG(localPath, outputDir);
            
            if (imagenes.length === 0) {
                await flowDynamic("Error al leer el PDF. Asegúrate de que no esté protegido.");
                return;
            }

            await flowDynamic("Procesando documento, un momento por favor...");

            let descripcionConsolidada = "";
            for (let i = 0; i < imagenes.length; i++) {
                const imgPath = imagenes[i];
                const imgBuffer = fs.readFileSync(imgPath);
                
                // Analizar cada página
                const result = await processImageWithVision(imgBuffer);
                descripcionConsolidada += `\n--- Página ${i + 1} ---\n${result}\n`;
                imagenesGeneradas.push(imgPath);
            }

            // Integrar el contenido del PDF en el flujo principal del asistente
            ctx.body = `[Documento PDF recibido]:\n${descripcionConsolidada}`;

            // Reencolar el mensaje para que lo procese el asistente principal (manteniendo el hilo)
            if (!userQueues.has(userId)) {
                userQueues.set(userId, []);
            }
            userQueues.get(userId).push({ ctx, flowDynamic, state, provider, gotoFlow });
            
            if (!userLocks.get(userId) && userQueues.get(userId).length === 1) {
                await handleQueue(userId);
            }

        } catch (err) {
            // console.error("Error procesando PDF:", err);
            await flowDynamic("Ocurrió un error al procesar el documento.");
        } finally {
            // Limpieza de archivos temporales
            for (const imgPath of imagenesGeneradas) {
                try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (e) {}
            }
            if (outputDir && fs.existsSync(outputDir)) {
                try { fs.rmSync(outputDir, { recursive: true, force: true }); } catch (e) {}
            }
            if (localPath && fs.existsSync(localPath)) {
                try { fs.unlinkSync(localPath); } catch (e) {}
            }
        }
    });