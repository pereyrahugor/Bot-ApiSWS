# 📖 Manual de Usuario API – Integración Chatbot

Este manual describe cómo interactuar con los distintos endpoints disponibles para la integración del chatbot con el sistema **SWS**.

## 🔑 Autenticación y Reglas Generales

Todos los endpoints, a excepción del inicio de sesión (Login), requieren un encabezado (**HEADER**) con el token obtenido al loguearse.

**Definición del Header:**

| Nombre | Valor | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| `CURRENTTOKENVALUE` | Token de sesión | Alfanumérico (40) | Obtenido con el método `GetToken()` |

### 🚀 Respuestas del Servidor

Los endpoints que devuelven JSON siempre retornarán un código de estado **200 OK**. 
- **Éxito:** El campo `"error"` dentro de la respuesta será igual a `0`.
- **Error:** El campo `"error"` será distinto de `0` y tendrá la siguiente estructura:

```json
{
  "error": 1,
  "message": "Mensaje de error determinado por el servidor",
  ...
}
```

---

## 📑 Índice de Contenidos

1. [🔑 1. Logueo para el sistema](#1-logueo-para-el-sistema)
2. [🔍 2. Identificación del cliente](#2-identificación-del-cliente)
3. [🎫 3. Generación de ticket (Incidente)](#3-generación-de-ticket)
4. [📍 4. Clientes cercanos por coordenada](#4-clientes-cercanos-por-coordenada)
5. [💰 5. Obtener lista de precios del cliente](#5-obtener-lista-de-precios-del-cliente)
6. [📝 6. Generación del Alta Temprana](#6-generación-del-alta-temprana-del-cliente)
7. [👤 7. Agregar contacto a cliente](#7-agregar-contacto-a-cliente)
8. [📊 8. Obtener datos de un cliente](#8-obtener-datos-de-un-cliente)
9. [🏢 9. Obtener cliente Sucursales](#9-obtener-cliente-sucursales)
10. [📋 10. Obtener matriz de lista de precios](#10-obtener-matriz-de-lista-de-precios)
11. [📦 11. Obtener abonos tipos](#11-obtener-abonos-tipos)
12. [🏠 12. Clientes cercanos por dirección](#12-clientes-cercanos-por-dirección)
13. [📄 13. Historial de facturas por fecha](#13-historial-de-facturas-del-cliente-por-fecha)
14. [🧾 14. Recibos de pago de un cliente](#14-recibos-de-pago-de-un-cliente)
15. [🏦 15. Resumen de cuenta cliente](#15-resumen-de-cuenta-cliente)
16. [🛠️ 16. Orden de trabajo servicio técnico](#16-orden-de-trabajo-servicio-técnico)
17. [🚚 17. Remitos de entrega](#17-remitos-de-entrega)
18. [📥 18. Descarga de remitos de entrega](#18-descarga-de-remitos-de-entrega)
19. [📂 19. Descarga de archivos](#19-descarga-de-archivos)
20. [💳 20. Obtener link mercado pago](#20-obtener-link-mercado-pago)
21. [💰 21. Obtener saldos de cliente](#21-obtener-saldos-de-cliente)
22. [📧 22. Reenvío de Factura](#22-reenvío-de-factura)
23. [📧 23. Reenvío de Remito](#23-reenvío-de-remito)
24. [📧 24. Reenvío de Recibo](#24-reenvío-de-recibo)
25. [🔐 25. Obtener Usuario y Contraseña](#25-obtener-usuario-y-contraseña-de-un-cliente)
26. [⚠️ 26. Obtener Incidentes de un Cliente](#26-obtener-incidentes-de-un-cliente)

---

<a name="1-logueo-para-el-sistema"></a>
## 🔑 1. Logueo para el sistema

**Descripción:** Autentica al usuario y devuelve un token para el uso de los demás endpoints.

- **Endpoint:** `POST /api/Session/GetToken`
- **Content-Type:** `application/json`

### Parámetros de entrada (JSON)

```json
{
  "username": "admin",
  "password": "sistemaws"
}
```

| Parámetro | Tipo | Longitud | Descripción |
| :--- | :--- | :--- | :--- |
| `username` | Alfanumérico | 50 | Nombre del usuario para inicio de sesión |
| `password` | Alfanumérico | 50 | Contraseña de usuario |

### Ejemplo de respuesta

```json
{
  "tokenValido": "687f8b1325da9d0d54c3f046",
  "vencimiento": "2025-07-22 11:58:59",
  "error": 0,
  "message": "Logueo correcto",
  "usuario_id": 12
}
```

> **Importante:** Se debe almacenar tanto el `tokenValido` como el `usuario_id`, ya que ambos son utilizados en llamadas posteriores a la API.

---

<a name="2-identificación-del-cliente"></a>
## 🔍 2. Identificación del cliente

**Descripción:** Devuelve los datos de un cliente en base a algún criterio (teléfono, nombre, DNI/CUIT o domicilio).

- **Endpoint:** `POST /api/Clientes/BusquedaRapidaResultJson`
- **Content-Type:** `application/json`

### Parámetros de entrada (JSON)

```json
{
  "datosCliente": "christian",
  "telefono": "+54",
  "dni": "3",
  "domicilio": "a"
}
```

> **Nota:** Se puede realizar la búsqueda utilizando cualquiera de los parámetros (datosCliente, teléfono, dni, domicilio) de forma individual o combinada.

| Parámetro | Tipo | Longitud | Descripción |
| :--- | :--- | :--- | :--- |
| `datosCliente` | Alfanumérico | 50 | Búsqueda por nombre o datos de facturación |
| `telefono` | Alfanumérico | 15 | Búsqueda por número de teléfono |
| `dni` | Alfanumérico | 20 | Búsqueda por DNI o CUIT |
| `domicilio` | Alfanumérico | 80 | Búsqueda por dirección |

### Ejemplo de respuesta

```json
{
  "data": [
    {
      "cliente_id": 53,
      "nombreCliente": "Alvarez Pablo",
      "nombreReparto": "1234",
      "nombrePromotor": "Admin",
      "actividad_ids": 24,
      "tipoCliente_ids": 1,
      "estadoCliente_ids": 1,
      "promotor_id": 1,
      "reparto_id": 2,
      "dniCliente": null,
      "nombreProvincia": "Buenos Aires",
      "nombreCiudad": "Brandsen",
      "nombreBarrio": "Brandsen",
      "domicilioCompleto": "Brandsen, Rivadavia 770.",
      "provincia_ids": 2,
      "ciudad_id": 10,
      "barrio_id": 477,
      "calle_id": 17,
      "numeroPuerta": "770",
      "nombreCalle": "Rivadavia",
      "actividadCliente": "Taller",
      "tipoCliente": "Familia",
      "estadoCliente": "Activo",
      "datosCompletos": true,
      "fechaIngreso": "/Date(1577847600000)/",
      "codigoPostal": "1980",
      "condicionIva_ids": 2,
      "tipoFactura_ids": 2,
      "cuit": "1111111111",
      "razonSocial": "Alvarez Pablo",
      "centroDistribucion_id": 1,
      "centroDeDistribucion": "CD Testing",
      "situacionConsumo": 1,
      "situacionSaldos": 1
    }
  ],
  "error": 0,
  "message": ""
}
```

---

<a name="3-generación-de-ticket"></a>
## 🎫 3. Generación de ticket (Incidente)

**Descripción:** Crea un ticket para que un operador gestione un requerimiento o reclamo del cliente.

- **Endpoint:** `POST /api/Incidentes/Save`
- **Content-Type:** `application/json`

### Clasificación de Incidentes

Existen diferentes tipos y subtipos de incidentes definidos en el sistema. El asistente utilizará principalmente los tipos **1** y **2**:

#### Tipos Sugeridos
| Id | Nombre | Uso |
| :--- | :--- | :--- |
| **1** | Gestión en ruta | Consultas de artículos, reclamos por visitas, cobranzas |
| **2** | Servicio Técnico | Instalaciones, sanitizaciones, reparaciones |
| **8** | Gestión Administrativa | Trámites burocráticos |
| **60** | Gestión de alertas | Coordenadas, altas rápidas |

#### Subtipos comunes (Ejemplos)
- **Gestión en ruta (1):** 1 (Solicitud artículos), 2 (Reclamo no visita), 13 (Gestión cobranza).
- **Servicio Técnico (2):** 4 (Instalación), 5 (Quitar dispenser), 7 (Sanitización), 9 (Reparación).
- **Gestión de alertas (60):** 100 (Toma de coordenadas), 509 (Alta rápida).

### Parámetros de entrada (JSON)

```json
{
  "centroDistribucion_id": 3,
  "cliente_id": 1018,
  "descripcion": "<p>Descripción Prueba</p>",
  "estadoIncidente_ids": null,
  "fechaCierreEstimado": "21/7/2025",
  "severidad_ids": 2,
  "subTipoIncidente_ids": 1,
  "tipoIncidente_ids": 50,
  "titulo": "Titulo Prueba",
  "usuarioResponsable_id": null
}
```

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `centroDistribucion_id` | numérico | Id del centro de distribución |
| `cliente_id` | numérico | Id del cliente |
| `descripcion` | Alfanumérico | Detalle del incidente (soporta HTML) |
| `estadoIncidente_ids` | numérico | 1: Abierto, 5: Cerrado, 3: Cancelado, 4: Pausado |
| `fechaCierreEstimado` | Alfanumérico | Fecha de cierre esperado (dd/MM/yyyy) |
| `severidad_ids` | numérico | 1: Baja, 2: Media, 3: Alta |
| `tipoIncidente_ids` | numérico | Id del tipo principal |
| `subTipoIncidente_ids` | numérico | Id del subtipo específico |
| `titulo` | Alfanumérico | Título resumen del incidente |

### Ejemplo de respuesta

```json
{
  "error": 0,
  "incidente": {
    "id": 10190,
    "fechaHoraRegistro": "/Date(1753112501144)/",
    "cliente_id": 1018,
    "titulo": "Titulo Prueba",
    "estadoIncidente_ids": 1
  }
}
```

---

<a name="4-clientes-cercanos-por-coordenada"></a>
## 📍 4. Clientes cercanos por coordenada

**Descripción:** Lista clientes dentro de un radio determinado a partir de coordenadas GPS (latitud/longitud).

- **Endpoint:** `GET /Repartos/ObtenerClientesCercanosPorCoordenadas`

### Parámetros (Query Params)

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `latitud` | Alfanumérico | Latitud GPS del centro de búsqueda |
| `longitud` | Alfanumérico | Longitud GPS del centro de búsqueda |
| `radioMetros` | numérico | Radio de búsqueda en metros |
| `excluir` | Booleano | Filtro opcional (normalmente `false`) |

### Ejemplo de respuesta

```json
{
  "clientesCercanos": [
    {
      "cliente_id": 1017,
      "nombreCliente": "Julieta Pillado",
      "domicilioCompleto": "Córdoba, PADRE FRANCISCO PALAU 6575. depto 3.",
      "distanciaMetros": 86.18,
      "proximaVisita": "/Date(1753401600000)/",
      "diasProximaVisita": 3
    }
  ],
  "error": 0
}
```

---

<a name="5-obtener-lista-de-precios-del-cliente"></a>
## 💰 5. Obtener lista de precios de un cliente

**Descripción:** Devuelve la lista de precios y productos asignada a un cliente específico.

- **Endpoint:** `GET /ListaDePrecios/ObtenerListaDePreciosDeCliente`

### Parámetros (Query Params)

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `ClienteId` | numérico | Identificador único del cliente |

### Ejemplo de respuesta

```json
{
  "ArticulosDeListaDePrecio": {
    "Bidon x 20 lts": 800.0,
    "Bidon x 12 lts": 500.0,
    "Sifon x 1 1/4": 500.0,
    "bidon de 20L Monte": 150.0,
    "bidon de 12L Monte": 200.0
  },
  "error": 0
}
```

---

<a name="6-generación-del-alta-temprana-del-cliente"></a>
## 📝 6. Generación del Alta Temprana (Prospecto)

**Descripción:** Registra anticipadamente un nuevo cliente (prospecto) en el sistema.

- **Endpoint:** `POST /Clientes/CrearNuevoClientePorChatBot`
- **Content-Type:** `application/json`

### Parámetros de entrada (JSON)

```json
{
  "cliente": {
    "nombre": "Cliente de alta rapida",
    "tipoDeClienteId": 1,
    "condicionIvaId": 2,
    "dniCuit": "3454564566",
    "telefono": "00",
    "email": "test@ejemplo.com",
    "listaDePreciosId": 1,
    "reparto_id": 1007,
    "domicilio": {
      "provincia": "Salta",
      "ciudad": "Salta",
      "calle": "Av. Sarmiento",
      "puerta": 2,
      "piso": "4",
      "depto": "b",
      "cp": "X5012",
      "latitud": "-31.3651314",
      "longitud": "-64.156489"
    }
  }
}
```

#### Parámetros Principales
| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `nombre` | Alfanumérico | Nombre completo o Razón Social |
| `tipoDeClienteId` | numérico | 1: Familia, 2: Empresa |
| `condicionIvaId` | numérico | 1: RI, 2: CF, 3: Monotributo, 4: Exento |
| `reparto_id` | numérico | ID del reparto asignado (debe ir dentro del objeto cliente) |
| `domicilio` | Objeto | Estructura con datos de ubicación (Provincia, Ciudad, Calle, Nro, etc.) |

### Ejemplo de respuesta

```json
{
  "error": 0,
  "message": "",
  "data": {
    "cliente_id": 1042,
    "nombreCliente": "Cliente de alta rapida",
    "estadoCliente": "Borrador",
    "domicilioCompleto": "ALEJANDRA PIZERNICK 2. piso 4. depto b."
  }
}
```

---

<a name="7-agregar-contacto-a-cliente"></a>
## 👤 7. Agregar contacto a cliente

**Descripción:** Añade un contacto secundario o alternativo a un cliente existente.

- **Endpoint:** `POST /api/Clientes/CreateContacto`
- **Content-Type:** `application/json`

### Parámetros de entrada (JSON)

```json
{
  "ModeloContacto": {
    "cliente_id": 33,
    "tipoContacto_ids": 1,
    "nombrePersona": "Juan Perez",
    "telefono": "+5411...",
    "sector_ids": 6
  }
}
```

### Ejemplo de respuesta

```json
{
  "error": "0",
  "message": "El contacto ha sido creado exitosamente",
  "cliente_id": "33"
}
```

---

<a name="8-obtener-datos-de-un-cliente"></a>
## 📊 8. Obtener datos de un cliente

**Descripción:** Recupera la ficha completa de un cliente por su ID.

- **Endpoint:** `POST /api/Clientes/ObtenerDatosCliente`

### Parámetros de entrada (JSON)

```json
{
  "cliente_id": 208
}
```

### Ejemplo de respuesta

```json
{
  "cliente_id": 208,
  "nombreCliente": "Neyra Patricia",
  "estadoCliente": "Activo",
  "centroDeDistribucion": "CD Testing",
  "error": 0
}
```

---

<a name="9-obtener-cliente-sucursales"></a>
## 🏢 9. Obtener cliente Sucursales

**Descripción:** Devuelve los datos de un cliente y la lista de sus sucursales asociadas.

- **Endpoint:** `POST /api/Clientes/ObtenerSucursalesJson`

### Parámetros de entrada (JSON)

```json
{
  "cliente_id": 208
}
```

---

<a name="10-obtener-matriz-de-lista-de-precios"></a>
## 📋 10. Obtener matriz de lista de precios

**Descripción:** Obtiene todos los artículos y sus precios para un tipo de lista determinado.

- **Endpoint:** `GET /ListaDePrecios/ObtenerMatrizListaDePrecios`

---

<a name="11-obtener-abonos-tipos"></a>
## 📦 11. Obtener abonos tipos

**Descripción:** Obtiene una lista de los tipos de abonos disponibles en el sistema.

- **Endpoint:** `GET /AbonosTipos/ObtenerAbonosTipos`

---

<a name="12-clientes-cercanos-por-dirección"></a>
## 🏠 12. Clientes cercanos por dirección

**Descripción:** Lista clientes dentro de un radio determinado a partir de una dirección textual.

- **Endpoint:** `GET /Repartos/BusquedaClientesCercanosResultJson`

---

<a name="13-historial-de-facturas-del-cliente-por-fecha"></a>
## 📄 13. Historial de facturas por fecha

**Descripción:** Obtiene el listado de facturas emitidas para un cliente en un rango de fechas.

- **Endpoint:** `POST /Facturacion/ObtenerHistorialDeFacturas`

---

<a name="14-recibos-de-pago-de-un-cliente"></a>
## 🧾 14. Recibos de pago de un cliente

**Descripción:** Obtiene los recibos de cobro de un cliente en un rango de fechas.

- **Endpoint:** `POST /Recibos/ObtenerRecibosDeCobros`

---

<a name="15-resumen-de-cuenta-cliente"></a>
## 🏦 15. Resumen de cuenta cliente

**Descripción:** Devuelve los movimientos financieros y de consumo de un cliente.

- **Endpoint:** `POST /Movimientos/BuscarMovimientos`

---

<a name="16-orden-de-trabajo-servicio-técnico"></a>
## 🛠️ 16. Orden de trabajo servicio técnico

**Descripción:** Obtiene los servicios técnicos programados o realizados para un cliente.

- **Endpoint:** `GET /UsuariosClientes/ObtenerServiciosTecnicos`

---

<a name="17-remitos-de-entrega"></a>
## 🚚 17. Remitos de entrega

**Descripción:** Obtiene los consumos (entregas) de un cliente en un rango de fechas.

- **Endpoint:** `POST /Movimientos/ObtenerVentasPorCliente`

---

<a name="18-descarga-de-remitos-de-entrega"></a>
## 📥 18. Descarga de remitos de entrega

**Descripción:** Descarga el archivo PDF de un remito específico.

- **Endpoint:** `GET /VentasEntregas/ObtenerRemitoPorVenta`

---

<a name="19-descarga-de-archivos"></a>
## 📂 19. Descarga de archivos (Publicaciones)

**Descripción:** Obtiene una lista de documentos compartidos con el cliente.

- **Endpoint:** `GET /Publicaciones/ObtenerPublicaciones`

---

<a name="20-obtener-link-mercado-pago"></a>
## 💳 20. Obtener link Mercado Pago (LINK_PAGO)

**Descripción:** Genera un link de pago para que el cliente abone un monto determinado.

- **Endpoint:** `POST /Recibos/ObtenerLinkMP`
- **Type:** `LINK_PAGO`

### Parámetros de entrada (JSON)

```json
{
  "type": "LINK_PAGO",
  "cliente_id": 3131,
  "monto": 1500.50
}
```

---

<a name="21-obtener-saldos-de-cliente"></a>
## 💰 21. Obtener saldos de cliente

**Descripción:** Obtiene el estado financiero resumido y la próxima visita logística.

- **Endpoint:** `GET /api/Movimientos/ObtenerSaldosDeCliente/`

---

<a name="22-reenvío-de-factura"></a>
## 📧 22. Reenvío de Factura

**Descripción:** Reenvía una factura por correo electrónico al cliente.

- **Endpoint:** `POST /Facturacion/EnviarFacturaPorMail`

---

<a name="23-reenvío-de-remito"></a>
## 📧 23. Reenvío de Remito

**Descripción:** Reenvía un remito por correo electrónico.

- **Endpoint:** `POST /Facturacion/EnviarRemitoPorMail`

---

<a name="24-reenvío-de-recibo"></a>
## 📧 24. Reenvío de Recibo

**Descripción:** Reenvía un recibo de cobro por correo electrónico.

- **Endpoint:** `POST /Recibos/EnviarPorMail`

---

<a name="25-obtener-usuario-y-contraseña-de-un-cliente"></a>
## 🔐 25. Obtener Usuario y Contraseña (Autogestión)

**Descripción:** Recupera las credenciales de acceso para el portal del cliente.

- **Endpoint:** `POST /UsuariosClientes/ObtenerUsuarioPorCliente`

### Parámetros de entrada (JSON)

```json
{
  "cliente_id": 14854
}
```

---

<a name="26-obtener-incidentes-de-un-cliente"></a>
## ⚠️ 26. Obtener Incidentes de un Cliente (BUSCAR_INCIDENCIA)

**Descripción:** Lista todos los tickets de incidencia históricos de un cliente.

- **Endpoint:** `POST /Incidentes/ObtenerIncidentesCliente`
- **Type:** `BUSCAR_INCIDENCIA`

### Parámetros de entrada (JSON)

```json
{
  "type": "BUSCAR_INCIDENCIA",
  "cliente_id": 1018,
  "fechaDesde": "01/01/2025",
  "fechaHasta": "21/07/2025"
}
```

### Ejemplo de respuesta

```json
{
  "error": 0,
  "incidentes": [
    {
      "id": 10194,
      "titulo": "Prueba Incidencia",
      "tipoIncidente": "Gestiones en Hoja de Ruta",
      "estadoIncidente": "Cerrado"
    }
  ]
}
```
