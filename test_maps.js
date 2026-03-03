const { Client } = require("@googlemaps/google-maps-services-js");
require("dotenv").config();

async function run() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    console.log("API Key loaded:", !!apiKey);

    const client = new Client({});
    const calleYAltura = "Cordoba, Cordoba capital, Chacabuco 206";
    const codigoPostal = "";

    const address = `${calleYAltura}, ${codigoPostal} Ciudad de Cordoba, Cordoba, Argentina`;
    console.log("Address query:", address);

    try {
        const response = await client.geocode({
            params: { address, key: apiKey },
            timeout: 5000,
        });
        console.log("Status:", response.data.status);
        if (response.data.results && response.data.results.length > 0) {
            console.log("Location:", response.data.results[0].geometry.location);
            console.log("Formatted address:", response.data.results[0].formatted_address);
        } else {
            console.log("No results");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}
run();
