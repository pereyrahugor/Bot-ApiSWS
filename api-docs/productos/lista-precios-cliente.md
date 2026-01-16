# Lista de Precios del Cliente

Devuelve la lista de precios y artículos comerciales habilitados para un cliente específico.

## Endpoint

```
GET /ListaDePrecios/ObtenerListaDePreciosDeCliente
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros de la Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| ClienteId | number | ID del cliente a consultar | Sí |

## Ejemplo de Request

```
GET /ListaDePrecios/ObtenerListaDePreciosDeCliente?ClienteId=1036
```

## Ejemplo de Respuesta Exitosa

```json
{
  "ArticulosDeListaDePrecio": {
    "Bidon x 20 lts": 800.00,
    "Bidon x 12 lts": 500.00,
    "Sifon x 1 1/4": 500.00,
    "bidon de 20L Monte": 150.00,
    "bidon de 12L Monte": 200.00
  },
  "error": 0
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| error | number | 0 para éxito, 1 para error |
| ArticulosDeListaDePrecio | object | Diccionario donde la llave es el nombre del artículo y el valor es el precio unitario |

> **Nota**: Este endpoint devuelve la lista de artículos comerciales habilitados para el comercio de un repartidor asociado al cliente.

## Ver También

- [Matriz de Lista de Precios](matriz-lista-precios.md)
- [Tipos de Abonos](tipos-abonos.md)
