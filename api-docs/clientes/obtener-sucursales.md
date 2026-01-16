# Obtener Sucursales del Cliente

Devuelve los datos y las sucursales asociadas a un cliente específico.

## Endpoint

```
POST /api/Clientes/ObtenerSucursalesJson
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| cliente_id | number | ID del cliente a consultar | Sí |

## Ejemplo de Request

```json
{
  "cliente_id": 208
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "message": "",
  "data": [
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
      "nombreCalle": "Chaco ",
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
  ]
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| error | number | 0 para éxito, 1 para error |
| message | string | Mensaje de error (si aplica) |
| data | array | Lista de sucursales (con estructura similar a Datos del Cliente) |

## Ver También

- [Obtener Datos del Cliente](obtener-datos.md)
- [Búsqueda Rápida](busqueda-rapida.md)
