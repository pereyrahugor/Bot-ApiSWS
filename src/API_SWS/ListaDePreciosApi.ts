// Clase para obtener lista de precios del cliente
import { swsClient } from './swsClient';

export class ListaDePreciosApi {
  /**
   * Obtener matriz de lista de precios
   * Endpoint: GET /ListaDePrecios/ObtenerMatrizListaDePrecios
   */
  // Según resumen_endpoints.txt:
  static async obtenerMatrizListaDePrecios(_tipoLista_id: number) {
    const url = `/ListaDePrecios/ObtenerMatrizListaDePrecios`;
    // Forzar tipoLista_id=0 siempre
    const params = { tipoLista_id: 0 };
    return swsClient.get(url, { params });
  }

  /**
   * Obtener abonos tipos
   * Endpoint: GET /ListaDePrecios/ObtenerAbonosTipos
   */
  // Según resumen_endpoints.txt:
  // Endpoint: GET /AbonosTipos/ObtenerAbonosTipos
  // Request: { "desde": null, "hasta": null, "concepto": null, "activo": true }
  static async obtenerAbonosTipos(desde: string | null = null, hasta: string | null = null, concepto: string | null = null, activo: boolean = true) {
    const url = `/AbonosTipos/ObtenerAbonosTipos`;
    const params = { desde, hasta, concepto, activo };
    return swsClient.get(url, { params });
  }
  
  static async obtenerListaDePrecios(ClienteId: number) {
    const url = `/ListaDePrecios/ObtenerListaDePreciosDeCliente`;
    const params = { ClienteId };
    return swsClient.get(url, { params });
  }
}
