# Obtener Datos del Cliente

Obtiene información detallada de un cliente específico por su ID.

## Endpoint

```
POST /api/Clientes/ObtenerDatosCliente
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| cliente_id | number | ID del cliente | Sí |

## Ejemplo de Request

```json
{
  "cliente_id": 208
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "cliente_id": 208,
  "nombreCliente": "Neyra Patricia",
  "nombreReparto": "1234",
  "nombrePromotor": "Admin",
  "actividad_ids": 31,
  "tipoCliente_ids": 1,
  "estadoCliente_ids": 1,
  "promotor_id": 1,
  "reparto_id": 2,
  "dniCliente": null,
  "nombreProvincia": "Buenos Aires",
  "nombreCiudad": "Ranchos",
  "nombreBarrio": "Ranchos",
  "domicilioCompleto": "Ranchos, Chaco 3088.",
  "provincia_ids": 2,
  "ciudad_id": 11,
  "barrio_id": 479,
  "calle_id": 43,
  "torre": "",
  "piso": "",
  "depto": "",
  "manzana": "",
  "lote": "",
  "numeroPuerta": "3088",
  "nombreCalle": "Chaco",
  "actividadCliente": "No aplica",
  "tipoCliente": "Familia",
  "estadoCliente": "Activo",
  "datosCompletos": true,
  "clientePadre": null,
  "fechaNacimiento": "/Date(1577847600000)/",
  "fechaIngreso": "/Date(1577847600000)/",
  "codigoPostal": "1987",
  "altitud": "",
  "longitud": "",
  "fechaUtlimaEntrega": null,
  "fechaUltimoCobroFactura": null,
  "fechaUltimaEnvases": null,
  "fechaUltimaDevoluciones": null,
  "validarOrdenesDeCompra": false,
  "validaCredito": false,
  "creditoPermitido": 100000.00,
  "limiteFacturas": 30,
  "facturacionAutomatica": true,
  "datosFacturacion_id": 208,
  "condicionIva_ids": 2,
  "tipoFactura_ids": 2,
  "cuit": "1111111111",
  "dniPersona": "",
  "ingresosBrutos": "1111111111",
  "domicioFiscal": "Chaco 3088",
  "razonSocial": "Neyra Patricia",
  "centroDistribucion_id": 1,
  "centroDeDistribucion": "CD Testing",
  "orden": 0,
  "cicloVisitas": 0,
  "etiquetas": [],
  "situacionConsumo": 1,
  "situacionSaldos": 1
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| cliente_id | number | ID único del cliente |
| nombreCliente | string | Nombre completo del cliente |
| nombreReparto | string | Nombre del reparto asignado |
| nombrePromotor | string | Nombre del promotor |
| actividad_ids | number | ID de la actividad del cliente |
| tipoCliente_ids | number | ID del tipo de cliente |
| estadoCliente_ids | number | ID del estado del cliente |
| promotor_id | number | ID del promotor |
| reparto_id | number | ID del reparto |
| dniCliente | string | DNI del cliente |
| nombreProvincia | string | Nombre de la provincia |
| nombreCiudad | string | Nombre de la ciudad |
| nombreBarrio | string | Nombre del barrio |
| domicilioCompleto | string | Dirección completa del cliente |
| provincia_ids | number | ID de la provincia |
| ciudad_id | number | ID de la ciudad |
| barrio_id | number | ID del barrio |
| calle_id | number | ID de la calle |
| torre | string | Torre del domicilio |
| piso | string | Piso del domicilio |
| depto | string | Departamento |
| manzana | string | Manzana |
| lote | string | Lote |
| numeroPuerta | string | Número de puerta |
| nombreCalle | string | Nombre de la calle |
| actividadCliente | string | Descripción de la actividad |
| tipoCliente | string | Tipo de cliente (Familia/Empresa) |
| estadoCliente | string | Estado del cliente |
| datosCompletos | boolean | Indica si los datos están completos |
| clientePadre | number | ID del cliente padre (si aplica) |
| fechaNacimiento | string | Fecha de nacimiento (formato /Date(timestamp)/) |
| fechaIngreso | string | Fecha de ingreso (formato /Date(timestamp)/) |
| codigoPostal | string | Código postal |
| altitud | string | Latitud del domicilio |
| longitud | string | Longitud del domicilio |
| fechaUtlimaEntrega | string | Fecha de última entrega |
| fechaUltimoCobroFactura | string | Fecha de último cobro de factura |
| fechaUltimaEnvases | string | Fecha de última entrega de envases |
| fechaUltimaDevoluciones | string | Fecha de últimas devoluciones |
| validarOrdenesDeCompra | boolean | Indica si valida órdenes de compra |
| validaCredito | boolean | Indica si valida crédito |
| creditoPermitido | number | Monto de crédito permitido |
| limiteFacturas | number | Límite de facturas |
| facturacionAutomatica | boolean | Indica si tiene facturación automática |
| datosFacturacion_id | number | ID de datos de facturación |
| condicionIva_ids | number | ID de condición de IVA |
| tipoFactura_ids | number | ID del tipo de factura |
| cuit | string | CUIT del cliente |
| dniPersona | string | DNI de la persona |
| ingresosBrutos | string | Número de ingresos brutos |
| domicioFiscal | string | Domicilio fiscal |
| razonSocial | string | Razón social |
| centroDistribucion_id | number | ID del centro de distribución |
| centroDeDistribucion | string | Nombre del centro de distribución |
| orden | number | Orden |
| cicloVisitas | number | Ciclo de visitas |
| etiquetas | array | Array de etiquetas |
| situacionConsumo | number | Situación de consumo |
| situacionSaldos | number | Situación de saldos |

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Operación exitosa |
| 1 | Error - Referencia a objeto no establecida como instancia de un objeto |
| 401 | Token inválido o expirado |

## Ver También

- [Búsqueda Rápida](busqueda-rapida.md)
- [Obtener Sucursales](obtener-sucursales.md)
- [Crear Nuevo Cliente](crear-cliente.md)
