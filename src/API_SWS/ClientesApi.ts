import { getMapsUbication } from '../addModule/getMapsUbication';
// Clase para métodos relacionados a clientes
import axios from 'axios';
import { getSessionToken, ensureValidToken } from './SessionApi';

const BASE_URL = 'http://demo.chatbot.sistemaws.com';

export class ClientesApi {
  /**
   * Obtener datos de un cliente por ID
   * Endpoint: GET /api/Clientes/ObtenerDatosCliente?cliente_id=ID
   */
  // Según resumen_endpoints.txt:
  // Endpoint: POST /api/Clientes/ObtenerDatosCliente
  // Request: { "cliente_id": 208 }
  static async obtenerDatosCliente(cliente_id: number) {
    await ensureValidToken();
    const token = getSessionToken() || '';
    const url = `${BASE_URL}/api/Clientes/ObtenerDatosCliente`;
    const headers = {
      'Content-Type': 'application/json',
      'CURRENTTOKENVALUE': token
    };
    const data = { cliente_id };
    return axios.post(url, data, { headers });
  }

  /**
   * Obtener sucursales de un cliente por ID
   * Endpoint: GET /api/Clientes/ObtenerSucursales?cliente_id=ID
   */
  // Según resumen_endpoints.txt:
  // Endpoint: POST /api/Clientes/ObtenerSucursalesJson
  // Request: { "cliente_id": 208 }
  static async obtenerSucursales(cliente_id: number) {
    await ensureValidToken();
    const token = getSessionToken() || '';
    const url = `${BASE_URL}/api/Clientes/ObtenerSucursalesJson`;
    const headers = {
      'Content-Type': 'application/json',
      'CURRENTTOKENVALUE': token
    };
    const data = { cliente_id };
    return axios.post(url, data, { headers });
  }
  static async busquedaRapida(params: { datosCliente?: string; telefono?: string; dni?: string; domicilio?: string }) {
    // datosCliente puede ser: nombre, nombre y apellido, dni o id de cliente
    await ensureValidToken();
    const token = getSessionToken() || '';
    console.log('Token usado en busquedaRapida:', token);
    const url = `${BASE_URL}/api/Clientes/BusquedaRapidaResultJson`;
    const headers = {
      'Content-Type': 'application/json',
      'CURRENTTOKENVALUE': token
    };
    // dni ya no se usa. datosCliente puede ser nombre, nombre y apellido, dni o id
    const body = {
      type: "BUSCAR_CLIENTE",
      datosCliente: params.datosCliente ?? "",
      telefono: params.telefono ?? "",
      domicilio: params.domicilio ?? ""
    };
    return axios.post(url, body, { headers });
  }

  static async crearNuevoCliente(payload: { cliente: any, reparto_id: number }) {
    // Transformar domicilio si es string
    let domicilio = payload.cliente.domicilio;
    if (typeof domicilio === 'string') {
      domicilio = parseDomicilioString(domicilio);
    } else if (!domicilio || typeof domicilio !== 'object') {
      domicilio = parseDomicilioString('');
    }

    // Obtener coordenadas usando los datos reales del domicilio
    try {
      // Concatenar calle y puerta para la geolocalización correcta
      const calleYAltura = `${domicilio.calle ?? ''} ${domicilio.puerta ?? ''}`.trim();

      const ubicacion = await getMapsUbication(
        calleYAltura,
        domicilio.cp ?? '',
        domicilio.ciudad ?? '',
        domicilio.provincia ?? '',
        domicilio.pais ?? ''
      );
      domicilio.latitud = (ubicacion && ubicacion.lat != null) ? String(ubicacion.lat) : '';
      domicilio.longitud = (ubicacion && ubicacion.lng != null) ? String(ubicacion.lng) : '';
      console.log('[CrearCliente] Domicilio parseado:', domicilio);
      console.log('[CrearCliente] Coordenadas obtenidas:', { latitud: domicilio.latitud, longitud: domicilio.longitud });
    } catch (e) {
      console.warn('No se pudo obtener geolocalización:', e);
      domicilio.latitud = '';
      domicilio.longitud = '';
      console.log('[CrearCliente] Domicilio parseado (sin coordenadas):', domicilio);
    }

    await ensureValidToken();
    const token = getSessionToken() || '';
    console.log('Token usado en crearNuevoCliente:', token);
    const url = `${BASE_URL}/Clientes/CrearNuevoClientePorChatBot`;
    const headers = {
      'Content-Type': 'application/json',
      'CURRENTTOKENVALUE': token
    };

    // Mapear campos del asistente al formato esperado por la API
    // tipoCliente: 'Familia' => tipoDeClienteId (ejemplo: 1 = Familia, 2 = Empresa, etc.)
    let tipoDeClienteId = 1;
    if (payload.cliente.tipoCliente) {
      const tipo = String(payload.cliente.tipoCliente).toLowerCase();
      if (tipo === 'familia') tipoDeClienteId = 1;
      else if (tipo === 'empresa') tipoDeClienteId = 2;
      // Agregar más tipos si es necesario
    }
    const cliente = {
      nombre: payload.cliente.nombre ?? '',
      apellido: payload.cliente.apellido ?? '',
      tipoDeClienteId,
      condicionIvaId: payload.cliente.condicionIvaId ?? 2,
      dniCuit: payload.cliente.dni ?? '',
      telefono: payload.cliente.telefono ?? '',
      email: payload.cliente.email ?? '',
      listaDePreciosId: payload.cliente.listaDePreciosId ?? 1,
      domicilio
    };
    return axios.post(url, { cliente, reparto_id: payload.reparto_id }, { headers });
  }

