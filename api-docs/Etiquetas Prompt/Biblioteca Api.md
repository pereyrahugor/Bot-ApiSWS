# 🏷️ Biblioteca de Etiquetas para Prompts (API SWS)

Esta biblioteca contiene el formato exacto de los bloques JSON que el asistente debe generar para interactuar con la API.

### 👥 Gestión de Clientes

**BUSCAR_CLIENTE** (API 2)
- **Uso:** Encontrar el `cliente_id` de un cliente activo. Priorizar ID > DNI/CUIT > Dirección > Nombre.
- **Formato:** `[API]{ "type": "BUSCAR_CLIENTE", "datosCliente": "Nombre|DNI|CUIT|ID", "telefono": "TelefonoOpcional", "domicilio": "Direccion" }[/API]`

**OBTENER_DATOS_CLIENTE** (API 8)
- **Uso:** Obtener la ficha completa del cliente una vez que se tiene el `cliente_id`.
- **Formato:** `[API]{ "type": "OBTENER_DATOS_CLIENTE", "cliente_id": 123 }[/API]`

**OBTENER_SUCURSALES_CLIENTE** (API 9)
- **Uso:** Identificar una sucursal específica si el cliente tiene múltiples domicilios.
- **Formato:** `[API]{ "type": "OBTENER_SUCURSALES_CLIENTE", "cliente_id": 123 }[/API]`

**CREAR_CLIENTE** (API 6)
- **Uso:** Alta temprana de nuevo cliente (prospecto). El `reparto_id` se obtiene de la búsqueda de zona.
- **Formato:** `[API]{ "type": "CREAR_CLIENTE", "cliente": { "nombre": "Juan", "apellido": "Pérez", "telefono": "+549...", "email": "x@x.com", "dni": "...", "domicilio": "Calle 123", "tipoCliente": "Familia|Empresa" }, "reparto_id": 1007 }[/API]`

---

### 📍 Logística y Zona

**CLIENTES_CERCANOS_DIRECCION** (API 12)
- **Uso:** Validar zona para nuevos clientes. Solicitar siempre: Ciudad, Barrio, Calle y Altura.
- **Formato:** `[API]{ "type": "CLIENTES_CERCANOS_DIRECCION", "address": "Cordoba, Av. Maipu 123", "metros": 500}[/API]`

**CLIENTES_CERCANOS_A_CLIENTE** (Interno)
- **Uso:** Consultar día y horario de reparto basándose en la zona de un cliente actual.
- **Formato:** `[API]{ "type": "CLIENTES_CERCANOS_A_CLIENTE", "clienteId": 123 }[/API]`

**CLIENTES_CERCANOS_COORDENADA** (API 4)
- **Uso:** Búsqueda técnica por coordenadas GPS.
- **Formato:** `[API]{ "type": "CLIENTES_CERCANOS_COORDENADA", "latitud": "-31...", "longitud": "-64...", "radioMetros": 500 }[/API]`

---

### 🎫 Gestión de Incidentes

**INCIDENCIA** (API 3)
- **Uso:** Registrar pedidos, reclamos o servicio técnico.
- **Formato:** `[API]{ "type": "INCIDENCIA", "cliente_id": 123, "titulo": "...", "descripcion": "...", "prioridad": "Alta|Media|Baja", "tipoIncidente_ids": 1, "subTipoIncidente_ids": 1 }[/API]`

**BUSCAR_INCIDENCIA** (API 26)
- **Uso:** Consultar el historial de tickets o el estado de un reclamo anterior.
- **Formato:** `[API]{ "type": "BUSCAR_INCIDENCIA", "cliente_id": 123, "fechaDesde": "dd/mm/aaaa", "fechaHasta": "dd/mm/aaaa" }[/API]`

---

### 💰 Facturación, Pagos y Saldos

**OBTENER_SALDOS** (API 21)
- **Uso:** Obtener de forma rápida el saldo adeudado y la fecha de la próxima visita del preventista/repartidor.
- **Formato:** `[API]{ "type": "OBTENER_SALDOS", "cliente_id": 123 }[/API]`

