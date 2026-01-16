# Códigos de Error

Referencia completa de códigos de error de la API SWS.

## Códigos Generales

| Código | Descripción | Significado / Solución |
|--------|-------------|-------------------------|
| 0 | Operación exitosa | La solicitud se procesó correctamente. |
| 1 | Error de lógica | Error en el servidor o parámetros incorrectos. Ver campo `message`. |
| 401 | No autorizado | Token inválido, expirado o falta el header `CURRENTTOKENVALUE`. |
| 404 | No encontrado | El endpoint o recurso solicitado no existe. |

## Errores Comunes del Sistema

Basado en la tecnología del servidor (.NET), existen mensajes de error recurrentes que indican problemas específicos en la solicitud:

### "Referencia a objeto no establecida como instancia de un objeto"
Este es el error más común cuando se utiliza la API.
- **Causa**: Faltan parámetros obligatorios en el cuerpo del JSON (Request Body) o están mal escritos.
- **Solución**: Verificar que todos los campos requeridos por el endpoint estén presentes y coincidan exactamente en nombre (case-sensitive en algunos casos).

### "Error al obtener Token. Error: Error de usuario y/o contraseña"
- **Causa**: Las credenciales enviadas a `/api/Session/GetToken` no son válidas.
- **Solución**: Verificar `username` y `password`.

### "El centro de distribución del incidente es diferente al del cliente seleccionado"
- **Causa**: Al crear un ticket o incidente, el `centroDistribucion_id` no coincide con el asignado al cliente.
- **Solución**: Consultar primero los datos del cliente para obtener su ID de centro de distribución correcto.

## Comportamientos Especiales

### Búsqueda sin resultados
En endpoints de búsqueda (como Búsqueda Rápida de Clientes), si ningún dato coincide con los criterios enviados:
- El sistema **devuelve todos los clientes** en lugar de una lista vacía. 
- Se recomienda procesar los resultados para verificar si la correspondencia es la esperada.

### Formato de Fechas
Las fechas en las respuestas no son strings estándar, sino objetos serializados:
`"fechaIngreso": "/Date(1577847600000)/"`
El número representa el timestamp en milisegundos.

## Manejo de Errores Sugerido

```javascript
if (response.error !== 0) {
    if (response.message.includes("Referencia a objeto no establecida")) {
        console.error("Error: Revisar estructura del JSON enviado.");
    } else {
        console.error("Error en API:", response.message);
    }
}
```
