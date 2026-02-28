// src/utils/JsonBlockFinder.ts

export class JsonBlockFinder {
    // Tipos válidos para este repositorio
    // Tipos válidos para este repositorio
    static tiposValidos = [
        // Reparto especial
        "CLIENTES_CERCANOS_A_CLIENTE",
        // Autogestión y pagos
        "OBTENER_CREDENCIALES_AUTOGESTION",
        "OBTENER_LINK_MERCADO_PAGO",
        "LINK_PAGO",
        // Clientes
        "BUSCAR_CLIENTE",
        "CREAR_CLIENTE",
        "BUSCAR_CLEINTE",
        "AGREGAR_CONTACTO",
        "OBTENER_DATOS_CLIENTE",
        "OBTENER_SUCURSALES_CLIENTE",
        // Incidentes
        "INCIDENCIA",
        "BUSCAR_INCIDENCIA",
        // Precios y productos
        "PRECIO",
        "PRODUCTOS",
        "MATRIZ_LISTA_PRECIOS",
        "ABONOS_TIPOS",
        // Reparto
        "REPARTO",
        "CLIENTES_CERCANOS_COORDENADA",
        "CLIENTES_CERCANOS_DIRECCION",
        // Facturación y administración
        "HISTORIAL_FACTURAS",
        "RECIBOS_PAGO",
        "RESUMEN_CUENTA",
        "ORDEN_TRABAJO",
        "REMITOS_ENTREGA",
        "DESCARGA_REMITO",
        "DESCARGA_REMITO_VENTA",
        "DESCARGA_ARCHIVO",
        "SALDO_CUENTA",
    // Otros
    "SESSION_LOGIN",
    // Reenvío de comprobantes
    "REENVIAR_FACTURA_POR_MAIL",
    "REENVIAR_REMITO_POR_MAIL",
    "REENVIAR_RECIBO_POR_MAIL"
    ];

    static buscarBloquesJSONEnTexto(texto: string): any | null {
        // 1. Buscar bloques entre etiquetas [API]...[/API]
        const apiRegex = /\[API\]([\s\S]*?)\[\/API\]/g;
        let match;
        while ((match = apiRegex.exec(texto)) !== null) {
            try {
                const parsed = JSON.parse(match[1]);
                if (JsonBlockFinder.tiposValidos.includes(parsed.type)) {
                    return parsed;
                }
            } catch (e) {
                // No es JSON válido, sigue buscando
            }
        }
        // 2. Buscar bloques JSON sueltos en el texto
        const bloques = [...texto.matchAll(/\{[\s\S]*?\}/g)].map(m => m[0]);
        for (const block of bloques) {
            try {
                const parsed = JSON.parse(block);
                if (JsonBlockFinder.tiposValidos.includes(parsed.type)) {
                    return parsed;
                }
            } catch (e) {
                // No es JSON válido, sigue buscando
            }
        }
        return null;
    }

    static buscarBloquesJSONProfundo(obj: any): any | null {
        if (!obj) return null;
        if (typeof obj === 'string') {
            return JsonBlockFinder.buscarBloquesJSONEnTexto(obj);
        }
        if (typeof obj === 'object') {
            for (const key of Object.keys(obj)) {
                const encontrado = JsonBlockFinder.buscarBloquesJSONProfundo(obj[key]);
                if (encontrado) return encontrado;
            }
        }
        return null;
    }
}   