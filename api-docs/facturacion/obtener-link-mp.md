# Obtener Link de Mercado Pago

Genera una preferencia de pago en Mercado Pago para un cliente y monto específicos, devolviendo el link (init_point) para realizar el pago.

## Endpoint

```
POST /Recibos/ObtenerLinkMP
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| cliente_id | number | ID único del cliente | Sí |
| monto | number | Importe a cobrar (formato decimal) | Sí |

## Ejemplo de Request

```json
{
  "cliente_id": 8,
  "monto": 1000.50
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=1740847852-9a77f20b-3906-4743-9ae0-c83498773fae"
}
```

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Operación exitosa |
| 1 | Error - Referencia a objeto no establecida (usualmente cliente inexistente o configuración de MP faltante) |

## Ver También

- [Recibos de Pago](recibos-pago.md)
- [Resumen de Cuenta](resumen-cuenta.md)
