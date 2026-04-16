import "dotenv/config";
import { supabase } from "../src/utils/historyHandler";
import { ClientesApi } from "../src/API_SWS/ClientesApi";
import fs from "fs";
import path from "path";

const PROJECT_ID = process.env.RAILWAY_PROJECT_ID || "276503c6-752a-4852-9c00-13a6a52aaa54";
const LOG_FILE = path.join(process.cwd(), "logs", "sync_contacts_2026-04-15T14-24-43-712Z.txt");

async function recover() {
    console.log(`\n🛠️ [Recovery] Iniciando recuperación para el proyecto: ${PROJECT_ID}`);
    const startTime = Date.now();

    if (!fs.existsSync(LOG_FILE)) {
        console.error(`❌ [Recovery] No se encontró el archivo de log: ${LOG_FILE}`);
        return;
    }

    const logContent = fs.readFileSync(LOG_FILE, 'utf-8');
    
    // Buscar líneas con el formato "- 3512413759: "
    const matches = logContent.matchAll(/- (\d+):/g);
    const numbersToRecover = Array.from(new Set(Array.from(matches).map(m => m[1])));

    console.log(`📦 [Recovery] Se identificaron ${numbersToRecover.length} números en el log.`);

    let metrics = {
        total: 0,
        recovered: 0,
        errors: 0
    };

    for (const phone of numbersToRecover) {
        metrics.total++;
        
        // Formato solicitado para guardar: 549 + numero
        const dbId = `549${phone}`;

        process.stdout.write(`\r🔄 [${metrics.total}/${numbersToRecover.length}] Recuperando: ${dbId}...`);

        try {
            // Buscamos los datos MAS RECIENTES en SWS antes de insertar
            const response = await ClientesApi.buscarClientePorContacto({ telefono: phone });
            const results = response.data?.clientes || [];

            if (results.length >= 1) {
                const client = results[0];
                const fullName = (client.nombrePersona || client.nombreCliente || 'Cliente Recuperado').trim();
                const address = client.DomicilioCompleto || '';
                const clientId = client.cliente_id;

                const updateData: any = {
                    id: dbId,
                    project_id: PROJECT_ID,
                    type: 'webchat', // Formato solicitado por el usuario
                    name: fullName,
                    address: address,
                    cuit_dni: String(clientId),
                    tipo_cliente: 'Si',
                    is_lead: false,
                    metadata: {
                        es_cliente: 'Si',
                        numero_cliente: clientId,
                        last_recovery: new Date().toISOString(),
                        recovered_from_log: true
                    }
                };

                // Usamos upsert para re-insertar o actualizar
                const { error: upsertError } = await supabase
                    .from('chats')
                    .upsert(updateData, { onConflict: 'id,project_id' });

                if (upsertError) {
                    console.error(`\n❌ [Recovery] Error al insertar ${dbId}:`, upsertError.message);
                    metrics.errors++;
                } else {
                    metrics.recovered++;
                }
            } else {
                // Si no se encuentra en SWS (raro pero posible), al menos lo creamos con el dato que tenemos
                const { error: insertError } = await supabase
                    .from('chats')
                    .upsert({
                        id: dbId,
                        project_id: PROJECT_ID,
                        type: 'webchat',
                        name: 'Recuperado (Sin datos SWS)',
                        metadata: { recovered_from_log: true, found_in_sws: false }
                    }, { onConflict: 'id,project_id' });
                
                if (insertError) metrics.errors++;
                else metrics.recovered++;
            }
        } catch (err: any) {
            console.error(`\n❌ [Recovery] Error API/DB para ${dbId}:`, err.message);
            metrics.errors++;
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n\n✅ [Recovery] Finalizado en ${duration}s`);
    console.log(`📊 RESULTADOS:`);
    console.log(`- Procesados: ${metrics.total}`);
    console.log(`- Recuperados exitosamente: ${metrics.recovered}`);
    console.log(`- Fallidos: ${metrics.errors}`);
}

recover().catch(err => {
    console.error("🔥 [Recovery] Error fatal:", err);
});
