# Clientes Cercanos por Dirección

Busca clientes cercanos a una dirección específica.

## Endpoint

```
GET /Repartos/BusquedaClientesCercanosResultJson
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| address | string | Dirección completa | Sí |
| metros | number | Radio de búsqueda en metros | Sí |

## Ejemplo de Request

```
GET /Repartos/BusquedaClientesCercanosResultJson?address=Av.%20Colón%201234,%20Córdoba&metros=500
```

## Ejemplo de Respuesta Exitosa

```json
{
  "data": [
    {
      "cliente_id": 802,
      "nombreCliente": "Granja Velicceli (Cristina Alibue)",
      "nombreReparto": "1234",
      "zona": "Sin especificar",
      "latitud": -31.4148491,
      "longitud": -64.1792179,
      "domicilioCompleto": "Córdoba, MENDOZA 237.",
      "distanciaMetros": 270.60,
      "visitas": [
        {
          "cliente_id": 802,
          "dia_ids": 2,
          "orden": 3.00,
          "nombreCliente": "Granja Velicceli (Cristina Alibue)",
          "domicilioCompleto": "Córdoba, MENDOZA 237.",
          "reparto_id": 2,
          "nombreReparto": "1234",
          "tipoCliente": "Familia",
          "estadoCliente": "Activo",
          "dia": "Martes",
          "altitud": "-31.4148491",
          "longitud": "-64.1792179",
          "semana": 1,
          "semanaMensual": 0,
          "color": null,
          "haCambiado": 0,
          "ultimasVisitas": {
            "cliente_id": 802,
            "diaSemana": "Martes",
            "diaId": 2,
            "horarioMin": "15:45",
            "horarioMax": "15:45",
            "horarioProm": "15:45",
            "cantidadVisitas": 1,
            "ultimaVisita": "/Date(1750790700000)/",
            "horarioMaxSeg": 56700,
            "horarioMinSeg": 56700,
            "horarioPromSeg": 56700,
            "ultimaVisitaString": "24/06/2025 15:45"
          }
        }
      ],
      "proximaVisita": "/Date(1755561600000)/",
      "diasProximaVisita": 8
    }
  ],
  "error": 0,
  "message": "",
  "coordenadas": {
    "Latitud": -31.4126304,
    "Longitud": -64.1780465
  }
}
```

## Notas

- El sistema convierte automáticamente la dirección a coordenadas
- Radio inicial: 500 metros
- Si no se encuentran resultados, el radio se incrementa automáticamente de 250m en 250m hasta un máximo de 2500m
- La dirección debe incluir calle, número y ciudad

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Operación exitosa |
| 1 | No se pudo geocodificar la dirección |
| 2 | No se encontraron clientes cercanos |
| 401 | Token inválido o expirado |

## Ver También

- [Clientes Cercanos por Coordenadas](clientes-cercanos-coordenadas.md)
