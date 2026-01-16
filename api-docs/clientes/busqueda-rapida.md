# Búsqueda Rápida de Clientes

Permite buscar clientes por diferentes criterios: nombre, DNI, teléfono o domicilio.

## Endpoint

```
POST /api/Clientes/BusquedaRapidaResultJson
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| datosCliente | string | Nombre, apellido, DNI o ID del cliente | No |
| telefono | string | Número de teléfono | No |
| domicilio | string | Dirección del cliente | No |

> **Nota**: Al menos uno de los parámetros debe ser proporcionado.

## Ejemplo de Request

```json
{
  "datosCliente": "Juan Pérez",
  "telefono": "",
  "domicilio": ""
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "data": [
    {
      "cliente_id": 208,
      "nombre": "Juan",
      "apellido": "Pérez",
      "nombreCompleto": "Juan Pérez",
      "dniCuit": "12345678",
      "telefono": "3512345678",
      "email": "juan.perez@email.com",
      "domicilio": {
        "calle": "Av. Colón",
        "numero": "1234",
        "ciudad": "Córdoba",
        "provincia": "Córdoba",
        "pais": "Argentina",
        "cp": "5000"
      },
      "tipoCliente": "Familia",
      "condicionIva": "Consumidor Final",
      "listaDePreciosId": 1,
      "reparto": {
        "id": 1,
        "nombre": "Zona Centro"
      }
    }
  ]
}
```

## Ejemplo de Respuesta Sin Resultados

```json
{
  "error": 0,
  "data": [],
  "message": "No se encontraron clientes con los criterios especificados"
}
```

## Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| cliente_id | number | ID único del cliente |
| nombre | string | Nombre del cliente |
| apellido | string | Apellido del cliente |
| nombreCompleto | string | Nombre completo concatenado |
| dniCuit | string | DNI o CUIT del cliente |
| telefono | string | Teléfono de contacto |
| email | string | Email del cliente |
| domicilio | object | Objeto con información del domicilio |
| tipoCliente | string | Tipo de cliente (Familia, Empresa, etc.) |
| condicionIva | string | Condición frente al IVA |
| listaDePreciosId | number | ID de la lista de precios asignada |
| reparto | object | Información del reparto asignado |

## Búsqueda por Diferentes Criterios

### Por Nombre
```json
{
  "datosCliente": "Juan",
  "telefono": "",
  "domicilio": ""
}
```

### Por DNI
```json
{
  "datosCliente": "12345678",
  "telefono": "",
  "domicilio": ""
}
```

### Por Teléfono
```json
{
  "datosCliente": "",
  "telefono": "3512345678",
  "domicilio": ""
}
```

### Por Domicilio
```json
{
  "datosCliente": "",
  "telefono": "",
  "domicilio": "Av. Colón 1234"
}
```

### Búsqueda Combinada
```json
{
  "datosCliente": "Juan",
  "telefono": "3512345678",
  "domicilio": ""
}
```

## Notas

- La búsqueda es case-insensitive
- Se admiten búsquedas parciales
- Los resultados se ordenan por relevancia
- Si hay múltiples coincidencias, se devuelven todas

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Operación exitosa |
| 1 | Error en la búsqueda |
| 401 | Token inválido o expirado |

## Ver También

- [Obtener Datos del Cliente](obtener-datos.md)
- [Crear Nuevo Cliente](crear-cliente.md)
