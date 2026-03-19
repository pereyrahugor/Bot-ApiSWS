import "dotenv/config";

/**
 * Configuración centralizada para evitar inconsistencias entre entornos (Local vs Railway).
 */
export const PROJECT_ID = process.env.RAILWAY_PROJECT_ID || process.env.PROJECT_ID || 'local-dev';
export const BOT_NAME = process.env.BOT_NAME || process.env.ASSISTANT_NAME || 'Bot-ApiSWS';

console.log(`[Config] PROJECT_ID: ${PROJECT_ID}`);
console.log(`[Config] BOT_NAME: ${BOT_NAME}`);
