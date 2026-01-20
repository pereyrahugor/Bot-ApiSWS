// Clase para obtener lista de precios del cliente
import axios from 'axios';
import { getSessionToken, ensureValidToken } from './SessionApi';

const BASE_URL = process.env.SWS_BASE_URL;
export class ListaDePreciosApi {
  /**
   * Obtener matriz de lista de precios
   * Endpoint: GET /ListaDePrecios/ObtenerMatrizListaDePrecios
   */
  // Según resumen_endpoints.txt:
  static async obtenerMatrizListaDePrecios(_tipoLista_id: number) {
    await ensureValidToken();
    const url = `${BASE_URL}/ListaDePrecios/ObtenerMatrizListaDePrecios`;
    const headers = { 'CURRENTTOKENVALUE': getSessionToken() || '' };
    // Forzar tipoLista_id=0 siempre
    const params = { tipoLista_id: 0 };
    return axios.get(url, { headers, params });
  }

  /**
   * Obtener abonos tipos
   * Endpoint: GET /ListaDePrecios/ObtenerAbonosTipos
   */
  // Según resumen_endpoints.txt:
  // Endpoint: GET /AbonosTipos/ObtenerAbonosTipos
  // Request: { "desde": null, "hasta": null, "concepto": null, "activo": true }
  static async obtenerAbonosTipos(desde: string | null = null, hasta: string | null = null, concepto: string | null = null, activo: boolean = true) {
    await ensureValidToken();
    const url = `${BASE_URL}/AbonosTipos/ObtenerAbonosTipos`;
    const headers = { 'CURRENTTOKENVALUE': getSessionToken() || '' };
    const params = { desde, hasta, concepto, activo };
    return axios.get(url, { headers, params });
  }
  static async obtenerListaDePrecios(ClienteId: number) {
    await ensureValidToken();
    const url = `${BASE_URL}/ListaDePrecios/ObtenerListaDePreciosDeCliente`;
    const headers = {
      'CURRENTTOKENVALUE': getSessionToken() || ''
    };
    const params = { ClienteId };
    return axios.get(url, { headers, params });
  }
}
