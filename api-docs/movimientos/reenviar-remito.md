# Reenviar Remito por Mail

Reenvía por correo electrónico un remito específico a la dirección asociada al cliente.

## Endpoint

```
POST /Facturacion/EnviarRemitoPorMail
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| remitoId | number | ID único del remito | Sí |

## Ejemplo de Request

```json
{
  "remitoId": 227194
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
| 1 | Error - Referencia a objeto no establecida (usualmente remito inexistente) |

## Ver También

- [Remitos de Entrega](remitos-entrega.md)
- [Reenviar Factura](../facturacion/reenviar-factura.md)
