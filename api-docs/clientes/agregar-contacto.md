# Agregar Contacto

Este endpoint permite añadir un contacto secundario o alternativo a un cliente ya existente en el sistema.

## Endpoint

```
POST /api/Clientes/CreateContacto
```

## Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| Content-Type | application/json | Sí |
| CURRENTTOKENVALUE | {token} | Sí |

## Parámetros del Body

| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| ModeloContacto | object | Objeto con los datos del contacto | Sí |

### Estructura del objeto `ModeloContacto`

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| tipoContacto_ids | number | 1: Primer contacto, 2: Contacto Alternativo | Sí |
| nombrePersona | string | Nombre completo del contacto | Sí |
| sectorEmpresa | string | Valor del texto indicando el sector | No |
| telefono | string | Teléfono fijo | No |
| email | string | Email del contacto | Sí |
| observaciones | string | Notas adicionales | No |
| cliente_id | number | ID único del cliente al que se asocia | Sí |
| contactoPrincipal | number | 1 si es principal, 0 si no | No |
| celular | string | Teléfono móvil | Sí |
| sector_ids | number | ID de relación (ver tabla de sectores) | Sí |
| enviarComprobanteFiscalAdjunto | boolean | Habilita envío automático de comprobantes | No |
| enviarRemitos | boolean | Habilita envío automático de remitos | No |
| enviarAvisoDeProximaVisita | boolean | Habilita avisos de visitas | No |

## Ejemplo de Request

```json
{
  "ModeloContacto": {
    "tipoContacto_ids": 1,
    "nombrePersona": "Nombre Persona",
    "sectorEmpresa": null,
    "telefono": "+54",
    "email": "contactoejemplo@test.net",
    "observaciones": "observaciones",
    "cliente_id": 33,
    "contactoPrincipal": 0,
    "celular": "Prueba 2",
    "sector_ids": 1077,
    "caracteristicaCelular": 0,
    "porCuentaCorriente": 0,
    "fechaValidacionEmail": null,
    "codigoValidacion": null,
    "enviarComprobanteFiscalAdjunto": 0,
    "enviarRemitos": 0,
    "enviarOrdenesDeTrabajo": 0,
    "enviarAvisoDeProximaVisita": 0
  }
}
```

## Ejemplo de Respuesta Exitosa

```json
{
  "error": "0",
  "message": "El contacto ha sido creado exitosamente",
  "cliente_id": "0"
}
```

## Tablas de Referencia

### Sectores (sector_ids)
- 1: Gerente
- 2: RRHH
- 3: Calidad
- 4: Compras
- 5: Encargado
- 6: Titular
- 7: Pareja
- 8: Organización

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 0 | Operación exitosa |
| 1 | Error - Parámetros faltantes o cliente no encontrado |

## Ver También

- [Obtener Datos del Cliente](obtener-datos.md)
- [Obtener Sucursales](obtener-sucursales.md)
