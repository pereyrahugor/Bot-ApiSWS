# Reenviar Factura por Mail

Reenvía una factura por email al cliente.

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
| facturaId | number | ID de la factura | Sí |

## Ejemplo de Request

```json
{
  "facturaId": 1001
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "message": "Factura enviada exitosamente"
}
```

## Ver También

- [Historial de Facturas](historial-facturas.md)
