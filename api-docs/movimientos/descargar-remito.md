# Descargar Remito

Descarga el archivo PDF de un remito.

## Endpoint

```
GET /Remitos/Descargar
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| remito_id | number | ID del remito | Sí |

## Ejemplo de Request

```
GET /Remitos/Descargar?remito_id=2001
```

## Respuesta

Devuelve el archivo PDF del remito con Content-Type: application/pdf

## Ver También

- [Remitos de Entrega](remitos-entrega.md)
- [Descargar Remito por Venta](descargar-remito-venta.md)
