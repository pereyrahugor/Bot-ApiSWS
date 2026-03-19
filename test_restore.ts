import { restoreSessionFromDb } from './src/utils/sessionSync';
import fs from 'fs';
import path from 'path';

async function test() {
    console.log('--- Probando restoreSessionFromDb ---');
    await restoreSessionFromDb();
    
    if (fs.existsSync('bot_sessions')) {
        const files = fs.readdirSync('bot_sessions');
        console.log(`✅ Carpetas de sesión encontradas: ${files.length} archivos.`);
        files.forEach(f => console.log(` - ${f}`));
    } else {
        console.log('❌ No se encontró la carpeta bot_sessions.');
    }
}

test();