**LINK_PAGO** (API 20)
- **Uso:** Generar un link de Mercado Pago para abono de saldos o facturas.
- **Formato:** `[API]{ "type": "LINK_PAGO", "cliente_id": 123, "monto": 1500 }[/API]`

**HISTORIAL_FACTURAS** (API 13)
- **Uso:** Consultar facturas emitidas en un periodo.
- **Formato:** `[API]{ "type": "HISTORIAL_FACTURAS", "cliente_id": 123, "fechaDesde":"dd/mm/aaaa", "fechaHasta": "dd/mm/aaaa", "saldoPendiente": false }[/API]`

**RECIBOS_PAGO** (API 14)
- **Uso:** Consultar comprobantes de pago recibidos.
- **Formato:** `[API]{ "type": "RECIBOS_PAGO", "cliente_id": 123 , "fechaDesde":"dd/mm/aaaa", "fechaHasta": "dd/mm/aaaa" }[/API]`

**RESUMEN_CUENTA** (API 15)
- **Uso:** Ver estado de cuenta corriente detallado (créditos y débitos).
- **Formato:** `[API]{ "type": "RESUMEN_CUENTA", "cliente_id": 123, "fechaDesde":"dd/mm/aaaa", "fechaHasta": "dd/mm/aaaa" }[/API]`

---

### 🚚 Movimientos y Servicios

**REMITOS_ENTREGA** (API 17)
- **Uso:** Listar las entregas realizadas (consumos) al cliente.
- **Formato:** `[API]{ "type": "REMITOS_ENTREGA", "cliente_id": 123, "fechaDesde": "dd/mm/aaaa", "fechaHasta": "dd/mm/aaaa", "consumosSinFacturar": false }[/API]`

**ORDEN_TRABAJO** (API 16)
- **Uso:** Consultar el estado de órdenes de servicio técnico.
- **Formato:** `[API]{ "type": "ORDEN_TRABAJO", "clienteId": 123, "fechaDesde": "dd/mm/aaaa", "fechaHasta": "dd/mm/aaaa" }[/API]`

---

### 📦 Productos y Precios

**PRECIO** (API 5)
- **Uso:** Ver precios actuales asignados al cliente.
- **Formato:** `[API]{ "type": "PRECIO", "ClienteId": 123 }[/API]`

**PRODUCTOS** (Interno)
- **Uso:** Consultar catálogo de productos disponibles para el cliente.
- **Formato:** `[API]{ "type": "PRODUCTOS", "ClienteId": 123 }[/API]`

**MATRIZ_LISTA_PRECIOS** (API 10)
- **Uso:** Consultar la matriz general de precios por zona.
- **Formato:** `[API]{ "type": "MATRIZ_LISTA_PRECIOS", "tipoLista_id": 1 }[/API]`

**ABONOS_TIPOS** (API 11)
- **Uso:** Mostrar opciones de abono mensual disponibles.
- **Formato:** `[API]{ "type": "ABONOS_TIPOS" }[/API]`

---

### 📧 Reenvío y Descargas

**REENVIAR_DOCUMENTO**
- **Uso:** Reenviar comprobantes por email (APIs 22, 23, 24).
- **Tipos:**
  - `[API]{ "type": "REENVIAR_FACTURA_POR_MAIL", "facturaId": 123 }[/API]`
  - `[API]{ "type": "REENVIAR_REMITO_POR_MAIL", "remitoId": 123 }[/API]`
  - `[API]{ "type": "REENVIAR_RECIBO_POR_MAIL", "reciboId": 123 }[/API]`

**DESCARGA_ARCHIVO**
- **Uso:** Obtener links de descarga para documentos (APIs 18, 19).
- **Formatos:**
  - `[API]{ "type": "DESCARGA_REMITO", "remito_id": 123 }[/API]`
  - `[API]{ "type": "DESCARGA_ARCHIVO", "archivo_id": 123 }[/API]`

---

### 🔐 Otros

**OBTENER_CREDENCIALES_AUTOGESTION** (API 25)
- **Uso:** Brindar acceso al portal web de autogestión.
- **Formato:** `[API]{ "type": "OBTENER_CREDENCIALES_AUTOGESTION", "id": 123 }[/API]`