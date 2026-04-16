import "dotenv/config";
import { ClientesApi } from "./src/API_SWS/ClientesApi";

async function test() {
    const phone = "3516368048"; // Uno que sabemos que existe
    console.log(`🧪 Testeando BuscarClientePorContacto para: ${phone}`);
    try {
        const response = await ClientesApi.buscarClientePorContacto({ telefono: phone });
        console.log("Status:", response.status);
        console.log("Full Body:", JSON.stringify(response.data, null, 2));
    } catch (e: any) {
        console.error("Error:", e.response?.data || e.message);
    }
}

test();
