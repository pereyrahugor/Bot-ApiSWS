# Matriz de Lista de Precios

Obtiene la matriz completa de listas de precios del sistema.

## Endpoint

```
GET /ListaDePrecios/ObtenerMatrizListaDePrecios
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| tipoLista_id | number | ID del tipo de lista (0 para todas) | No |

## Ejemplo de Request

```
GET /ListaDePrecios/ObtenerMatrizListaDePrecios?tipoLista_id=0
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "data": [
    {
      "lista_id": 1,
      "nombre": "Lista Minorista",
      "productos": [
        {
          "producto_id": 1,
          "nombre": "Bidón 20L",
          "precio": 850.00
        }
      ]
    },
    {
      "lista_id": 2,
      "nombre": "Lista Mayorista",
      "productos": [
        {
          "producto_id": 1,
          "nombre": "Bidón 20L",
          "precio": 750.00
        }
      ]
    }
  ]
}
```

## Ver También

- [Lista de Precios del Cliente](lista-precios-cliente.md)
