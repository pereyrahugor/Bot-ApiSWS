# Crear Nuevo Cliente

Crea un nuevo cliente en el sistema.

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
| tipoDeClienteId | number | Tipo de cliente (1=Familia, 2=Empresa) | Sí |
| condicionIvaId | number | Condición de IVA (default: 2) | No |
| dniCuit | string | DNI o CUIT | Sí |
| telefono | string | Teléfono de contacto | Sí |
| email | string | Email del cliente | No |
| listaDePreciosId | number | ID de lista de precios (default: 1) | No |
| domicilio | object | Objeto con información del domicilio | Sí |

### Estructura del objeto `domicilio`

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| provincia | string | Provincia | Sí |
| pais | string | País | Sí |
| ciudad | string | Ciudad | Sí |
| calle | string | Calle y número | Sí |
| cp | string | Código postal | No |
| piso | string | Piso | No |
| depto | string | Departamento | No |
| torre | string | Torre | No |
| puerta | string | Puerta | No |
| observaciones | string | Observaciones | No |
| latitud | string | Latitud (se calcula automáticamente) | No |
| longitud | string | Longitud (se calcula automáticamente) | No |

## Ejemplo de Request

```json
{
  "cliente": {
    "nombre": "Juan Pérez",
    "tipoDeClienteId": 1,
    "condicionIvaId": 2,
    "dniCuit": "12345678",
    "telefono": "3512345678",
    "email": "juan.perez@email.com",
    "listaDePreciosId": 1,
    "domicilio": {
      "provincia": "Cordoba",
      "pais": "Argentina",
      "ciudad": "Córdoba Capital",
      "calle": "Av. Colón 1234",
      "cp": "5000",
      "piso": "",
      "depto": "",
      "torre": "",
      "puerta": "",
      "observaciones": ""
    }
  },
  "reparto_id": 1
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": 0,
  "cliente": {
    "cliente_id": 350,
    "nombre": "Juan Pérez",
    "dniCuit": "12345678",
    "telefono": "3512345678",
    "email": "juan.perez@email.com"
  },
  "message": "Cliente creado exitosamente"
}
```

## Ejemplo de Respuesta con Error

```json
{
  "error": 1,
  "message": "El DNI ya existe en el sistema"
}
```

## Notas Importantes

- El sistema calcula automáticamente las coordenadas (latitud/longitud) basándose en la dirección
- El nombre debe incluir nombre y apellido completos
- El DNI/CUIT debe ser único en el sistema
- Si no se especifica `listaDePreciosId`, se asigna la lista por defecto (1)
- Si no se especifica `condicionIvaId`, se asigna "Consumidor Final" (2)

## Tipos de Cliente

| ID | Descripción |
|----|-------------|
| 1 | Familia |
| 2 | Empresa |

## Condiciones de IVA

| ID | Descripción |
|----|-------------|
| 1 | Responsable Inscripto |
| 2 | Consumidor Final |
| 3 | Exento |
| 4 | Monotributo |

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Cliente creado exitosamente |
| 1 | Error al crear cliente |
| 2 | DNI/CUIT ya existe |
| 3 | Datos incompletos |
| 401 | Token inválido o expirado |

## Ver También

- [Búsqueda Rápida](busqueda-rapida.md)
- [Agregar Contacto](agregar-contacto.md)
