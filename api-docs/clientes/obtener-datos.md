# Obtener Datos del Cliente

Obtiene información detallada de un cliente específico por su ID.

## Endpoint

```
POST /api/Clientes/ObtenerDatosCliente
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
  "data": {
    "cliente_id": 208,
    "nombre": "Juan",
    "apellido": "Pérez",
    "nombreCompleto": "Juan Pérez",
    "dniCuit": "12345678",
    "telefono": "3512345678",
    "email": "juan.perez@email.com",
    "tipoDeClienteId": 1,
    "tipoCliente": "Familia",
    "condicionIvaId": 2,
    "condicionIva": "Consumidor Final",
    "listaDePreciosId": 1,
    "domicilio": {
      "provincia": "Córdoba",
      "pais": "Argentina",
      "ciudad": "Córdoba Capital",
      "calle": "Av. Colón 1234",
      "puerta": "",
      "observaciones": "",
      "piso": "",
      "depto": "",
      "torre": "",
      "cp": "5000",
      "lote": "",
      "manzana": "",
      "latitud": "-31.4201",
      "longitud": "-64.1888"
    },
    "reparto": {
      "reparto_id": 1,
      "nombreReparto": "Zona Centro",
      "visitas": "Lunes, Miércoles, Viernes",
      "proximaVisita": "2026-01-17",
      "diasProximaVisita": 1
    },
    "saldoPendiente": 0,
    "activo": true,
    "fechaAlta": "2024-01-15",
    "observaciones": ""
  }
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| cliente_id | number | ID único del cliente |
| nombre | string | Nombre del cliente |
| apellido | string | Apellido del cliente |
| nombreCompleto | string | Nombre completo |
| dniCuit | string | DNI o CUIT |
| telefono | string | Teléfono de contacto |
| email | string | Email del cliente |
| tipoDeClienteId | number | ID del tipo de cliente |
| tipoCliente | string | Descripción del tipo de cliente |
| condicionIvaId | number | ID de la condición de IVA |
| condicionIva | string | Descripción de la condición de IVA |
| listaDePreciosId | number | ID de la lista de precios |
| domicilio | object | Información completa del domicilio |
| reparto | object | Información del reparto asignado |
| saldoPendiente | number | Saldo pendiente de pago |
| activo | boolean | Estado del cliente |
| fechaAlta | string | Fecha de alta del cliente |
| observaciones | string | Observaciones adicionales |

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Operación exitosa |
| 1 | Cliente no encontrado |
| 401 | Token inválido o expirado |

## Ver También

- [Búsqueda Rápida](busqueda-rapida.md)
- [Obtener Sucursales](obtener-sucursales.md)
