import "dotenv/config";
import { supabase } from "../src/utils/historyHandler";
import { ClientesApi } from "../src/API_SWS/ClientesApi";
import fs from "fs";
import path from "path";

/**
 * Script de Enriquecimiento de Contactos sin DNI/CUIT
 * 
 * Objetivo: Identificar contactos en la tabla 'chats' que no tengan 
 * valor en 'cuit_dni' para un proyecto específico, buscar sus datos 
 * en SWS y actualizarlos.
 */

const PROJECT_ID = "276503c6-752a-4852-9c00-13a6a52aaa54";

async function run() {
    process.env.RAILWAY_PROJECT_ID = PROJECT_ID;
    
    console.log(`\n🚀 [Enrich] Iniciando enriquecimiento para el proyecto: ${PROJECT_ID}`);
    const startTime = Date.now();

    // 1. Obtener contactos que NO tengan cuit_dni (null o string vacío)
    const { data: contacts, error } = await supabase
        .from('chats')
        .select('*')
        .eq('project_id', PROJECT_ID)
        .or('cuit_dni.is.null,cuit_dni.eq.""');

    if (error) {
        console.error("❌ [Enrich] Error al obtener los contactos:", error);
        return;
    }

    const totalToProcess = contacts.length;
    console.log(`📦 [Enrich] Se encontraron ${totalToProcess} contactos sin DNI/CUIT para procesar.`);

    if (totalToProcess === 0) {
        console.log("✅ [Enrich] No hay contactos pendientes de enriquecimiento.");
        return;
    }

    let metrics = {
        total: 0,
        updated: 0,
        foundDetails: [] as { phone: string, name: string, cuit: string }[],
        notFound: [] as string[],
        multipleFound: [] as { phone: string, count: number }[],
        errors: 0
    };

    for (const contact of contacts) {
        metrics.total++;
        // Extraer número de teléfono del ID (ej: "5493512345678@s.whatsapp.net" -> "5493512345678")
        const rawId = contact.id;
        const phoneWithPrefix = rawId.includes('@') ? rawId.split('@')[0] : rawId;

        // Limpiar teléfono para la API (remover 549 o +549)
        const cleanPhone = phoneWithPrefix.replace(/^\+/, '').replace(/^549?/, '');

        process.stdout.write(`\r🔍 [${metrics.total}/${totalToProcess}] Consultando: ${cleanPhone}...`);

        try {
            // Buscar en API SWS por teléfono
            const response = await ClientesApi.buscarClientePorContacto({ telefono: cleanPhone });
            const results = response.data?.clientes || [];

            if (results.length === 1) {
                const client = results[0];
                
                // Extraer datos
                const fullName = (client.nombreCliente || client.nombrePersona || contact.name || 'Cliente').trim();
                const address = (client.DomicilioCompleto || contact.address || '').trim();
                const clientId = client.cliente_id;

                // Preparar actualización
                const updateData: any = {
                    name: fullName,
                    address: address,
                    cuit_dni: String(clientId),
                    tipo_cliente: 'Si',
                    is_lead: false,
                    metadata: {
                        ...(contact.metadata || {}),
                        es_cliente: 'Si',
                        numero_cliente: clientId,
                        last_enrichment: new Date().toISOString()
                    }
                };

                // Actualizar en Supabase
                const { error: updateError } = await supabase
                    .from('chats')
                    .update(updateData)
                    .eq('id', contact.id)
                    .eq('project_id', PROJECT_ID);

                if (updateError) {
                    console.error(`\n❌ [Enrich] Error actualizando ${cleanPhone}:`, updateError.message);
                    metrics.errors++;
                } else {
                    metrics.updated++;
                    metrics.foundDetails.push({ phone: cleanPhone, name: fullName, cuit: String(clientId) });
                }
            } else if (results.length === 0) {
                metrics.notFound.push(cleanPhone);
            } else {
                metrics.multipleFound.push({ phone: cleanPhone, count: results.length });
            }
        } catch (err: any) {
            console.error(`\n❌ [Enrich] Error API para ${cleanPhone}:`, err.message);
            metrics.errors++;
        }
    }

    const endTime = Date.now();
    const durationSeconds = (endTime - startTime) / 1000;
    
    // Generar Reporte
    const reportLines = [
        "=========================================",
        "      REPORTE DE ENRIQUECIMIENTO DNI",
        "=========================================",
        `Fecha: ${new Date().toLocaleString()}`,
        `Proyecto: ${PROJECT_ID}`,
        `Duración: ${durationSeconds.toFixed(2)}s`,
        "",
        "MÉTRICAS:",
        `- Total inspeccionados: ${metrics.total}`,
        `- Contactos enriquecidos: ${metrics.updated}`,
        `- No encontrados en SWS: ${metrics.notFound.length}`,
        `- Múltiples coincidencias (SWS): ${metrics.multipleFound.length}`,
        `- Errores: ${metrics.errors}`,
        "",
        "-----------------------------------------",
        "DETALLE: ACTUALIZACIONES",
        "-----------------------------------------",
        ...(metrics.foundDetails.length > 0 
            ? metrics.foundDetails.map(m => `- ${m.phone}: ${m.name} (DNI: ${m.cuit})`)
            : ["(Ninguno)"]),
        "",
        "-----------------------------------------",
        "DETALLE: NO ENCONTRADOS (SWS)",
        "-----------------------------------------",
        ...(metrics.notFound.length > 0 
            ? metrics.notFound.map(phone => `- ${phone}`)
            : ["(Ninguno)"]),
        "",
        "-----------------------------------------",
        "DETALLE: MÚLTIPLES COINCIDENCIAS (SWS)",
        "-----------------------------------------",
        ...(metrics.multipleFound.length > 0 
            ? metrics.multipleFound.map(m => `- ${m.phone} (${m.count} coincidencias)`)
            : ["(Ninguno)"]),
        "========================================="
    ];

    const report = reportLines.join('\n');
    console.log("\n\n" + report);

    // Guardar logs
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, `enrich_dni_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`);
    fs.writeFileSync(logPath, report);
    console.log(`\n✅ [Enrich] Proceso finalizado. Log guardado en: ${logPath}`);
}

run().catch(err => {
    console.error("🔥 [Enrich] Error fatal:", err);
});
