# Reenviar Factura por Mail

Reenvía por correo electrónico una factura específica a la dirección asociada al cliente.

## Endpoint

```
POST /Facturacion/EnviarFacturaPorMail
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| facturaId | number | ID único de la factura | Sí |

## Ejemplo de Request

```json
{
  "facturaId": 121471
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0
}
```

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Operación exitosa |
| 1 | Error - Referencia a objeto no establecida (usualmente factura inexistente) |

## Ver También

- [Historial de Facturas](historial-facturas.md)
- [Reenviar Remito](../movimientos/reenviar-remito.md)
