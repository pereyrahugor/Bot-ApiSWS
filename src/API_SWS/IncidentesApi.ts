// Clase para la generación de tickets/incidentes
import axios from 'axios';
import { getSessionToken, ensureValidToken } from './SessionApi';

const BASE_URL = 'http://demo.chatbot.sistemaws.com';

export class IncidentesApi {
  static async crearTicket(params: any) {
    await ensureValidToken();
    const url = `${BASE_URL}/api/Incidentes/Save`;
    const headers = {
      'Content-Type': 'application/json',
      'CURRENTTOKENVALUE': getSessionToken() || ''
    };
    return axios.post(url, params, { headers });
  }
}
