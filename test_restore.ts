
import 'dotenv/config';
import { restoreSessionFromDb } from './src/utils/sessionSync.js';
import fs from 'fs';
import path from 'path';

async function testRestore() {
    console.log('--- TEST RESTORE ---');
    await restoreSessionFromDb();
    
    const sessDir = 'bot_sessions';
    if (fs.existsSync(sessDir)) {
        const files = fs.readdirSync(sessDir);
        console.log(`Archivos restaurados en ${sessDir}: ${files.length}`);
        if (files.length > 0) {
            console.log('Primeros 5 archivos:', files.slice(0, 5));
        }
    } else {
        console.log('La carpeta bot_sessions no existe.');
    }
}

testRestore();
