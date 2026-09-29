# Spec 01 — Filtro de rango de fechas en el dashboard principal

## Descripción

Añadir dos inputs de fecha en la parte superior del dashboard — fecha de inicio y fecha de fin — que filtren todos los datos mostrados actualmente. Las fechas se envían a la API en formato `YYYY-MM-DD`. Ambos inputs son opcionales; cuando están vacíos se muestran todos los datos disponibles.

**Estado del backend:** ✅ Sin incompatibilidades. Alineación perfecta entre lo solicitado y lo implementado.

---

## Endpoints involucrados

### `GET /api/metrics/facets`

Obtener el rango de fechas disponible (mínima y máxima) para mostrarlo como referencia al usuario.

| Parámetro | Tipo | Requerido | Default |
|---|---|---|---|
| *(ninguno)* | — | — | — |

**Respuesta (MetricsFacets):**

```json
{
  "operation_types": ["income", "outcome"],
  "business_types": ["B2B", "B2C"],
  "categories": ["administrative", "operational", "others", "sales", "suppliers"],
  "min_date": "2024-01-05",
  "max_date": "2024-12-28"
}
```

| Campo | Tipo Python | Tipo TS | Descripción |
|---|---|---|---|
| `operation_types` | `list[Literal["income","outcome"]]` | `OperationType[]` | Tipos de operación disponibles |
| `business_types` | `list[Literal["B2B","B2C"]]` | `BusinessType[]` | Tipos de negocio disponibles |
| `categories` | `list[Category]` | `Category[]` | Categorías disponibles |
| `min_date` | `date` (ISO) | `string` | Fecha más antigua del dataset |
| `max_date` | `date` (ISO) | `string` | Fecha más reciente del dataset |

---

### `GET /api/metrics`

Endpoint principal del dashboard, ya acepta filtros de fecha.

**Query params:**

| Parámetro | Tipo | Requerido | Default |
|---|---|---|---|
| `start_date` | `date` (ISO) | ❌ Opcional | `None` |
| `end_date` | `date` (ISO) | ❌ Opcional | `None` |
| `category` | `Category` literal | ❌ Opcional | `None` |
| `operation_type` | `OperationType` literal | ❌ Opcional | `None` |

**Uso:** `GET /api/metrics?start_date=2024-06-01&end_date=2024-08-31`

**Respuesta:** `list[FinancialMovement]`

```json
[
  {
    "create_date": "2024-06-05",
    "amount": 64500.0,
    "operation_type": "income",
    "category": "sales",
    "business_type": "B2B"
  }
]
```

---

## Nuevos tipos TypeScript necesarios

Agregar en `frontend/src/lib/financial-types.ts`:

```typescript
export interface MetricsFacets {
  operation_types: OperationType[]
  business_types: BusinessType[]
  categories: Category[]
  min_date: string   // ISO date
  max_date: string   // ISO date
}
```

---

## Componentes a crear / modificar

### `DateRangeFilter` (nuevo componente)

- Dos inputs de tipo `date` con etiquetas: "Start date" y "End date"
- Texto informativo debajo: `Available range: 2024-01-05 — 2024-12-28`
- Inputs inicializados vacíos
- Al cambiar cualquiera de los dos, dispara callback con `{ startDate: string | null, endDate: string | null }`

**Props:**

```typescript
interface DateRangeFilterProps {
  minDate: string
  maxDate: string
  startDate: string | null
  endDate: string | null
  onDateChange: (range: { startDate: string | null; endDate: string | null }) => void
}
```

### `App.tsx` (modificar)

- Añadir estado `startDate` y `endDate` con `useState<string | null>(null)`
- Añadir un `useEffect` para fetch inicial de `/api/metrics/facets` (una sola vez al montar el componente)
- Modificar el `useEffect` existente para que dependa de `[startDate, endDate]` y refetchee `/api/metrics` incluyendo los query params de fecha cuando no sean nulos
- Pasar `DateRangeFilter` al layout, ubicado cerca del `DashboardHeader`

### `DashboardHeader` (modificar — opcional)

Extender props para aceptar un children o un slot para el filtro de fechas.

---

## Flujo de datos

```
App monta
  ├─ useEffect① → GET /api/metrics/facets → minDate, maxDate
  └─ useEffect② → GET /api/metrics → movements
                      ↓
               computeKPIs(movements) → KPIMetrics
               computeMonthlyData(movements) → MonthlyDataPoint[]

Usuario cambia fecha
  └─ useEffect② se dispara de nuevo
       └─ GET /api/metrics?start_date=...&end_date=...
```

---

## Estados UX

| Estado | Condición | UI |
|---|---|---|
| Carga de facets | Primer render, esperando facets | Texto "Loading available dates..." |
| Facets cargados | `minDate` y `maxDate` disponibles | Inputs visibles con rango indicado |
| Carga de métricas | Fetch en progreso con filtros | Skeletons existentes (KPIs + charts) |
| Empty (sin datos) | Array vacío del fetch con filtros | Mensaje "No data available for the selected period" |
| Error de facets | Fallo en fetch de facets | Error banner; dashboard funciona sin filtros |
| Error de métricas | Fallo en fetch de métricas | Error banner existente en App.tsx |

---

## Notas técnicas

- No enviar `start_date` / `end_date` en la URL si están vacíos (null)
- Los inputs `date` nativos del navegador ya validan formato YYYY-MM-DD
- El rango (`minDate`, `maxDate`) es informativo, no restrictivo: si el usuario elige fechas fuera de rango, la API devuelve array vacío
- Los filtros afectan a todos los KPIs y gráficos del dashboard actual
- Compatibilidad con tema claro/oscuro usando las variables CSS existentes
- Los tipos de los filtros (`category`, `operation_type`) ya existen en el endpoint pero no se usan aún en esta funcionalidad