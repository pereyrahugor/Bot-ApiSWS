# Remitos de Entrega

Obtiene los consumos (ventas) de un cliente en un rango de fechas determinado, permitiendo filtrar por estado de facturación.

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
| cliente_id | number | ID del cliente a consultar | Sí |
| fechaDesde | string | Fecha de inicio (dd/MM/yyyy) | Sí |
| fechaHasta | string | Fecha de fin (dd/MM/yyyy) | Sí |
| consumosSinFacturar | boolean | Si es true, filtra consumos con factura. Si es false, sin factura. | No |

## Ejemplo de Request

```json
{
  "cliente_id": 8,
  "fechaDesde": "07/04/2025",
  "fechaHasta": "26/09/2025",
  "consumosSinFacturar": false
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "ventas": [
    {
      "id": 11013,
      "fechaVenta": "/Date(1755800760000)/",
      "montoTotalVenta": 0,
      "hojaRuta_id": 20179,
      "clienteEntrega_id": 8,
      "factura_id": null,
      "remito_id": 10606,
      "nroRemito": "00055",
      "nroRemitoFisico": null,
      "clienteEntrega": "Correo Argentino",
      "archivoRemitoPdf": "8_20179.pdf",
      "fueEditada": false,
      "visita_id": 20212,
      "nombreRepartoEntrega": "1234",
      "Articulos": [
        {
          "id": 11038,
          "articulo_id": 1,
          "precioUnitario": 0,
          "cantidad": 3,
          "codigoInterno": "1",
          "nombreArticulo": "Bidon x 20 lts",
          "esImputacionAbono": false,
          "factura_id": null,
          "leyenda": null,
          "facturaDeItem_id": null,
          "porcentajeDescuentoManual": 0,
          "porcentajeDescuentoPorCantidad": 0,
          "porcentajeDescuentoVenta": 0,
          "precioUnitarioOriginal": 0,
          "tipoItem_id": 2
        }
      ]
    }
  ],
  "error": 0
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| error | number | 0 para éxito, 1 para error |
| ventas | array | Lista de ventas/remitos encontrados |

### Campos de Venta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | number | ID interno de la venta |
| fechaVenta | string | Fecha de la operación (/Date(timestamp)/) |
| nroRemito | string | Número de remito asignado |
| clienteEntrega | string | Nombre del cliente receptor |
| archivoRemitoPdf | string | Nombre del archivo PDF para descarga |
| Articulos | array | Detalle de artículos entregados en este remito |

### Campos de Artículo

| Campo | Tipo | Descripción |
|-------|------|-------------|
| articulo_id | number | ID único del producto |
| nombreArticulo | string | Descripción del producto |
| cantidad | number | Cantidad entregada |
| precioUnitario | number | Precio aplicado |
| esImputacionAbono | boolean | Indica si el item se descontó de un abono |

## Ver También

- [Descargar Remito](descargar-remito.md)
- [Reenviar Remito](reenviar-remito.md)
