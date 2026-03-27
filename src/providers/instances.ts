let adapterProvider = null;
let groupProvider = null;

/**
 * Establece el proveedor principal (YCloud)
 */
export const setAdapterProvider = (instance) => {
    adapterProvider = instance;
};

/**
 * Obtiene el proveedor principal (YCloud)
 */
export const getAdapterProvider = () => adapterProvider;

/**
 * Establece el proveedor de grupos (Baileys)
 */
export const setGroupProvider = (instance) => {
    groupProvider = instance;
};

/**
 * Obtiene el proveedor de grupos (Baileys)
 */
export const getGroupProvider = () => groupProvider;
