# Crear Ticket de Incidente

Permite crear un ticket de incidente o solicitud (ej. "Llamar a cliente", "Servicio Técnico") para que sea gestionado por un operador o en la ruta.

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
| cliente_id | number | ID único del cliente | Sí |
| centroDistribucion_id | number | ID del centro de distribución | Sí |
| titulo | string | Título breve del incidente | Sí |
| descripcion | string | Detalle del incidente (soporta HTML) | Sí |
| tipoIncidente_ids | number | ID del tipo de incidente (ver tablas) | Sí |
| subTipoIncidente_ids | number | ID secundario del incidente (ver tablas) | Sí |
| severidad_ids | number | Prioridad (1:Baja, 2:Media, 3:Alta) | Sí |
| `estadoIncidente_ids` | number | Estado (1:Abierto, 5:Cerrado, etc.) | No |
| `fechaCierreEstimado` | string | Fecha estimada (dd/MM/yyyy). El sistema la calcula automáticamente como **+2 días hábiles**. | No |
| `usuarioResponsable_id` | number | ID del usuario responsable. Se obtiene del logueo (`usuario_id`). | Sí |

## Ejemplo de Request (Llamar a Cliente)

```json
{
  "centroDistribucion_id": 3,
  "cliente_id": 1018,
  "titulo": "Solicitud de llamada",
  "descripcion": "<p>Cliente solicita replanificación de entrega</p>",
  "tipoIncidente_ids": 50,
  "subTipoIncidente_ids": 50,
  "severidad_ids": 2,
  "estadoIncidente_ids": 1,
  "fechaCierreEstimado": "23/07/2025",
  "usuarioResponsable_id": 12
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "incidente": {
    "id": 10190,
    "fechaHoraRegistro": "/Date(1753112501144)/",
    "cliente_id": 1018,
    "titulo": "Solicitud de llamada",
    "descripcion": "<p>Cliente solicita replanificación de entrega</p>",
    "tipoIncidente_ids": 50,
    "severidad_ids": 2,
    "estadoIncidente_ids": 1,
    "centroDistribucion_id": 3
  }
}
```

## Tablas de Clasificación

### Tipos de Incidentes (tipoIncidente_ids)
- 1: Gestión en ruta
- 8: Gestión Administrativa
- 2: Servicio Técnico
- 50: Llamadas a cliente
- 60: Gestión de alertas

### Sub-tipos por Categoría

#### 1. Gestión en ruta
- 1: Solicitud de artículos
- 2: Reclamo por no visita
- 13: Gestión cobranza
- 169: Replanificación visita

#### 2. Gestión Administrativa
- 501: Gestión de baja de cliente
- 510: Pausado de cliente
- 42: Cobranza

#### 3. Servicio Técnico
- 4: Instalación de dispenser
- 5: Quitar dispenser
- 7: Sanitización
- 9: Reparación

## Ver También

- [Obtener Servicios Técnicos](../servicios/obtener-servicios-tecnicos.md)
