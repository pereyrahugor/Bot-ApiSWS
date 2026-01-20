# ⚙️ Variables de Entorno

Este documento detalla las variables de entorno necesarias para el funcionamiento del Bot y su integración con la API SWS, OpenAI, Google y Supabase.

## 🤖 OpenAI y Asistente

Variables utilizadas para la comunicación con los modelos de lenguaje y la gestión de hilos.

| Variable | Descripción |
| :--- | :--- |
| `OPENAI_API_KEY` | Key principal de OpenAI para el procesamiento de texto. |
| `OPENAI_API_KEY_IMG` | Key secundaria para el procesamiento de imágenes/vídeo si aplica. |
| `ASSISTANT_ID` | Identificador del asistente principal en OpenAI. |
| `ASSISTANT_ID_IMG` | Identificador del asistente especializado en análisis visual. |
| `ASSISTANT_NAME` | Nombre descriptivo del asistente para reportes. |

## 🌐 Google Integration

Configuraciones para el acceso a Google Sheets (bases de datos de conocimiento) y Google Maps (geolocalización).

| Variable | Descripción |
| :--- | :--- |
| `GOOGLE_CLIENT_EMAIL` | Email de la cuenta de servicio de Google Cloud. |
| `GOOGLE_PRIVATE_KEY` | Llave privada de la cuenta de servicio (formato RSA). |
| `GOOGLE_MAPS_API_KEY` | Key de Google Maps para validación de direcciones y cálculo de rutas. |
| `SHEET_ID_UPDATE` | ID de la hoja de cálculo de Google donde se leen los datos maestros. |
| `SHEET_ID_RESUMEN` | ID de la hoja de cálculo donde se exportan los reportes de actividad. |
| `GOOGLE_CALENDAR_ID` | (Opcional) ID del calendario para agendamiento de turnos. |

## 🗄️ Persistencia (Supabase)

Utilizado para almacenar los archivos de sesión de WhatsApp (`bot_sessions`) y asegurar que el bot no pierda el logueo al reiniciarse.

| Variable | Descripción |
| :--- | :--- |
| `SUPABASE_URL` | URL del proyecto en Supabase. |
| `SUPABASE_KEY` | Service Role Key para operaciones de lectura/escritura en el bucket. |

## 🔌 API SWS (Sistema de Gestión)

Variables críticas para la comunicación con el backend de gestión de la empresa.

| Variable | Descripción |
| :--- | :--- |
| `SWS_BASE_URL` | URL base de la API (ej: `http://demo.chatbot.sistemaws.com`). |
| `SWS_USERNAME` | Usuario de servicio para obtener el token de sesión. |
| `SWS_PASSWORD` | Contraseña del usuario de servicio. |

## 🚉 Railway (Despliegue)

Variables para la gestión del ciclo de vida del bot dentro de la infraestructura de Railway.

| Variable | Descripción |
| :--- | :--- |
| `RAILWAY_TOKEN` | Token de API de Railway para reinicios y gestión. |
| `RAILWAY_PROJECT_ID` | ID del proyecto activo. |
| `RAILWAY_SERVICE_ID` | ID del servicio específico del bot. |
| `RAILWAY_ENVIRONMENT_ID` | ID del entorno (production/staging). |

## 💬 Configuración del Chatbot

Mensajes y tiempos de espera personalizables para el flujo de atención.

| Variable | Descripción |
| :--- | :--- |
| `msjCierre` | Mensaje final de despedida y reporte. |
| `msjSeguimiento1` | Primer mensaje de seguimiento tras inactividad. |
| `msjSeguimiento2` | Segundo mensaje de seguimiento. |
| `msjSeguimiento3` | Tercer mensaje de seguimiento. |
| `timeOutCierre` | Días/Horas para considerar una sesión como cerrada. |
| `timeOutSeguimiento2` | Tiempo de espera para el segundo seguimiento. |
| `timeOutSeguimiento3` | Tiempo de espera para el tercer seguimiento. |

---

### ⚠️ Notas de Seguridad
- Nunca subas el archivo `.env` al repositorio de Git (está incluido en `.gitignore`).
- En producción (Railway), estas variables deben configurarse en la sección **Variables** del servicio.
