# Tipos de Datos

Referencia de tipos de datos utilizados en la API.

## Formatos de Fecha

### Fecha Simple
```
Formato: DD/MM/YYYY
Ejemplo: 16/01/2026
```

### Fecha y Hora
```
Formato: YYYY-MM-DD HH:mm:ss
Ejemplo: 2026-01-16 14:30:00
```

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

## Estados de Factura

| Estado | Descripción |
|--------|-------------|
| Pendiente | Factura emitida, sin pagar |
| Pagada | Factura pagada completamente |
| Parcial | Factura con pago parcial |
| Anulada | Factura anulada |

## Prioridades de Incidentes

| Prioridad | Descripción | Tiempo de Respuesta |
|-----------|-------------|---------------------|
| Alta | Requiere atención inmediata | 2 horas |
| Media | Atención en el día | 24 horas |
| Baja | Puede esperar | 48 horas |

## Estructura de Domicilio

```typescript
interface Domicilio {
  provincia: string;
  pais: string;
  ciudad: string;
  calle: string;
  puerta?: string;
  observaciones?: string;
  piso?: string;
  depto?: string;
  torre?: string;
  cp?: string;
  lote?: string;
  manzana?: string;
  latitud?: string;
  longitud?: string;
}
```

## Estructura de Reparto

```typescript
interface Reparto {
  reparto_id: number;
  nombreReparto: string;
  visitas: string;
  proximaVisita: string;
  diasProximaVisita: number;
}
```

## Monedas

| Código | Descripción |
|--------|-------------|
| ARS | Peso Argentino |
| USD | Dólar Estadounidense |
