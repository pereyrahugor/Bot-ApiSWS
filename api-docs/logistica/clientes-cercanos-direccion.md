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
  "error": 0,
  "data": [
    {
      "cliente_id": 208,
      "nombreCompleto": "Juan Pérez",
      "domicilio": "Av. Colón 1234",
      "telefono": "3512345678",
      "distanciaMetros": 50,
      "nombreReparto": "Zona Centro"
    }
  ]
}
```

## Notas

- El sistema convierte automáticamente la dirección a coordenadas
- Si no se encuentran resultados, el radio se incrementa automáticamente hasta 2500m
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
