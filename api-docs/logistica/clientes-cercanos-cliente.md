# Clientes Cercanos a Cliente

Busca clientes cercanos a un cliente específico.

## Endpoint

```
GET /Repartos/ObtenerClientesCercanosACliente
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| clienteId | string | ID del cliente de referencia | Sí |
| radioMetros | number | Radio de búsqueda en metros | Sí |
| excluir | boolean | Excluir el cliente de referencia | No |

## Ejemplo de Request

```
GET /Repartos/ObtenerClientesCercanosACliente?clienteId=208&radioMetros=500&excluir=true
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "data": [
    {
      "cliente_id": 215,
      "nombreCompleto": "María González",
      "domicilio": "Av. Vélez Sarsfield 500",
      "telefono": "3512345679",
      "distanciaMetros": 320,
      "nombreReparto": "Zona Centro"
    }
  ]
}
```

## Notas

- Útil para optimizar rutas de reparto
- El parámetro `excluir=true` omite el cliente de referencia de los resultados
- Radio inicial recomendado: 500 metros
- Radio máximo recomendado: 2500 metros
- Si no hay resultados, considerar aumentar el radio de 250m en 250m
- Cuando se usa desde el bot, el radio se incrementa automáticamente de 250m en 250m hasta 2500m si no hay resultados

## Ver También

- [Clientes Cercanos por Coordenadas](clientes-cercanos-coordenadas.md)
- [Clientes Cercanos por Dirección](clientes-cercanos-direccion.md)
