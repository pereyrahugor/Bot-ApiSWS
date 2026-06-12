import { swsClient } from './swsClient';

export class MovimientosApi {
  /**
   * Obtener saldos de un cliente por ID
   * Endpoint: POST /api/Movimientos/ObtenerSaldosDeCliente/
   * Request: { "cliente_id": ID }
   */
  static async obtenerSaldosDeCliente(clienteId: number) {
    const url = `/api/Movimientos/ObtenerSaldosDeCliente/`;
    const params = { clienteId };
    return swsClient.get(url, { params });
  }
}
