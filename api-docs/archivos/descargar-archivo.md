# Descargar Archivo

Descarga un archivo del sistema.

## Endpoint

```
GET /Archivos/Descargar
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros Query

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| archivo_id | number | ID del archivo | Sí |

## Ejemplo de Request

```
GET /Archivos/Descargar?archivo_id=300
```

## Respuesta

Devuelve el archivo con el Content-Type apropiado según el tipo de archivo.
