# Acerca de la API SWS

## Descripción General

La API de SWS (Sistema Web SWS) es una interfaz RESTful que permite la integración con el sistema de gestión empresarial. Proporciona acceso a funcionalidades de:

- **Gestión de Clientes**: Búsqueda, creación y actualización de información de clientes
- **Logística y Repartos**: Gestión de zonas de cobertura y planificación de entregas
- **Facturación**: Consulta de facturas, recibos y estado de cuenta
- **Productos y Precios**: Acceso a listas de precios y catálogos
- **Servicios Técnicos**: Gestión de órdenes de trabajo
- **Incidentes**: Creación y seguimiento de tickets

## URL Base

```
http://demo.chatbot.sistemaws.com
```

## Formato de Respuesta

Todas las respuestas de la API están en formato JSON.

### Estructura de Respuesta Exitosa

```json
{
  "error": 0,
  "data": { ... },
  "message": "Operación exitosa"
}
```

### Estructura de Respuesta con Error

```json
{
  "error": 1,
  "message": "Descripción del error",
  "details": "Información adicional del error"
}
```

## Autenticación

Todos los endpoints requieren autenticación mediante un token de sesión que debe incluirse en el header `CURRENTTOKENVALUE`.

Ver [Obtener Token](../autenticacion/obtener-token.md) para más detalles.

## Versionamiento

**Versión actual**: 5.0

## Soporte

Para soporte técnico o consultas, contactar al equipo de desarrollo.
