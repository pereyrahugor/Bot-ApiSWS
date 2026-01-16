# Historial de Facturas

Obtiene una lista de las facturas de un cliente en un rango de fechas determinado.

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
| cliente_id | number | ID del cliente a consultar | Sí |
| fechaDesde | string | Fecha de inicio (dd/MM/yyyy) | Sí |
| fechaHasta | string | Fecha de fin (dd/MM/yyyy) | Sí |
| saldoPendiente | boolean | Si es true, filtra facturas con saldo a imputar > 0. Si es false, saldo = 0. | No |

## Ejemplo de Request

```json
{
  "cliente_id": 8,
  "fechaDesde": "05/12/2022",
  "fechaHasta": "26/09/2025",
  "saldoPendiente": false
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "facturas": [
    {
      "id": 10039,
      "nroFactura": "003-00000064",
      "fechaFactura": "/Date(1744047204477)/",
      "tipoFactura": "Factura A",
      "montoFacturaTotal": 300050.00,
      "montoTotalNeto": 247975.21,
      "montoFacturaIVA": 52074.79,
      "montoExcento": 0.00,
      "montoGravado": 300050.00,
      "fechaVencimiento1": "/Date(1741195625157)/",
      "fechaVencimiento2": "/Date(1742491625157)/",
      "fechaVencimiento3": "/Date(1743787625157)/",
      "cobrado": 0,
      "cliente_id": 8,
      "estadoFactura": "No Vencida",
      "interesVencimiento2": 1.05,
      "interesVencimiento3": 1.10,
      "estadoFactura_ids": 1,
      "leyenda1": null,
      "leyenda2": "Remitos asociados a las ventas facturadas: ",
      "leyenda3": null,
      "leyenda4": null,
      "codigoAfip": "x",
      "eliminada": false,
      "pathFactura": null,
      "facturaElectronica_id": 35,
      "resultado": 0,
      "mensaje": null,
      "cae": "75146229004566",
      "numeroComprobante": 64,
      "fechaVencimientoCae": "/Date(1744858800000)/",
      "fechaVencimientoComprobante": "/Date(1744858800000)/",
      "observaciones": "",
      "facturarAfip": true,
      "puntoDeVenta": 3,
      "tipoComprobanteAfip": 11,
      "pathFacturaDuplicado": null,
      "entregadaPapel": false,
      "entregadaEmail": false,
      "fechaEntregadaPapel": null,
      "fechaEntregadaEmail": null,
      "impresa": false,
      "procesoFacturacion_id": 11105,
      "notaDeDebitoAjusteId": null,
      "centroFacturacion_id": 1,
      "montoImputado": 300050.00,
      "saldoPendienteDeImputar": 0.00,
      "ItemsFactura": null
    }
  ],
  "ajustes": []
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| error | number | 0 para éxito, 1 para error |
| facturas | array | Lista de facturas encontradas |
| ajustes | array | Lista de ajustes asociados |

### Campos de Factura

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | number | ID interno de la factura |
| nroFactura | string | Número de factura (formato XXX-XXXXXXXX) |
| fechaFactura | string | Fecha de emisión (/Date(timestamp)/) |
| tipoFactura | string | Tipo de comprobante (Factura A, B, etc.) |
| montoFacturaTotal | number | Monto total bruto |
| montoTotalNeto | number | Monto neto |
| montoFacturaIVA | number | Monto de IVA |
| estadoFactura | string | Estado actual (No Vencida, Vencida, etc.) |
| cae | string | Código de Autorización Electrónico |
| saldoPendienteDeImputar | number | Saldo que falta cobrar/asignar |

## Ver También

- [Recibos de Pago](recibos-pago.md)
- [Resumen de Cuenta](resumen-cuenta.md)
- [Reenviar Factura](reenviar-factura.md)
