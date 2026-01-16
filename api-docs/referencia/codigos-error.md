# Códigos de Error

Referencia completa de códigos de error de la API.

## Códigos Generales

| Código | Descripción | Solución |
|--------|-------------|----------|
| 0 | Operación exitosa | - |
| 1 | Error general | Verificar parámetros y reintentar |
| 401 | Token inválido o expirado | Renovar token de autenticación |
| 403 | Acceso denegado | Verificar permisos del usuario |
| 404 | Recurso no encontrado | Verificar ID del recurso |
| 500 | Error interno del servidor | Contactar soporte técnico |

## Códigos Específicos por Módulo

### Autenticación

| Código | Descripción |
|--------|-------------|
| 1 | Credenciales inválidas |
| 2 | Usuario bloqueado |
| 3 | Error del servidor |

### Clientes

| Código | Descripción |
|--------|-------------|
| 1 | Cliente no encontrado |
| 2 | DNI/CUIT ya existe |
| 3 | Datos incompletos |

### Logística

| Código | Descripción |
|--------|-------------|
| 1 | No se pudo geocodificar la dirección |
| 2 | No se encontraron clientes cercanos |

### Facturación

| Código | Descripción |
|--------|-------------|
| 1 | Factura no encontrada |
| 2 | Error al generar PDF |

## Manejo de Errores

### Ejemplo de Respuesta de Error

```json
{
  "error": 1,
  "message": "Descripción del error",
  "details": "Información adicional",
  "code": "ERR_CLIENTE_NOT_FOUND"
}
```

### Buenas Prácticas

1. **Siempre verificar el campo `error`** en la respuesta
2. **Implementar reintentos** para errores temporales (500, 503)
3. **Renovar token automáticamente** ante error 401
4. **Loguear errores** para debugging
5. **Mostrar mensajes amigables** al usuario final

### Ejemplo de Manejo

```javascript
async function handleApiCall(apiFunction) {
  try {
    const response = await apiFunction();
    
    if (response.error === 0) {
      return response.data;
    } else if (response.error === 401) {
      await renewToken();
      return handleApiCall(apiFunction); // Reintentar
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error('Error en API:', error);
    throw error;
  }
}
```
