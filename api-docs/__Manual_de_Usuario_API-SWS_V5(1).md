![][image1]

MANUAL DE USUARIO 

SISTEMA WATER SERVICE  
INDICE  


**1\. Logueo para el sistema** 

2\. **Identificación del cliente**  

**3\. Generación de ticket para "Llamar a cliente"** 

**4\. Clientes cercanos por coordenada** 

**5\. Obtener lista de precios de un cliente** 

6\. **Generación del Alta Temprana del cliente**  

7\. **Agregar contacto a cliente**  

8\. **Obtener datos de un cliente**  

9\. **Obtener cliente Sucursales**  

10\. **Obtener matriz de lista de precios**  

11\. **Obtener abonos tipos**  

12\. **Clientes cercanos por dirección**  

13\. **Historial de facturas del cliente por fecha**  

14\. **Recibos de pago de un cliente**  

**15\. Resumen de cuenta cliente de consumos por rango de x|fecha 16\. Orden de trabajo servicio técnico** 

**17\. Remitos de entrega** 

**18\. Descarga de remitos de entrega** 

**19\. Descarga de Archivos** 

**20\. Obtener link mercado pago** 

**21\. Obtener saldos de cliente** 

**22\. Reenvío de factura** 

**23\. Reenvío de remito** 

**24\. Reenvío de recibo** 

**25\. Obtener contraseña y usuario de un cliente** 


  


  

   
 **Manual de Usuario API – Integración Chatbot** 

Este manual describe cómo interactuar con los distintos endpoints disponibles para la  integración del chatbot con el sistema. 

 **1\. Logueo para el sistema** 

**Descripción:** Autentica al usuario y devuelve un token para el uso de los demás endpoints. 

**Endpoint:** POST (URL)+ /api/Session/GetToken 

Request Content Type: application/json sobre HTTPS 

Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {   "username": "admin",   "password": "sistemaws"  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | ----- | :---: | :---: | ----- |
| **REQUEST** | username  | Alfanumérico  | 50  | Nombre del   usuario para   inicio de sesión  |
|  | password  | Alfanumérico  | 50  | Contraseña de  usuario |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {  "tokenValido": "687f8b1325da9d0d54c3f046",  "vencimiento": "2025-07-22 11:58:59",  "error": 0,  "message": "Logueo correcto"  } |
|  | ERROR  { |

| 200 | "tokenValido": null,  "vencimiento": null,  "error": 1,  "message": "Error al obtener Token. Error:Error de usuario y/o  contaseña"  } |
| :---: | :---- |

**Nota: cuando la variable “error” venga con un valor 0, significa que el login fue exitoso ahora  cuando venga con 1 es que no fue exitoso y devuelve el mensaje del error.** 

 **2\. Identificación del cliente** 

**Endpoint:** POST (url) \+ /api/Clientes/BusquedaRapidaResultJson 

**Descripción:** Devuelve los datos de un cliente en base a algún criterio (teléfono, nombre,  DNI/CUIT, domicilio). 

Request Content Type: application/json sobre HTTPS 

Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "datosCliente": "christian",  "telefono": "+54",  "dni": "3",  "domicilio":"a"  } |

Definición de datos 

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | :---: | :---: | :---: |
| HEADER  | CURRENTTOKENVALUE  | Alfanumérico  | 40  | Token de sesión obtenido con el  método   GetToken() |
| **REQUEST** | datosCliente    | Alfanumérico  | 50  | Obtener   aproximación  de nombre por  texto de cliente o datos de   facturación  Ejemplo:   Nombre cliente,  |

|  |  |  |  | Razón social,  Datos  Facturación |
| :---- | ----- | ----- | ----- | ----- |
|  | telefono  | Alfanumérico  | 15  | Obtener cliente  por el teléfono |
|  | dni  | Alfanumérico  | 20  | Obtener cliente  por el DNI/CUIT |
|  | domicilio  | Alfanumérico  | 80  | Obtener cliente  por el domicilio |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {   "data": \[   {   "cliente\_id": 53,   "nombreCliente": "Alvarez Pablo",   "nombreReparto": "1234",   "nombrePromotor": "Admin",   "actividad\_ids": 24,   "tipoCliente\_ids": 1,   "estadoCliente\_ids": 1,   "promotor\_id": 1,   "reparto\_id": 2,   "dniCliente": null,   "nombreProvincia": "Buenos Aires",   "nombreCiudad": "Brandsen",   "nombreBarrio": "Brandsen",   "domicilioCompleto": "Brandsen, Rivadavia 770.",  "provincia\_ids": 2,   "ciudad\_id": 10,   "barrio\_id": 477,   "calle\_id": 17,   "torre": "",   "piso": "",   "depto": "",   "manzana": "",   "lote": "",   "numeroPuerta": "770",   "nombreCalle": "Rivadavia",   "actividadCliente": "Taller",   "tipoCliente": "Familia",   "estadoCliente": "Activo",   "datosCompletos": true,   "clientePadre": null,   "fechaNacimiento": "/Date(1577847600000)/",   "fechaIngreso": "/Date(1577847600000)/",   "codigoPostal": "1980", |

|  |  "altitud": "",   "longitud": "",   "fechaUtlimaEntrega": null,   "fechaUltimoCobroFactura": null,   "fechaUltimaEnvases": null,   "fechaUltimaDevoluciones": null,   "validarOrdenesDeCompra": false,   "validaCredito": false,   "creditoPermitido": 100000.00,   "limiteFacturas": 30,   "facturacionAutomatica": true,   "datosFacturacion\_id": 53,   "condicionIva\_ids": 2,   "tipoFactura\_ids": 2,   "cuit": "1111111111",   "dniPersona": "",   "ingresosBrutos": "1111111111",   "domicioFiscal": "Rivadavia 770",   "razonSocial": "Alvarez Pablo",   "centroDistribucion\_id": 1,   "centroDeDistribucion": "CD Testing",   "orden": 0,   "cicloVisitas": 0,   "etiquetas": \[\],   "situacionConsumo": 1,   "situacionSaldos": 1   }   \],   "error": 0,   "message": ""  } |
| ----- | :---- |
| 404 | ERROR  \<\!DOCTYPE html\>  \<html\>  \<head\>  \<title\>The resource cannot be found.\</title\> |

**Nota: con cualquiera de los parámetros (datoscliente, teléfono, dni, domicilio) se puede  realizar la búsqueda, cuando no coincide ningún dato devuelve todos los clientes.** 


   
 **3\. Generación de ticket para "Llamar a cliente"** 

**Endpoint:** POST /api/Incidentes/Save 

**Descripción:** Crea un ticket para que un operador llame al cliente. Para profundizar mas en el  tema tenemos una tabla de incidentes con tipos de incidentes y otras que se sub dividen de  cada tipo seria subtipos incidentes y se describen a continuación: 

| Id Nombre Incidente |
| ----: |
| **1 Gestión en ruta** |
| **8 Gestión Administrativa** |
| **2 Servicio Técnico** |
| **50 Llamadas a cliente** |
| **60 Gestión de alertas** |

Ahora las tablas de sub tipos de incidentes: 

1\. **Gestión en ruta**: 

| Id Nombre Incidente |
| ----: |
| **1** Solicitud de artículos |
| **2** Reclamo por no visita |
| **13** Gestión cobranza |
| **28** Visita por alta |
| **48** Gestión de envases |
| **502** Replanificación visita |

**2\. Gestiones Administrativas:** 

| Id Nombre Incidente |
| ----: |
| **501** Gestión de baja de cliente |
| **510** Pausado de cliente |
| **42** Cobranza |

**3\. Servicio técnico:** 

| Id Nombre Incidente |
| ----: |
| **4** Instalación de dispenser |
| **5** Quitar dispenser |
| **7** Sanitizacion |
| **8** Reubicación dispenser |
| **9** Reparación |

**4\. Llamadas a cliente:** 

| Id Nombre Incidente |
| ----: |
| **50** Llamar por replanificación de servicio técnico |

**5\. Gestión de alertas:**

