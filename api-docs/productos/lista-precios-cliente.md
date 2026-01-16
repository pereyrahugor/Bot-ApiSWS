# Lista de Precios del Cliente

Obtiene la lista de precios asignada a un cliente específico.

## Endpoint

```
GET /ListaDePrecios/ObtenerListaDePreciosDeCliente
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| ClienteId | number | ID del cliente | Sí |

## Ejemplo de Request

```
GET /ListaDePrecios/ObtenerListaDePreciosDeCliente?ClienteId=208
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "precios": [
    {
      "producto_id": 1,
      "nombre": "Bidón 20L",
      "precio": 850.00,
      "moneda": "ARS",
      "categoria": "Bidones",
      "stock": 150
    },
    {
      "producto_id": 2,
      "nombre": "Bidón 12L",
      "precio": 550.00,
      "moneda": "ARS",
      "categoria": "Bidones",
      "stock": 200
    }
  ]
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| producto_id | number | ID del producto |
| nombre | string | Nombre del producto |
| precio | number | Precio unitario |
| moneda | string | Código de moneda |
| categoria | string | Categoría del producto |
| stock | number | Stock disponible |

## Ver También

- [Matriz de Lista de Precios](matriz-lista-precios.md)
- [Tipos de Abonos](tipos-abonos.md)
