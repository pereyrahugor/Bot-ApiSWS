import { getAdapterProvider, getGroupProvider } from '../providers/instances';

/**
 * Función centralizada que elige el motor de envío correcto según el destinatario.
 * Si el destinatario es un grupo (@g.us), utiliza el motor de Baileys.
 * Si es un número individual, utiliza el motor principal (YCloud).
 */
export const sendToGroup = async (target: string, message: string, options: any = {}) => {
    try {
        if (!target) return;

        // Limpiar target de caracteres no deseados (excepto el @g.us)
        const isGroup = target.includes('@g.us');
        
        if (isGroup) {
            const groupProvider = getGroupProvider();
            if (!groupProvider) {
                console.error('❌ [groupSender] groupProvider no disponible para enviar a grupo.');
                return;
            }
            console.log(`📡 [groupSender] Enviando a GRUPO via Baileys: ${target}`);
            await groupProvider.sendMessage(target, message, options);
        } else {
            const adapterProvider = getAdapterProvider();
            if (!adapterProvider) {
                console.error('❌ [groupSender] adapterProvider no disponible para enviar individual.');
                return;
            }
            // Normalizar número para YCloud si fuera necesario
            const cleanTarget = target.replace(/[^0-9]/g, '');
            console.log(`📡 [groupSender] Enviando INDIVIDUAL via YCloud: ${cleanTarget}`);
            await adapterProvider.sendMessage(cleanTarget, message, options);
        }
    } catch (error) {
        console.error('❌ [groupSender] Error al enviar mensaje:', error);
    }
};

/**
 * Reenvía una imagen al destino correcto.
 */
export const sendImageToGroup = async (target: string, imagePath: string, caption: string = "") => {
    try {
        const isGroup = target.includes('@g.us');
        if (isGroup) {
            const groupProvider = getGroupProvider();
            if (groupProvider) await groupProvider.sendImage(target, imagePath, caption);
        } else {
            const adapterProvider = getAdapterProvider();
            const cleanTarget = target.replace(/[^0-9]/g, '');
            if (adapterProvider) await adapterProvider.sendImage(cleanTarget, imagePath, caption);
        }
    } catch (error) {
        console.error('❌ [groupSender] Error al enviar imagen:', error);
    }
};

/**
 * Reenvía un video al destino correcto.
 */
export const sendVideoToGroup = async (target: string, videoPath: string, caption: string = "") => {
    try {
        const isGroup = target.includes('@g.us');
        if (isGroup) {
            const groupProvider = getGroupProvider();
            if (groupProvider) {
                if (groupProvider.sendVideo) await groupProvider.sendVideo(target, videoPath, caption);
                else await groupProvider.sendImage(target, videoPath, caption); // Fallback
            }
        } else {
            const adapterProvider = getAdapterProvider();
            const cleanTarget = target.replace(/[^0-9]/g, '');
            if (adapterProvider) {
                if (adapterProvider.sendVideo) await adapterProvider.sendVideo(cleanTarget, videoPath, caption);
                else await adapterProvider.sendImage(cleanTarget, videoPath, caption);
            }
        }
    } catch (error) {
        console.error('❌ [groupSender] Error al enviar video:', error);
    }
};