| Id Nombre Incidente |
| ----: |
| **61** LimiteSuperado |
| **62** Prestamos envases vencidos |
| **46** Verificar cantidad de abonos y dispensers |
| **100** Toma de coordenadas |
| **503** Precios especiales vencido |
| **504** Precios especiales por vencer |
| **505** Orden compra vencida |
| **506** Orden compra por vencer |
| **507** Abono cliente vencido |
| **508** Abono cliente por vencer |
| **509** Alta rápida de cliente |

Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "centroDistribucion\_id": 3,  "cliente\_id":1018,  "descripcion":"\<p\>Descripción   Prueba\</p\>",  "estadoIncidente\_ids":null,  "fechaCierreEstimado":"21/7/2025", "severidad\_ids":2,  "subTipoIncidente\_ids": 1,  "tipoIncidente\_ids": 50,  "titulo":"Titulo Prueba",  "usuarioResponsable\_id": null  } |

Definición de datos 

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | ----- | :---: | :---: |
| HEADER  | CURRENTTOKENVALUE  | Alfanumérico  | 40  | Token de sesión  obtenido con el   método GetToken() |
|  | centroDistribucion\_id  | numérico  | 3  | Id del centro de   distribución  |
|  | cliente\_id  | numérico  | 3  | Id del cliente |

| REQUEST | descripcion  | Alfanumérico  | 255  | Campo de texto que  describe el incidente  con detalle Ejemplo:  \<p\> TEXTO \<p/\> |
| :---- | :---: | :---: | ----- | ----- |
|  | estadoIncidente\_ids  | numérico  |  | Id que define el   estado del incidente,  Abierto \= 1, Cerrado  \= 5, Cancelado \= 3, Pausado \= 4,  PendienteAprobacion  \= 6, Derivado \= 7 |
|  | fechaCierreEstimado  | Alfanumérico  | 12  | Fecha estima de   cierre del incidente  en formato   “dd/MM/yyyy” |
|  | severidad\_ids  | numérico  | 3  | Id usado para saber  la prioridad del   incidente. Ejemplo:  Baja \= 1, Media=  2, Alta \= 3, |
|  | tipoIncidente\_ids  | numérico  | 3  | Id que define el tipo  del incidente.  Para "Lamar a   cliente" \= 50 |
|  | subTipoIncidente\_ids  | numérico  | 3  | Id que define el sub  tipo del incidente.  Ejemplo:   “Llamar por   replanificacion de Ser  Tec” \= 50 |
|  | titulo  | Alfanumérico  |  | Es el título que va a  tener el incidente |
|  | usuarioResponsable\_id  | numérico  | 3  | Es el Id del usuario  que será responsable  del incidente puesde  ser null |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {  "error": 0,  "incidente": {  "id": 10190,  "fechaHoraRegistro": "/Date(1753112501144)/", |

|  | "usuarioRegistra": 1,  "cliente\_id": 1018,  "titulo": "Titulo Prueba",  "descripcion": "\<p\>Descripción Prueba\</p\>",  "tipoIncidente\_ids": 50,  "severidad\_ids": 2,  "pedido\_id": null,  "usuarioResponsable\_id": 0,  "fechaCierreEstimado": "/Date(1753066800000)/",  "fechaCierreReal": null,  "estadoIncidente\_ids": 0,  "eliminado": false,  "subTipoIncidente\_ids": 1,  "clientePadre\_id": 1018,  "servicioTecnico\_id": null,  "incidenteRelacionado": null,  "grupoResponsable\_ids": null,  "usuariosSeguimiento\_ids": null,  "centroDistribucion\_id": 3,  "usuariosSeguimiento": null  },  "servicioTecnico": {  "id": 0,  "cantidadDispensers": 0,  "sectorUbicacion": null,  "responsableEnCliente": null,  "telefonoResponsable": null,  "comentariosDeCierre": null,  "usuarioTecnicoId": null,  "fechaVisitaPlanificada": null,  "cumplido": false, |
| :---- | :---- |

|  | "fechaRealVisita": null,  "esSanitizacionPlanificada": false,  "precio": null,  "RazonesDeCierre\_ids": null,  "orden": null,  "dispenser\_id": null,  "sintoma\_ids": 0,  "cliente\_id": 1018,  "fechaCreacion": "/Date(-62135586000000)/",  "prioridad\_ids": 0,  "estadoServicioTecnico\_ids": 0,  "comentarios": null,  "franjaHoraria\_ids": null,  "centroDistribucion\_id": 3,  "idsDispensers": null  },  "pedido": {  "id": 0,  "clienteFactura\_id": 0,  "clienteAVisitar\_id": 0,  "fechaRecepcion": "/Date(-62135586000000)/",  "usuarioRegistra": 0,  "tipoPedido\_ids": 0,  "comentarios": null,  "asignarHojaDeRuta": false,  "hojaDeRuta\_id": null,  "reparto\_id": null,  "fechaPlanificadaAtencion": null,  "estadoPedido\_ids": 0,  "fechaRealAtencion": null,  "repartoIdRealAtencion": null, |
| :---- | :---- |

|  | "comentariosAtencion": null,  "enviadoAMovil": false  }  } |
| ----- | :---- |
| 200 | {  "error": 1,  "message": "El centro de distribución del incidente es diferente al del  cliente seleccionado"  } |


 **4\. Clientes cercanos por coordenada** 

**Endpoint:** GET /Repartos/ObtenerClientesCercanosPorCoordenadas 

**Descripción:** Lista clientes dentro de un radio determinado a partir de coordenadas GPS. 

Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "excluir": false,  "latitud": "-31.34374425512577 ",  "longitud": "-64.25413477249496 ", "radioMetros ": 500  } |

Definición de datos 

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | ----- | :---: | :---: | :---: |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de sesión obtenido con el  método   GetToken() |
|  **REQUEST** | excluir  | Alfanumérico  | 50  | Campo buleano que   normamente es  falso, es para  |

|  |  |  |  | aplicar el filtros  o no  |
| :---- | ----- | ----- | ----- | :---: |
|  | latitud  | Alfanumérico  | 50  | La latitud indica  la posición   norte o sur |
|  | longitud  | Alfanumérico  | 50  | la longitud   indica la   posición este u  oeste. |
|  | radioMetros  | numérico  |  | Son los metros  de distancia del  lugar buscado |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {  "clientesCercanos": \[  {  "cliente\_id": 1017,  "nombreCliente": "Julieta Pillado",  "nombreReparto": "1234",  "zona": "Sin especificar",  "latitud": \-31.3441697,  "longitud": \-64.254893299999992,  "domicilioCompleto": "Córdoba, PADRE FRANCISCO PALAU 6575\.  torre 0\. piso 0\. depto 3\. ",  "distanciaMetros": 86.18,  "visitas": \[  {  "cliente\_id": 1017,  "dia\_ids": 5,  "orden": 0.00,  "nombreCliente": "Julieta Pillado",  "domicilioCompleto": "Córdoba, PADRE FRANCISCO PALAU  6575\. torre 0\. piso 0\. depto 3\. ", |

|  | "reparto\_id": 2,  "nombreReparto": "1234",  "tipoCliente": "Empresa",  "estadoCliente": "Activo",  "dia": "Viernes",  "altitud": "-31.3441697",  "longitud": "-64.25489329999999",  "semana": 1,  "semanaMensual": 1,  "color": null,  "haCambiado": 0,  "ultimasVisitas": null  },  {  "cliente\_id": 1017,  "dia\_ids": 5,  "orden": 0.00,  "nombreCliente": "Julieta Pillado",  "domicilioCompleto": "Córdoba, PADRE FRANCISCO PALAU  6575\. torre 0\. piso 0\. depto 3\. ",  "reparto\_id": 2,  "nombreReparto": "1234",  "tipoCliente": "Empresa",  "estadoCliente": "Activo",  "dia": "Viernes",  "altitud": "-31.3441697",  "longitud": "-64.25489329999999",  "semana": 1,  "semanaMensual": 2,  "color": null,  "haCambiado": 0, |
| :---- | :---- |

|  | "ultimasVisitas": null  },  {  "cliente\_id": 1017,  "dia\_ids": 5,  "orden": 0.00,  "nombreCliente": "Julieta Pillado",  "domicilioCompleto": "Córdoba, PADRE FRANCISCO PALAU  6575\. torre 0\. piso 0\. depto 3\. ",  "reparto\_id": 2,  "nombreReparto": "1234",  "tipoCliente": "Empresa",  "estadoCliente": "Activo",  "dia": "Viernes",  "altitud": "-31.3441697",  "longitud": "-64.25489329999999",  "semana": 1,  "semanaMensual": 3,  "color": null,  "haCambiado": 0,  "ultimasVisitas": null  },  {  "cliente\_id": 1017,  "dia\_ids": 5,  "orden": 0.00,  "nombreCliente": "Julieta Pillado",  "domicilioCompleto": "Córdoba, PADRE FRANCISCO PALAU  6575\. torre 0\. piso 0\. depto 3\. ",  "reparto\_id": 2,  "nombreReparto": "1234", |
| :---- | :---- |

|  | "tipoCliente": "Empresa",  "estadoCliente": "Activo",  "dia": "Viernes",  "altitud": "-31.3441697",  "longitud": "-64.25489329999999",  "semana": 1,  "semanaMensual": 4,  "color": null,  "haCambiado": 0,  "ultimasVisitas": null  }  \],  "proximaVisita": "/Date(1753401600000)/",  "diasProximaVisita": 3  }  \],  "error": 0  } |
| ----- | :---- |
| 200 | ERROR  {  "tokenValido": null,  "vencimiento": null,  "error": 1,  "message": "Error al obtener Token. Error:Error de usuario y/o  contaseña"  } |

