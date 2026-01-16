# Reenviar Recibo por Mail

Reenvía por correo electrónico un recibo de cobro específico a la dirección asociada al cliente.

## Endpoint

```
POST /Recibos/EnviarPorMail
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| reciboId | number | ID único del recibo | Sí |

## Ejemplo de Request

```json
{
  "reciboId": 171406
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
| 1 | Error - Referencia a objeto no establecida (usualmente recibo inexistente) |

## Ver También

- [Recibos de Pago](../facturacion/recibos-pago.md)
- [Reenviar Factura](../facturacion/reenviar-factura.md)
