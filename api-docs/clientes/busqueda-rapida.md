# Búsqueda Rápida de Clientes

Permite buscar clientes por diferentes criterios: nombre (o datos de facturación), DNI/CUIT, teléfono o domicilio.

## Endpoint

```
POST /api/Session/BusquedaRapidaResultJson
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| datosCliente | string | Nombre, apellido, Razón Social o datos de facturación | No |
| telefono | string | Número de teléfono | No |
| dni | string | DNI o CUIT del cliente | No |
| domicilio | string | Dirección del cliente | No |

> **Nota**: Con cualquiera de los parámetros se puede realizar la búsqueda. Cuando no coincide ningún dato, devuelve todos los clientes.

## Ejemplo de Request

```json
{
  "datosCliente": "christian",
  "telefono": "+54",
  "dni": "3",
  "domicilio": "a"
}
```

## Ejemplo de Respuesta Exitosa

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
      "torre": "",
      "piso": "",
      "depto": "",
      "manzana": "",
      "lote": "",
      "numeroPuerta": "770",
      "nombreCalle": "Rivadavia",
      "actividadCliente": "Taller",
      "tipoCliente": "Familia",
      "estadoCliente": "Activo",
      "datosCompletos": true,
      "clientePadre": null,
      "fechaNacimiento": "/Date(1577847600000)/",
      "fechaIngreso": "/Date(1577847600000)/",
      "codigoPostal": "1980",
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
      "datosFacturacion_id": 53,
      "condicionIva_ids": 2,
      "tipoFactura_ids": 2,
      "cuit": "1111111111",
      "dniPersona": "",
      "ingresosBrutos": "1111111111",
      "domicioFiscal": "Rivadavia 770",
      "razonSocial": "Alvarez Pablo",
      "centroDistribucion_id": 1,
      "centroDeDistribucion": "CD Testing",
      "orden": 0,
      "cicloVisitas": 0,
      "etiquetas": [],
      "situacionConsumo": 1,
      "situacionSaldos": 1
    }
  ],
  "error": 0,
  "message": ""
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| data | array | Lista de clientes encontrados |
| error | number | 0 para éxito, 1 para error |
| message | string | Mensaje de error (si aplica) |

### Campos del objeto Cliente

| Campo | Tipo | Descripción |
|-------|------|-------------|
| cliente_id | number | ID único del cliente |
| nombreCliente | string | Nombre completo del cliente |
| nombreReparto | string | Nombre del reparto asignado |
| dniCliente | string | DNI del cliente |
| domicilioCompleto | string | Dirección completa |
| tipoCliente | string | Tipo (Familia/Empresa) |
| estadoCliente | string | Estado (Activo/Inactivo/etc.) |
| cuit | string | CUIT del cliente |
| razonSocial | string | Razón social |
| centroDeDistribucion | string | Centro de distribución asignado |
| fechaIngreso | string | Fecha de ingreso (/Date(timestamp)/) |
| creditoPermitido | number | Límite de crédito |
| facturacionAutomatica | boolean | Si tiene facturación automática |

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Operación exitosa |
| 1 | Error en la búsqueda |
| 404 | Recurso no encontrado (HTML error response) |

## Ver También

- [Obtener Datos del Cliente](obtener-datos.md)
- [Crear Nuevo Cliente](crear-cliente.md)
