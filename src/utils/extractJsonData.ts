import { ResumenData } from "./googleSheetsResumen";

const extraerDatosResumen = (resumen: string): ResumenData => {
    const nombreMatch = resumen.match(/Nombre[:_]?\s*(.*)/i);
    const interesMatch = resumen.match(/Inter[eé]s[:_]?\s*(.*)/i);
    const empresaMatch = resumen.match(/Empresa[:_]?\s*(.*)/i);
    const cargoMatch = resumen.match(/Cargo[:_]?\s*(.*)/i);
    const linkWSMatch = resumen.match(/WhatsApp[:_]?\s*(.*)/i);

    return {
        nombre: nombreMatch ? nombreMatch[1].trim() : "",
        interes: interesMatch ? interesMatch[1].trim() : "",
        empresa: empresaMatch ? empresaMatch[1].trim() : "",
        cargo: cargoMatch ? cargoMatch[1].trim() : "",
        linkWS: linkWSMatch ? linkWSMatch[1].trim() : "",
    };
};

export {
    extraerDatosResumen
}