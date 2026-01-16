# Obtener Servicios Técnicos

Obtiene una lista de los servicios técnicos (ordenes de trabajo) de un cliente en un rango de fechas determinado.

## Endpoint

```
GET /UsuariosClientes/ObtenerServiciosTecnicos
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros de la Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| clienteId | number | ID del cliente a consultar | Sí |
| desde | string | Fecha de inicio (dd/MM/yyyy) | Sí |
| hasta | string | Fecha de fin (dd/MM/yyyy) | Sí |

## Ejemplo de Request

```
GET /UsuariosClientes/ObtenerServiciosTecnicos?clienteId=8&desde=07/02/2025&hasta=26/09/2025
```

## Ejemplo de Respuesta Exitosa

```json
{
  "serviciosTecnicos": {
    "items": [
      {
        "id": 10022,
        "clienteUbicacion": "Correo Argentino",
        "clienteIdUbicacion": 8,
        "fechaPlanificada": "/Date(1743130800000)/",
        "fechaReal": "/Date(1743706682687)/",
        "creado": "/Date(1743706529567)/",
        "estadoIds": 4,
        "estado": "Cerrado",
        "nroComprobante": "(D) 10022",
        "repartoId": 2,
        "reparto": "1234",
        "archivoComprobante": "comprobante_st_8_10022.pdf",
        "sintoma": "Sanitización"
      },
      {
        "id": 10019,
        "clienteUbicacion": "Correo Argentino",
        "clienteIdUbicacion": 8,
        "fechaPlanificada": "/Date(1743044400000)/",
        "fechaReal": null,
        "creado": "/Date(1743704804467)/",
        "estadoIds": 3,
        "estado": "Cancelado",
        "nroComprobante": "(D) 10019",
        "repartoId": 2,
        "reparto": "1234",
        "archivoComprobante": null,
        "sintoma": "Sanitización"
      }
    ]
  },
  "error": 0
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| error | number | 0 para éxito, 1 para error |
| serviciosTecnicos | object | Contenedor de items de servicio |

### Campos de Item de Servicio

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | number | ID único de la orden de servicio |
| clienteUbicacion | string | Nombre del cliente donde se realiza el servicio |
| fechaPlanificada | string | Fecha programada (/Date(timestamp)/) |
| fechaReal | string | Fecha efectiva de realización |
| estado | string | Estado actual (Abierto, Cerrado, Cancelado, etc.) |
| nroComprobante | string | Número de comprobante de la orden |
| sintoma | string | Motivo o descripción del servicio (ej. Sanitización) |
| archivoComprobante | string | Nombre del archivo PDF (si está disponible) |

## Ver También

- [Crear Ticket de Incidente](../incidentes/crear-ticket.md)