**Nota: Se devuelve una lista de los clientes más cercanos** 


 **5\. Obtener lista de precios del cliente de un cliente** 

**Endpoint:** GET /ListaDePrecios/ObtenerListaDePreciosDeCliente 

**Descripción:** Devuelve la lista de precios correspondiente al cliente más cercano.  
Parametros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "ClienteId":1036  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | :---: | ----- | :---: |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de   sesión  obtenido con  el método   GetToken() |
|    **REQUEST** | ClienteId  | numérico  |  | Id del cliente |

 **Response** 

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {  "ArticulosDeListaDePrecio": {  "Bidon x 20 lts": 800.00,  "Bidon x 12 lts": 500.00,  "Sifon x 1 1/4": 500.00,  "bidon de 20L Monte": 150.00,  "bidon de 12L Monte": 200.00  },  "error": 0  } |
| 200  | ERROR  {  "tokenValido": null,  "vencimiento": null,  "error": 1,  "message": "Error al obtener Token. Error:Error de usuario y/o  contaseña"  } |

**Nota: devuelve la lista de artículos comerciales habilitados para el comercio de un repartidor.**


  

 **6\. Generación del Alta Temprana del cliente** 

**Endpoint:** POST /Clientes/CrearNuevoClientePorChatBot 

**Descripción:** Registra anticipadamente un nuevo cliente en el sistema. 

Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
|    **REQUEST** | {  "cliente": {  "nombre": "Cliente de alta rapida",  "tipoDeClienteId": 1,  "condicionIvaId": 2,  "dniCuit": "3454564566",  "telefono": "00",  "email": "al456756756@test.com",  "listaDePreciosId": 1,  "domicilio": {  "provincia": "Salta",  "ciudad": "Salta",  "calle": "Av. Sarmiento",  "puerta": 2,  "observaciones": "",  "piso": "4",  "depto": "b",  "torre": "",  "cp": "X5012",  "lote": "",  "manzana": "",  "latitud": "-31.3651314",  "longitud": "-64.156489"  }  },  "reparto\_id": 1007  } |

Definición de datos 

| NOMBR  PARAMETRO TIPO DATO LONGITU  DESCRIPCIÓN  E   D   |  |  |  |  |
| ----- | :---: | :---: | :---: | :---: |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanuméric o | 40 | Token de sesión obtenido con el  método   GetToken() |

|       REQUEST | cliente.nombre  | Alfanuméric o  | 50  | Nombre del   cliente  |
| ----- | :---: | :---: | ----- | ----- |
|  | cliente.tipoDeClienteId  | numérico  |  | Id del tipo de   Cliente:  “Familia” \= 1,  “Empresa” \= 2 |
|  | cliente.actividadId  | numérico  |  | Id de la actividad  del cliente:  “Comercio” \= 1  “Servicios   Profesionales” \=  2,  “Educación” \= 3, “Industria” \= 4,  “Consumidor   final” \= 15,  “Otras” \= 18 |
|  | cliente.condicionIvaId  | numérico  |  | Id de la Condición  del Iva:  “Responsable   Inscripto” \= 1,  “Consumidor   Final” \= 2,  “Monotributista” \= 3,  “Sujeto Exento”= 4,  “IVA No   alcanzado” \= 5 |
|  | cliente.dniCuit  | Alfanuméric o | 30 |  |
|  | cliente.telefono  | Alfanuméric o | 15 |  |
|  | cliente.email  | Alfanuméric o | 50 |  |
|  | cliente.listaDePreciosId  | numérico  |  | Id lista de precios |
|  | cliente.domicilio.provincia  | Alfanuméric o | 250  | Nombre de la   provincia |
|  | cliente.domicilio.ciudad  | Alfanuméric o | 250  | Nombre de la   ciudad |
|  | cliente.domicilio.calle  | Alfanuméric o | 250  | Nombre de la   calle |
|  | cliente.domicilio.puerta  | Alfanuméric o | 250  | Observación   adicional del   domicilio |
|  | cliente.domicilio.observacione s | Alfanuméric o | 250  | Observación   adicional del   domicilio |
|  | cliente.domicilio.piso  | Alfanuméric o | 30  | Piso del domicilio |

|  | cliente.domicilio.depto  | Alfanuméric o | 30  | Identificación del  dep |
| :---- | :---: | :---: | ----- | ----- |
|  | cliente.domicilio.torre  | Alfanuméric o | 30  | Identificación   torre o edificio |
|  | cliente.domicilio.cp  | Alfanuméric o | 20  | Código postal del  domicilio |
|  | cliente.domicilio.lote  | Alfanuméric o | 20  | Lote de domicilio |
|  | cliente.domicilio.manzana  | Alfanuméric o | 30  | Manzana del   domicilio |
|  | cliente.domicilio.latitud  | Alfanuméric o | 50  | Latitud del   domicilio |
|  | cliente.domicilio.longitud  | Alfanuméric o | 50  | Longitud del   domicilio |
|  | reparto\_id  | numérico  |  | Id del reparto |

 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {  "error": 0,  "message": "",  "data": {  "cliente\_id": 1042,  "nombreCliente": "Cliente de alta rapida",  "nombreReparto": "S/R",  "nombrePromotor": null,  "actividad\_ids": 15,  "tipoCliente\_ids": 1,  "estadoCliente\_ids": 5,  "promotor\_id": 0,  "reparto\_id": 0,  "dniCliente": "963345344",  "nombreProvincia": "Córdoba",  "nombreCiudad": "Córdoba",  "nombreBarrio": "ALTA CORDOBA", |

|  | "domicilioCompleto": "Córdoba, ALEJANDRA PIZERNICK 2\. piso  4\. depto b. ",  "provincia\_ids": 1,  "ciudad\_id": 1,  "barrio\_id": 19,  "calle\_id": 397,  "torre": null,  "piso": "4",  "depto": "b",  "manzana": null,  "lote": null,  "numeroPuerta": "2",  "nombreCalle": "ALEJANDRA PIZERNICK",  "actividadCliente": "Consumidor Final",  "tipoCliente": "Familia",  "estadoCliente": "Borrador",  "datosCompletos": false,  "clientePadre": null,  "fechaNacimiento": null,  "fechaIngreso": "/Date(1753275884110)/",  "codigoPostal": "X5012",  "altitud": "-31.3651314",  "longitud": "-64.156489",  "fechaUtlimaEntrega": null,  "fechaUltimoCobroFactura": null,  "fechaUltimaEnvases": null,  "fechaUltimaDevoluciones": null,  "validarOrdenesDeCompra": false,  "validaCredito": false,  "creditoPermitido": 0.00,  "limiteFacturas": 0, |
| :---- | :---- |

|  | "facturacionAutomatica": true,  "datosFacturacion\_id": 1035,  "condicionIva\_ids": 2,  "tipoFactura\_ids": 0,  "cuit": null,  "dniPersona": "963345344",  "ingresosBrutos": null,  "domicioFiscal": "-",  "razonSocial": "Cliente de alta rapida",  "centroDistribucion\_id": 3,  "centroDeDistribucion": "PRUEBA",  "orden": 0,  "cicloVisitas": 0,  "etiquetas": \[\],  "situacionConsumo": 1,  "situacionSaldos": 1  }  } |
| ----- | :---- |
| 200 | {  "error": 1,  "message": "Referencia a objeto no establecida como instancia de un  objeto."  } |

