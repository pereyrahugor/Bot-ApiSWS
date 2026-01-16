# Obtener Saldos del Cliente

Obtiene un resumen financiero rápido y datos logísticos detallados de un cliente, incluyendo saldos de consumo y facturación.

## Endpoint

```
GET /api/Movimientos/ObtenerSaldosDeCliente/
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros de la Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| cliente_id | number | ID del cliente a consultar | Sí |

## Ejemplo de Request

```
GET /api/Movimientos/ObtenerSaldosDeCliente/?cliente_id=8
```

## Ejemplo de Respuesta Exitosa

```json
{
  "saldos": {
    "cliente_id": 3131,
    "nombreCliente": "EXPERTA ART SA",
    "nombreReparto": "Reparto 3 (Rosario)",
    "diasVisita": "S4 Jueves",
    "fechaUltimoCobro": "12/09/2025",
    "fechaUltimaEntrega": "11/09/2025",
    "saldoCuentaConsumo": 33440.00,
    "saldoCuentaFacturacion": 0.00,
    "listaDePrecios": "Lista Base CD1"
  },
  "error": 0
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| saldoCuentaConsumo | number | Saldo operativo por productos entregados no facturados |
| saldoCuentaFacturacion | number | Saldo contable por facturas emitidas no cobradas |
| fechaUltimoCobro | string | Fecha del último recibo registrado |
| fechaUltimaEntrega | string | Fecha del último remito registrado |
| diasVisita | string | Frecuencia y día de visita asignado |

## Ver También

- [Resumen de Cuenta](../facturacion/resumen-cuenta.md)
- [Obtener Datos del Cliente](obtener-datos.md)
