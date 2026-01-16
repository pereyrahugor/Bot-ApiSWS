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
  "error": 0,
  "clientesCercanos": [
    {
      "cliente_id": 208,
      "nombreCompleto": "Juan Pérez",
      "domicilio": "Av. Colón 1234",
      "telefono": "3512345678",
      "distanciaMetros": 150,
      "latitud": "-31.4201",
      "longitud": "-64.1888",
      "nombreReparto": "Zona Centro",
      "visitas": "Lunes, Miércoles, Viernes",
      "proximaVisita": "2026-01-17",
      "diasProximaVisita": 1
    },
    {
      "cliente_id": 215,
      "nombreCompleto": "María González",
      "domicilio": "Av. Vélez Sarsfield 500",
      "telefono": "3512345679",
      "distanciaMetros": 320,
      "latitud": "-31.4215",
      "longitud": "-64.1895",
      "nombreReparto": "Zona Centro",
      "visitas": "Martes, Jueves",
      "proximaVisita": "2026-01-16",
      "diasProximaVisita": 0
    }
  ]
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| cliente_id | number | ID del cliente |
| nombreCompleto | string | Nombre completo del cliente |
| domicilio | string | Dirección del cliente |
| telefono | string | Teléfono de contacto |
| distanciaMetros | number | Distancia en metros desde el punto de referencia |
| latitud | string | Latitud del cliente |
| longitud | string | Longitud del cliente |
| nombreReparto | string | Nombre del reparto asignado |
| visitas | string | Días de visita |
| proximaVisita | string | Fecha de próxima visita |
| diasProximaVisita | number | Días hasta la próxima visita |

## Notas

- Los resultados se ordenan por distancia (más cercanos primero)
- El radio máximo recomendado es 2500 metros
- Si no hay resultados, considerar aumentar el radio de búsqueda

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Operación exitosa |
| 1 | Error en la búsqueda |
| 401 | Token inválido o expirado |

## Ver También

- [Clientes Cercanos por Dirección](clientes-cercanos-direccion.md)
- [Clientes Cercanos a Cliente](clientes-cercanos-cliente.md)
