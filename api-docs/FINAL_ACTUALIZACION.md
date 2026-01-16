# Resumen de Actualización de Documentación API v5.0

Se ha completado la actualización exhaustiva de la documentación basada en el **Manual de Usuario API – Integración Chatbot v5.0**.

## 🚀 Cambios Principales

1. **Actualización Completa de Endpoints**: Todos los 25 puntos del manual oficial han sido revisados y actualizados.
2. **Ejemplos Reales**: Se reemplazaron todas las respuestas de ejemplo con la estructura real del sistema (incluyendo objetos complejos como `visitas`, `ultimasVisitas`, `coordenadas`, `ArticulosDeListaDePrecio`, etc.).
3. **Documentación de Campos**: Se expandió la cantidad de campos documentados por endpoint (pasando de ~10 a 40+ en casos como Datos del Cliente).
4. **Notas Técnicas**:
   - Corrección de formato de fechas (`/Date(timestamp)/`).
   - Documentación del comportamiento del radio de búsqueda (incrementos de 250m).
   - Inclusión de tablas de referencia para **Sectores de Contacto**, **Tipos de Incidentes**, **Actividades** y **Condiciones de IVA**.
5. **Nuevos Endpoints Agregados**:
   - `Obtener Link de Mercado Pago`
   - `Obtener Saldos del Cliente`
   - `Credenciales de Autogestión`
   - `Descarga de Archivos/Publicaciones`

## 📂 Archivos Actualizados/Creados

- `api-docs/clientes/busqueda-rapida.md`
- `api-docs/clientes/obtener-datos.md`
- `api-docs/clientes/obtener-sucursales.md`
- `api-docs/clientes/obtener-saldos.md` (Nuevo)
- `api-docs/clientes/crear-cliente.md`
- `api-docs/clientes/agregar-contacto.md`
- `api-docs/clientes/credenciales-autogestion.md`
- `api-docs/facturacion/historial-facturas.md`
- `api-docs/facturacion/recibos-pago.md`
- `api-docs/facturacion/resumen-cuenta.md`
- `api-docs/facturacion/reenviar-factura.md`
- `api-docs/facturacion/obtener-link-mp.md` (Nuevo)
- `api-docs/movimientos/remitos-entrega.md`
- `api-docs/movimientos/descargar-remito-venta.md`
- `api-docs/movimientos/reenviar-remito.md`
- `api-docs/movimientos/reenviar-recibo.md`
- `api-docs/servicios/obtener-servicios-tecnicos.md`
- `api-docs/incidentes/crear-ticket.md`
- `api-docs/archivos/descargar-archivo.md`
- `api-docs/referencia/codigos-error.md`
- `api-docs/SUMMARY.md`

## ⚠️ Pendientes y Observaciones

- **Limpieza**: El archivo `__Manual_de_Usuario_API-SWS_V5.md` permanece en la carpeta `api-docs/` por si es necesaria una revisión final.
- **Git Sync**: Los cambios están listos para ser pusheados. He notado procesos de `git commit` previos que parecen bloqueados, se recomienda revisar el estado del repositorio antes de hacer el Push final.
