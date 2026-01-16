# Tipos de Abonos

Obtiene los tipos de abonos disponibles en el sistema.

## Endpoint

```
GET /AbonosTipos/ObtenerAbonosTipos
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| desde | string | Fecha desde (DD/MM/YYYY) | No |
| hasta | string | Fecha hasta (DD/MM/YYYY) | No |
| concepto | string | Filtro por concepto | No |
| activo | boolean | Solo abonos activos | No |

## Ejemplo de Request

```
GET /AbonosTipos/ObtenerAbonosTipos?activo=true
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "data": [
    {
      "abono_id": 1,
      "concepto": "Abono Mensual 20L",
      "descripcion": "4 bidones de 20L por mes",
      "precio": 3000.00,
      "frecuencia": "Mensual",
      "activo": true
    }
  ]
}
```

## Ver También

- [Lista de Precios del Cliente](lista-precios-cliente.md)
