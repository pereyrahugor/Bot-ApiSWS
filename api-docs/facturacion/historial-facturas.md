# Historial de Facturas

Obtiene el historial de facturas de un cliente.

## Endpoint

```
POST /Facturacion/ObtenerHistorialDeFacturas
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
| saldoPendiente | boolean | Solo facturas con saldo pendiente | No |

## Ejemplo de Request

```json
{
  "cliente_id": 208,
  "fechaDesde": "01/01/2026",
  "fechaHasta": "31/01/2026",
  "saldoPendiente": false
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "data": [
    {
      "factura_id": 1001,
      "numero": "A-0001-00001001",
      "fecha": "15/01/2026",
      "total": 5000.00,
      "saldo": 0.00,
      "estado": "Pagada"
    }
  ]
}
```

## Ver También

- [Recibos de Pago](recibos-pago.md)
- [Resumen de Cuenta](resumen-cuenta.md)
