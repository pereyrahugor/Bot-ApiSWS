# Crear Nuevo Cliente

Este endpoint permite registrar anticipadamente un nuevo cliente en el sistema (Alta Temprana).

## Endpoint

```
POST /Clientes/CrearNuevoClientePorChatBot
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| cliente | object | Objeto con datos del cliente | Sí |
| reparto_id | number | ID del reparto a asignar | Sí |

### Estructura del objeto `cliente`

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| nombre | string | Nombre completo del cliente | Sí |
| tipoDeClienteId | number | ID del tipo de cliente (1=Familia, 2=Empresa) | Sí |
| actividadId | number | ID de la actividad del cliente (ver tablas abajo) | No |
| condicionIvaId | number | ID de la Condición de IVA (ver tablas abajo) | Sí |
| dniCuit | string | DNI o CUIT del cliente | Sí |
| telefono | string | Teléfono de contacto | Sí |
| email | string | Correo electrónico | Sí |
| listaDePreciosId | number | ID de la lista de precios asignada | Sí |
| domicilio | object | Objeto con información del domicilio | Sí |

### Estructura del objeto `domicilio`

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| provincia | string | Nombre de la provincia | Sí |
| ciudad | string | Nombre de la ciudad | Sí |
| calle | string | Nombre de la calle | Sí |
| puerta | number | Número de puerta / altura | Sí |
| piso | string | Piso | No |
| depto | string | Departamento | No |
| torre | string | Torre o edificio | No |
| cp | string | Código postal | Sí |
| manzana | string | Manzana | No |
| lote | string | Lote | No |
| observaciones | string | Observaciones adicionales | No |
| latitud | string | Coordenada latitud | Sí |
| longitud | string | Coordenada longitud | Sí |

## Ejemplo de Request

```json
{
  "cliente": {
    "nombre": "Cliente de alta rapida",
    "tipoDeClienteId": 1,
    "condicionIvaId": 2,
    "dniCuit": "3454564566",
    "telefono": "00",
    "email": "al456756756@test.com",
    "listaDePreciosId": 1,
    "domicilio": {
      "provincia": "Salta",
      "ciudad": "Salta",
      "calle": "Av. Sarmiento",
      "puerta": 2,
      "observaciones": "",
      "piso": "4",
      "depto": "b",
      "torre": "",
      "cp": "X5012",
      "lote": "",
      "manzana": "",
      "latitud": "-31.3651314",
      "longitud": "-64.156489"
    }
  },
  "reparto_id": 1007
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "message": "",
  "data": {
    "cliente_id": 1042,
    "nombreCliente": "Cliente de alta rapida",
    "nombreReparto": "S/R",
    "actividad_ids": 15,
    "tipoCliente_ids": 1,
    "estadoCliente_ids": 5,
    "dniCliente": "963345344",
    "domicilioCompleto": "Córdoba, ALEJANDRA PIZERNICK 2. piso 4. depto b. ",
    "tipoCliente": "Familia",
    "estadoCliente": "Borrador",
    "fechaIngreso": "/Date(1753275884110)/",
    "codigoPostal": "X5012",
    "altitud": "-31.3651314",
    "longitud": "-64.156489",
    "centroDeDistribucion": "PRUEBA"
  }
}
```

## Tablas de Referencia

### Actividades (actividadId)
- 1: Comercio
- 2: Servicios Profesionales
- 3: Educación
- 4: Industria
- 15: Consumidor final
- 18: Otras

### Condiciones de IVA (condicionIvaId)
- 1: Responsable Inscripto
- 2: Consumidor Final
- 3: Monotributista
- 4: Sujeto Exento
- 5: IVA No alcanzado

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Operación exitosa |
| 1 | Error - Referencia a objeto no establecida como instancia de un objeto (usualmente faltan parámetros) |

## Ver También

- [Búsqueda Rápida](busqueda-rapida.md)
- [Agregar Contacto](agregar-contacto.md)
- [Obtener Datos del Cliente](obtener-datos.md)
