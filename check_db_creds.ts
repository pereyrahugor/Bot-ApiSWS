
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const projectId = '276503c6-752a-4852-9c00-13a6a52aaa54';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCreds() {
    const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('data')
        .eq('project_id', projectId)
        .eq('key_id', 'full_backup')
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    const creds = data.data['creds.json'];
    if (creds) {
        console.log('--- Creds in DB ---');
        console.log('ID:', creds.me?.id);
        console.log('Name:', creds.me?.name);
        console.log('Registered:', creds.registered);
    } else {
        console.log('creds.json not found in backup!');
    }
}

checkCreds();
