
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const currentProjectId = process.env.RAILWAY_PROJECT_ID || 'local-dev';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSessions() {
    console.log('--- Buscando sesión para:', currentProjectId);
    
    const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('project_id', currentProjectId);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('❌ No existe ninguna sesión para este project_id.');
        return;
    }

    console.log(`✅ Se encontraron ${data.length} filas para este proyecto.`);
    console.table(data.map(d => ({ 
        project_id: d.project_id, 
        session_id: d.session_id, 
        key_id: d.key_id, 
        updated_at: d.updated_at 
    })));
}

checkSessions();