**Nota: Error,** "Referencia a objeto no establecida como instancia de un objeto." Significa que le  faltan datos (parámetros) en el resquest. 


 **7\. Agregar contacto a cliente** 

**Endpoint:** POST /api/Clientes/CreateContacto 

**Descripción:** Añade un contacto secundario o alternativo a un cliente existente. Parámetros

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "ModeloContacto": {  "tipoContacto\_ids": 1,  "nombrePersona":"Nombre Persona", "sectorEmpresa":null,  "telefono":"+54",  "email":"contactoejemplo@test.net", "observaciones":"observaciones",  "cliente\_id": 33,  "contactoPrincipal": 0,  "celular":"Prueba 2",  "sector\_ids": 1077,  "caracteristicaCelular": 0,  "porCuentaCorriente": 0,  "fechaValidacionEmail": null,  "codigoValidacion": null,  "enviarComprobanteFiscalAdjunto": 0, "enviarRemitos": 0,  "enviarOrdenesDeTrabajo": 0,  "enviarAvisoDeProximaVisita": 0  }  } |

Definición de datos 

| NOMB  PARAMETRO TIPO   LONGIT  DESCRIPCI  RE   DATO   UD   ÓN  |  |  |  |  |
| ----- | :---: | ----- | ----- | :---: |
| **HEADE  R** | CURRENTTOKENVALUE  | Alfanumér ico | 40 | Token de   sesión  obtenido   con el   método   GetToken() |
|  | ModeloContacto.tipoContacto\_ids  | numérico  |  | Id que   define el  |

|    REQUES T |  |  |  | tipo de   contacto:   “Primer   contacto” \=  1,  “Contacto   Alternativo”  \=2  |
| :---- | ----- | ----- | ----- | ----- |
|  | ModeloContacto.nombrePersona  | Alfanumér ico | 100  | Nombre del  Contacto |
|  | ModeloContacto.sectorEmpresa  | Alfanumér ico | 50  | Valor del   texto en el   sector\_ids |
|  | ModeloContacto.telefono  | Alfanumér ico | 20  | Teléfono fijo |
|  | ModeloContacto.email  | Alfanumér ico | 50  | Email del   contacto |
|  | ModeloContacto.observaciones  | Alfanumér ico | 250  | Observación  sobre el   contacto |
|  | ModeloContacto.cliente\_id  | numérico  |  | Id del   cliente |
|  | ModeloContacto.celular  | Alfanumér ico | 20  | Celular del   contacto |
|  | ModeloContacto.sector\_ids  | numérico  |  | Id donde se  identifica la  relación del  contacto   con el   cliente:  “Gerente” \=  1,  “RRHH” \=2  “Calidad” \=  3  “Compras”  \= 4  “Encargado ” \= 5  “Titular” \= 6 “Pareja” \= 7 “Organizaci ón” \= 8 |
|  | ModeloContacto.caracteristicaCelular  | numérico  |  | Código de   área del   celular |
|  | ModeloContacto.porCuentaCorriente  | booleano  |  | Valor para   establecer   la cuenta   corriente   debe ser  |

|  |  |  |  | false en este  caso |
| :---- | ----- | ----- | :---- | :---: |
|  | ModeloContacto.enviarComprobanteFisc alAdjunto | booleano  |  | Bandera   (true/false)  |
|  | ModeloContacto.enviarRemitos  | booleano  |  | Bandera   (true/false)  |
|  | ModeloContacto.enviarOrdenesDeTrabaj o | booleano  |  | Bandera   (true/false)  |
|  | ModeloContacto.enviarAvisoDeProximaV isita | booleano  |  | Bandera   (true/false) |


 **Response** 

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {  "error": "0",  "message": "El contacto ha sido creado exitosamente",  "cliente\_id": "0"  } |
| 200 | {  "error": 1,  "message": "Referencia a objeto no establecida como instancia de un  objeto."  } |

**Nota: Error,** "Referencia a objeto no establecida como instancia de un objeto." Significa que le  faltan datos (parámetros) en el resquest. 


 **8\. Obtener datos de un cliente** 

**Endpoint:** POST (url) \+ /api/Clientes/ObtenerDatosCliente 

**Descripción:** Devuelve los datos de un cliente en base necesita el (cliente\_id) Request Content Type: application/json sobre HTTPS 

Parámetros

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "cliente\_id": 208  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | ----- | :---: | :---: |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de   sesión  obtenido con  el método   GetToken() |
| **REQUEST**  | cliente\_id  | numérico  |   | Id del cliente |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {   "cliente\_id": 208,   "nombreCliente": "Neyra Patricia",   "nombreReparto": "1234",   "nombrePromotor": "Admin",   "actividad\_ids": 31,   "tipoCliente\_ids": 1,   "estadoCliente\_ids": 1,   "promotor\_id": 1,   "reparto\_id": 2,   "dniCliente": null,   "nombreProvincia": "Buenos Aires",   "nombreCiudad": "Ranchos",   "nombreBarrio": "Ranchos",   "domicilioCompleto": "Ranchos, Chaco 3088.",   "provincia\_ids": 2,   "ciudad\_id": 11,   "barrio\_id": 479,   "calle\_id": 43,   "torre": "",   "piso": "",   "depto": "",   "manzana": "",   "lote": "",   "numeroPuerta": "3088",   "nombreCalle": "Chaco ", |

|  |  "actividadCliente": "No aplica",   "tipoCliente": "Familia",   "estadoCliente": "Activo",   "datosCompletos": true,   "clientePadre": null,   "fechaNacimiento": "/Date(1577847600000)/",   "fechaIngreso": "/Date(1577847600000)/",   "codigoPostal": "1987",   "altitud": "",   "longitud": "",   "fechaUtlimaEntrega": null,   "fechaUltimoCobroFactura": null,   "fechaUltimaEnvases": null,   "fechaUltimaDevoluciones": null,   "validarOrdenesDeCompra": false,   "validaCredito": false,   "creditoPermitido": 100000.00,   "limiteFacturas": 30,   "facturacionAutomatica": true,   "datosFacturacion\_id": 208,   "condicionIva\_ids": 2,   "tipoFactura\_ids": 2,   "cuit": "1111111111",   "dniPersona": "",   "ingresosBrutos": "1111111111",   "domicioFiscal": "Chaco 3088",   "razonSocial": "Neyra Patricia",   "centroDistribucion\_id": 1,   "centroDeDistribucion": "CD Testing",   "orden": 0,   "cicloVisitas": 0,   "etiquetas": \[\],   "situacionConsumo": 1,   "situacionSaldos": 1  } |
| ----- | :---- |
| 200 | {  "error": 1,  "message": "Referencia a objeto no establecida como instancia de un  objeto."  } |

 **9\. Obtener cliente Sucursales** 

**Endpoint:** POST (url) \+ /api/Clientes/ObtenerSucursalesJson 

**Descripción:** Devuelve los datos y las sucursales de un cliente en base necesita el (cliente\_id) Request Content Type: application/json sobre HTTPS 

