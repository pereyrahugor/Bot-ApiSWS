# Recibos de Pago

Obtiene los recibos de pago de un cliente.

## Endpoint

```
POST /Recibos/ObtenerRecibosDeCobros
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| clienteId | number | ID del cliente | Sí |
| fechaReciboDesde | string | Fecha desde (DD/MM/YYYY) | Sí |
| fechaReciboHasta | string | Fecha hasta (DD/MM/YYYY) | Sí |
| saldoDisponible | boolean | Solo con saldo disponible | No |

## Ejemplo de Request

```json
{
  "clienteId": 208,
  "fechaReciboDesde": "01/01/2026",
  "fechaReciboHasta": "31/01/2026",
  "saldoDisponible": false
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "data": [
    {
      "recibo_id": 500,
      "numero": "R-0001-00000500",
      "fecha": "10/01/2026",
      "importe": 5000.00,
      "saldoDisponible": 0.00,
      "formaPago": "Transferencia"
    }
  ]
}
```

## Ver También

- [Historial de Facturas](historial-facturas.md)
- [Reenviar Recibo por Mail](../movimientos/reenviar-recibo.md)
