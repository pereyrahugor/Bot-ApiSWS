import "dotenv/config";
import { supabase } from "../src/utils/historyHandler";
import { ClientesApi } from "../src/API_SWS/ClientesApi";
import fs from "fs";
import path from "path";

/**
 * Script de sincronización de contactos
 * 
 * Objetivo: Recorrer todos los contactos de un proyecto en la tabla 'chats',
 * realizar una búsqueda rápida por teléfono en la API SWS, y si se encuentra
 * un único resultado, actualizar los datos del contacto.
 */

const PROJECT_ID = "276503c6-752a-4852-9c00-13a6a52aaa54";

async function run() {
    process.env.RAILWAY_PROJECT_ID = PROJECT_ID; // Asegurar que HistoryHandler use el ID correcto
    
    console.log(`\n🚀 [Sync] Iniciando sincronización para el proyecto: ${PROJECT_ID}`);
    const startTime = Date.now();

    // 1. Obtener todos los contactos del proyecto
    const { data: chats, error } = await supabase
        .from('chats')
        .select('*')
        .eq('project_id', PROJECT_ID);

    if (error) {
        console.error("❌ [Sync] Error al obtener los chats:", error);
        return;
    }

    const totalToProcess = chats.length;
    console.log(`📦 [Sync] Se encontraron ${totalToProcess} contactos para procesar.`);

    let metrics = {
        total: 0,
        clientsFound: 0,
        foundDetails: [] as { phone: string, name: string }[],
        notFound: [] as string[],
        multipleFound: [] as { phone: string, count: number }[],
        errors: 0
    };

    for (const chat of chats) {
        metrics.total++;
        // Extraer número de teléfono del ID (ej: "5493512345678@s.whatsapp.net" -> "5493512345678")
        const rawPhone = chat.id.includes('@') ? chat.id.split('@')[0] : chat.id;

        // Limpiar teléfono: Solo característica y número (Ej: +5493515408368 -> 3515408368)
        const phone = rawPhone.replace(/^\+/, '').replace(/^549?/, '');

        process.stdout.write(`\r🔍 [${metrics.total}/${totalToProcess}] Procesando: ${phone}...`);

        try {
            // Llamar al nuevo endpoint BuscarClientePorContacto
            const response = await ClientesApi.buscarClientePorContacto({ telefono: phone });
            const results = response.data?.clientes || [];

            if (results.length === 1) {
                const client = results[0];
                
                // Extraer datos según la estructura del nuevo endpoint
                const fullName = client.nombreCliente || client.nombrePersona || 'Cliente';
                const address = client.DomicilioCompleto || '';
                const clientId = client.cliente_id;

                // Preparar actualización
                const updateData: any = {
                    name: fullName,
                    address: address,
                    cuit_dni: String(clientId),
                    tipo_cliente: 'Si', // Marcamos como cliente
                    is_lead: false,     // Ya no es un lead potencial si es cliente confirmado
                    metadata: {
                        ...(chat.metadata || {}),
                        es_cliente: 'Si',
                        numero_cliente: clientId,
                        tipo_cliente_sws: client.tipoCliente,
                        last_sync: new Date().toISOString()
                    }
                };

                // Actualizar en Supabase
                const { error: updateError } = await supabase
                    .from('chats')
                    .update(updateData)
                    .eq('id', chat.id)
                    .eq('project_id', PROJECT_ID);

                if (updateError) {
                    console.error(`\n❌ [Sync] Error actualizando ${phone}:`, updateError.message);
                    metrics.errors++;
                } else {
                    metrics.clientsFound++;
                    metrics.foundDetails.push({ phone, name: fullName });
                }
            } else if (results.length === 0) {
                metrics.notFound.push(phone);
            } else {
                metrics.multipleFound.push({ phone, count: results.length });
            }
        } catch (err: any) {
            console.error(`\n❌ [Sync] Error API para ${phone}:`, err.message);
            metrics.errors++;
        }
    }

    const endTime = Date.now();
    const durationSeconds = (endTime - startTime) / 1000;
    const durationFormatted = durationSeconds > 60 
        ? `${Math.floor(durationSeconds / 60)}m ${Math.floor(durationSeconds % 60)}s` 
        : `${durationSeconds.toFixed(2)}s`;

    // Generar Reporte
    const reportLines = [
        "=========================================",
        "      REPORTE DE SINCRONIZACIÓN SWS",
        "=========================================",
        `Fecha: ${new Date().toLocaleString()}`,
        `Proyecto: ${PROJECT_ID}`,
        `Duración: ${durationFormatted}`,
        "",
        "MÉTRICAS:",
        `- Total procesados: ${metrics.total}`,
        `- Clientes encontrados y actualizados: ${metrics.clientsFound}`,
        `- No encontrados: ${metrics.notFound.length}`,
        `- Resultados múltiples (revisión manual): ${metrics.multipleFound.length}`,
        `- Errores de proceso: ${metrics.errors}`,
        "",
        "-----------------------------------------",
        "DETALLE: CLIENTES ENCONTRADOS",
        "-----------------------------------------",
        ...(metrics.foundDetails.length > 0 
            ? metrics.foundDetails.map(m => `- ${m.phone}: ${m.name}`)
            : ["(Ninguno)"]),
        "",
        "-----------------------------------------",
        "DETALLE: MÚLTIPLES COINCIDENCIAS",
        "-----------------------------------------",
        ...(metrics.multipleFound.length > 0 
            ? metrics.multipleFound.map(m => `- ${m.phone}: ${m.count} resultados`)
            : ["(Ninguno)"]),
        "",
        "-----------------------------------------",
        "DETALLE: NO ENCONTRADOS",
        "-----------------------------------------",
        ...(metrics.notFound.length > 0 
            ? [metrics.notFound.join(", ")]
            : ["(Ninguno)"]),
        "========================================="
    ];

    const report = reportLines.join('\n');
    console.log("\n\n" + report);

    // Guardar logs en un archivo
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    
    const logFileName = `sync_contacts_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    const logPath = path.join(logDir, logFileName);
    
    fs.writeFileSync(logPath, report);
    console.log(`\n✅ [Sync] Sincronización finalizada. Reporte guardado en: ${logPath}`);
}

run().catch(err => {
    console.error("🔥 [Sync] Error fatal en el script:", err);
});
