# Clientes Cercanos por Coordenadas

Busca clientes cercanos a una coordenada geográfica específica.

## Endpoint

```
GET /Repartos/ObtenerClientesCercanosP orCoordenadas
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| latitud | string | Latitud de la ubicación | Sí |
| longitud | string | Longitud de la ubicación | Sí |
| radioMetros | number | Radio de búsqueda en metros | Sí |
| excluir | boolean | Excluir clientes inactivos | No |

## Ejemplo de Request

```
GET /Repartos/ObtenerClientesCercanosP orCoordenadas?latitud=-31.4201&longitud=-64.1888&radioMetros=500&excluir=false
```

## Ejemplo de Respuesta Exitosa

```json
{
  "clientesCercanos": [
    {
      "cliente_id": 1017,
      "nombreCliente": "Julieta Pillado",
      "nombreReparto": "1234",
      "zona": "Sin especificar",
      "latitud": -31.3441697,
      "longitud": -64.254893299999992,
      "domicilioCompleto": "Córdoba, PADRE FRANCISCO PALAU 6575. torre 0. piso 0. depto 3. ",
      "distanciaMetros": 86.18,
      "visitas": [
        {
          "cliente_id": 1017,
          "dia_ids": 5,
          "orden": 0.00,
          "nombreCliente": "Julieta Pillado",
          "domicilioCompleto": "Córdoba, PADRE FRANCISCO PALAU 6575. torre 0. piso 0. depto 3. ",
          "reparto_id": 2,
          "nombreReparto": "1234",
          "tipoCliente": "Empresa",
          "estadoCliente": "Activo",
          "dia": "Viernes",
          "altitud": "-31.3441697",
          "longitud": "-64.25489329999999",
          "semana": 1,
          "semanaMensual": 1,
          "color": null,
          "haCambiado": 0,
          "ultimasVisitas": null
        }
      ],
      "proximaVisita": "/Date(1753401600000)/",
      "diasProximaVisita": 3
    }
  ],
  "error": 0
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| cliente_id | number | ID del cliente |
| nombreCliente | string | Nombre completo del cliente |
| nombreReparto | string | Nombre del reparto asignado |
| zona | string | Zona del reparto |
| latitud | number | Latitud del cliente |
| longitud | number | Longitud del cliente |
| domicilioCompleto | string | Dirección completa del cliente |
| distanciaMetros | number | Distancia en metros desde el punto de referencia |
| visitas | array | Array de objetos con información de visitas programadas |
| proximaVisita | string | Fecha de próxima visita (formato /Date(timestamp)/) |
| diasProximaVisita | number | Días hasta la próxima visita |

### Campos del objeto visitas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| cliente_id | number | ID del cliente |
| dia_ids | number | ID del día de la semana |
| orden | number | Orden de visita |
| nombreCliente | string | Nombre del cliente |
| domicilioCompleto | string | Dirección completa |
| reparto_id | number | ID del reparto |
| nombreReparto | string | Nombre del reparto |
| tipoCliente | string | Tipo de cliente (Familia/Empresa) |
| estadoCliente | string | Estado del cliente |
| dia | string | Nombre del día de la semana |
| altitud | string | Latitud (como string) |
| longitud | string | Longitud (como string) |
| semana | number | Número de semana |
| semanaMensual | number | Semana del mes |
| color | string | Color asignado (puede ser null) |
| haCambiado | number | Indicador de cambios |
| ultimasVisitas | object | Información de últimas visitas (puede ser null) |

## Notas

- Los resultados se ordenan por distancia (más cercanos primero)
- Radio inicial recomendado: 500 metros
- Radio máximo recomendado: 2500 metros
- Si no hay resultados, considerar aumentar el radio de búsqueda de 250m en 250m
- Cuando se usa desde el bot, el radio se incrementa automáticamente de 250m en 250m hasta 2500m si no hay resultados

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Operación exitosa |
| 1 | Error en la búsqueda |
| 401 | Token inválido o expirado |

## Ver También

- [Clientes Cercanos por Dirección](clientes-cercanos-direccion.md)
- [Clientes Cercanos a Cliente](clientes-cercanos-cliente.md)
