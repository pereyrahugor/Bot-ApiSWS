# Uso del Token

Una vez obtenido el token de sesión, debe incluirse en todas las peticiones a la API.

## Header Requerido

Todas las peticiones autenticadas deben incluir el siguiente header:

```
CURRENTTOKENVALUE: <tu_token_aqui>
```

## Ejemplo de Request Completo

```javascript
const response = await fetch('http://demo.chatbot.sistemaws.com/api/Clientes/ObtenerDatosCliente', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CURRENTTOKENVALUE': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  body: JSON.stringify({
    cliente_id: 208
  })
});
```

## Validación del Token

### Token Válido
Si el token es válido, la API procesará la petición normalmente.

### Token Inválido o Expirado
Si el token es inválido o ha expirado, recibirás una respuesta de error:

```json
{
  "error": 401,
  "message": "Token inválido o expirado"
}
```

## Renovación del Token

Cuando el token esté próximo a vencer:

1. Verificar el campo `vencimiento` del token actual
2. Si está próximo a vencer, solicitar un nuevo token
3. Actualizar el token en tu aplicación

### Ejemplo de Verificación de Vencimiento

```javascript
function isTokenExpiringSoon(vencimiento) {
  const expirationDate = new Date(vencimiento.replace(' ', 'T'));
  const now = new Date();
  const timeUntilExpiration = expirationDate - now;
  const fiveMinutes = 5 * 60 * 1000;
  
  return timeUntilExpiration < fiveMinutes;
}

// Uso
if (isTokenExpiringSoon(tokenVencimiento)) {
  // Renovar token
  const newToken = await obtenerNuevoToken();
}
```

## Buenas Prácticas

### ✅ Hacer

- Almacenar el token de forma segura
- Verificar la fecha de vencimiento antes de cada request
- Renovar el token proactivamente antes de que expire
- Manejar errores 401 renovando el token automáticamente

### ❌ No Hacer

- No almacenar el token en texto plano en el código
- No compartir el mismo token entre múltiples aplicaciones
- No ignorar los errores de autenticación
- No hacer requests sin verificar la validez del token

## Manejo de Errores de Autenticación

```javascript
async function makeAuthenticatedRequest(url, data) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CURRENTTOKENVALUE': getCurrentToken()
      },
      body: JSON.stringify(data)
    });
    
    if (response.status === 401) {
      // Token expirado, renovar
      await renewToken();
      // Reintentar request
      return makeAuthenticatedRequest(url, data);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en request autenticado:', error);
    throw error;
  }
}
```

## Ver También

- [Obtener Token](obtener-token.md)
- [Códigos de Error](../referencia/codigos-error.md)
