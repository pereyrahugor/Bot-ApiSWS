// Métodos para endpoints de administración y archivos
import axios from 'axios';
import { getSessionToken, ensureValidToken } from './SessionApi';

const BASE_URL = 'http://demo.chatbot.sistemaws.com';

export class AdministracionApi {

  /**
   * Obtener servicios técnicos del cliente
   * Endpoint: POST /UsuariosClientes/ObtenerServiciosTecnicos
   * @param clienteId ID del cliente
   * @param desde Fecha de inicio (formato DD/MM/YYYY)
   * @param hasta Fecha de fin (formato DD/MM/YYYY, opcional, default: hoy)
   */
  static async obtenerServiciosTecnicosCliente(clienteId: number, desde: string, hasta?: string) {
    await ensureValidToken();
    const url = `${BASE_URL}/UsuariosClientes/ObtenerServiciosTecnicos`;
    const headers = { 'CURRENTTOKENVALUE': getSessionToken() || '' };
    const _hasta = hasta || new Date().toLocaleDateString('es-AR');
    const params = { clienteId, desde, hasta: _hasta };
    return axios.get(url, { headers, params });
  }
  /**
   * Descarga de remitos de entrega por venta
   * Endpoint: GET /VentasEntregas/ObtenerRemitoPorVenta
   */
  static async descargarRemitoPorVenta(idVenta: number) {
    await ensureValidToken();
    const url = `${BASE_URL}/VentasEntregas/ObtenerRemitoPorVenta`;
    const headers = { 'CURRENTTOKENVALUE': getSessionToken() || '' };
    const params = { idVenta };
    return axios.get(url, { headers, params, responseType: 'blob' });
  }
  /**
   * Historial de facturas del cliente por fecha
   * Endpoint: GET /Facturacion/HistorialFacturasCliente
   */
  // Según resumen_endpoints.txt:
  // Endpoint: POST /Facturacion/ObtenerHistorialDeFacturas
  // Request: { "cliente_id":8, "fechaDesde":"05/12/2022", "fechaHasta":"26/09/2025", "saldoPendiente": false }
  static async historialFacturasCliente(cliente_id: number, fechaDesde: string, fechaHasta: string, saldoPendiente: boolean = false) {
  await ensureValidToken();
  const url = `${BASE_URL}/Facturacion/ObtenerHistorialDeFacturas`;
  const headers = { 'CURRENTTOKENVALUE': getSessionToken() || '', 'Content-Type': 'application/json' };
  // Si no se provee fechaHasta, usar la fecha actual en formato dd/MM/yyyy
  const _fechaHasta = fechaHasta || new Date().toLocaleDateString('es-AR');
  const data = { cliente_id, fechaDesde, fechaHasta: _fechaHasta, saldoPendiente };
  return axios.post(url, data, { headers });
  }

  /**
   * Recibos de pago de un cliente
   * Endpoint: GET /Facturacion/RecibosPagoCliente
   */
  // Según resumen_endpoints.txt:
  // Endpoint: POST /Recibos/ObtenerRecibosDeCobros
  // Request: { "clienteId":8, "fechaReciboDesde":"07/04/2025", "fechaReciboHasta":"26/09/2025", "saldoDisponible": false }
  static async recibosPagoCliente(clienteId: number, fechaReciboDesde: string, fechaReciboHasta: string, saldoDisponible: boolean = false) {
  await ensureValidToken();
  const url = `${BASE_URL}/Recibos/ObtenerRecibosDeCobros`;
  const headers = { 'CURRENTTOKENVALUE': getSessionToken() || '', 'Content-Type': 'application/json' };
  // Si no se provee fechaReciboHasta, usar la fecha actual en formato dd/MM/yyyy
  const _fechaReciboHasta = fechaReciboHasta || new Date().toLocaleDateString('es-AR');
  const data = { clienteId, fechaReciboDesde, fechaReciboHasta: _fechaReciboHasta, saldoDisponible };
  return axios.post(url, data, { headers });
  }

