# Obtener Servicios Técnicos

Obtiene los servicios técnicos realizados a un cliente.

## Endpoint

```
GET /UsuariosClientes/ObtenerServiciosTecnicos
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| clienteId | number | ID del cliente | Sí |
| desde | string | Fecha desde (DD/MM/YYYY) | Sí |
| hasta | string | Fecha hasta (DD/MM/YYYY) | No |

## Ejemplo de Request

```
GET /UsuariosClientes/ObtenerServiciosTecnicos?clienteId=208&desde=01/01/2026&hasta=31/01/2026
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "data": [
    {
      "servicio_id": 100,
      "fecha": "15/01/2026",
      "tecnico": "Carlos Gómez",
      "descripcion": "Mantenimiento de dispenser",
      "estado": "Completado"
    }
  ]
}
```
