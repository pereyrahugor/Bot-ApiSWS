
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSessions() {
    console.log('--- Resumen de Sesiones en Supabase ---');
    console.log('SUPABASE_URL:', supabaseUrl);
    
    const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('project_id, session_id, key_id, bot_name, updated_at');

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No se encontraron sesiones.');
        return;
    }

    console.table(data);
}

checkSessions();
