import { Client } from "@googlemaps/google-maps-services-js";

/**
 * Obtiene la latitud y longitud de una dirección usando la API de Google Maps Geocoding.
 * @param calleYAltura Calle y altura (ej: "Av. Sarmiento 123")
 * @param localidad Localidad o ciudad
 * @param provincia Provincia
 * @returns { lat: number, lng: number } o null si no se encuentra
 *
 * Requiere credenciales: credentials/bot-test-v1-450813-e8a481670ed1-aquavita.json
 */
/**
 * Obtiene la latitud y longitud de una dirección usando la API de Google Maps Geocoding.
 * @param calleYAltura Calle y altura (ej: "Av. Sarmiento 123")
 * @param localidad Localidad o ciudad
 * @param provincia Provincia
 * @param pais País
 * @returns { lat: number, lng: number } o null si no se encuentra
 */
/**
 * Obtiene la latitud y longitud de una dirección usando la API de Google Maps Geocoding.
 * @param calleYAltura Calle y altura (ej: "Cmte. Lucena 5361")
 * @param codigoPostal Código postal (ej: "B1874AYH")
 * @param localidad Localidad o ciudad (ej: "Wilde")
 * @param provincia Provincia (ej: "Provincia de Buenos Aires")
 * @param pais País (ej: "Argentina")
 * @returns { lat: number, lng: number } o null si no se encuentra
 */
export async function getMapsUbication(
  calleYAltura: string,
  codigoPostal: string,
  _localidad: string,
  _provincia: string,
  _pais: string
) {
  // Forzar valores estáticos
  const provinciaFija = "Cordoba";
  const pais = "Argentina";
  const localidadFija = "Ciudad de Cordoba";
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  if (!apiKey) {
    console.error('No se encontró la API Key de Google Maps en las variables de entorno.');
    return null;
  }
  const address = `${calleYAltura}, ${codigoPostal} ${localidadFija}, ${provinciaFija}, ${pais}`;
  const client = new Client({});
  try {
    const response = await client.geocode({
      params: {
        address: address,
        key: apiKey,
      },
      timeout: 5000,
    });
    if (
      response.data.status === "OK" &&
      response.data.results &&
      response.data.results.length > 0
    ) {
      const location = response.data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } else {
      console.warn("No se encontró la ubicación para:", address);
      return null;
    }
  } catch (error) {
    console.error("Error consultando Google Maps Geocoding API:", error);
    return null;
  }
}
