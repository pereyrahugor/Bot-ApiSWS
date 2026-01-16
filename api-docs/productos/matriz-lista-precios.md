# Matriz de Lista de Precios

Permite obtener la matriz de precios actual de productos filtrada por un tipo de lista específico.

## Endpoint

```
GET /ListaDePrecios/ObtenerMatrizListaDePrecios
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros de la Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| tipoLista_id | number | ID del tipo de lista de precios | Sí |

## Ejemplo de Request

```
GET /ListaDePrecios/ObtenerMatrizListaDePrecios?tipoLista_id=2
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "matriz": {
    "articulos": [
      {
        "articulo_id": 1,
        "nombreArticulo": "Bidon x 20 lts",
        "codigoInterno": "1",
        "tipoArticulo_ids": 1,
        "tipo": "Producto comercilizable",
        "rubro_ids": 2,
        "rubro": "Agua en Bidon",
        "precios": [
          {
            "lista_id": 5,
            "tipoLista_ids": 2,
            "articulo_id": 1,
            "precio": 800.00
          }
        ]
      },
      {
        "articulo_id": 2,
        "nombreArticulo": "Bidon x 12 lts",
        "codigoInterno": "2",
        "tipoArticulo_ids": 1,
        "tipo": "Producto comercilizable",
        "rubro_ids": 2,
        "rubro": "Agua en Bidon",
        "precios": [
          {
            "lista_id": 5,
            "tipoLista_ids": 2,
            "articulo_id": 2,
            "precio": 500.00
          }
        ]
      }
    ],
    "listas": [
      {
        "lista_id": 5,
        "nombre": "Distribuidores",
        "tipo_ids": 2,
        "tipo": "Lista"
      }
    ]
  }
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| error | number | 0 para éxito, 1 para error |
| matriz | object | Contenedor de artículos y listas |

### Campos de Artículo

| Campo | Tipo | Descripción |
|-------|------|-------------|
| articulo_id | number | ID único del artículo |
| nombreArticulo | string | Descripción del producto |
| tipo | string | Categoría del artículo (ej. Producto comerciable) |
| rubro | string | Rubro al que pertenece (ej. Agua en Bidón) |
| precios | array | Lista de precios definidos para este artículo en diferentes listas |

## Ver También

- [Lista de Precios del Cliente](lista-precios-cliente.md)
