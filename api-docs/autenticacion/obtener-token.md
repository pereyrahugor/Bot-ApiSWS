# Obtener Token de Sesión

Endpoint para autenticarse y obtener un token de sesión válido.

## Endpoint

```
POST /api/Session/GetToken
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| username | string | Nombre de usuario | Sí |
| password | string | Contraseña | Sí |

## Ejemplo de Request

```json
{
  "username": "admin",
  "password": "demo2024"
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "tokenValido": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "vencimiento": "2026-01-16 23:59:59",
  "usuario": {
    "id": 1,
    "username": "admin",
    "nombre": "Administrador"
  }
}
```

## Ejemplo de Respuesta con Error

```json
{
  "error": 1,
  "message": "Credenciales inválidas"
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| tokenValido | string | Token JWT para usar en requests subsecuentes |
| vencimiento | string | Fecha y hora de vencimiento del token (formato: YYYY-MM-DD HH:mm:ss) |
| usuario | object | Información del usuario autenticado |

## Notas

- El token tiene una duración limitada (ver campo `vencimiento`)
- Debe renovarse antes de su vencimiento
- Almacenar el token de forma segura
- No compartir el token entre diferentes aplicaciones

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 1 | Credenciales inválidas |
| 2 | Usuario bloqueado |
| 3 | Error del servidor |

## Ejemplo de Uso (JavaScript)

```javascript
const response = await fetch('http://demo.chatbot.sistemaws.com/api/Session/GetToken', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'demo2024'
  })
});

const data = await response.json();
const token = data.tokenValido;
```

## Ver También

- [Uso del Token](uso-del-token.md)
- [Códigos de Error](../referencia/codigos-error.md)