Parámetros

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "cliente\_id": 208  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | ----- | :---: | :---: |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de   sesión   obtenido con  el método   GetToken() |
| **REQUEST**  | cliente\_id  | numérico  |   | Id del cliente |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {   "error": 0,   "message": "",   "data": \[   {   "cliente\_id": 208,   "nombreCliente": "Neyra Patricia",   "nombreReparto": "1234",   "nombrePromotor": "Admin",   "actividad\_ids": 31,   "tipoCliente\_ids": 1,   "estadoCliente\_ids": 1,   "promotor\_id": 1,   "reparto\_id": 2,   "dniCliente": null,   "nombreProvincia": "Buenos Aires",   "nombreCiudad": "Ranchos",   "nombreBarrio": "Ranchos",   "domicilioCompleto": "Ranchos, Chaco 3088.",   "provincia\_ids": 2,   "ciudad\_id": 11,   "barrio\_id": 479,   "calle\_id": 43,   "torre": "",   "piso": "",   "depto": "", |

|  |  "manzana": "",   "lote": "",   "numeroPuerta": "3088",   "nombreCalle": "Chaco ",   "actividadCliente": "No aplica",   "tipoCliente": "Familia",   "estadoCliente": "Activo",   "datosCompletos": true,   "clientePadre": null,   "fechaNacimiento": "/Date(1577847600000)/",   "fechaIngreso": "/Date(1577847600000)/",   "codigoPostal": "1987",   "altitud": "",   "longitud": "",   "fechaUtlimaEntrega": null,   "fechaUltimoCobroFactura": null,   "fechaUltimaEnvases": null,   "fechaUltimaDevoluciones": null,   "validarOrdenesDeCompra": false,   "validaCredito": false,   "creditoPermitido": 100000.00,   "limiteFacturas": 30,   "facturacionAutomatica": true,   "datosFacturacion\_id": 208,   "condicionIva\_ids": 2,   "tipoFactura\_ids": 2,   "cuit": "1111111111",   "dniPersona": "",   "ingresosBrutos": "1111111111",   "domicioFiscal": "Chaco 3088",   "razonSocial": "Neyra Patricia",   "centroDistribucion\_id": 1,   "centroDeDistribucion": "CD Testing",   "orden": 0,   "cicloVisitas": 0,   "etiquetas": \[\],   "situacionConsumo": 1,   "situacionSaldos": 1   }   \]  } |
| ----- | :---- |
| 200 | {  "error": 1,  "message": "Referencia a objeto no establecida como instancia de un  objeto."  } |

 **10\. Obtener matriz de lista de precios** 

