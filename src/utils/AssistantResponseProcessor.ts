import OpenAI from "openai";
import { JsonBlockFinder } from "../API_SWS/JsonBlockFinder";
import util from "util";
import { ClientesApi } from "../API_SWS/ClientesApi";
import { IncidentesApi } from "../API_SWS/IncidentesApi";
import { ListaDePreciosApi } from "../API_SWS/ListaDePreciosApi";
import { RepartosApi } from "../API_SWS/RepartosApi";
import { AdministracionApi } from "../API_SWS/FacturacionApi";
import { MovimientosApi } from "../API_SWS/MovimientosApi";
import { getMapsUbication } from "../addModule/getMapsUbication";
import { getUsuarioId } from "../API_SWS/SessionApi";
import { HistoryHandler } from "./historyHandler";
/**
 * Convierte una fecha a formato DD/MM/YYYY
 * @param {string} fecha - Fecha en formato YYYY-MM-DD, YYYY/MM/DD o DD/MM/YYYY
 * @returns {string} Fecha en formato DD/MM/YYYY
 */
function toDDMMYYYY(fecha: string): string {
    if (!fecha) return '';
    
    // Manejar marcadores de posición para la fecha actual
    if (fecha.includes('{{HOY_DDMMYYYY}}') || fecha.includes('{{HOY}}')) {
        const today = new Date();
        const d = String(today.getDate()).padStart(2, '0');
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const y = today.getFullYear();
        return `${d}/${m}/${y}`;
    }

    // Si ya está en formato DD/MM/YYYY, devolver igual
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) return fecha;
    // Si está en formato YYYY-MM-DD, convertir
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        const [y, m, d] = fecha.split('-');
        return `${d}/${m}/${y}`;
    }
    // Si está en formato YYYY/MM/DD, convertir
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(fecha)) {
        const [y, m, d] = fecha.split('/');
        return `${d}/${m}/${y}`;
    }
    return fecha;
}

/**
 * Convierte un string DD/MM/YYYY a un objeto Date (local)
 * @param {string} fechaStr 
 * @returns {Date | null}
 */
function parseDate(fechaStr: string): Date | null {
    if (!fechaStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr)) return null;
    const [d, m, y] = fechaStr.split('/').map(Number);
    return new Date(y, m - 1, d);
}

/**
 * Valida un rango de fechas. Si la fechaHasta es anterior a fechaDesde, 
 * reemplaza fechaHasta por la fecha actual.
 * @param {string} desdeStr 
 * @param {string} hastaStr 
 * @returns {{desde: string, hasta: string}}
 */
