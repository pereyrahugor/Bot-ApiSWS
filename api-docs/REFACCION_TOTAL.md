# Guía de Refactorización y Correcciones Finales

Este documento resume las mejoras críticas, correcciones de errores y la hoja de ruta para la refactorización total de `app.ts` y las interfaces HTML del Backoffice.

## 🛠️ Correcciones Finales (Must-Read)

### 1. Gestión de Historial (`src/utils/historyHandler.ts`)
- **Error de FK**: Se corrigió la violación de llave foránea al guardar mensajes asegurando que el `chatId` exista antes de insertar.
- **Paginación**: Implementación de `.range()` para `listChats` y `getMessages`.
- **Bypass de Fetch**: Corregido el error `TypeError: fetch failed` mediante la optimización de llamadas internas a Supabase.

### 2. Bypass de Streams de Archivos (`src/app.ts`)
- **Problema**: El `body-parser` global consumía los streams de `multipart/form-data` antes de llegar a las rutas, rompiendo la subida de archivos.
- **Solución**: Se implementó un "Master-Interceptor" al inicio de los middlewares que captura `/api/backoffice/send-message` y procesa con `multer` ANTES de cualquier `body-parser`.

### 3. Recupero de Sesión (`src/utils/sessionSync.ts` y `app.ts`)
- Se automatizó `restoreSessionFromDb()` al inicio del `main()` para garantizar que el bot mantenga la sesión de WhatsApp incluso tras reinicios en entornos como Railway.

## 🚀 Objetivos de Refactorización Total

### 1. Refactorización de `app.ts`
- **Modularidad**: Mover la lógica de middlewares y configuración de Multer a archivos separados.
- **Limpieza de Interceptores**: El "Master-Interceptor" es funcional pero "sucio". Se recomienda moverlo a un archivo de middleware dedicado o integrar mejor con la cola de Polka/Express.
- **Inyección de Dependencias**: Mejorar cómo se pasan `adapterProvider` y `aiManager` a las rutas.

### 2. Refactorización de HTML (`src/html/`)
- **Componentización**: Extraer partes repetitivas (Sidebar, Navbar) en fragmentos (templates).
- **Consistencia Visual**: Unificar el bot name (`ASSISTANT_NAME`) en todas las vistas (`login`, `dashboard`, `backoffice`).
- **Responsive Design**: Mejorar el Sidebar para dispositivos móviles.

### 3. Refactorización de `backoffice.js`
- **Estado Global**: Migrar de variables sueltas a un objeto de estado consolidado.
- **Rendimiento**: Implementar búsqueda global con paginación (el actual es solo local sobre lo cargado).
- **Socket.IO**: Optimizar la actualización de mensajes en tiempo real para usar los datos paginados correctamente.

## 📂 Archivos Clave para el Asistente

Para aplicar estas mejoras eficientemente, el asistente debe leer:

### Core & Logic
1. `src/app.ts`: Punto de entrada y orquestación de middlewares.
2. `src/utils/historyHandler.ts`: Lógica de base de datos y paginación.
3. `src/utils/ai.manager.ts`: Lógica modular de la IA.
4. `src/middleware/global.ts`: Middlewares críticos de compatibilidad.

### Backoffice (Frontend & API)
5. `src/js/backoffice.js`: Toda la lógica del panel (Infinite Scroll, Tags, Sockets).
6. `src/routes/backoffice.routes.ts`: Endpoints que alimentan el backoffice.
7. `src/html/backoffice.html`: Estructura principal de la interfaz.
8. `src/html/dashboard.html` y `src/html/login.html`: Vistas auxiliares.

### Documentación de Apoyo
9. `api-docs/guia_paginacion.md`: Guía técnica de cómo funciona el Infinite Scroll.
10. `api-docs/backoffice.md`: Referencia de la API.
