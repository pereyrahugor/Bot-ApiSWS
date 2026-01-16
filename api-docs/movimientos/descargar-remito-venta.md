# Descargar Remito por Venta

Descarga el remito asociado a una venta específica.

## Endpoint

```
GET /VentasEntregas/ObtenerRemitoPorVenta
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| idVenta | number | ID de la venta | Sí |

## Ejemplo de Request

```
GET /VentasEntregas/ObtenerRemitoPorVenta?idVenta=5001
```

## Respuesta

Devuelve el archivo PDF del remito con Content-Type: application/pdf

## Ver También

- [Descargar Remito](descargar-remito.md)
