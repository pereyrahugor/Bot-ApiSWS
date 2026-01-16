# Credenciales de Autogestión

Recupera el nombre de usuario y la contraseña de un cliente para el acceso al portal de autogestión.

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
| id | number | ID único del cliente | Sí |

## Ejemplo de Request

```json
{
  "id": 14854
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "userName": "hugo.pereyra",
  "password": "hashed_or_plain_password",
  "message": "Operación exitosa"
}
```

> **Nota**: Este endpoint es útil para recuperar credenciales en situaciones de soporte o cuando el cliente olvida sus datos de acceso.

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Operación exitosa |
| 1 | Error - Cliente no encontrado |

## Ver También

- [Obtener Datos del Cliente](obtener-datos.md)