  static async agregarContacto(modeloContacto: any) {
    await ensureValidToken();
    const token = getSessionToken() || '';
    console.log('Token usado en agregarContacto:', token);
    const url = `${BASE_URL}/api/Clientes/CreateContacto`;
    const headers = {
      'Content-Type': 'application/json',
      'CURRENTTOKENVALUE': token
    };
    return axios.post(url, { ModeloContacto: modeloContacto }, { headers });
  }

  static async obtenerCredencialesAutogestion(id: number) {
    await ensureValidToken();
    const token = getSessionToken() || '';
    const url = `${BASE_URL}/api/Usuarios/ObtenerUsuarioById`;
    const headers = {
      'Content-Type': 'application/json',
      'CURRENTTOKENVALUE': token
    };
    // Enviar el campo correcto 'id' en el body
    return axios.post(url, { id }, { headers });
  }
}

// Transforma un string de domicilio en un objeto compatible con el backend
function parseDomicilioString(domicilioStr: string) {
  // Ejemplo esperado: '25 de mayo 1560, Centro, Córdoba Capital'
  let calle = '';
  let puerta = '';
  let ciudad = '';
  let provincia = 'Cordoba';
  let pais = 'Argentina';
  let observaciones = '';
  const cp = '';
  // Regex para detectar formato "Calle Altura Resto" (ej: Colon 1540 Centro Cordoba)
  // Busca: Texto (calle) + Espacio + Número (altura) + Espacio opcional + Texto (resto)
  const regexDireccion = /^(.+?)\s+(\d+)(?:\s+(.*))?$/;

  if (domicilioStr && domicilioStr.includes(',')) {
    const partes = domicilioStr.split(',').map(p => p.trim());
    // Calle y número
    // Intentar separar número si está pegado en la primera parte
    const parte1 = partes[0] || '';
    const match1 = parte1.match(regexDireccion);
    if (match1) {
      calle = match1[1].trim();
      puerta = match1[2].trim();
    } else {
      calle = parte1;
    }

    // Ciudad/localidad
    ciudad = partes.length > 1 ? partes[1] : '';
    // Provincia y país (ej: 'Córdoba Capital')
    if (partes.length > 2) {
      // Si contiene 'Capital', es ciudad, si no, provincia
      if (/capital/i.test(partes[2])) {
        provincia = 'Cordoba';
        // Si no habíamos seteado ciudad o era redundante, ajustamos
        if (!ciudad) ciudad = partes[2];
      } else {
        provincia = partes[2];
      }
    }
  } else {
    // Caso sin comas: intentar parsear "Calle Altura Resto"
    const match = domicilioStr.match(regexDireccion);
    if (match) {
      calle = match[1].trim();
      puerta = match[2].trim();
      const resto = match[3] ? match[3].trim() : '';

      // Heurística simple para el resto:
      // Si menciona Cordoba o Capital, asumirlo como ciudad
      if (/cordoba|capital/i.test(resto)) {
        ciudad = resto;
      } else {
        // Si no parece ciudad, lo ponemos en observaciones o barrio si existiera campo
        observaciones = resto;
        // Default ciudad si no se detectó
        if (!ciudad) ciudad = 'Cordoba Capital';
      }
    } else {
      // Fallback: todo a calle si no se detecta número
      calle = domicilioStr;
    }
  }
  // Si el string contiene país explícito
  if (/argentina/i.test(domicilioStr)) {
    pais = 'Argentina';
  }

  return {
    provincia,
    pais,
    ciudad,
    calle,
    puerta,
    observaciones,
    piso: '',
    depto: '',
    torre: '',
    cp,
    lote: '',
    manzana: '',
    latitud: '',
    longitud: ''
  };
}
