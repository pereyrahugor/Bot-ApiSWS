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
    console.log(`[SessionApi] Token ${!token ? 'ausente' : 'vencido'}. Solicitando uno nuevo para el usuario: ${user}`);
    try {
      const response = await SessionApi.login(user, pass);
      const newToken = getSessionToken();
      console.log(`[SessionApi] Resultado del login: ${newToken ? 'ÉXITO' : 'FALLO'}`);
      return newToken;
    } catch (err: any) {
      console.error(`[SessionApi] Error crítico en login:`, err.message);
      return null;
    }
  } else {
    // Si el token está vigente, no hacer login de nuevo
    return token;
  }
}
// Clase para el logueo y obtención de token
import axios from 'axios';


const BASE_URL = process.env.SWS_BASE_URL;


let sessionToken: string | null = null;
let tokenVencimiento: string | null = null;
let usuarioId: number | null = null;

export function setSessionToken(token: string) {
  sessionToken = token;
}

export function setTokenVencimiento(vencimiento: string) {
  tokenVencimiento = vencimiento;
}

export function setUsuarioId(id: number) {
  usuarioId = id;
}

export function getSessionToken(): string | null {
  return sessionToken;
}

export function getTokenVencimiento(): string | null {
  return tokenVencimiento;
}

export function getUsuarioId(): number | null {
  return usuarioId;
}

export class SessionApi {
  // Credenciales por defecto (pueden ser cambiadas en tiempo de ejecución)
  static username: string = process.env.SWS_USERNAME;
  static password: string = process.env.SWS_PASSWORD;
  static async login(username: string, password: string) {
    const url = `${BASE_URL}/api/Session/GetToken`;
    const body = { username, password };
    const headers = { 'Content-Type': 'application/json' };
    
    console.log(`[SessionApi] Intentando login en: ${url}`);
    
    try {
      const response = await axios.post(url, body, { headers });
      
      // Si el login es exitoso, guardar el token y el id de usuario
      if (response.data && response.data.tokenValido) {
        setSessionToken(response.data.tokenValido);
        setTokenVencimiento(response.data.vencimiento || '');
        setUsuarioId(response.data.usuario_id || 0);
        console.log(`[SessionApi] Login exitoso. Token obtenido (últimos 5): ${response.data.tokenValido.slice(-5)}`);
      } else {
        console.warn(`[SessionApi] Login falló. Respuesta de la API:`, response.data);
        setSessionToken('');
        setTokenVencimiento('');
        setUsuarioId(0);
      }
      return response;
    } catch (e: any) {
      console.error(`[SessionApi] Error al realizar el POST de login:`, e.response?.data || e.message);
      throw e;
    }
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
