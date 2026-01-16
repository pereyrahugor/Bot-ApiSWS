# Descarga de Archivos y Publicaciones

Este endpoint permite obtener una lista de publicaciones y documentos (como manuales o folletos) asociados a un cliente o generales del sistema, incluyendo sus links de descarga.

## Endpoint

```
GET /Publicaciones/ObtenerPublicaciones
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros de la Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| cliente_id | number | ID del cliente para ver sus publicaciones. Si es null, devuelve las generales. | No |

## Ejemplo de Request

```
GET /Publicaciones/ObtenerPublicaciones?cliente_id=null
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "publicaciones": [
    {
      "id": 1,
      "cliente_id": null,
      "titulo": "Manual API",
      "descripcion": "Manual de integración v5.0",
      "usuario": "Admin",
      "fechaAlta": "/Date(1756477342130)/",
      "tipoPublicacion": "Documentación comercial",
      "archivos": [
        {
          "id": 1,
          "nombreArchivo": "cd5417..._Manual_API.pdf",
          "tituloArchivo": "Manual_API.pdf"
        }
      ]
    }
  ]
}
```

## Descarga del Archivo

Para descargar el archivo físicamente, se debe utilizar el nombre del archivo devuelto en la ruta base de archivos del sistema.

**Ejemplo de URL de descarga:**
`https://url-del-sistema/Archivos/Publicaciones/nombre_del_archivo_devuelto.pdf`

## Ver También

- [Descargar Remito](../movimientos/descargar-remito-venta.md)
