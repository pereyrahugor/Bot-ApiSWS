# Credenciales de Autogestión

Obtiene las credenciales de acceso al portal de autogestión de un cliente.

## Endpoint

```
POST /api/Usuarios/ObtenerUsuarioById
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| id | number | ID del cliente | Sí |

## Ejemplo de Request

```json
{
  "id": 208
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "data": {
    "usuario_id": 150,
    "username": "juanperez",
    "email": "juan.perez@email.com",
    "activo": true,
    "fechaCreacion": "2024-01-15",
    "ultimoAcceso": "2026-01-15 10:30:00",
    "cliente_id": 208
  }
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| usuario_id | number | ID del usuario |
| username | string | Nombre de usuario para login |
| email | string | Email del usuario |
| activo | boolean | Estado del usuario |
| fechaCreacion | string | Fecha de creación del usuario |
| ultimoAcceso | string | Fecha y hora del último acceso |
| cliente_id | number | ID del cliente asociado |

## Notas

- Las credenciales se generan automáticamente al crear el cliente
- El username se genera basado en el nombre del cliente
- La contraseña inicial se envía por email al cliente

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Operación exitosa |
| 1 | Usuario no encontrado |
| 2 | Cliente sin usuario de autogestión |
| 401 | Token inválido o expirado |

## Ver También

- [Obtener Datos del Cliente](obtener-datos.md)