**Endpoint:** GET (url) \+ /**ListaDePrecios/ObtenerMatrizListaDePrecios** 

**Descripción:** Este endpoint permite obtener la matriz de precios actual de productos, que se  obtiene mediante un tipoLista\_id 

Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "tipoLista\_id ": 2  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | ----- | :---: | :---: |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de   sesión   obtenido con  el método   GetToken() |
| **REQUEST**  | tipoLista\_id  | numérico  |   | Id de la lista de  precios |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {   "error": 0,   "matriz": {   "articulos": \[   {   "articulo\_id": 1,   "nombreArticulo": "Bidon x 20 lts",   "codigoInterno": "1",   "tipoArticulo\_ids": 1,   "tipo": "Producto comercilizable",   "rubro\_ids": 2,   "rubro": "Agua en Bidon",   "precios": \[   {   "lista\_id": 5,   "tipoLista\_ids": 2, |

|  |  "articulo\_id": 1,   "precio": 800.00   }   \]   },   {   "articulo\_id": 2,   "nombreArticulo": "Bidon x 12 lts",   "codigoInterno": "2",   "tipoArticulo\_ids": 1,   "tipo": "Producto comercilizable",   "rubro\_ids": 2,   "rubro": "Agua en Bidon",   "precios": \[   {   "lista\_id": 5,   "tipoLista\_ids": 2,   "articulo\_id": 2,   "precio": 500.00   }   \]   },   {   "articulo\_id": 6,   "nombreArticulo": "bidon de 20L Monte",   "codigoInterno": "4",   "tipoArticulo\_ids": 1,   "tipo": "Producto comercilizable",   "rubro\_ids": 2,   "rubro": "Agua en Bidon",   "precios": \[   {   "lista\_id": 5,   "tipoLista\_ids": 2,   "articulo\_id": 6,   "precio": 150.00   }   \]   },   {   "articulo\_id": 7,   "nombreArticulo": "bidon de 12L Monte",   "codigoInterno": "5",   "tipoArticulo\_ids": 1,   "tipo": "Producto comercilizable",   "rubro\_ids": 2,   "rubro": "Agua en Bidon",   "precios": \[   {   "lista\_id": 5,   "tipoLista\_ids": 2,   "articulo\_id": 7, |
| :---- | :---- |

|  |  "precio": 200.00   }   \]   }   \],   "listas": \[   {   "lista\_id": 5,   "nombre": "Distribuidores",   "tipo\_ids": 2,   "tipo": "Lista"   }   \]   }  } |
| ----- | :---- |
| 200 | {  "error": 1,  "message": "Referencia a objeto no establecida como instancia de un  objeto."  } |

 **11\. Obtener abonos tipos** 

**Endpoint:** GET (url) \+ /AbonosTipos/ObtenerAbonosTipos 

**Descripción:** Obtiene una lista de los tipos de abonos disponibles en el sistema, los cuales  pueden ser utilizados para clasificar transacciones financieras. Todos los parámetros son  opcionales excepto el parámetro activo (true/false) 

Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "desde": null,  "hasta": null,  "concepto": null,  "activo": true  } |

Definición de datos 

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | :---: | ----- | :---: |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de   sesión   obtenido con  el método   GetToken() |
| **REQUEST** | desde  | Alfanumérico  |   | Puede ser null,  si no se quiere  filtrar por   fecha desde |
|  | hasta  | Alfanumérico  |  | Puede ser null,  si no se quiere  filtrar por   fecha hasta |
|  | concepto  | Alfanumérico  |  | Una cadena   opcional para  filtrar por   concepto |
|  | activo  | booleano  |  | Valor lógico   obligatorio que determina si el  bono esta   activo o no   (true/false) |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {   "error": 0,   "abonosTipos": \[   {   "id": 1007,   "articuloAbonoConcepto\_id": 4,   "articuloAbonoConcepto": "Concepto de Abono Tipo",  "nombreAbono": "abono 4 x 20",   "leyendaFacturacion": "abono ,emsual de 4 bidones de 20litros",  "precio": 30000.00,   "tipoAbonoTipo\_ids": 1,   "tipoAbonoTipo": "Abono Aguas",   "fechaAlta": "/Date(1735909324993)/",   "usuarioAlta\_id": 1,   "nombreApellidoAlta": "Admin",   "activo": true,   "fechaBaja": null,   "usuarioBaja\_id": null,   "nombreApellidoBaja": null |

|  |  }   \]  } |
| ----- | :---- |
| 200 | {  "error": 1,  "message": "Referencia a objeto no establecida como instancia de un  objeto."  } |


 **12\. Clientes cercanos por dirección** 

**Endpoint:** GET /Repartos/BusquedaClientesCercanosResultJson 

**Descripción:** Lista clientes dentro de un radio determinado a partir de dirección. Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "address": "Argentina, Cordoba, Cordoba  capital, Centro, Av. Maipu"  "metros ": 10000  } |

Definición de datos 

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | :---: | ----- | :---: |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de sesión  obtenido con el  método   GetToken() |
| **REQUEST** | address  | Alfanumérico  | 50  | Cadena que   contiene la   dirección.   Ejemplo:  Argentina,   Cordoba,   Cordoba   capital, Centro,  Av. Maipu    |
|  | metros  | numérico  |  | Un entero que  expresa los   metros de   distancia desde  |

|  |  |  |  | la dirección   para buscar los  clientes |
| :---- | :---- | :---- | :---- | :---: |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {   "data": \[   {   "cliente\_id": 802,   "nombreCliente": "Granja Velicceli (Cristina Alibue)",  "nombreReparto": "1234",   "zona": "Sin especificar",   "latitud": \-31.4148491,   "longitud": \-64.1792179,   "domicilioCompleto": "Córdoba, MENDOZA 237.",  "distanciaMetros": 270.60,   "visitas": \[   {   "cliente\_id": 802,   "dia\_ids": 2,   "orden": 3.00,   "nombreCliente": "Granja Velicceli (Cristina Alibue)",  "domicilioCompleto": "Córdoba, MENDOZA 237.",  "reparto\_id": 2,   "nombreReparto": "1234",   "tipoCliente": "Familia",   "estadoCliente": "Activo",   "dia": "Martes",   "altitud": "-31.4148491",   "longitud": "-64.1792179",   "semana": 1,   "semanaMensual": 0,   "color": null,   "haCambiado": 0,   "ultimasVisitas": {   "cliente\_id": 802,   "diaSemana": "Martes",   "diaId": 2,   "horarioMin": "15:45",   "horarioMax": "15:45",   "horarioProm": "15:45",   "cantidadVisitas": 1,   "ultimaVisita": "/Date(1750790700000)/",   "horarioMaxSeg": 56700,   "horarioMinSeg": 56700,   "horarioPromSeg": 56700,   "ultimaVisitaString": "24/06/2025 15:45" |

|  |  }   }   \],   "proximaVisita": "/Date(1755561600000)/",   "diasProximaVisita": 8   }   \],   "error": 0,   "message": "",   "coordenadas": {   "Latitud": \-31.4126304,   "Longitud": \-64.1780465   }  } |
| ----- | :---- |
| 200 | ERROR  {  "tokenValido": null,  "vencimiento": null,  "error": 1,  "message": "Error al obtener Token. Error:Error de usuario y/o  contaseña"  } |

**Nota: Se devuelve una lista de los clientes más cercanos, con una dirección determinada** 


 **13\. Historial de facturas del cliente por fecha** 

**Endpoint:** POST /Facturacion/ObtenerHistorialDeFacturas 

**Descripción:** Se obtiene una lista de clientes de las facturas de un cliente en un rango de fecha. 

Parámetros

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "cliente\_id":8,  "fechaDesde":"05/12/2022",  "fechaHasta":"26/09/2025",  "saldoPendiente": false  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | ----- | ----- | ----- |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de sesión obtenido  con el método GetToken() |
| **REQUEST** | cliente\_id  | numérico  |  | Id del cliente que se desea  buscar    |
|  | fechaDesde  | Alfanumérico  | 15 | Fecha de inicio de la   búsqueda en formato  dd/MM/yyyy |
|  | fechaHasta  | Alfanumérico  | 15 | Fecha de final de la   búsqueda en formato  dd/MM/yyyy |
|  | saldoPendiente  | booleano  |  | Variable booleana que  filtra si es true, significa  que el saldo pendiente a   Imputar es mayor a 0,  mientras que falso el   saldoPendienteDeImputar Es \= 0 |

 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {   "error": 0,   "facturas": \[   {   "id": 10039,   "nroFactura": "003-00000064",   "fechaFactura": "/Date(1744047204477)/",   "tipoFactura": "Factura A",   "montoFacturaTotal": 300050.00,   "montoTotalNeto": 247975.2100000,   "montoFacturaIVA": 52074.79,   "montoExcento": 0.00,   "montoGravado": 300050.00,   "fechaVencimiento1": "/Date(1741195625157)/",  "fechaVencimiento2": "/Date(1742491625157)/",  "fechaVencimiento3": "/Date(1743787625157)/",  "cobrado": 0,   "cliente\_id": 8,   "estadoFactura": "No Vencida",   "interesVencimiento2": 1.05,   "interesVencimiento3": 1.10, |

|  |  "estadoFactura\_ids": 1,   "leyenda1": null,   "leyenda2": "Remitos asociados a las ventas facturadas: ",  "leyenda3": null,   "leyenda4": null,   "codigoAfip": "x",   "eliminada": false,   "pathFactura": null,   "facturaElectronica\_id": 35,   "resultado": 0,   "mensaje": null,   "cae": "75146229004566",   "numeroComprobante": 64,   "fechaVencimientoCae": "/Date(1744858800000)/",  "fechaVencimientoComprobante": "/Date(1744858800000)/",  "observaciones": "",   "facturarAfip": true,   "puntoDeVenta": 3,   "tipoComprobanteAfip": 11,   "pathFacturaDuplicado": null,   "entregadaPapel": false,   "entregadaEmail": false,   "fechaEntregadaPapel": null,   "fechaEntregadaEmail": null,   "impresa": false,   "procesoFacturacion\_id": 11105,   "notaDeDebitoAjusteId": null,   "centroFacturacion\_id": 1,   "montoImputado": 300050.00,   "saldoPendienteDeImputar": 0.00,   "ItemsFactura": null   }   \],   "ajustes": \[\]  } |
| ----- | :---- |
| 200 | ERROR  {  "tokenValido": null,  "vencimiento": null,  "error": 1,  "message": "Error al obtener Token. Error:Error de usuario y/o  contaseña"  } |

**Nota: Se devuelve el historial de las facturas imputadas o sin imputar en un rango de fecha.**    
 **14\. Recibos de pago de un cliente** 

**Endpoint:** POST /Recibos/ObtenerRecibosDeCobros 

**Descripción:** Se obtiene una lista de recibos de un cliente en un rango de fecha. 

Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "clienteId":8,  "fechaReciboDesde":"07/04/2025",  "fechaReciboHasta":"26/09/2025",  "saldoDisponible": false  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | ----- | ----- | ----- |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de sesión obtenido  con el método GetToken() |
| **REQUEST** | clienteId  | numérico  |  | Id del cliente que se desea  buscar    |
|  | fechaReciboDesde  | Alfanumérico  | 15 | Fecha de inicio de la   búsqueda en formato  dd/MM/yyyy |
|  | fechaReciboHasta  | Alfanumérico  | 15 | Fecha de final de la   búsqueda en formato  dd/MM/yyyy |
|  | saldoDisponible  | booleano |  | Variable booleana que  filtra si es true, significa  que el saldo disponible es  mayor a 0, mientras que  falso el montoDisponible Es \= 0 |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| :---- | :---- |
|  | OK  { |

| 200 |  "recibos": \[   {   "id": 10112,   "cliente\_id": 8,   "clienteEntrega\_id": 8,   "usuarioRecibe\_id": 1,   "fechaRecibo": "/Date(1751571804133)/",   "fechaAlta": "/Date(1751571804133)/",   "nroReciboDigital": "00000027",   "nroReciboFisico": null,   "esRecibo": false,   "pathPdf": null,   "hojaDeRuta\_id": null,   "fechaEnvioMail": null,   "fechaEntregadaConfirmadaEmail": null,   "centroDeFacturacion\_id": 1,   "esCreditoDisponible": true,   "esAfip": true,   "liquidado": true,   "clienteRecibo": "Correo Argentino",   "clienteEntrega": "Correo Argentino",   "centroDeFacturacion": "Principal",   "usuarioRecibe": "Admin",   "fechaRuta": null,   "reparto": null,   "montoTotalUtilizado": 12312.00,   "montoTotalRecibo": 12312.00,   "montoDisponible": 0.00,   "permisoEditar": true,   "permisoImputar": true,   "permisoEditarNumero": true,   "items": null,   "imputaciones": null   }   \],   "error": 0  } |
| :---: | :---- |
| 200 | ERROR  {  "tokenValido": null,  "vencimiento": null,  "error": 1,  "message": "Error al obtener Token. Error:Error de usuario y/o  contaseña"  } |

**Nota: Se devuelve el historial de los recibos de un cliente determinado.**


 **15\. Resumen de cuenta cliente de consumos por rango de fecha** 

**Endpoint:** POST /Movimientos/BuscarMovimientos 

**Descripción:** Se obtiene una lista de movimientos de un cliente en un rango de fecha. Generando 3 listas los consumos sin facturar, las facturas y los movimientos agrupados por  periodo. 

Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "clienteId":8,  "desde":"07/04/2025",  "hasta":"26/09/2025"  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | ----- | ----- | ----- |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de sesión obtenido  con el método GetToken() |
| **REQUEST** | clienteId  | numérico  |  | Id del cliente que se desea  buscar    |
|  | desde  | Alfanumérico  | 15 | Fecha de inicio de la   búsqueda en formato  dd/MM/yyyy |
|  | hasta  | Alfanumérico  | 15 | Fecha de final de la   búsqueda en formato  dd/MM/yyyy |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {   "dashboard": {   "movimientosConsumos": \[   {   "fecha": "/Date(1751338799000)/", |

|  |  "descripcion": "Venta",   "nroComprobante": "Rm-e-00016",   "montoDebe": 1780.0000,   "montoHaber": 0,   "saldo": 0,   "entidadId": 10736,   "tipoDeEntidad": 5   },   {   "fecha": "/Date(1750362180000)/",   "descripcion": "Venta",   "nroComprobante": "Rm-e-00014",   "montoDebe": 0.0000,   "montoHaber": 0,   "saldo": 0,   "entidadId": 10730,   "tipoDeEntidad": 5   }   \],   "movimientosFacturacion": \[   {   "fecha": "/Date(1751571804133)/",   "descripcion": "Recibo",   "nroComprobante": "Rc-e-00000027",   "montoDebe": 0,   "montoHaber": 12312.00,   "saldo": 0,   "entidadId": 10112,   "tipoDeEntidad": 3   },   {   "fecha": "/Date(1751571770237)/",   "descripcion": "Factura",   "nroComprobante": "F-0000",   "montoDebe": 12312.00,   "montoHaber": 0,   "saldo": 0,   "entidadId": 10065,   "tipoDeEntidad": 2   },   {   "fecha": "/Date(1751571673890)/",   "descripcion": "Recibo",   "nroComprobante": "Rc-e-00000026",   "montoDebe": 0,   "montoHaber": 12312.00,   "saldo": 0,   "entidadId": 10111,   "tipoDeEntidad": 3   }   \],   "movimientosPeriodo": \[ |
| :---- | :---- |

|  |  {   "periodo": "202504",   "articulo\_id": 1,   "nombreArticulo": "Bidon x 20 lts",   "precioUnitario": 3000.00,   "cantidad": 1.00,   "subtotal": 3000.0000,   "clienteFacturable\_id": 8   },   {   "periodo": "202505",   "articulo\_id": 1,   "nombreArticulo": "Bidon x 20 lts",   "precioUnitario": 3000.00,   "cantidad": 2.00,   "subtotal": 6000.0000,   "clienteFacturable\_id": 8   }   \]   },   "error": 0  } |
| ----- | :---- |
| 200 | ERROR  {  "tokenValido": null,  "vencimiento": null,  "error": 1,  "message": "Error al obtener Token. Error:Error de usuario y/o  contaseña"  } |

**Nota: Se devuelve 3 listas Consumos, Facturas y Periodos** 


 **16\. Orden de trabajo servicio técnico** 

**Endpoint:** GET /UsuariosClientes/ObtenerServiciosTecnicos 

**Descripción:** Se obtiene los servicios de un cliente en un rango de fechas. 

Parámetros

| CAMPO DESCRIPCION |  |
| ----- | :---- |
|  | { |

| REQUEST | "clienteId":8,  "desde":"07/02/2025",  "hasta":"26/09/2025"  } |
| :---: | :---- |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | ----- | ----- | ----- |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de sesión obtenido  con el método GetToken() |
| **REQUEST** | clienteId  | numérico  |  | Id del cliente que se desea  buscar    |
|  | desde  | Alfanumérico  | 15 | Fecha de inicio de la   búsqueda en formato  dd/MM/yyyy |
|  | hasta  | Alfanumérico  | 15 | Fecha de final de la   búsqueda en formato  dd/MM/yyyy |

 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {   "serviciosTecnicos": {   "items": \[   {   "id": 10022,   "clienteUbicacion": "Correo Argentino",   "clienteIdUbicacion": 8,   "fechaPlanificada": "/Date(1743130800000)/",   "fechaReal": "/Date(1743706682687)/",   "creado": "/Date(1743706529567)/",   "estadoIds": 4,   "estado": "Cerrado",   "nroComprobante": "(D) 10022",   "repartoId": 2,   "reparto": "1234",   "archivoComprobante": "comprobante\_st\_8\_10022.pdf",  "sintoma": "Sanitización"   },   {   "id": 10019,   "clienteUbicacion": "Correo Argentino", |

|  |  "clienteIdUbicacion": 8,   "fechaPlanificada": "/Date(1743044400000)/",   "fechaReal": null,   "creado": "/Date(1743704804467)/",   "estadoIds": 3,   "estado": "Cancelado",   "nroComprobante": "(D) 10019",   "repartoId": 2,   "reparto": "1234",   "archivoComprobante": null,   "sintoma": "Sanitización"   }   \]   },   "error": 0  } |
| ----- | :---- |
| 200 | ERROR  {  "tokenValido": null,  "vencimiento": null,  "error": 1,  "message": "Error al obtener Token. Error:Error de usuario y/o  contaseña"  } |

**Nota: Se obtiene los servicios técnicos de un cliente** 


 **17\. Remitos de entrega** 

**Endpoint:** POST /Movimientos/ObtenerVentasPorCliente 

**Descripción:** Se obtiene los consumos de un cliente en un rango de fechas con o sin facturas. 

Parámetros

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "cliente\_id":8,  "fechaDesde":"07/04/2025", |

|  | "fechaHasta":"26/09/2025",  "consumosSinFacturar": false  } |
| :---- | :---- |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | ----- | ----- | ----- |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de sesión obtenido  con el método GetToken() |
| **REQUEST** | cliente\_id  | numérico  |  | Id del cliente que se desea  buscar    |
|  | fechaDesde  | Alfanumérico  | 15 | Fecha de inicio de la   búsqueda en formato  dd/MM/yyyy |
|  | fechaHasta  | Alfanumérico  | 15 | Fecha de final de la   búsqueda en formato  dd/MM/yyyy |
|  | consumosSinFacturar  | Booleano |  | Variable booleana que  filtra si es true, significa  que se filtran los   consumos con factura y  false sin factura |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {   "ventas": \[   {   "id": 11013,   "fechaVenta": "/Date(1755800760000)/",   "montoTotalVenta": 0,   "hojaRuta\_id": 20179,   "clienteEntrega\_id": 8,   "factura\_id": null,   "remito\_id": 10606,   "nroRemito": "00055",   "nroRemitoFisico": null,   "clienteEntrega": "Correo Argentino",   "archivoRemitoPdf": "8\_20179.pdf",   "fueEditada": false, |

|  |  "visita\_id": 20212,   "nombreRepartoEntrega": "1234",   "Articulos": \[   {   "id": 11038,   "articulo\_id": 1,   "precioUnitario": 0,   "cantidad": 3,   "codigoInterno": "1",   "nombreArticulo": "Bidon x 20 lts",   "esImputacionAbono": false,   "factura\_id": null,   "leyenda": null,   "facturaDeItem\_id": null,   "porcentajeDescuentoManual": 0,   "porcentajeDescuentoPorCantidad": 0,   "porcentajeDescuentoVenta": 0,   "precioUnitarioOriginal": 0,   "tipoItem\_id": 2   }   \]   },   {   "id": 11008,   "fechaVenta": "/Date(1755800707967)/",   "montoTotalVenta": 0,   "hojaRuta\_id": null,   "clienteEntrega\_id": 8,   "factura\_id": null,   "remito\_id": 10600,   "nroRemito": "00053",   "nroRemitoFisico": null,   "clienteEntrega": "Correo Argentino",   "archivoRemitoPdf": "8\_st\_10600.pdf",   "fueEditada": false,   "visita\_id": 11047,   "nombreRepartoEntrega": null,   "Articulos": \[   {   "id": 11032,   "articulo\_id": 1014,   "precioUnitario": 0,   "cantidad": 1,   "codigoInterno": "04",   "nombreArticulo": "Sanitizacion de Dispenser",  "esImputacionAbono": false,   "factura\_id": null,   "leyenda": "Sanitizacion de Dispenser",   "facturaDeItem\_id": null,   "porcentajeDescuentoManual": 0,   "porcentajeDescuentoPorCantidad": 0,   "porcentajeDescuentoVenta": 0, |
| :---- | :---- |

|  |  "precioUnitarioOriginal": 0,   "tipoItem\_id": 10   }   \]   }   \],   "error": 0  } |
| ----- | :---- |
| 200 | ERROR  {  "tokenValido": null,  "vencimiento": null,  "error": 1,  "message": "Error al obtener Token. Error:Error de usuario y/o  contaseña"  } |

**Nota: Se obtiene los consumos de un cliente** 


 **18\. Descarga de remitos de entrega** 

**Endpoint:** GET /VentasEntregas/ObtenerRemitoPorVenta 

**Descripción:** Se descarga el PDF del remito. 

Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "idVenta":8  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | ----- | ----- | ----- | ----- |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de sesión obtenido  con el método GetToken() |
| **REQUEST**  | idVenta  | numérico  |  | Id de la venta que se   desea descargar    |


 **Response**

| CODE HTTP DESCRIPCIÓN |
| :---- |

| 200  | OK |
| :---: | ----- |
| 200 | ERROR  {  "tokenValido": null,  "vencimiento": null,  "error": 1,  "message": "Error al obtener Token. Error:Error de usuario y/o  contaseña"  } |

**Nota: con este link se descarga el remito en formato pdf.** 


 **19\. Descarga de archivos**  

**Endpoint:** GET /Publicaciones/ObtenerPublicaciones 

**Descripción:** obtiene una lista de publicaciones si se le pasa el cliente las publicaciones de ese  cliente, si es null se obtiene todas las publicaciones. 

Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "cliente\_id”: null  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | ----- | ----- | ----- |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de sesión obtenido  con el método GetToken() |
| **REQUEST**  | cliente\_id  | numérico  |  | Id del cliente que se desea  consultar    |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200**  | OK  {   "error": 0,   "publicaciones": \[   { |

|  |  "id": 1,   "cliente\_id": null,   "titulo": "Manual API",   "descripcion": null,   "usuario\_id": 1,   "fechaAlta": "/Date(1756477342130)/",   "eliminado": false,   "tipoPublicacion\_ids": 2,   "tipoPublicacion": "Documentación comercial",   "usuario": "Admin",   "archivos": \[   {   "id": 1,   "publicacion\_id": 1,   "nombreArchivo": "cd5417d9-2366-4770-921c 26770146bc36\_?? Manual de Usuario API.pdf",   "tituloArchivo": "?? Manual de Usuario API.pdf"  }   \]   }   \]  } |
| ----- | :---- |
| 200 | ERROR  {  "tokenValido": null,  "vencimiento": null,  "error": 1,  "message": "Error al obtener Token. Error:Error de usuario y/o  contaseña"  } |

**Nota: Se obtiene una lista de las publicaciones con los links de descarga. Ejemplo del link:** href="/Archivos/Publicaciones/cd5417d9-2366-4770-921c-26770146bc36\_?? Manual de  Usuario API.pdf" 

 **20\. Obtener link mercado pago** 

**Endpoint:** POST (url) \+ /Recibos/ObtenerLinkMP 

**Descripción:** Obtiene un link de marcado pago, con la intención de pago para un cliente, para  ello se necesita el cliente id y el monto a cobrar. 

Parámetros

| CAMPO DESCRIPCION |
| ----: |

| REQUEST | {  "cliente\_id": 8,  "monto": 1000  } |
| :---: | :---- |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | :---: | ----- | :---: |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de   sesión   obtenido con  el método   GetToken() |
| **REQUEST** | cliente\_id  | entero  |  | El id o   identificador   único para un  cliente |
|  | monto  | decimal |  | Monto en   formato   decimal |


 **Response**

| CODE   DESCRIPCIÓN HTTP  |  |
| ----- | :---- |
| **200** | OK  {  "error": 0,  "init\_point":   "https://www.mercadopago.com.ar/checkout/v1/redirect?pref\_id=1740847852- 9a77f20b-3906-4743-9ae0-c83498773fae"  } |
| 200 | {  "error": 1,  "message": "Referencia a objeto no establecida como instancia de un objeto." } |

 **21\. Obtener saldos de cliente** 

**Endpoint:** GET (url) \+ /api/Movimientos/ObtenerSaldosDeCliente/ 

**Descripción:** obtiene información financiera y logística detallada de un cliente específico. Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "cliente\_id": 8,  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | :---: | ----- | :---: |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de   sesión   obtenido con  el método   GetToken() |
| **REQUEST** | cliente\_id  | entero  |  | El id o   identificador   único para un  cliente |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {  "saldos": {  "cliente\_id": 3131,  "nombreCliente": "(de 09 a 13)EXPERTA ART SA",  "nombreReparto": "Reparto 3 ( Rosario)",  "diasVisita": "S4 Jueves, ",  "fechaUltimoCobro": "12/09/2025",  "fechaUltimaEntrega": "11/09/2025",  "saldoCuentaConsumo": 33440.000, |

|  | "saldoCuentaFacturacion": 0.00,  "listaDePrecios": "Lista Base CD1 Tipo Listas Bases"  },  "error": 0  } |
| ----- | :---- |
| 200 | {  "error": 1,  "message": "Referencia a objeto no establecida como instancia de un  objeto."  } |

 22\. Reenvío de Factura  

**Endpoint:** POST (url) \+ /Facturacion/EnviarFacturaPorMail 

**Descripción:** Reenvía por correo electrónico una factura específica a la dirección asociada al  cliente. 

Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "facturaId": 121471  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | :---: | ----- | :---: |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de   sesión   obtenido con  el método   GetToken() |
| **REQUEST** | facturaId  | entero  |  | El id o   identificador   único para una  factura |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {  "error": 0  } |
| 200 | {  "error": 1,  "message": "Referencia a objeto no establecida como instancia de un  objeto."  } |

 23\. Reenvío de Remito  

**Endpoint:** POST (url) \+ /Facturacion/EnviarRemitoPorMail 

**Descripción:** Reenvía por correo un remito especificado. 

Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "remitoId": 227194  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | :---: | ----- | :---: |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de   sesión   obtenido con  el método   GetToken() |
| **REQUEST** | remitoId  | entero  |  | El id o   identificador   único para un remito |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  {  "error": 0  } |
| 200 | {  "error": 1,  "message": "Referencia a objeto no establecida como instancia de un  objeto."  } |

 24\. Reenvío de Recibo  

**Endpoint:** POST (url) \+ /Recibos/EnviarPorMail 

**Descripción:** Envía nuevamente un recibo a la dirección registrada del cliente. Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "reciboId": 171406  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | :---: | :---: | :---: |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de   sesión   obtenido con  el método   GetToken() |
| **REQUEST**  | reciboId  | entero  |   | El id o   identificador   único para un recibo |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| :---- | :---- |
|  | OK |

| 200 | {  "error": 0  } |
| :---: | :---- |
| 200 | {  "error": 1,  "message": "Referencia a objeto no establecida como instancia de un  objeto."  } |

 25\. Obtener Usuario y Contraseña de un Cliente  

**Endpoint:** POST (url) \+ /api/Usuarios/ObtenerUsuarioById 

**Descripción:** Recupera el nombre de usuario y contraseña (en caso de restablecimiento o envío  inicial) de un cliente. 

Parámetros 

| CAMPO DESCRIPCION |  |
| ----- | :---- |
| **REQUEST** | {  "id": 14854  } |

Definición de datos  

| NOMBRE PARAMETRO TIPO DATO LONGITUD DESCRIPCIÓN  |  |  |  |  |
| ----- | :---: | :---: | :---: | :---: |
| **HEADER**  | CURRENTTOKENVALUE  | Alfanumérico  | 40 | Token de   sesión   obtenido con  el método   GetToken() |
| **REQUEST**  | id  | entero  |   | El id o   identificador   único para un usuario |


 **Response**

| CODE HTTP DESCRIPCIÓN |  |
| ----- | :---- |
| **200** | OK  { |

|  | "error": 0,  "usuario": {  "id": 14854,  "nombreApellido": "Supermercado Culpina",  "userName": "14716",  "password": "1kXC0187",  "email": null,  "telefono": null,  "dni": null,  "activo": true,  "centroDistribucion\_id": 4,  "RolesDelUsuario": \[  {  "id": 18410,  "usuario\_id": 14854,  "rol\_id": 500  }  \],  "CargosDelUsuario": \[\],  "IdsGrupos": \[\]  }  } |
| ----- | :---- |
| 200 | {  "error": 1,  "message": "Referencia a objeto no establecida como instancia de un  objeto."  } |

[image1]: <data:image/png;base64,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>