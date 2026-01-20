import OpenAI from "openai";
/**
 * Convierte una fecha a formato DD/MM/YYYY
 * @param {string} fecha - Fecha en formato YYYY-MM-DD, YYYY/MM/DD o DD/MM/YYYY
 * @returns {string} Fecha en formato DD/MM/YYYY
 */
function toDDMMYYYY(fecha: string): string {
    if (!fecha) return '';
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

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function waitForActiveRuns(threadId: string) {
    if (!threadId) return;
    try {
        console.log(`[AssistantResponseProcessor] Verificando runs activos en thread ${threadId}...`);
        let attempt = 0;
        const maxAttempts = 20; // 40-60 segundos total
        while (attempt < maxAttempts) {
            const runs = await openai.beta.threads.runs.list(threadId, { limit: 5 });
            const activeRun = runs.data.find(run => 
                ["queued", "in_progress", "cancelling", "requires_action"].includes(run.status)
            );
            
            if (activeRun) {
                console.log(`[AssistantResponseProcessor] [${attempt}/${maxAttempts}] Run activo detectado (${activeRun.id}, estado: ${activeRun.status}). Esperando 2s...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempt++;
            } else {
                console.log(`[AssistantResponseProcessor] No hay runs activos. OK.`);
                // Delay adicional reducido pero presente para asegurar sincronización de OpenAI
                await new Promise(resolve => setTimeout(resolve, 1500));
                return;
            }
        }
        console.warn(`[AssistantResponseProcessor] Timeout esperando liberación del thread ${threadId}.`);
    } catch (error) {
        console.error(`[AssistantResponseProcessor] Error verificando runs:`, error);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
// src/utils/AssistantResponseProcessor.ts
import { JsonBlockFinder } from "../API_SWS/JsonBlockFinder";
import util from "util";
import { ClientesApi } from "../API_SWS/ClientesApi";
import { IncidentesApi } from "../API_SWS/IncidentesApi";
import { ListaDePreciosApi } from "../API_SWS/ListaDePreciosApi";
import { RepartosApi } from "../API_SWS/RepartosApi";
import { AdministracionApi } from "../API_SWS/FacturacionApi";
import { getMapsUbication } from "../addModule/getMapsUbication";
import { getUsuarioId } from "../API_SWS/SessionApi";

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
    return texto.replace(/\[API\][\s\S]*?\[\/API\]/g, "");
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
 * @param {number} max - Número máximo de resultados (default: 10)
 * @returns {any} Datos limitados
 */
function limitarResultados(data: any, max: number = 10): any {
    if (Array.isArray(data)) {
        return data.slice(0, max);
    }
    if (data && Array.isArray(data.data)) {
        return { ...data, data: data.data.slice(0, max) };
    }
    return data;
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
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                    if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
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
                    datos = apiResponse.data ? limitarResultados(apiResponse.data) : [];
                    if (tieneResultados(datos)) break;
                    if (radio >= radioMax) break;
                    radio += 250;
                } while (radio <= radioMax);
                console.log(`[API Debug] CLIENTES_CERCANOS_A_CLIENTE: clienteId=${jsonData.clienteId}, radio=${radio}`);
                const resumen = esRespuestaExitosa(datos, apiResponse) ? `Clientes cercanos: ${JSON.stringify(datos)}` : "No se pudo obtener los clientes cercanos.";
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                return;
            }

            // CLIENTES_CERCANOS_DIRECCION
            if (tipo === "CLIENTES_CERCANOS_DIRECCION") {
                const ubicacion = await getMapsUbication(
                    jsonData.address,
                    "",
                    "",
                    "",
                    ""
                );

                if (!ubicacion || !ubicacion.lat || !ubicacion.lng) {
                    const resumen = "No se pudo obtener coordenadas para la dirección proporcionada.";
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                    if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                    return;
                }

                // Ignorar metros recibido, siempre iniciar en 500 y escalar
                let metros = 500;
                const metrosMax = 2500;
                let apiResponse;
                let datos = [];
                do {
                    apiResponse = await RepartosApi.busquedaClientesCercanosResultJson({
                        address: jsonData.address,
                        metros // ignorar jsonData.metros
                    });
                    datos = apiResponse.data ? limitarResultados(apiResponse.data) : [];
                    if (tieneResultados(datos)) break;
                    if (metros >= metrosMax) break;
                    metros += 250;
                } while (metros <= metrosMax);
                console.log(`[API Debug] CLIENTES_CERCANOS_DIRECCION: address=${jsonData.address}, metros=${metros}`);

                const resumen = esRespuestaExitosa(datos, apiResponse) ? `Clientes cercanos: ${JSON.stringify(datos)}` : "No se encontraron clientes cercanos.";
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                return;
            }

            // BUSCAR_CLIENTE
            if (tipo === "BUSCAR_CLIENTE" || tipo === "BUSCAR_CLEINTE") {
                // busquedaRapida espera: { datosCliente, telefono, domicilio }
                const apiResponse = await ClientesApi.busquedaRapida({
                    datosCliente: jsonData.datosCliente ?? '',
                    telefono: jsonData.telefono ?? '',
                    domicilio: jsonData.domicilio ?? ''
                });
                console.log('[API Debug] Respuesta BUSCAR_CLIENTE:', util.inspect(apiResponse, { depth: 4 }));
                const respuestaApi = apiResponse.data || {};
                let datosCliente = null;
                if (Array.isArray(respuestaApi.data) && respuestaApi.data.length > 0) {
                    // Aquí solo tomamos el primero, así que no hace falta limitar
                    datosCliente = respuestaApi.data[0];
                    console.log('[API Debug] Datos de cliente:', util.inspect(datosCliente, { depth: 4 }));
                }
                let resumen;
                if (esRespuestaExitosa(respuestaApi) && datosCliente) {
                    resumen = `Datos completos del cliente:\n${JSON.stringify(datosCliente, null, 2)}`;
                } else {
                    resumen = "No se encuentra cliente coincidente con los datos enviados";
                }
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) {
                    // Si la respuesta del asistente contiene un bloque [API], reprocesar antes de enviar al usuario
                    const apiBlockRegex = /\[API\](.*?)\[\/API\]/is;
                    if (typeof assistantApiResponse === 'string' && apiBlockRegex.test(assistantApiResponse)) {
                        // Si contiene un bloque [API], reprocesar como instrucción API y NO enviar nada al usuario aún
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
                console.log('[API Debug] Respuesta CREAR_CLIENTE:', util.inspect(apiResponse, { depth: 4 }));
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
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) {
                    const apiBlockRegex = /\[API\](.*?)\[\/API\]/is;
                    if (typeof assistantApiResponse === 'string' && apiBlockRegex.test(assistantApiResponse)) {
                        await AssistantResponseProcessor.analizarYProcesarRespuestaAsistente(
                            assistantApiResponse, ctx, flowDynamic, state, provider, gotoFlow, getAssistantResponse, ASSISTANT_ID
                        );
                    } else {
                        await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                    }
                }
                return;
            }

            // AGREGAR_CONTACTO
            if (tipo === "AGREGAR_CONTACTO") {
                // agregarContacto espera: modeloContacto
                const apiResponse = await ClientesApi.agregarContacto(jsonData.modeloContacto);
                console.log('[API Debug] Respuesta AGREGAR_CONTACTO:', util.inspect(apiResponse, { depth: 4 }));
                const resumen = esRespuestaExitosa(apiResponse.data)
                    ? "Contacto agregado exitosamente."
                    : "No se pudo agregar el contacto.";
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
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

                const apiResponse = await IncidentesApi.crearTicket(jsonData);
                console.log('[API Debug] Respuesta INCIDENCIA:', util.inspect(apiResponse, { depth: 4 }));
                let resumen = "";
                if (esRespuestaExitosa(apiResponse.data)) {
                    const id = apiResponse.data?.incidente?.id;
                    resumen = `✅ Incidencia registrada exitosamente. ID: ${id ?? 'desconocido'}`;
                } else {
                    resumen = `No se pudo registrar la incidencia: ${apiResponse.data?.message || 'Error desconocido.'}`;
                }
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                return;
            }

            // BUSCAR_INCIDENCIA
            if (tipo === "BUSCAR_INCIDENCIA") {
                const apiResponse = await IncidentesApi.obtenerIncidentesCliente(jsonData);
                console.log('[API Debug] Respuesta BUSCAR_INCIDENCIA:', util.inspect(apiResponse, { depth: 4 }));
                const datos = limitarResultados(apiResponse.data || {});
                const resumen = esRespuestaExitosa(datos, apiResponse) ? `Incidentes encontrados: ${JSON.stringify(datos, null, 2)}` : "No se encontraron incidentes para el cliente.";
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                return;
            }

            // LINK_PAGO / OBTENER_LINK_MERCADO_PAGO
            if (tipo === "LINK_PAGO" || tipo === "OBTENER_LINK_MERCADO_PAGO") {
                const cliente_id = jsonData.cliente_id ?? jsonData.ClienteId;
                const monto = jsonData.monto;
                const apiResponse = await AdministracionApi.obtenerLinkPago(cliente_id, monto);
                console.log('[API Debug] Respuesta LINK_PAGO:', util.inspect(apiResponse, { depth: 4 }));
                const datos = apiResponse.data || {};
                const resumen = esRespuestaExitosa(datos, apiResponse) ? `Link de pago generado: ${JSON.stringify(datos, null, 2)}` : "No se pudo generar el link de pago.";
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                return;
            }

            // PRECIO
            if (tipo === "PRECIO") {
                const apiResponse = await ListaDePreciosApi.obtenerListaDePrecios(jsonData.ClienteId);
                console.log('[API Debug] Respuesta PRECIO completa:', util.inspect(apiResponse.data, { depth: 5 }));
                
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
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
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
                    console.log('[API Debug] Respuesta REPARTO:', util.inspect(apiResponse, { depth: 4 }));
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
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                return;
            }

            // PRODUCTOS
            if (tipo === "PRODUCTOS") {
                // PRODUCTOS espera: ClienteId (preferido) o cliente_Id (legacy), categoria (opcional)
                    const clienteId = jsonData.ClienteId ?? jsonData.cliente_Id;
                    const apiResponse = await ListaDePreciosApi.obtenerListaDePrecios(clienteId);
                    console.log('[API Debug] Respuesta PRODUCTOS:', util.inspect(apiResponse, { depth: 4 }));

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
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                    if (assistantApiResponse) {
                        await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                    }
                    return;
            }

            // OBTENER_DATOS_CLIENTE
            if (tipo === "OBTENER_DATOS_CLIENTE") {
                // obtenerDatosCliente espera: cliente_id (number)
                const apiResponse = await ClientesApi.obtenerDatosCliente(jsonData.cliente_id);
                console.log('[API Debug] Respuesta OBTENER_DATOS_CLIENTE:', util.inspect(apiResponse, { depth: 4 }));
                const datos = limitarResultados(apiResponse.data || {});
                const resumen = esRespuestaExitosa(datos, apiResponse) ? `Datos del cliente: ${JSON.stringify(datos)}` : "No se encontraron datos del cliente.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                    if (assistantApiResponse) {
                        await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                    }
                    return;
            }

            // OBTENER_SUCURSALES_CLIENTE
            if (tipo === "OBTENER_SUCURSALES_CLIENTE") {
                // obtenerSucursales espera: cliente_id (number)
                const apiResponse = await ClientesApi.obtenerSucursales(jsonData.cliente_id);
                console.log('[API Debug] Respuesta OBTENER_SUCURSALES_CLIENTE:', util.inspect(apiResponse, { depth: 4 }));
                    const datos = limitarResultados(apiResponse.data || {});
                    const resumen = esRespuestaExitosa(datos) ? `Sucursales del cliente: ${JSON.stringify(datos)}` : "No se encontraron sucursales para el cliente.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                    if (assistantApiResponse) {
                        await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                    }
                    return;
            }

            // MATRIZ_LISTA_PRECIOS
            if (tipo === "MATRIZ_LISTA_PRECIOS") {
                // obtenerMatrizListaDePrecios espera: tipoLista_id (number)
                const tipoListaId = jsonData.tipoLista_id ?? 1;
                const apiResponse = await ListaDePreciosApi.obtenerMatrizListaDePrecios(tipoListaId);
                console.log('[API Debug] Respuesta MATRIZ_LISTA_PRECIOS:', util.inspect(apiResponse, { depth: 4 }));
                    const datos = limitarResultados(apiResponse.data || {});
                    const resumen = esRespuestaExitosa(datos) ? `Matriz de lista de precios: ${JSON.stringify(datos)}` : "No se pudo obtener la matriz de lista de precios.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                    if (assistantApiResponse) {
                        await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                    }
                    return;
            }

            // ABONOS_TIPOS
            if (tipo === "ABONOS_TIPOS") {
                // obtenerAbonosTipos espera: desde, hasta, concepto, activo
                const apiResponse = await ListaDePreciosApi.obtenerAbonosTipos(
                    jsonData.desde ?? null,
                    jsonData.hasta ?? null,
                    jsonData.concepto ?? null,
                    typeof jsonData.activo === 'boolean' ? jsonData.activo : true
                );
                console.log('[API Debug] Respuesta ABONOS_TIPOS:', util.inspect(apiResponse, { depth: 4 }));
                    const datos = limitarResultados(apiResponse.data || {});
                    const resumen = esRespuestaExitosa(datos) ? `Tipos de abonos: ${JSON.stringify(datos)}` : "No se pudo obtener los tipos de abonos.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                    if (assistantApiResponse) {
                        await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                    }
                    return;
            }

            // HISTORIAL_FACTURAS
            if (tipo === "HISTORIAL_FACTURAS") {
                // historialFacturasCliente espera: cliente_id, fechaDesde, fechaHasta, saldoPendiente (opcional)
                const apiResponse = await AdministracionApi.historialFacturasCliente(
                    jsonData.cliente_id,
                    toDDMMYYYY(jsonData.fechaDesde),
                    toDDMMYYYY(jsonData.fechaHasta),
                    typeof jsonData.saldoPendiente === 'boolean' ? jsonData.saldoPendiente : false
                );
                console.log('[API Debug] Respuesta HISTORIAL_FACTURAS:', util.inspect(apiResponse, { depth: 4 }));
                    const datos = limitarResultados(apiResponse.data || {});
                    const resumen = esRespuestaExitosa(datos) ? `Historial de facturas: ${JSON.stringify(datos)}` : "No se pudo obtener el historial de facturas.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                    if (assistantApiResponse) {
                        await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                    }
                    return;
            }

            // RECIBOS_PAGO
            if (tipo === "RECIBOS_PAGO") {
                // recibosPagoCliente espera: clienteId, fechaReciboDesde, fechaReciboHasta, saldoDisponible (opcional)
                const apiResponse = await AdministracionApi.recibosPagoCliente(
                    jsonData.cliente_id,
                    toDDMMYYYY(jsonData.fechaReciboDesde ?? ''),
                    toDDMMYYYY(jsonData.fechaReciboHasta ?? ''),
                    typeof jsonData.saldoDisponible === 'boolean' ? jsonData.saldoDisponible : false
                );
                console.log('[API Debug] Respuesta RECIBOS_PAGO:', util.inspect(apiResponse, { depth: 4 }));
                    const datos = limitarResultados(apiResponse.data || {});
                    const resumen = esRespuestaExitosa(datos) ? `Recibos de pago: ${JSON.stringify(datos)}` : "No se pudo obtener los recibos de pago.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                    if (assistantApiResponse) {
                        await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                    }
                    return;
            }

            // RESUMEN_CUENTA
            if (tipo === "RESUMEN_CUENTA") {
                // resumenCuentaCliente espera: clienteId, desde, hasta
                const apiResponse = await AdministracionApi.resumenCuentaCliente(
                    jsonData.cliente_id,
                    toDDMMYYYY(jsonData.fechaDesde ?? ''),
                    toDDMMYYYY(jsonData.fechaHasta ?? '')
                );
                console.log('[API Debug] Respuesta RESUMEN_CUENTA:', util.inspect(apiResponse, { depth: 4 }));
                    const datos = limitarResultados(apiResponse.data || {});
                    const resumen = esRespuestaExitosa(datos) ? `Resumen de cuenta: ${JSON.stringify(datos)}` : "No se pudo obtener el resumen de cuenta.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                    if (assistantApiResponse) {
                        await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                    }
                    return;
            }

            // ORDEN_TRABAJO
            if (tipo === "ORDEN_TRABAJO") {
                // obtenerServiciosTecnicosCliente espera: clienteId, desde, hasta (hasta es opcional, default: hoy)
                const apiResponse = await AdministracionApi.obtenerServiciosTecnicosCliente(
                    jsonData.clienteId,
                    toDDMMYYYY(jsonData.fechaDesde ?? ''),
                    toDDMMYYYY(jsonData.fechaHasta ?? '')
                );
                console.log('[API Debug] Respuesta ORDEN_TRABAJO:', util.inspect(apiResponse, { depth: 4 }));
                    const datos = limitarResultados(apiResponse.data || {});
                    const resumen = esRespuestaExitosa(datos) ? `Servicios técnicos: ${JSON.stringify(datos)}` : "No se pudo obtener los servicios técnicos.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                    if (assistantApiResponse) {
                        await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                    }
                    return;
            }

            // REMITOS_ENTREGA
            if (tipo === "REMITOS_ENTREGA") {
                // remitosEntrega espera: cliente_id, fechaDesde, fechaHasta, consumosSinFacturar (opcional)
                const apiResponse = await AdministracionApi.remitosEntrega(
                    jsonData.cliente_id,
                    toDDMMYYYY(jsonData.fechaDesde ?? ''),
                    toDDMMYYYY(jsonData.fechaHasta ?? ''),
                    typeof jsonData.consumosSinFacturar === 'boolean' ? jsonData.consumosSinFacturar : false
                );
                console.log('[API Debug] Respuesta REMITOS_ENTREGA:', util.inspect(apiResponse, { depth: 4 }));
                    const datos = limitarResultados(apiResponse.data || {});
                    const resumen = esRespuestaExitosa(datos) ? `Remitos de entrega: ${JSON.stringify(datos)}` : "No se pudo obtener los remitos de entrega.";
                    // Enviar SIEMPRE la respuesta al asistente
                    const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                    if (assistantApiResponse) {
                        await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                    }
                    return;
            }

            // DESCARGA_REMITO
            if (tipo === "DESCARGA_REMITO") {
                // descargarRemito espera: remito_id
                const apiResponse = await AdministracionApi.descargarRemito(jsonData.remito_id);
                console.log('[API Debug] Respuesta DESCARGA_REMITO:', util.inspect(apiResponse, { depth: 4 }));
                const datos = apiResponse.data || {};
                const resumen = esRespuestaExitosa(datos) ? `Archivo de remito descargado: ${JSON.stringify(datos)}` : "No se pudo descargar el remito.";
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                return;
            }

            // DESCARGA_REMITO_VENTA
            if (tipo === "DESCARGA_REMITO_VENTA") {
                // descargarRemitoPorVenta espera: idVenta
                const apiResponse = await AdministracionApi.descargarRemitoPorVenta(jsonData.idVenta);
                console.log('[API Debug] Respuesta DESCARGA_REMITO_VENTA:', util.inspect(apiResponse, { depth: 4 }));
                const datos = apiResponse.data || {};
                const resumen = esRespuestaExitosa(datos) ? `Archivo de remito por venta descargado: ${JSON.stringify(datos)}` : "No se pudo descargar el remito por venta.";
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                return;
            }

            // DESCARGA_ARCHIVO
            if (tipo === "DESCARGA_ARCHIVO") {
                // descargarArchivo espera: archivo_id
                const apiResponse = await AdministracionApi.descargarArchivo(jsonData.archivo_id);
                console.log('[API Debug] Respuesta DESCARGA_ARCHIVO:', util.inspect(apiResponse, { depth: 4 }));
                const datos = apiResponse.data || {};
                const resumen = esRespuestaExitosa(datos) ? `Archivo descargado: ${JSON.stringify(datos)}` : "No se pudo descargar el archivo.";
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                return;
            }

            // REENVIAR_FACTURA_POR_MAIL
            if (tipo === "REENVIAR_FACTURA_POR_MAIL") {
                // reenviarFacturaPorMail espera: facturaId
                const apiResponse = await AdministracionApi.reenviarFacturaPorMail(jsonData.facturaId);
                console.log('[API Debug] Respuesta REENVIAR_FACTURA_POR_MAIL:', util.inspect(apiResponse, { depth: 4 }));
                const resumen = esRespuestaExitosa(apiResponse.data) ? "Factura reenviada por mail exitosamente." : "No se pudo reenviar la factura.";
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                return;
            }

            // REENVIAR_REMITO_POR_MAIL
            if (tipo === "REENVIAR_REMITO_POR_MAIL") {
                // reenviarRemitoPorMail espera: remitoId
                const apiResponse = await AdministracionApi.reenviarRemitoPorMail(jsonData.remitoId);
                console.log('[API Debug] Respuesta REENVIAR_REMITO_POR_MAIL:', util.inspect(apiResponse, { depth: 4 }));
                const resumen = esRespuestaExitosa(apiResponse.data) ? "Remito reenviado por mail exitosamente." : "No se pudo reenviar el remito.";
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                return;
            }

            // REENVIAR_RECIBO_POR_MAIL
            if (tipo === "REENVIAR_RECIBO_POR_MAIL") {
                // reenviarReciboPorMail espera: reciboId
                const apiResponse = await AdministracionApi.reenviarReciboPorMail(jsonData.reciboId);
                console.log('[API Debug] Respuesta REENVIAR_RECIBO_POR_MAIL:', util.inspect(apiResponse, { depth: 4 }));
                const resumen = esRespuestaExitosa(apiResponse.data) ? "Recibo reenviado por mail exitosamente." : "No se pudo reenviar el recibo.";
                const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, resumen, state, undefined, ctx.from, ctx.from);
                if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
                return;
            }

            // Fallback para tipos válidos pero no implementados
            console.warn(`[API Debug] Tipo de API reconocido pero no implementado: ${tipo}`);
            const errorResumen = `El sistema aún no tiene implementada la función para el tipo: ${tipo}.`;
            const assistantApiResponse = await getAssistantResponse(ASSISTANT_ID, errorResumen, state, undefined, ctx.from, ctx.from);
            if (assistantApiResponse) await flowDynamic([{ body: limpiarBloquesJSON(String(assistantApiResponse)).trim() }]);
            return;
        }

        // Si no hubo bloque JSON válido, simplemente limpiar y enviar el texto si existe
        const cleanTextResponse = limpiarBloquesJSON(textResponse).trim();
        if (cleanTextResponse.length > 0) {
            // Enviar el mensaje tal como lo recibió el asistente, preservando saltos de línea y formato markdown
            await flowDynamic([{ body: cleanTextResponse }]);
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
