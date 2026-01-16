# Resumen de Cuenta

Obtiene el resumen de cuenta de un cliente con todos sus movimientos.

## Endpoint

```
POST /Movimientos/BuscarMovimientos
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
| desde | string | Fecha desde (DD/MM/YYYY) | Sí |
| hasta | string | Fecha hasta (DD/MM/YYYY) | Sí |

## Ejemplo de Request

```json
{
  "clienteId": 208,
  "desde": "01/01/2026",
  "hasta": "31/01/2026"
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "data": {
    "saldoAnterior": 1000.00,
    "movimientos": [
      {
        "fecha": "05/01/2026",
        "tipo": "Factura",
        "numero": "A-0001-00001001",
        "debe": 5000.00,
        "haber": 0.00
      },
      {
        "fecha": "10/01/2026",
        "tipo": "Recibo",
        "numero": "R-0001-00000500",
        "debe": 0.00,
        "haber": 5000.00
      }
    ],
    "saldoActual": 1000.00
  }
}
```

## Ver También

- [Historial de Facturas](historial-facturas.md)
- [Recibos de Pago](recibos-pago.md)
