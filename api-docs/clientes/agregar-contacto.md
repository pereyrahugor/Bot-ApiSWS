# Agregar Contacto

Agrega un nuevo contacto a un cliente existente.

## Endpoint

```
POST /api/Clientes/CreateContacto
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| ModeloContacto | object | Objeto con datos del contacto | Sí |

### Estructura del objeto `ModeloContacto`

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| cliente_id | number | ID del cliente | Sí |
| nombre | string | Nombre del contacto | Sí |
| apellido | string | Apellido del contacto | Sí |
| telefono | string | Teléfono | Sí |
| email | string | Email | No |
| cargo | string | Cargo en la empresa | No |
| principal | boolean | Es contacto principal | No |

## Ejemplo de Request

```json
{
  "ModeloContacto": {
    "cliente_id": 208,
    "nombre": "María",
    "apellido": "González",
    "telefono": "3512345679",
    "email": "maria.gonzalez@empresa.com",
    "cargo": "Gerente de Compras",
    "principal": true
  }
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "contacto_id": 45,
  "message": "Contacto agregado exitosamente"
}
```

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Contacto agregado exitosamente |
| 1 | Error al agregar contacto |
| 2 | Cliente no encontrado |
| 401 | Token inválido o expirado |

## Ver También

- [Obtener Datos del Cliente](obtener-datos.md)
- [Obtener Sucursales](obtener-sucursales.md)
