# Descargar Remito por Venta

Permite descargar el comprobante PDF de un remito asociado a un ID de venta específico.

## Endpoint

```
GET /VentasEntregas/ObtenerRemitoPorVenta
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros de la Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| idVenta | number | ID único de la venta que se desea descargar | Sí |

## Ejemplo de Request

```
GET /VentasEntregas/ObtenerRemitoPorVenta?idVenta=8
```

## Respuesta

### Exitosa (HTTP 200)
- Devuelve el flujo del archivo PDF.
- Los navegadores o el bot pueden guardarlo como archivo .pdf.

### Error
```json
{
  "tokenValido": null,
  "vencimiento": null,
  "error": 1,
  "message": "Error al obtener Token..."
}
```

## Ver También

- [Remitos de Entrega](remitos-entrega.md)
- [Descargar Archivos](../archivos/descargar-archivos.md)
