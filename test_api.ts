import { RepartosApi } from './src/API_SWS/RepartosApi';
import { config } from 'dotenv';
config();

async function run() {
    console.log("Testing coords based:");
    const res = await RepartosApi.obtenerClientesCercanosPorDireccion("Cordoba, Cordoba capital, Chacabuco 206", "", "", "", "");
    console.log(JSON.stringify(res?.data || res?.error));

    console.log("\nTesting direct endpoint:");
    const res2 = await RepartosApi.busquedaClientesCercanosResultJson({ address: "Cordoba, Cordoba capital, Chacabuco 206", metros: 500 });
    console.log(JSON.stringify(res2?.data || res2?.error));
}
run();
