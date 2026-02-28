import axios from 'axios';
import { getSessionToken, ensureValidToken } from './SessionApi';

const BASE_URL = process.env.SWS_BASE_URL;

export class MovimientosApi {
  /**
   * Obtener saldos de un cliente por ID
   * Endpoint: POST /api/Movimientos/ObtenerSaldosDeCliente/
   * Request: { "cliente_id": ID }
   */
  static async obtenerSaldosDeCliente(clienteId: number) {
    await ensureValidToken();
    const token = getSessionToken() || '';
    const url = `${BASE_URL}/api/Movimientos/ObtenerSaldosDeCliente/`;
    const headers = {
      'CURRENTTOKENVALUE': token
    };
    const params = { clienteId };
    return axios.get(url, { headers, params });
  }
}
