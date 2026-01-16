# Documentación API SWS v5.0

Bienvenido a la documentación oficial de la API del Sistema Web SWS.

## 📚 Contenido

Esta documentación está organizada en las siguientes secciones:

### Introducción
- [Acerca de la API](introduccion/acerca-de.md) - Información general y conceptos básicos
- [Changelog](introduccion/changelog.md) - Historial de versiones y cambios

### Autenticación
- [Obtener Token](autenticacion/obtener-token.md) - Cómo autenticarse en la API
- [Uso del Token](autenticacion/uso-del-token.md) - Guía de uso del token en requests

### Clientes
- [Búsqueda Rápida](clientes/busqueda-rapida.md) - Buscar clientes por múltiples criterios
- [Obtener Datos del Cliente](clientes/obtener-datos.md) - Información detallada de un cliente
- [Obtener Sucursales](clientes/obtener-sucursales.md) - Sucursales de un cliente
- [Crear Nuevo Cliente](clientes/crear-cliente.md) - Registro de nuevos clientes
- [Agregar Contacto](clientes/agregar-contacto.md) - Agregar contactos a clientes
- [Credenciales de Autogestión](clientes/credenciales-autogestion.md) - Acceso al portal

### Logística y Repartos
- [Clientes Cercanos por Coordenadas](logistica/clientes-cercanos-coordenadas.md)
- [Clientes Cercanos por Dirección](logistica/clientes-cercanos-direccion.md)
- [Clientes Cercanos a Cliente](logistica/clientes-cercanos-cliente.md)

### Productos y Precios
- [Lista de Precios del Cliente](productos/lista-precios-cliente.md)
- [Matriz de Lista de Precios](productos/matriz-lista-precios.md)
- [Tipos de Abonos](productos/tipos-abonos.md)

### Facturación
- [Historial de Facturas](facturacion/historial-facturas.md)
- [Recibos de Pago](facturacion/recibos-pago.md)
- [Resumen de Cuenta](facturacion/resumen-cuenta.md)
- [Reenviar Factura por Mail](facturacion/reenviar-factura.md)

### Movimientos y Entregas
- [Remitos de Entrega](movimientos/remitos-entrega.md)
- [Descargar Remito](movimientos/descargar-remito.md)
- [Descargar Remito por Venta](movimientos/descargar-remito-venta.md)
- [Reenviar Remito por Mail](movimientos/reenviar-remito.md)
- [Reenviar Recibo por Mail](movimientos/reenviar-recibo.md)

### Servicios Técnicos
- [Obtener Servicios Técnicos](servicios/obtener-servicios-tecnicos.md)

### Incidentes
- [Crear Ticket](incidentes/crear-ticket.md)

### Archivos
- [Descargar Archivo](archivos/descargar-archivo.md)

### Referencia
- [Códigos de Error](referencia/codigos-error.md) - Referencia completa de errores
- [Tipos de Datos](referencia/tipos-datos.md) - Estructuras y tipos de datos
- [Ejemplos Completos](referencia/ejemplos.md) - Ejemplos de uso en escenarios reales

## 🚀 Inicio Rápido

### 1. Autenticación

```javascript
const response = await fetch('http://demo.chatbot.sistemaws.com/api/Session/GetToken', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'demo2024'
  })
});

const { tokenValido } = await response.json();
```

### 2. Realizar una Petición

```javascript
const clienteResponse = await fetch('http://demo.chatbot.sistemaws.com/api/Clientes/ObtenerDatosCliente', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CURRENTTOKENVALUE': tokenValido
  },
  body: JSON.stringify({ cliente_id: 208 })
});

const cliente = await clienteResponse.json();
```

## 📖 Formato GitBook

Esta documentación está estructurada para ser utilizada con GitBook. El archivo `SUMMARY.md` contiene el índice completo de la documentación.

### Uso con GitBook

1. Instalar GitBook CLI:
```bash
npm install -g gitbook-cli
```

2. Inicializar GitBook en esta carpeta:
```bash
cd api-docs
gitbook init
```

3. Servir la documentación localmente:
```bash
gitbook serve
```

4. Generar sitio estático:
```bash
gitbook build
```

## 🔗 URL Base

```
http://demo.chatbot.sistemaws.com
```

## 📝 Notas Importantes

- Todos los endpoints requieren autenticación mediante token
- Las fechas deben enviarse en formato `DD/MM/YYYY`
- Las respuestas exitosas tienen `error: 0`
- El token tiene una duración limitada y debe renovarse

## 📄 Documentación Original

El archivo PDF original de la documentación se encuentra en:
- `__Manual_de_Usuario_API-SWS_V5.pdf`

## 🤝 Soporte

Para consultas o soporte técnico, contactar al equipo de desarrollo.

---

**Versión**: 5.0  
**Última actualización**: 2026-01-16
