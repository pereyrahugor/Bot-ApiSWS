# Reenviar Remito por Mail

Reenvía un remito por email.

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
| remitoId | number | ID del remito | Sí |

## Ejemplo de Request

```json
{
  "remitoId": 2001
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "message": "Remito enviado exitosamente"
}
```
