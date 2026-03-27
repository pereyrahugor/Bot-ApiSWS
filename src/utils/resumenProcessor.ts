import { IncidentesApi } from '../API_SWS/IncidentesApi';
import { ClientesApi } from '../API_SWS/ClientesApi';
import { getUsuarioId } from '../API_SWS/SessionApi';
import { extraerDatosResumen } from './extractJsonData';

/**
 * Procesa acciones automáticas basadas en el contenido del resumen generado.
 * Si no hay incidencia_id, crea una.
 * Si no se pasaron credenciales y hay cliente_id, las obtiene.
 */
export async function procesarAccionesResumen(resumen: string): Promise<{ updatedResumen: string, feedback: string[] }> {
    const data = extraerDatosResumen(resumen);
    const feedback: string[] = [];
    let updatedResumen = resumen;

    // 1. Caso: Numero Incidencia vacío
    const numIncidenciaRaw = data["Numero Incidencia"] || "";
    if (numIncidenciaRaw.trim() === "") {
        console.log('[ResumenProcessor] Detectada incidencia vacía. Creando una nueva...');
        
        // Extraer cliente_id (solo números)
        const clienteIdMatch = (data["Numero de cliente"] || "").match(/\d+/);
        const cliente_id = clienteIdMatch ? clienteIdMatch[0] : "";

        const payloadIncidencia = {
            centroDistribucion_id: 1,
            cliente_id: cliente_id,
            descripcion: `<p>${data["Observaciones"] || ""}</p>`,
            estadoIncidente_ids: null,
            fechaCierreEstimado: getFechaCierreEstimado(),
            severidad_ids: 2,
            subTipoIncidente_ids: 74,
            tipoIncidente_ids: 8,
            titulo: data["Solicitud interés"] || "Solicitud de interés (Resumen)",
            usuarioResponsable_id: getUsuarioId() || null,
            grupoResponsable_ids: null
        };

        try {
            const resp = await IncidentesApi.crearTicket(payloadIncidencia);
            if (resp.data && resp.data.error === 0 && resp.data.incidente) {
                const newId = resp.data.incidente.id;
                console.log(`[ResumenProcessor] Incidencia creada exitosamente. ID: ${newId}`);
                
                // Reemplazar en el resumen
                // Buscamos "Numero Incidencia:" y lo que siga hasta el final de la línea o el próximo campo
                updatedResumen = updatedResumen.replace(/(Numero Incidencia[:=])\s*(?=\n|$)/i, `$1 ${newId}`);
                
                feedback.push(`✅ Se ha registrado automáticamente una incidencia por el bot. El número de incidente generado es: ${newId}. Por favor, infórmale al usuario.`);
            } else {
                console.warn('[ResumenProcessor] No se pudo crear la incidencia automática:', resp.data);
            }
        } catch (err: any) {
            console.error('[ResumenProcessor] Error creando incidencia automática:', err.message);
        }
    }

    // 2. Caso: Credenciales "No" y hay cliente_id
    const pasaronCredenciales = (data["Se pasaron credenciales"] || "").trim().toLowerCase();
    const clienteIdMatch = (data["Numero de cliente"] || "").match(/\d+/);
    
    if (pasaronCredenciales === "no" && clienteIdMatch) {
        const cliente_id = parseInt(clienteIdMatch[0]);
        console.log(`[ResumenProcessor] Obteniendo credenciales para cliente: ${cliente_id}...`);
        
        try {
            const resp = await ClientesApi.obtenerCredencialesAutogestion(cliente_id);
            if (resp.data && resp.data.error === 0) {
                const creds = resp.data.data || resp.data;
                console.log(`[ResumenProcessor] Credenciales obtenidas exitosamente.`);
                
                // Reemplazar No por sí en el resumen
                updatedResumen = updatedResumen.replace(/(Se pasaron credenciales[:=])\s*no/i, `$1 sí`);
                
                // Preparar mensaje detallado para el asistente
                feedback.push(`🔑 He obtenido las credenciales de autogestión para el cliente:\n${JSON.stringify(creds, null, 2)}\nPor favor, entrega estos datos al usuario para que pueda acceder a su cuenta.`);
            } else {
                console.warn('[ResumenProcessor] No se pudieron obtener las credenciales automáticas:', resp.data);
            }
        } catch (err: any) {
            console.error('[ResumenProcessor] Error obteniendo credenciales automáticas:', err.message);
        }
    }

    return { updatedResumen, feedback };
}

/** 
 * Duplicado de la función de fechas para evitar dependencias circulares complejas o exportaciones pesadas
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
