import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_IMG || process.env.OPENAI_API_KEY });

/**
 * Procesa una imagen usando el modelo gpt-4o (Vision) y devuelve su descripción.
 * No envía mensajes al usuario directamente; el flujo llamante debe decidir qué hacer con el resultado.
 * @param buffer Buffer de la imagen (jpeg, png, etc.)
 * @returns Descripción del contenido de la imagen
 */
export async function processImageWithVision(buffer: Buffer): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Describe esta imagen detalladamente o extrae la información si es un documento (como una factura o resumen), para que el asistente pueda entender su contenido y responder al usuario. Si hay tablas o datos estructurados, lístalos claramente." 
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${buffer.toString("base64")}` },
            },
          ],
        },
      ],
    });

    const result = response.choices[0].message.content || "No se pudo obtener una descripción de la imagen.";
    return result;
  } catch (err: any) {
    // console.error("Error en processImageWithVision:", err.message);
    return `Error al analizar la imagen: ${err.message}`;
  }
}