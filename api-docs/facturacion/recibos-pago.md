# Recibos de Pago

Obtiene una lista de recibos de cobro de un cliente en un rango de fechas.

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
| clienteId | number | ID del cliente a consultar | Sí |
| fechaReciboDesde | string | Fecha de inicio (dd/MM/yyyy) | Sí |
| fechaReciboHasta | string | Fecha de fin (dd/MM/yyyy) | Sí |
| saldoDisponible | boolean | Si es true, filtra recibos con saldo disponible > 0. Si es false, montoDisponible = 0. | No |

## Ejemplo de Request

```json
{
  "clienteId": 8,
  "fechaReciboDesde": "07/04/2025",
  "fechaReciboHasta": "26/09/2025",
  "saldoDisponible": false
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "recibos": [
    {
      "id": 10112,
      "cliente_id": 8,
      "clienteEntrega_id": 8,
      "usuarioRecibe_id": 1,
      "fechaRecibo": "/Date(1751571804133)/",
      "fechaAlta": "/Date(1751571804133)/",
      "nroReciboDigital": "00000027",
      "nroReciboFisico": null,
      "esRecibo": false,
      "pathPdf": null,
      "hojaDeRuta_id": null,
      "fechaEnvioMail": null,
      "fechaEntregadaConfirmadaEmail": null,
      "centroDeFacturacion_id": 1,
      "esCreditoDisponible": true,
      "esAfip": true,
      "liquidado": true,
      "clienteRecibo": "Correo Argentino",
      "clienteEntrega": "Correo Argentino",
      "centroDeFacturacion": "Principal",
      "usuarioRecibe": "Admin",
      "fechaRuta": null,
      "reparto": null,
      "montoTotalUtilizado": 12312.00,
      "montoTotalRecibo": 12312.00,
      "montoDisponible": 0.00,
      "permisoEditar": true,
      "permisoImputar": true,
      "permisoEditarNumero": true,
      "items": null,
      "imputaciones": null
    }
  ],
  "error": 0
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| error | number | 0 para éxito, 1 para error |
| recibos | array | Lista de recibos encontrados |

### Campos de Recibo

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | number | ID interno del recibo |
| nroReciboDigital | string | Número de comprobante digital |
| fechaRecibo | string | Fecha del recibo (/Date(timestamp)/) |
| montoTotalRecibo | number | Importe total del recibo |
| montoDisponible | number | Saldo del recibo no imputado aún |
| liquidado | boolean | Indica si el recibo ya fue liquidado |
| clienteRecibo | string | Nombre del cliente titular |
| centroDeFacturacion | string | Centro de facturación que emitió el recibo |

## Ver También

- [Historial de Facturas](historial-facturas.md)
- [Reenviar Recibo](../movimientos/reenviar-recibo.md)
