# Obtener Sucursales del Cliente

Obtiene la lista de sucursales de un cliente.

## Endpoint

```
POST /api/Clientes/ObtenerSucursalesJson
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| cliente_id | number | ID del cliente | Sí |

## Ejemplo de Request

```json
{
  "cliente_id": 208
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "data": [
    {
      "sucursal_id": 1,
      "nombre": "Sucursal Centro",
      "domicilio": {
        "calle": "Av. Colón 1234",
        "ciudad": "Córdoba",
        "provincia": "Córdoba",
        "cp": "5000",
        "latitud": "-31.4201",
        "longitud": "-64.1888"
      },
      "telefono": "3512345678",
      "email": "centro@empresa.com",
      "contacto": "María González",
      "activo": true
    },
    {
      "sucursal_id": 2,
      "nombre": "Sucursal Norte",
      "domicilio": {
        "calle": "Av. Circunvalación 5000",
        "ciudad": "Córdoba",
        "provincia": "Córdoba",
        "cp": "5001",
        "latitud": "-31.3850",
        "longitud": "-64.1820"
      },
      "telefono": "3512345679",
      "email": "norte@empresa.com",
      "contacto": "Carlos Martínez",
      "activo": true
    }
  ]
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| sucursal_id | number | ID único de la sucursal |
| nombre | string | Nombre de la sucursal |
| domicilio | object | Información del domicilio |
| telefono | string | Teléfono de contacto |
| email | string | Email de la sucursal |
| contacto | string | Nombre del contacto principal |
| activo | boolean | Estado de la sucursal |

## Ver También

- [Obtener Datos del Cliente](obtener-datos.md)
- [Agregar Contacto](agregar-contacto.md)
