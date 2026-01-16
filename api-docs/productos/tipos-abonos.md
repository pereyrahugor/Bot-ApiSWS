# Tipos de Abonos

Obtiene una lista de los tipos de abonos disponibles en el sistema para clasificar transacciones.

## Endpoint

```
GET /AbonosTipos/ObtenerAbonosTipos
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros de la Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| desde | string | Fecha inicio (opcional) | No |
| hasta | string | Fecha fin (opcional) | No |
| concepto | string | Filtro por nombre del abono (opcional) | No |
| activo | boolean | Determina si el abono está activo o no | Sí |

## Ejemplo de Request

```
GET /AbonosTipos/ObtenerAbonosTipos?activo=true
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "abonosTipos": [
    {
      "id": 1007,
      "articuloAbonoConcepto_id": 4,
      "articuloAbonoConcepto": "Concepto de Abono Tipo",
      "nombreAbono": "abono 4 x 20",
      "leyendaFacturacion": "abono mensual de 4 bidones de 20 litros",
      "precio": 30000.00,
      "tipoAbonoTipo_ids": 1,
      "tipoAbonoTipo": "Abono Aguas",
      "fechaAlta": "/Date(1735909324993)/",
      "usuarioAlta_id": 1,
      "nombreApellidoAlta": "Admin",
      "activo": true,
      "fechaBaja": null,
      "usuarioBaja_id": null,
      "nombreApellidoBaja": null
    }
  ]
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| error | number | 0 para éxito, 1 para error |
| abonosTipos | array | Lista de configuraciones de abonos |

### Campos de Abono

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | number | ID único del tipo de abono |
| nombreAbono | string | Nombre descriptivo |
| leyendaFacturacion | string | Descripción que aparecerá en la factura |
| precio | number | Precio base del abono |
| tipoAbonoTipo | string | Clasificación del abono (ej. Abono Aguas) |

## Ver También

- [Lista de Precios del Cliente](lista-precios-cliente.md)