function validarRangoFechas(desdeStr: string, hastaStr: string): { desde: string, hasta: string } {
    const desde = toDDMMYYYY(desdeStr);
    let hasta = toDDMMYYYY(hastaStr);

    // Si fechaHasta no llega o está vacía, autocompletar con la fecha de HOY
    if (!hasta) {
        hasta = toDDMMYYYY('{{HOY}}');
    }

    if (desde && hasta) {
        const dDate = parseDate(desde);
        const hDate = parseDate(hasta);

        if (dDate && hDate && hDate < dDate) {
            console.log(`[AssistantResponseProcessor] fechaHasta (${hasta}) anterior a fechaDesde (${desde}). Corrigiendo hasta a HOY.`);
            hasta = toDDMMYYYY('{{HOY}}');
        }
    }

    return { desde, hasta };
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function cancelRun(threadId: string, runId: string) {
    if (!threadId || !runId) return false;
    try {
        console.log(`[AssistantResponseProcessor] Intentando cancelar run ${runId} en thread ${threadId}...`);
        await openai.beta.threads.runs.cancel(threadId, runId);
        
        // Esperar brevemente a que el estado se actualice
        for (let i = 0; i < 5; i++) {
            const run = await openai.beta.threads.runs.retrieve(threadId, runId);
            if (["cancelled", "failed", "expired"].includes(run.status)) {
                console.log(`[AssistantResponseProcessor] Run ${runId} cancelado exitosamente.`);
                return true;
            }
            await new Promise(r => setTimeout(r, 1000));
        }
    } catch (error: any) {
        console.error(`[AssistantResponseProcessor] Error al cancelar run ${runId}:`, error.message);
    }
    return false;
}

export async function waitForActiveRuns(threadId: string) {
    if (!threadId) return;
    try {
        console.log(`[AssistantResponseProcessor] Verificando runs activos en thread ${threadId}...`);
        let attempt = 0;
        const maxAttempts = 15; // Reducido para no bloquear tanto tiempo
        while (attempt < maxAttempts) {
            const runs = await openai.beta.threads.runs.list(threadId, { limit: 5 });
            const activeRun = runs.data.find(run =>
                ["queued", "in_progress", "cancelling", "requires_action"].includes(run.status)
            );

            if (activeRun) {
                console.log(`[AssistantResponseProcessor] [${attempt}/${maxAttempts}] Run activo detectado (${activeRun.id}, estado: ${activeRun.status}).`);
                
                // Si está estancado en requires_action, lo cancelamos proactivamente (Capa 1 de la guía)
                if (activeRun.status === 'requires_action' && attempt >= 2) {
                    console.log(`[AssistantResponseProcessor] [Reconexión] Run estancado en requires_action detectado (${activeRun.id}). Cancelando...`);
                    await cancelRun(threadId, activeRun.id);
                    return; // Retornar para que safeToAsk pueda reintentar de inmediato
                }

                // Fallback para otros estados que duren demasiado
                if (attempt > 10) {
                    console.log(`[AssistantResponseProcessor] Run persistente detectado. Intentando cancelación final...`);
                    await cancelRun(threadId, activeRun.id);
                }

                await new Promise(resolve => setTimeout(resolve, 2000));
                attempt++;
            } else {
                console.log(`[AssistantResponseProcessor] No hay runs activos. OK.`);
                return;
            }
        }
        console.warn(`[AssistantResponseProcessor] Timeout esperando liberación del thread ${threadId}.`);
    } catch (error) {
        console.error(`[AssistantResponseProcessor] Error verificando runs:`, error);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}


/**
 * Calcula la fecha actual + 2 días hábiles en formato DD/MM/YYYY
 * @returns {string}
 */
function getFechaCierreEstimado(): string {
    const date = new Date();
    let businessDays = 0;
    while (businessDays < 2) {
        date.setDate(date.getDate() + 1);
        if (date.getDay() !== 0 && date.getDay() !== 6) { // 0=Domingo, 6=Sábado
            businessDays++;
        }
    }
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}


/**
 * Elimina todos los bloques [API]...[/API] de un texto
 * @param {string} texto - Texto que puede contener bloques API
 * @returns {string} Texto sin bloques API
 */
function limpiarBloquesJSON(texto: string): string {
    // 1. Preservar bloques especiales temporalmente
    const specialBlocks: string[] = [];
    let textoConMarcadores = texto;
    
    // Preservar [DB_QUERY: ...] (Permitiendo espacios opcionales tras el corchete y el separador opcional)
    textoConMarcadores = textoConMarcadores.replace(/\[\s*DB_QUERY\s*:?\s*[\s\S]*?\]/gi, (match) => {
        const index = specialBlocks.length;
        specialBlocks.push(match);
        return `___SPECIAL_BLOCK_${index}___`;
    });

    // Preservar [DB: "T":"tabla", "D":"dato"] o [DB{"T":"..."}]
    textoConMarcadores = textoConMarcadores.replace(/\[\s*DB\s*:?\s*[\s\S]*?\]/gi, (match) => {
        const index = specialBlocks.length;
        specialBlocks.push(match);
        return `___SPECIAL_BLOCK_${index}___`;
    });
    
    // Preservar [API]...[/API] (Tolerante a espacios)
    textoConMarcadores = textoConMarcadores.replace(/\[\s*API\s*\][\s\S]*?\[\/\s*API\s*\]/gi, (match) => {
        const index = specialBlocks.length;
        specialBlocks.push(match);
        return `___SPECIAL_BLOCK_${index}___`;
    });
    
    // 2. Limpiar referencias de OpenAI tipo 【4:0†archivo.pdf】
    let limpio = textoConMarcadores.replace(/【.*?】/g, "");

    // 2b. Limpiar bloques JSON de "queries" que a veces fuga el asistente de OpenAI (File Search / Web Search)
    limpio = limpio.replace(/\{\s*"queries"\s*:\s*\[[\s\S]*?\]\s*\}[\s,]*?/gi, "");
    
    // 2c. Limpiar bloques de PDF [PDF: ID]
    limpio = limpio.replace(/\[\s*PDF\s*:\s*[\s\S]*?\]/gi, "");

    // 2d. Filtrar SYSTEM_DB_RESULT o SYSTEM_API_RESULT filtrados por error del asistente
    limpio = limpio.replace(/\[?\s*SYSTEM_(DB|API)_RESULT[\s\S]*?(?:\]|$)/gi, "");

    // 3. Restaurar bloques especiales
    specialBlocks.forEach((block, index) => {
        limpio = limpio.replace(`___SPECIAL_BLOCK_${index}___`, block);
    });
    
    return limpio;
}

/**
 * Corrige el año de una fecha para asegurar que sea el año vigente o posterior
 * @param {string} fechaReservaStr - Fecha en formato YYYY-MM-DD HH:mm:ss
 * @returns {string} Fecha corregida con año vigente
 */
function corregirFechaAnioVigente(fechaReservaStr: string): string {
    const ahora = new Date();
    const vigente = ahora.getFullYear();
    const [fecha, hora] = fechaReservaStr.split(" ");
    const [anioRaw, mes, dia] = fecha.split("-").map(Number);
    let anio = anioRaw;
    if (anio < vigente) anio = vigente;
    return `${anio.toString().padStart(4, "0")}-${mes.toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")} ${hora}`;
}

/**
 * Verifica si una fecha es futura (mayor o igual a la fecha actual)
 * @param {string} fechaReservaStr - Fecha en formato YYYY-MM-DD HH:mm:ss
 * @returns {boolean} true si la fecha es futura, false en caso contrario
 */
function esFechaFutura(fechaReservaStr: string): boolean {
    const ahora = new Date();
    const fechaReserva = new Date(fechaReservaStr.replace(" ", "T"));
    return fechaReserva >= ahora;
}

/**
 * Limita el número de resultados en un array o en la propiedad data de un objeto
 * @param {any} data - Array o objeto con propiedad data
 * @param {number} max - Número máximo de resultados (default: 25)
 * @returns {any} Datos limitados
 */
function limitarResultados(data: any, max: number = 10): any {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.slice(0, max);
    }
    const result = { ...data };
    if (Array.isArray(result.data)) {
        result.data = result.data.slice(0, max);
    }
    if (Array.isArray(result.clientesCercanos)) {
        result.clientesCercanos = result.clientesCercanos.slice(0, max);
    }
    return result;
}

/**
 * Verifica si hay resultados en un array o en la propiedad data de un objeto
 * @param {any} datos - Array o objeto con propiedad data
 * @returns {boolean} true si hay resultados, false en caso contrario
 */
function tieneResultados(datos: any): boolean {
    if (Array.isArray(datos)) return datos.length > 0;
    if (datos && Array.isArray(datos.data)) return datos.data.length > 0;
    return false;
}

/**
 * Loguea de forma limpia y consolidada la respuesta de la API SWS.
 * @param tipo - El tipo de endpoint o acción (e.g. "INCIDENCIA", "BUSCAR_CLIENTE")
 * @param response - La respuesta completa de Axios
 */
function logApiResponse(tipo: string, response: any): void {
    if (!response || !response.config) {
        console.log(`[API Debug] ${tipo} (Sin objeto Axios):`, util.inspect(response, { depth: 4 }));
        return;
    }
    
    console.log(`\n[API Debug] Respuesta ${tipo}:`);
    console.log(`    url: '${response.config.url || ''}',`);
    console.log(`    data: '${response.config.data || ''}',`);
    console.log(`    status: ${response.status},`);
    console.log(`    responseData:`, util.inspect(response.data, { depth: 4 }));
}

/**
 * Verifica si una respuesta de API es exitosa según diferentes criterios
 * @param {any} data - Datos de respuesta de la API
 * @param {any} apiResponse - Respuesta completa de axios (opcional)
 * @returns {boolean} true si la respuesta es exitosa, false en caso contrario
 */
function esRespuestaExitosa(data: any, apiResponse?: any): boolean {
    if (!data) return false;
    // Criterio principal definido por el usuario: error === 0
    if (data.error === 0) return true;
    // Compatibilidad con otros formatos posibles (por si acaso)
    if (data.success === true) return true;
    // Si es un array directo con elementos, asumimos éxito (legacy)
    if (Array.isArray(data)) return true;
    // Si el status HTTP es 200 y hay datos, también es éxito
    if (apiResponse && apiResponse.status === 200 && Object.keys(data).length > 0) return true;
    return false;
}

/**
 * Clase para procesar respuestas del asistente de OpenAI y ejecutar llamadas a APIs
 */
export class AssistantResponseProcessor {
    /**
     * Analiza y procesa la respuesta del asistente, detectando bloques [API] y ejecutando las llamadas correspondientes
     * @param {any} response - Respuesta del asistente de OpenAI
     * @param {any} ctx - Contexto del mensaje (contiene from, body, type, etc.)
     * @param {any} flowDynamic - Función para enviar mensajes al usuario
     * @param {any} state - Estado de la conversación
     * @param {any} provider - Proveedor de mensajería (WhatsApp, webchat, etc.)
     * @param {any} gotoFlow - Función para cambiar de flujo
     * @param {Function} getAssistantResponse - Función para obtener respuestas del asistente
     * @param {string} ASSISTANT_ID - ID del asistente de OpenAI
     */
    static async procesarRespuestaAsistente(
        assistantApiResponse: any,
        ctx: any,
        flowDynamic: any,
        state: any,
        provider: any,
        gotoFlow: any,
        getAssistantResponse: Function,
        ASSISTANT_ID: string
    ) {
        if (assistantApiResponse) {
            const apiBlockRegex = /\[API\](.*?)\[\/API\]/is;
            if (typeof assistantApiResponse === 'string' && apiBlockRegex.test(assistantApiResponse)) {
                await AssistantResponseProcessor.analizarYProcesarRespuestaAsistente(
                    assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID
                );
            } else {
                const cleanTextResponse = limpiarBloquesJSON(String(assistantApiResponse)).trim();
                if (cleanTextResponse.length > 0) {
                    await flowDynamic([{ body: cleanTextResponse }]);
                }
            }
        }
    }

    static async analizarYProcesarRespuestaAsistente(
        response: any,
        ctx: any,
        flowDynamic: any,
        state: any,
        provider: any,
        gotoFlow: any,
        getAssistantResponse: Function,
        ASSISTANT_ID: string
    ) {
        try {
            // Log de mensaje entrante del asistente (antes de cualquier filtro)
            if (ctx && ctx.type === 'webchat') {
                console.log('[Webchat Debug] Mensaje entrante del asistente:', response);
            } else {
                console.log('[WhatsApp Debug] Mensaje entrante del asistente:', response);
            }
            let jsonData: any = null;
            const textResponse = typeof response === "string" ? response : String(response || "");

            // Log de mensaje saliente al usuario (antes de cualquier filtro)
            if (ctx && ctx.type === 'webchat') {
                console.log('[Webchat Debug] Mensaje saliente al usuario (sin filtrar):', textResponse);
            } else {
                console.log('[WhatsApp Debug] Mensaje saliente al usuario (sin filtrar):', textResponse);
            }
            // 1) Extraer bloque [API] ... [/API]
            const apiBlockRegex = /\[API\](.*?)\[\/API\]/is;
            const match = textResponse.match(apiBlockRegex);
            if (match) {
                const jsonStr = match[1].trim();
                try {
                    jsonData = JSON.parse(jsonStr);
                    // Solo CREAR_CLIENTE usa payload
                    if (jsonData && typeof jsonData.type === 'string' && !jsonData.payload) {
                        if (jsonData.type === 'CREAR_CLIENTE') {
                            // Mover todos los campos excepto 'type' a 'payload'
                            const payload = {};
                            for (const key of Object.keys(jsonData)) {
                                if (key !== 'type') payload[key] = jsonData[key];
                            }
                            jsonData.payload = payload;
                            // Eliminar los campos movidos de la raíz, excepto cliente_id
                            for (const key of Object.keys(payload)) {
                                if (key !== 'cliente_id') {
                                    delete jsonData[key];
                                }
                            }
                        }
                    }
                } catch (e) {
                    jsonData = null;
                    if (ctx && ctx.type === 'webchat') {
                        console.log('[Webchat Debug] Error al parsear bloque [API]:', jsonStr);
                    }
                }
            }

            // Eliminar fallback: solo procesar si hay bloque [API]
            if (!jsonData) {
                if (ctx && ctx.type === 'webchat') {
                    console.log('[Webchat Debug] No [API] block detected in assistant response. Raw output:', textResponse);
                } else {
                    console.log('[WhatsApp Debug] No [API] block detected in assistant response. Raw output:', textResponse);
                }
            }

            // 3) Procesar JSON si existe
            if (jsonData && typeof jsonData.type === "string") {
                let tipo = jsonData.type.trim();
                // Corrección de errores comunes de tipeo
                if (tipo === 'CREAR_CLEINTE') tipo = 'CREAR_CLIENTE';
                // FILTRO: Si el tipo no es válido, ignorar y cortar el flujo
                const tiposValidos = JsonBlockFinder.tiposValidos;
                if (!tiposValidos.includes(tipo)) {
                    if (ctx && ctx.type === 'webchat') {
                        console.log(`[Webchat Debug] Bloque API ignorado por tipo inválido: ${tipo}`);
                    } else {
                        console.log(`[WhatsApp Debug] Bloque API ignorado por tipo inválido: ${tipo}`);
                    }
                    return;
                }

                // OBTENER_CREDENCIALES_AUTOGESTION
                if (tipo === "OBTENER_CREDENCIALES_AUTOGESTION") {
                    // Permitir tanto 'id' como 'cliente_Id' según lo que venga en el payload
                    const id = jsonData.id ?? jsonData.cliente_Id;
                    const apiResponse = await ClientesApi.obtenerCredencialesAutogestion(id);
                    console.log('[API Debug] Respuesta OBTENER_CREDENCIALES_AUTOGESTION:', util.inspect(apiResponse, { depth: 4 }));
                    const datos = apiResponse.data || {};
                    const resumen = esRespuestaExitosa(datos, apiResponse) ? `Credenciales de autogestión: ${JSON.stringify(datos)}` : "No se pudieron obtener las credenciales.";
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // CLIENTES_CERCANOS_A_CLIENTE
                if (tipo === "CLIENTES_CERCANOS_A_CLIENTE") {
                    // Ignorar radioMetros recibido, siempre iniciar en 500 y escalar
                    let radio = 500;
                    const radioMax = 2500;
                    let apiResponse;
                    let datos = [];
                    do {
                        apiResponse = await RepartosApi.obtenerClientesCercanosACliente(
                            jsonData.clienteId,
                            radio, // ignorar jsonData.radioMetros
                            typeof jsonData.excluir === 'boolean' ? jsonData.excluir : false
                        );
                        datos = apiResponse.data ? limitarResultados(apiResponse.data, 10) : [];
                        if (tieneResultados(datos)) break;
                        if (radio >= radioMax) break;
                        radio += 250;
                    } while (radio <= radioMax);
                    console.log(`[API Debug] CLIENTES_CERCANOS_A_CLIENTE: clienteId=${jsonData.clienteId}, radio=${radio}`);
                    const resumen = esRespuestaExitosa(datos, apiResponse) ? `Clientes cercanos: ${JSON.stringify(datos)}` : "No se pudo obtener los clientes cercanos.";
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // CLIENTES_CERCANOS_DIRECCION
                if (tipo === "CLIENTES_CERCANOS_DIRECCION") {
                    const address = jsonData.address;
                    let normalizedAddress = address;

                    try {
                        const mapData = await getMapsUbication(address, "", "", "", "");
                        if (mapData && mapData.formattedAddress) {
                            normalizedAddress = mapData.formattedAddress;
                        }
                    } catch (error) {
                        console.error("[API Debug] Error normalizando dirección con Google Maps:", error);
                    }

                    const metros = jsonData.metros || jsonData.radioMetros || 2500;

                    const apiResponse = await RepartosApi.busquedaClientesCercanosResultJson({
                        address: normalizedAddress,
                        metros: metros // Search radius according to user preference
                    });

                    logApiResponse("CLIENTES_CERCANOS_DIRECCION", apiResponse);

                    // Si la API devolvió error en formato de objeto (no Axios)
                    if (apiResponse && (apiResponse as any).error) {
                        const resumen = (apiResponse as any).error;
                        const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                        if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                        return;
                    }

                    // Normalizar respuesta para el asistente: mapear clientesCercanos a data si existe
                    // para asegurar compatibilidad con tieneResultados y limitarResultados
                    let data = apiResponse.data || {};
                    if (data.clientesCercanos && !data.data) {
                        data.data = data.clientesCercanos;
                    }
                    
                    const datos = limitarResultados(data, 10);
                    console.log(`[API Debug] CLIENTES_CERCANOS_DIRECCION (Coords-based): address=${normalizedAddress}`);

                    const resumen = tieneResultados(datos)
                        ? `Clientes cercanos: ${JSON.stringify(datos)}`
                        : "No se encontraron clientes cercanos.";

                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // BUSCAR_CLIENTE
                if (tipo === "BUSCAR_CLIENTE" || tipo === "BUSCAR_CLEINTE") {
                    // Filtros opcionales internos (no se envían a la API)
                    const filtroPiso = jsonData.piso ? String(jsonData.piso).trim().toLowerCase() : null;
                    const filtroDepto = jsonData.depto ? String(jsonData.depto).trim().toLowerCase() : null;

                    let domicilioParam = jsonData.domicilio ?? '';
                    let requiereFiltroSN = false;
                    
                    if (typeof domicilioParam === 'string' && domicilioParam) {
                        const regexSN = /(?:\bs\/n\b|\bsin n[uú]mero\b)/i;
                        if (regexSN.test(domicilioParam)) {
                            requiereFiltroSN = true;
                            domicilioParam = domicilioParam.replace(regexSN, '').trim();
                        }
                    }

                    // busquedaRapida espera: { datosCliente, telefono, domicilio }
                    const apiResponse = await ClientesApi.busquedaRapida({
                        datosCliente: jsonData.datosCliente ?? '',
                        telefono: jsonData.telefono ?? '',
                        domicilio: domicilioParam
                    });
                    logApiResponse('BUSCAR_CLIENTE', apiResponse);
                    
                    const respuestaApi = apiResponse.data || {};
                    let countResultados = 0;
                    let datosCliente = null;
                    if (Array.isArray(respuestaApi.data) && respuestaApi.data.length > 0) {
                        let resultados = respuestaApi.data;
                        
                        // Aplicar filtros internos si existen
                        if (filtroPiso || filtroDepto || requiereFiltroSN) {
                            resultados = resultados.filter((c: any) => {
                                let match = true;
                                if (filtroPiso) {
                                    const pisoCliente = String(c.piso || '').trim().toLowerCase();
                                    if (pisoCliente !== filtroPiso) match = false;
                                }
                                if (filtroDepto) {
                                    const deptoCliente = String(c.depto || '').trim().toLowerCase();
                                    if (deptoCliente !== filtroDepto) match = false;
                                }
                                if (requiereFiltroSN) {
                                    const numPuerta = String(c.numeroPuerta || '').trim().toUpperCase();
                                    if (numPuerta !== 'S/N') match = false;
                                }
                                return match;
                            });
                        }

                        countResultados = resultados.length;
                        if (resultados.length > 0) {
                            // Preferimos clientes que NO estén en BAJA
                            const clienteActivo = resultados.find((c: any) => c.estadoCliente?.trim().toLowerCase() !== 'baja');
                            datosCliente = clienteActivo || resultados[0];
                            console.log('[API Debug] Datos de cliente (tras filtrar y priorizar por estado):', util.inspect(datosCliente, { depth: 4 }));
                        } else {
                            console.log('[API Debug] Ningún cliente pasó los filtros internos de piso/depto/S/N.');
                        }
                    }
                    
                    let resumen;
                    if (esRespuestaExitosa(respuestaApi) && datosCliente) {
                        const esBaja = datosCliente.estadoCliente?.trim().toLowerCase() === 'baja';
                        const esMultiple = countResultados > 1;
                        let advertenciaMultiple = esMultiple ? "⚠️ ATENCIÓN: multiples resultados obtenidos, solicitar datos adicionales para obtener datos mas precisos o identificar un unico cliente\n\n" : "";

                        if (esBaja) {
                            resumen = `${advertenciaMultiple}⚠️ ATENCIÓN: El cliente se encuentra en estado de "BAJA" (Inactivo). No se permiten realizar nuevas pedidos ni registrar incidencias para clientes en este estado.\n\nDatos completos:\n${JSON.stringify(datosCliente, null, 2)}`;
                        } else {
                            resumen = `${advertenciaMultiple}Datos completos del cliente:\n${JSON.stringify(datosCliente, null, 2)}`;
                        }
                    } else {
                        resumen = "No se encuentra cliente coincidente con los datos enviados";
                        const filtrosAplicados = [];
                        if (filtroPiso) filtrosAplicados.push(`piso: ${filtroPiso}`);
                        if (filtroDepto) filtrosAplicados.push(`depto: ${filtroDepto}`);
                        if (requiereFiltroSN) filtrosAplicados.push(`S/N: S/N`);
                        
                        if (filtrosAplicados.length > 0) {
                            resumen += ` (se aplicaron filtros - ${filtrosAplicados.join(', ')})`;
                        }
                    }
                    
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // CREAR_CLIENTE o CREAR_CLEINTE (acepta ambos por compatibilidad)
                if (tipo === "CREAR_CLIENTE") {
                    // Unificar nombre y apellido en cliente.nombre
                    const clienteRaw = (jsonData.payload && jsonData.payload.cliente) ? jsonData.payload.cliente : {};
                    let nombreCompleto = '';
                    if (clienteRaw.nombre && clienteRaw.apellido) {
                        nombreCompleto = `${clienteRaw.nombre} ${clienteRaw.apellido}`.trim();
                    } else if (clienteRaw.nombre) {
                        nombreCompleto = String(clienteRaw.nombre).trim();
                    } else if (clienteRaw.apellido) {
                        nombreCompleto = String(clienteRaw.apellido).trim();
                    }
                    
                    // --- NORMALIZACIÓN DE DIRECCIÓN ---
                    if (clienteRaw.direccion) {
                        try {
                            const mapData = await getMapsUbication(clienteRaw.direccion, "", "", "", "");
                            if (mapData && mapData.formattedAddress) {
                                console.log(`[CREAR_CLIENTE] Dirección normalizada: ${clienteRaw.direccion} -> ${mapData.formattedAddress}`);
                                clienteRaw.direccion = mapData.formattedAddress;
                            }
                        } catch (error) {
                            console.error("[CREAR_CLIENTE] Error normalizando dirección con Google Maps:", error);
                        }
                    }

                    // Construir nuevo objeto cliente con nombre completo
                    const cliente = {
                        ...clienteRaw,
                        nombre: nombreCompleto,
                    };
                    // Eliminar apellido si existe
                    if (cliente.apellido !== undefined) delete cliente.apellido;
                    
                    console.log('[CREAR_CLIENTE] Datos recibidos del asistente:', JSON.stringify(jsonData));
                    console.log('[CREAR_CLIENTE] Objeto cliente armado:', JSON.stringify(cliente));
                    
                    const reparto_id = (jsonData.payload && jsonData.payload.reparto_id) ? jsonData.payload.reparto_id : 1;
                    const apiResponse = await ClientesApi.crearNuevoCliente({
                        cliente,
                        reparto_id
                    });

                    logApiResponse('CREAR_CLIENTE', apiResponse);
                    let resumen = "";
                    if (esRespuestaExitosa(apiResponse?.data)) {
                        // Éxito: mostrar mensaje claro y el id del cliente
                        const id = apiResponse?.data?.cliente?.cliente_id;
                        resumen = `✅ Cliente creado exitosamente. ID: ${id ?? 'desconocido'}`;
                    } else if (apiResponse?.data?.error) {
                        resumen = `No se pudo crear el cliente: ${apiResponse.data?.message || 'Error desconocido.'}`;
                    } else {
                        resumen = "No se pudo crear el cliente. (Sin respuesta de la API)";
                    }
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // AGREGAR_CONTACTO
                if (tipo === "AGREGAR_CONTACTO") {
                    // agregarContacto espera: modeloContacto
                    const apiResponse = await ClientesApi.agregarContacto(jsonData.modeloContacto);
                    logApiResponse('AGREGAR_CONTACTO', apiResponse);
                    const resumen = esRespuestaExitosa(apiResponse.data)
                        ? "Contacto agregado exitosamente."
                        : "No se pudo agregar el contacto.";
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // INCIDENCIA
                if (tipo === "INCIDENCIA") {
                    // crearTicket espera: objeto con los datos del ticket
                    // Forzar centroDistribucion_id a 1 siempre
                    jsonData.centroDistribucion_id = 1;
                    // Corregir clienteId -> cliente_id si viene mal
                    if (jsonData.clienteId && !jsonData.cliente_id) {
                        jsonData.cliente_id = jsonData.clienteId;
                        delete jsonData.clienteId;
                    }
                    // NUEVO: Asignar usuario responsable desde la sesión y fecha de cierre estimado calculada
                    jsonData.usuarioResponsable_id = getUsuarioId() || null;
                    jsonData.fechaCierreEstimado = getFechaCierreEstimado();
                    jsonData.estadoIncidente_ids = 1;

                    const apiResponse = await IncidentesApi.crearTicket(jsonData);
                    console.log('[API Debug] Respuesta INCIDENCIA:', util.inspect(apiResponse, { depth: 4 }));
                    let resumen = "";
                    if (esRespuestaExitosa(apiResponse.data)) {
                        const id = apiResponse.data?.incidente?.id;
                        resumen = `✅ Incidencia registrada exitosamente. ID: ${id ?? 'desconocido'}`;
                    } else {
                        resumen = `No se pudo registrar la incidencia: ${apiResponse.data?.message || 'Error desconocido.'}`;
                    }
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // BUSCAR_INCIDENCIA
                if (tipo === "BUSCAR_INCIDENCIA") {
                    const apiResponse = await IncidentesApi.obtenerIncidentesCliente(jsonData);
                    logApiResponse("BUSCAR_INCIDENCIA", apiResponse);
                    const datos = apiResponse.data || {};
                    const resumen = esRespuestaExitosa(datos, apiResponse) ? `Incidentes encontrados: ${JSON.stringify(datos, null, 2)}` : "No se encontraron incidentes para el cliente.";
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // LINK_PAGO / OBTENER_LINK_MERCADO_PAGO
                if (tipo === "LINK_PAGO" || tipo === "OBTENER_LINK_MERCADO_PAGO") {
                    const cliente_id = jsonData.cliente_id ?? jsonData.ClienteId;
                    const monto = jsonData.monto;
                    const apiResponse = await AdministracionApi.obtenerLinkPago(cliente_id, monto);
                    logApiResponse("LINK_PAGO", apiResponse);
                    const datos = apiResponse.data || {};
                    const resumen = esRespuestaExitosa(datos, apiResponse) ? `Link de pago generado: ${JSON.stringify(datos, null, 2)}` : "No se pudo generar el link de pago.";
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // PRECIO
                if (tipo === "PRECIO") {
                    const apiResponse = await ListaDePreciosApi.obtenerListaDePrecios(jsonData.ClienteId);
                    logApiResponse("PRECIO", apiResponse);

                    const success = esRespuestaExitosa(apiResponse.data);
                    let precios = [];

                    if (success) {
                        if (Array.isArray(apiResponse.data)) {
                            precios = apiResponse.data;
                        } else if (Array.isArray(apiResponse.data?.precios)) {
                            precios = apiResponse.data.precios;
                        } else {
                            // Fallback: si es exitosa pero no hallamos array obvio, serializamos todo data
                            precios = apiResponse.data;
                        }
                    }

                    const resumen = success
                        ? `Precios: ${JSON.stringify(precios)}`
                        : "No se pudo obtener la lista de precios.";
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // REPARTO
                if (tipo === "REPARTO") {
                    let resumen = "No se encuentra en zona habitual de reparto.";
                    let apiResponse;
                    let clienteSeleccionado = null;
                    let preciosCliente = null;
                    if (typeof RepartosApi.obtenerClientesCercanosPorDireccion === 'function') {
                        // obtenerClientesCercanosPorDireccion espera: calleYAltura, codigoPostal, localidad, provincia, pais, excluir
                        apiResponse = await RepartosApi.obtenerClientesCercanosPorDireccion(
                            jsonData.calleYAltura || `${jsonData.calle ?? ''} ${jsonData.numero ?? ''}`,
                            jsonData.codigoPostal ?? '',
                            jsonData.localidad ?? '',
                            jsonData.provincia ?? '',
                            jsonData.pais ?? '',
                            typeof jsonData.excluir === 'boolean' ? jsonData.excluir : false
                        );
                        logApiResponse("REPARTO", apiResponse);
                        // Seleccionar el cliente con menor distanciaMetros
                        if (apiResponse.data?.clientesCercanos && Array.isArray(apiResponse.data.clientesCercanos) && apiResponse.data.clientesCercanos.length > 0) {
                            const clientes = apiResponse.data.clientesCercanos;
                            clienteSeleccionado = clientes.reduce((min, c) => c.distanciaMetros < min.distanciaMetros ? c : min, clientes[0]);
                            // Llamar a la API de lista de precios con el cliente más cercano
                            try {
                                const preciosResp = await ListaDePreciosApi.obtenerListaDePrecios(clienteSeleccionado.cliente_id);
                                preciosCliente = preciosResp.data || {};
                            } catch (err) {
                                console.error('[API Debug] Error obteniendo lista de precios:', err);
                            }
                            resumen = `La dirección está dentro de la zona de cobertura.\nCliente más cercano: ${clienteSeleccionado.cliente_id}, Reparto: ${clienteSeleccionado.nombreReparto}`;
                            // Guardar o pasar los datos relevantes al asistente
                            const datosCliente = {
                                cliente_id: clienteSeleccionado.cliente_id,
                                nombreReparto: clienteSeleccionado.nombreReparto,
                                visitas: clienteSeleccionado.visitas,
                                proximaVisita: clienteSeleccionado.proximaVisita,
                                diasProximaVisita: clienteSeleccionado.diasProximaVisita,
                                precios: preciosCliente
                            };
                            // Puedes guardar en state, enviar al asistente, o loguear
                            state.datosClienteReparto = datosCliente;
                            // También puedes enviar el resumen y los datos al asistente
                            resumen += `\nPrecios: ${JSON.stringify(preciosCliente)}`;
                        } else if (apiResponse.diasHorarios && apiResponse.diasHorarios.length > 0) {
                            resumen = apiResponse.diasHorarios.map(dh => `Día: ${dh.dia}, Horario: ${dh.horario}`).join(" | ");
                        } else if (apiResponse.raw?.error === 0) {
                            resumen = "Se encuentra en zona habitual de reparto.";
                        }
                    } else {
                        resumen = "Funcionalidad de reparto no implementada.";
                    }
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // PRODUCTOS
                if (tipo === "PRODUCTOS") {
                    // PRODUCTOS espera: ClienteId (preferido) o cliente_Id (legacy), categoria (opcional)
                    const clienteId = jsonData.ClienteId ?? jsonData.cliente_Id;
                    const apiResponse = await ListaDePreciosApi.obtenerListaDePrecios(clienteId);
                    logApiResponse("PRODUCTOS", apiResponse);

                    let resumen = "No se pudieron obtener los productos.";
                    // Si la respuesta contiene error: 0, se considera exitosa
                    if (apiResponse.data && apiResponse.data.error === 0) {
                        // Si hay precios en array, filtrar por categoría si corresponde
                        let productos = Array.isArray(apiResponse.data?.precios)
                            ? apiResponse.data.precios
                            : apiResponse.data.ArticulosDeListaDePrecio || apiResponse.data;
                        // Si es un objeto, convertir a array de pares clave-valor
                        if (!Array.isArray(productos) && typeof productos === 'object') {
                            productos = Object.entries(productos).map(([nombre, precio]) => ({ nombre, precio }));
                        }
                        if (jsonData.categoria && Array.isArray(productos)) {
                            const categoria = jsonData.categoria.toLowerCase();
                            productos = productos.filter((p) =>
                                (p.nombre && p.nombre.toLowerCase().includes(categoria)) ||
                                (p.categoria && p.categoria.toLowerCase().includes(categoria))
                            );
                        }
                        resumen = `Productos disponibles${jsonData.categoria ? ` (categoría: ${jsonData.categoria})` : ''}: ${JSON.stringify(productos)}`;
                    }

                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // OBTENER_DATOS_CLIENTE
                if (tipo === "OBTENER_DATOS_CLIENTE") {
                    // obtenerDatosCliente espera: cliente_id (number)
                    const apiResponse = await ClientesApi.obtenerDatosCliente(jsonData.cliente_id);
                    logApiResponse("OBTENER_DATOS_CLIENTE", apiResponse);
                    const datos = apiResponse.data || {};
                    const resumen = esRespuestaExitosa(datos, apiResponse) ? `Datos del cliente: ${JSON.stringify(datos)}` : "No se encontraron datos del cliente.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // OBTENER_SUCURSALES_CLIENTE
                if (tipo === "OBTENER_SUCURSALES_CLIENTE") {
                    // obtenerSucursales espera: cliente_id (number)
                    const apiResponse = await ClientesApi.obtenerSucursales(jsonData.cliente_id);
                    logApiResponse("OBTENER_SUCURSALES_CLIENTE", apiResponse);
                    const datos = apiResponse.data || {};
                    const resumen = esRespuestaExitosa(datos) ? `Sucursales del cliente: ${JSON.stringify(datos)}` : "No se encontraron sucursales para el cliente.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    if (assistantApiResponse) {
                        await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                    }
                    return;
                }

                // MATRIZ_LISTA_PRECIOS
                if (tipo === "MATRIZ_LISTA_PRECIOS") {
                    // obtenerMatrizListaDePrecios espera: tipoLista_id (number)
                    const tipoListaId = jsonData.tipoLista_id ?? 1;
                    const filtroListaId = jsonData.lista_id ? parseInt(jsonData.lista_id, 10) : null;

                    const apiResponse = await ListaDePreciosApi.obtenerMatrizListaDePrecios(tipoListaId);
                    logApiResponse("MATRIZ_LISTA_PRECIOS", apiResponse);
                    
                    const datos = apiResponse.data || {};
                    let success = esRespuestaExitosa(datos);
                    
                    if (success && filtroListaId != null && datos.matriz && Array.isArray(datos.matriz.articulos)) {
                        // Filtrar los artículos para que solo queden los que tengan el lista_id específico
                        datos.matriz.articulos = datos.matriz.articulos
                            .map((art: any) => {
                                // Filtrar sus precios al lista_id específico
                                if (Array.isArray(art.precios)) {
                                    art.precios = art.precios.filter((p: any) => p.lista_id === filtroListaId);
                                }
                                return art;
                            })
                            // Conservar solo los artículos que todavía tengan al menos 1 precio válido para esta lista
                            // y omitir aquellos donde el precio sea 0 si no es válido
                            .filter((art: any) => Array.isArray(art.precios) && art.precios.length > 0);
                            
                        console.log(`[API Debug] Filtrado interno MATRIZ_LISTA_PRECIOS aplicado (lista_id: ${filtroListaId}). Artículos encontrados: ${datos.matriz.articulos.length}`);
                    }

                    const resumen = success ? `Matriz de lista de precios: ${JSON.stringify(datos)}` : "No se pudo obtener la matriz de lista de precios.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // ABONOS_TIPOS
                if (tipo === "ABONOS_TIPOS") {
                    // obtenerAbonosTipos espera: desde, hasta, concepto, activo
                    const { desde, hasta } = validarRangoFechas(jsonData.desde ?? '', jsonData.hasta ?? '');
                    const apiResponse = await ListaDePreciosApi.obtenerAbonosTipos(
                        desde || null,
                        hasta || null,
                        jsonData.concepto ?? null,
                        typeof jsonData.activo === 'boolean' ? jsonData.activo : true
                    );
                    logApiResponse("ABONOS_TIPOS", apiResponse);
                    const datos = apiResponse.data || {};
                    const resumen = esRespuestaExitosa(datos) ? `Tipos de abonos: ${JSON.stringify(datos)}` : "No se pudo obtener los tipos de abonos.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // HISTORIAL_FACTURAS
                if (tipo === "HISTORIAL_FACTURAS") {
                    // historialFacturasCliente espera: cliente_id, fechaDesde, fechaHasta, saldoPendiente (opcional)
                    const { desde, hasta } = validarRangoFechas(jsonData.fechaDesde ?? '', jsonData.fechaHasta ?? '');
                    const apiResponse = await AdministracionApi.historialFacturasCliente(
                        jsonData.cliente_id,
                        desde,
                        hasta,
                        typeof jsonData.saldoPendiente === 'boolean' ? jsonData.saldoPendiente : false
                    );
                    logApiResponse("HISTORIAL_FACTURAS", apiResponse);
                    const datos = apiResponse.data || {};
                    const resumen = esRespuestaExitosa(datos) ? `Historial de facturas: ${JSON.stringify(datos)}` : "No se pudo obtener el historial de facturas.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // RECIBOS_PAGO
                if (tipo === "RECIBOS_PAGO") {
                    // recibosPagoCliente espera: clienteId, fechaReciboDesde, fechaReciboHasta, saldoDisponible (opcional)
                    const { desde, hasta } = validarRangoFechas(jsonData.fechaReciboDesde ?? '', jsonData.fechaReciboHasta ?? '');
                    const apiResponse = await AdministracionApi.recibosPagoCliente(
                        jsonData.cliente_id,
                        desde,
                        hasta,
                        typeof jsonData.saldoDisponible === 'boolean' ? jsonData.saldoDisponible : false
                    );
                    logApiResponse("RECIBOS_PAGO", apiResponse);
                    const datos = apiResponse.data || {};
                    const resumen = esRespuestaExitosa(datos) ? `Recibos de pago: ${JSON.stringify(datos)}` : "No se pudo obtener los recibos de pago.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // SALDO_CUENTA
                if (tipo === "SALDO_CUENTA") {
                    const cId = jsonData.cliente_id ?? jsonData.clienteId;
                    const apiResponse = await MovimientosApi.obtenerSaldosDeCliente(cId);
                    logApiResponse("SALDO_CUENTA", apiResponse);
                    const datos = apiResponse.data || {};
                    
                    // Cálculo de Saldo Real: saldoCuentaConsumo + saldoCuentaFacturacion
                    if (datos.saldos) {
                        const consumo = Number(datos.saldos.saldoCuentaConsumo);
                        const facturacion = Number(datos.saldos.saldoCuentaFacturacion);
                        datos.saldos.saldoReal = consumo + facturacion;
                        console.log(`[API Logic] Saldo Real calculado: ${datos.saldos.saldoReal}`);
                    }

                    const resumen = esRespuestaExitosa(datos, apiResponse) ? `Saldo de cuenta: ${JSON.stringify(datos)}` : "No se pudo obtener el saldo de cuenta.";
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // RESUMEN_CUENTA
                if (tipo === "RESUMEN_CUENTA") {
                    // resumenCuentaCliente espera: clienteId, desde, hasta
                    const { desde, hasta } = validarRangoFechas(jsonData.fechaDesde ?? '', jsonData.fechaHasta ?? '');
                    const cId = jsonData.cliente_id ?? jsonData.clienteId;
                    const apiResponse = await AdministracionApi.resumenCuentaCliente(
                        cId,
                        desde,
                        hasta
                    );
                    logApiResponse("RESUMEN_CUENTA", apiResponse);
                    const datos = apiResponse.data || {};
                    
                    // Inyectar los saldos reales para evitar que el asistente los calcule erróneamente 
                    // a partir de los "movimientos" (que suelen traer saldo: 0)
                    try {
                        const saldosResp = await MovimientosApi.obtenerSaldosDeCliente(cId);
                        if (saldosResp && saldosResp.data && saldosResp.data.saldos) {
                            datos.saldos = saldosResp.data.saldos;
                            const consumo = Number(datos.saldos.saldoCuentaConsumo || 0);
                            const facturacion = Number(datos.saldos.saldoCuentaFacturacion || 0);
                            datos.saldos.saldoReal = consumo + facturacion;
                        }
                    } catch (error) {
                        console.error('[API Logic] Error inyectando saldos a RESUMEN_CUENTA:', error);
                    }

                    const resumen = esRespuestaExitosa(datos) ? `Resumen de cuenta con saldos incluidos: ${JSON.stringify(datos)}` : "No se pudo obtener el resumen de cuenta.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // ORDEN_TRABAJO
                if (tipo === "ORDEN_TRABAJO") {
                    // obtenerServiciosTecnicosCliente espera: clienteId, desde, hasta (hasta es opcional, default: hoy)
                    const { desde, hasta } = validarRangoFechas(jsonData.fechaDesde ?? '', jsonData.fechaHasta ?? '');
                    const apiResponse = await AdministracionApi.obtenerServiciosTecnicosCliente(
                        jsonData.clienteId,
                        desde,
                        hasta
                    );
                    logApiResponse("ORDEN_TRABAJO", apiResponse);
                    const datos = apiResponse.data || {};
                    const resumen = esRespuestaExitosa(datos) ? `Servicios técnicos: ${JSON.stringify(datos)}` : "No se pudo obtener los servicios técnicos.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // REMITOS_ENTREGA
                if (tipo === "REMITOS_ENTREGA") {
                    // remitosEntrega espera: cliente_id, fechaDesde, fechaHasta, consumosSinFacturar (opcional)
                    const { desde, hasta } = validarRangoFechas(jsonData.fechaDesde ?? '', jsonData.fechaHasta ?? '');
                    const apiResponse = await AdministracionApi.remitosEntrega(
                        jsonData.cliente_id,
                        desde,
                        hasta,
                        typeof jsonData.consumosSinFacturar === 'boolean' ? jsonData.consumosSinFacturar : false
                    );
                    logApiResponse("REMITOS_ENTREGA", apiResponse);
                    const datos = apiResponse.data || {};
                    const resumen = esRespuestaExitosa(datos) ? `Remitos de entrega: ${JSON.stringify(datos)}` : "No se pudo obtener los remitos de entrega.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // DESCARGA_REMITO
                if (tipo === "DESCARGA_REMITO") {
                    // descargarRemito espera: remito_id
                    const apiResponse = await AdministracionApi.descargarRemito(jsonData.remito_id);
                    logApiResponse("DESCARGA_REMITO", apiResponse);
                    const datos = apiResponse.data || {};
                    const resumen = esRespuestaExitosa(datos) ? `Archivo de remito descargado: ${JSON.stringify(datos)}` : "No se pudo descargar el remito.";
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // DESCARGA_REMITO_VENTA
                if (tipo === "DESCARGA_REMITO_VENTA") {
                    // descargarRemitoPorVenta espera: idVenta
                    const apiResponse = await AdministracionApi.descargarRemitoPorVenta(jsonData.idVenta);
                    logApiResponse("DESCARGA_REMITO_VENTA", apiResponse);
                    const datos = apiResponse.data || {};
                    const resumen = esRespuestaExitosa(datos) ? `Archivo de remito por venta descargado: ${JSON.stringify(datos)}` : "No se pudo descargar el remito por venta.";
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // DESCARGA_ARCHIVO
                if (tipo === "DESCARGA_ARCHIVO") {
                    // descargarArchivo espera: archivo_id
                    const apiResponse = await AdministracionApi.descargarArchivo(jsonData.archivo_id);
                    logApiResponse("DESCARGA_ARCHIVO", apiResponse);
                    const datos = apiResponse.data || {};
                    const resumen = esRespuestaExitosa(datos) ? `Archivo descargado: ${JSON.stringify(datos)}` : "No se pudo descargar el archivo.";
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // REENVIAR_FACTURA_POR_MAIL
                if (tipo === "REENVIAR_FACTURA_POR_MAIL") {
                    // reenviarFacturaPorMail espera: facturaId
                    const apiResponse = await AdministracionApi.reenviarFacturaPorMail(jsonData.facturaId);
                    logApiResponse("REENVIAR_FACTURA_POR_MAIL", apiResponse);
                    const resumen = esRespuestaExitosa(apiResponse.data) ? "Factura reenviada por mail exitosamente." : "No se pudo reenviar la factura.";
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // REENVIAR_REMITO_POR_MAIL
                if (tipo === "REENVIAR_REMITO_POR_MAIL") {
                    // reenviarRemitoPorMail espera: remitoId
                    const apiResponse = await AdministracionApi.reenviarRemitoPorMail(jsonData.remitoId);
                    logApiResponse("REENVIAR_REMITO_POR_MAIL", apiResponse);
                    const resumen = esRespuestaExitosa(apiResponse.data) ? "Remito reenviado por mail exitosamente." : "No se pudo reenviar el remito.";
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // REENVIAR_RECIBO_POR_MAIL
                if (tipo === "REENVIAR_RECIBO_POR_MAIL") {
                    // reenviarReciboPorMail espera: reciboId
                    const apiResponse = await AdministracionApi.reenviarReciboPorMail(jsonData.reciboId);
                    logApiResponse("REENVIAR_RECIBO_POR_MAIL", apiResponse);
                    const resumen = esRespuestaExitosa(apiResponse.data) ? "Recibo reenviado por mail exitosamente." : "No se pudo reenviar el recibo.";
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.thread_id);
                    await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                    return;
                }

                // Fallback para tipos válidos pero no implementados
                console.warn(`[API Debug] Tipo de API reconocido pero no implementado: ${tipo}`);
                const errorResumen = `El sistema aún no tiene implementada la función para el tipo: ${tipo}.`;
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, errorResumen, state, undefined, ctx.from, ctx.thread_id);
                await AssistantResponseProcessor.procesarRespuestaAsistente(assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID);
                return;
            }

            // Si no hubo bloque JSON válido, simplemente limpiar y enviar el texto si existe
            const cleanTextResponse = limpiarBloquesJSON(textResponse).trim();
            if (cleanTextResponse.length > 0) {
                // Guardar en Supabase antes de fragmentar
                if (ctx && ctx.from) {
                    await HistoryHandler.saveMessage(ctx.from, 'assistant', cleanTextResponse, 'text');
                }

                // Fragmentar mensajes largos por saltos de línea dobles
                const chunks = cleanTextResponse.split(/\n\n+/);
                for (const chunk of chunks) {
                    if (chunk.trim().length > 0) {
                        try {
                            // Enviar el mensaje tal como lo recibió el asistente, preservando saltos de línea y formato markdown
                            await flowDynamic([{ body: chunk.trim() }]);
                            // Pequeña pausa para evitar que WhatsApp ignore mensajes muy rápidos
                            await new Promise(r => setTimeout(r, 600)); 
                        } catch (err) {
                            console.error('[WhatsApp Debug] Error en flowDynamic:', err);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[Processor Error] Error crítico en analizarYProcesarRespuestaAsistente:', error);
            // Intentar informar al usuario o al menos no crashear
            try {
                await flowDynamic([{ body: "Hubo un problema técnico al procesar la respuesta del sistema. Por favor, intenta de nuevo en unos instantes." }]);
            } catch (innerError) {
                console.error('[Processor Error] No se pudo enviar mensaje de error:', innerError);
            }
        }
    }
}
