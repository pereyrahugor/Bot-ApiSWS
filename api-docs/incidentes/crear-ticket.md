# Crear Ticket de Incidente

Crea un nuevo ticket de incidente o reclamo.

## Endpoint

```
POST /api/Incidentes/Save
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
| descripcion | string | Descripción del incidente | Sí |
| prioridad | string | Alta, Media, Baja | No |
| centroDistribucion_id | number | ID del centro (default: 1) | No |

## Ejemplo de Request

```json
{
  "cliente_id": 208,
  "descripcion": "Bidón con pérdida de agua",
  "prioridad": "Alta",
  "centroDistribucion_id": 1
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "incidente": {
    "id": 150,
    "numero": "INC-2026-00150",
    "estado": "Abierto",
    "fechaCreacion": "2026-01-16 01:00:00"
  },
  "message": "Incidente registrado exitosamente"
}
```
