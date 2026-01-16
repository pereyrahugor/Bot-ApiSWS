# Resumen de Cuenta

Obtiene una lista de movimientos de un cliente en un rango de fechas, agrupados en tres categorías: consumos sin facturar, facturas emitidas y movimientos por periodo.

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
| clienteId | number | ID del cliente a consultar | Sí |
| desde | string | Fecha de inicio (dd/MM/yyyy) | Sí |
| hasta | string | Fecha de fin (dd/MM/yyyy) | Sí |

## Ejemplo de Request

```json
{
  "clienteId": 8,
  "desde": "07/04/2025",
  "hasta": "26/09/2025"
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "dashboard": {
    "movimientosConsumos": [
      {
        "fecha": "/Date(1751338799000)/",
        "descripcion": "Venta",
        "nroComprobante": "Rm-e-00016",
        "montoDebe": 1780.00,
        "montoHaber": 0,
        "saldo": 0,
        "entidadId": 10736,
        "tipoDeEntidad": 5
      }
    ],
    "movimientosFacturacion": [
      {
        "fecha": "/Date(1751571804133)/",
        "descripcion": "Recibo",
        "nroComprobante": "Rc-e-00000027",
        "montoDebe": 0,
        "montoHaber": 12312.00,
        "saldo": 0,
        "entidadId": 10112,
        "tipoDeEntidad": 3
      },
      {
        "fecha": "/Date(1751571770237)/",
        "descripcion": "Factura",
        "nroComprobante": "F-0000",
        "montoDebe": 12312.00,
        "montoHaber": 0,
        "saldo": 0,
        "entidadId": 10065,
        "tipoDeEntidad": 2
      }
    ],
    "movimientosPeriodo": [
      {
        "periodo": "202504",
        "articulo_id": 1,
        "nombreArticulo": "Bidon x 20 lts",
        "precioUnitario": 3000.00,
        "cantidad": 1.00,
        "subtotal": 3000.00,
        "clienteFacturable_id": 8
      }
    ]
  },
  "error": 0
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| error | number | 0 para éxito, 1 para error |
| dashboard | object | Objeto contenedor de los diferentes tipos de movimientos |

### Tipos de Movimientos

1. **movimientosConsumos**: Son los consumos (ventas/remitos) que aún no han sido facturados o que pertenecen al flujo operativo.
2. **movimientosFacturacion**: Historial de comprobantes fiscales (Facturas) y comprobantes de pago (Recibos).
3. **movimientosPeriodo**: Agrupación de artículos consumidos por periodo (mes) con sus subtotales.

### Detalle de Campos del Movimiento

| Campo | Tipo | Descripción |
|-------|------|-------------|
| fecha | string | Fecha del movimiento (/Date(timestamp)/) |
| descripcion | string | Tipo de movimiento (Venta, Factura, Recibo) |
| nroComprobante | string | Número de documento |
| montoDebe | number | Importe que se carga a la cuenta (ej. Factura) |
| montoHaber | number | Importe que se abona a la cuenta (ej. Recibo) |
| saldo | number | Saldo acumulado (si aplica) |

## Ver También

- [Historial de Facturas](historial-facturas.md)
- [Recibos de Pago](recibos-pago.md)
