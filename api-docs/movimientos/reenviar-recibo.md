# Reenviar Recibo por Mail

Reenvía un recibo de pago por email.

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
| reciboId | number | ID del recibo | Sí |

## Ejemplo de Request

```json
{
  "reciboId": 500
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "message": "Recibo enviado exitosamente"
}
```
