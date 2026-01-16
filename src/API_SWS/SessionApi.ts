// Verifica si el token está vigente, vencido o null. Si está vencido o null, solicita uno nuevo y lo almacena.
// Recibe las credenciales para poder reloguear si es necesario.
export async function ensureValidToken(username?: string, password?: string): Promise<string | null> {
  const vencimiento = getTokenVencimiento();
  const token = getSessionToken();
  let vigente = false;
  if (token && vencimiento) {
    // El formato es 'YYYY-MM-DD HH:mm:ss'
    const venc = new Date(vencimiento.replace(' ', 'T'));
    const ahora = new Date();
    vigente = venc > ahora;
  }
  // Usar los valores estáticos si no se pasan argumentos
  const user = username || SessionApi.username;
  const pass = password || SessionApi.password;
  if (!token || !vigente) {
    // Solo solicitar nuevo token si no hay uno vigente
    const response = await SessionApi.login(user, pass);
    return getSessionToken();
  } else {
    // Si el token está vigente, no hacer login de nuevo
    return token;
  }
}
// Clase para el logueo y obtención de token
import axios from 'axios';


const BASE_URL = 'http://demo.chatbot.sistemaws.com';


let sessionToken: string | null = null;
let tokenVencimiento: string | null = null;

export function setSessionToken(token: string) {
  sessionToken = token;
}

export function setTokenVencimiento(vencimiento: string) {
  tokenVencimiento = vencimiento;
}


export function getSessionToken(): string | null {
  return sessionToken;
}

export function getTokenVencimiento(): string | null {
  return tokenVencimiento;
}

export class SessionApi {
  // Credenciales por defecto (pueden ser cambiadas en tiempo de ejecución)
  static username: string = 'admin';
  static password: string = 'demo2024';
  static async login(username: string, password: string) {
    const url = `${BASE_URL}/api/Session/GetToken`;
    const body = { username, password };
    const headers = { 'Content-Type': 'application/json' };
    const response = await axios.post(url, body, { headers });
    // Si el login es exitoso, guardar el token
    if (response.data && response.data.tokenValido) {
      setSessionToken(response.data.tokenValido);
      setTokenVencimiento(response.data.vencimiento || '');
    } else {
      setSessionToken('');
      setTokenVencimiento('');
    }
    return response;
  }
  // Permite obtener el token actual
  static getToken() {
    return getSessionToken();
  }
  // Permite setear el token manualmente
  static setToken(token: string) {
    setSessionToken(token);
  }
  // Permite obtener el vencimiento actual
  static getVencimiento() {
    return getTokenVencimiento();
  }
  // Permite setear el vencimiento manualmente
  static setVencimiento(vencimiento: string) {
    setTokenVencimiento(vencimiento);
  }
}
