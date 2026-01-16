# Remitos de Entrega

Obtiene los remitos de entrega de un cliente.

## Endpoint

```
POST /Movimientos/ObtenerVentasPorCliente
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
| fechaDesde | string | Fecha desde (DD/MM/YYYY) | Sí |
| fechaHasta | string | Fecha hasta (DD/MM/YYYY) | Sí |
| consumosSinFacturar | boolean | Solo sin facturar | No |

## Ejemplo de Request

```json
{
  "cliente_id": 208,
  "fechaDesde": "01/01/2026",
  "fechaHasta": "31/01/2026",
  "consumosSinFacturar": false
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "data": [
    {
      "remito_id": 2001,
      "numero": "R-0001-00002001",
      "fecha": "15/01/2026",
      "items": [
        {
          "producto": "Bidón 20L",
          "cantidad": 4,
          "precio": 850.00
        }
      ],
      "total": 3400.00,
      "facturado": true
    }
  ]
}
```

## Ver También

- [Descargar Remito](descargar-remito.md)
- [Reenviar Remito por Mail](reenviar-remito.md)