  /**
   * Resumen de cuenta cliente de consumos por rango de fecha
   * Endpoint: GET /Facturacion/ResumenCuentaCliente
   */
  // Según resumen_endpoints.txt:
  // Endpoint: POST /Movimientos/BuscarMovimientos
  // Request: { "clienteId":8, "desde":"07/04/2025", "hasta":"26/09/2025" }
  static async resumenCuentaCliente(clienteId: number, desde: string, hasta: string) {
  await ensureValidToken();
  const url = `${BASE_URL}/Movimientos/BuscarMovimientos`;
  const headers = { 'CURRENTTOKENVALUE': getSessionToken() || '', 'Content-Type': 'application/json' };
  // Si no se provee hasta, usar la fecha actual en formato dd/MM/yyyy
  const _hasta = hasta || new Date().toLocaleDateString('es-AR');
  const data = { clienteId, desde, hasta: _hasta };
  return axios.post(url, data, { headers });
  }


  /**
   * Remitos de entrega
   * Endpoint: GET /Remitos/Entrega
   */
  // Según documentación: Remitos de entrega
  // Endpoint: POST /Movimientos/ObtenerVentasPorCliente
  static async remitosEntrega(cliente_id: number, fechaDesde: string, fechaHasta: string, consumosSinFacturar: boolean = false) {
  await ensureValidToken();
  const url = `${BASE_URL}/Movimientos/ObtenerVentasPorCliente`;
  const headers = { 'CURRENTTOKENVALUE': getSessionToken() || '', 'Content-Type': 'application/json' };
  // Si no se provee fechaHasta, usar la fecha actual en formato dd/MM/yyyy
  const _fechaHasta = fechaHasta || new Date().toLocaleDateString('es-AR');
  const data = { cliente_id, fechaDesde, fechaHasta: _fechaHasta, consumosSinFacturar };
  return axios.post(url, data, { headers });
  }

  /**
   * Descarga de remitos de entrega
   * Endpoint: GET /Remitos/Descargar
   */
  static async descargarRemito(remito_id: number) {
    await ensureValidToken();
    const url = `${BASE_URL}/Remitos/Descargar`;
    const headers = { 'CURRENTTOKENVALUE': getSessionToken() || '' };
    const params = { remito_id };
    return axios.get(url, { headers, params, responseType: 'blob' });
  }

  /**
   * Descarga de archivos
   * Endpoint: GET /Archivos/Descargar
   */
  static async descargarArchivo(archivo_id: number) {
    await ensureValidToken();
    const url = `${BASE_URL}/Archivos/Descargar`;
    const headers = { 'CURRENTTOKENVALUE': getSessionToken() || '' };
    const params = { archivo_id };
    return axios.get(url, { headers, params, responseType: 'blob' });
  }

  static async reenviarFacturaPorMail(facturaId: number) {
    await ensureValidToken();
    const url = `${BASE_URL}/Facturacion/EnviarFacturaPorMail`;
    const headers = { 'CURRENTTOKENVALUE': getSessionToken() || '', 'Content-Type': 'application/json' };
    const data = { facturaId };
    return axios.post(url, data, { headers });
  }

  /**
   * Reenvío de remito por mail
   * Endpoint: POST /Facturacion/EnviarRemitoPorMail
   * @param remitoId ID del remito a reenviar
   */
  static async reenviarRemitoPorMail(remitoId: number) {
    await ensureValidToken();
    const url = `${BASE_URL}/Facturacion/EnviarRemitoPorMail`;
    const headers = { 'CURRENTTOKENVALUE': getSessionToken() || '', 'Content-Type': 'application/json' };
    const data = { remitoId };
    return axios.post(url, data, { headers });
  }

  /**
   * Reenvío de recibo por mail
   * Endpoint: POST /Recibos/EnviarPorMail
   * @param reciboId ID del recibo a reenviar
   */
  static async reenviarReciboPorMail(reciboId: number) {
    await ensureValidToken();
    const url = `${BASE_URL}/Recibos/EnviarPorMail`;
    const headers = { 'CURRENTTOKENVALUE': getSessionToken() || '', 'Content-Type': 'application/json' };
    const data = { reciboId };
    return axios.post(url, data, { headers });
  }
}
