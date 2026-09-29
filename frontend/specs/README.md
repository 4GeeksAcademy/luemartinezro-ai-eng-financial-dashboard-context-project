# Contrato de Datos — Frontend ↔ Backend

> Documento de referencia del contrato de datos para las **tres funcionalidades** de `prompst.md`.
> Rutas, parámetros, tipos y restricciones **verificadas contra el OpenAPI generado por el backend**
> (`GET /openapi.json`, visible en `http://localhost:8000/docs`).
>
> Tipos TypeScript de referencia: `frontend/specs/api-types.ts` (respuestas) y
> `frontend/specs/param-types.ts` (parámetros de query).

---

## Endpoints consumidos por cada funcionalidad

| Funcionalidad | Endpoint(s) | Método | Archivo spec |
|---|---|---|---|
| **F1 — Filtro de rango de fechas** | `GET /api/metrics/facets`<br>`GET /api/metrics` | GET | `01-date-range-filter.md` |
| **F2 — Tabla de alertas** | `GET /api/metrics/alerts` | GET | `02-alerts-table.md` |
| **F3 — Vista B2B vs B2C** | `GET /api/metrics/categories/top`<br>`GET /api/metrics/summary`<br>`GET /api/metrics/facets` | GET | `03-b2b-vs-b2c-view.md` |

> Todos los endpoints son **GET**. El proxy de Vite redirige `/api/*` → `http://backend:8000` en desarrollo.

---

## F1 — Filtro de rango de fechas

### Endpoint 1: `GET /api/metrics/facets`

Parámetros de petición: **ninguno**.

Respuesta (tipo TS `FacetsResponse`):

| Campo | Tipo TS | Valores válidos | Restricciones |
|---|---|---|---|
| `operation_types` | `OperationType[]` | `"income"` \| `"outcome"` | — |
| `business_types` | `BusinessType[]` | `"B2B"` \| `"B2C"` | — |
| `categories` | `Category[]` | `"suppliers" \| "sales" \| "operational" \| "administrative" \| "others"` | — |
| `min_date` | `string` | fecha ISO `YYYY-MM-DD` | fecha más antigua del dataset |
| `max_date` | `string` | fecha ISO `YYYY-MM-DD` | fecha más reciente del dataset |

### Endpoint 2: `GET /api/metrics`

| Parámetro (query) | Tipo TS | Valores válidos | Requerido | Default |
|---|---|---|---|---|
| `start_date` | `string` | fecha ISO `YYYY-MM-DD` | ❌ | `null` |
| `end_date` | `string` | fecha ISO `YYYY-MM-DD` | ❌ | `null` |
| `category` | `Category` | ver `Category` | ❌ | `null` |
| `operation_type` | `OperationType` | `"income"` \| `"outcome"` | ❌ | `null` |

> En `param-types.ts` estos filtros opcionales se tipan como `string \| null` / `Category \| null` /
> `OperationType \| null` y **deben omitirse de la URL cuando son `null`**.

Respuesta: `list[FinancialMovement]` (tipo TS `FinancialMovement[]`).

| Campo | Tipo TS | Valores válidos | Restricciones |
|---|---|---|---|
| `create_date` | `string` | fecha ISO `YYYY-MM-DD` | — |
| `amount` | `number` | ≥ 0 | USD |
| `operation_type` | `OperationType` | `"income"` \| `"outcome"` | — |
| `category` | `Category` | 5 valores posibles | — |
| `business_type` | `BusinessType` | `"B2B"` \| `"B2C"` | — |

---

## F2 — Tabla de alertas de anomalías

### Endpoint: `GET /api/metrics/alerts`

| Parámetro (query) | Tipo TS | Valores válidos | Requerido | Default | Restricción |
|---|---|---|---|---|---|
| `threshold` | `number` | `>= 0.01` (UI) | ❌ | `0.3` | Backend: `>= 0`; **UI lo limita a ≤ 1.0** |
| `group_by` | `GroupBy` | `"day"` \| `"week"` \| `"month"` | ❌ | `"month"` | — |
| `start_date` | `string` | fecha ISO `YYYY-MM-DD` | ❌ | `null` | — |
| `end_date` | `string` | fecha ISO `YYYY-MM-DD` | ❌ | `null` | — |
| `business_type` | `BusinessType` | `"B2B"` \| `"B2C"` | ❌ | `null` | — |

> Tipo TS del conjunto de params: `AlertsParams`.

Respuesta: `list[MetricsAlert]` (tipo TS `AlertResponse = AlertEntry[]`).

| Campo | Tipo TS | Valores válidos | Restricciones |
|---|---|---|---|
| `period` | `string` | `"2024-01"` (mes), `"2024-W03"` (semana), `"2024-01-15"` (día) | depende de `group_by` |
| `outcome_total` | `number` | ≥ 0 | gasto del período, USD |
| `baseline_average` | `number` | ≥ 0 | **media de todo el histórico** (no rolling window de 3) ⚠️ |
| `increase_ratio` | `number` | > `threshold` | `(outcome_total − baseline_average) / baseline_average` |

---

## F3 — Vista comparativa B2B vs B2C

### Endpoint 1: `GET /api/metrics/categories/top` (llamada ×2: B2B y B2C)

| Parámetro (query) | Tipo TS | Valores válidos | Requerido | Default | Restricción |
|---|---|---|---|---|---|
| `operation_type` | `OperationType` | `"income"` \| `"outcome"` | ❌ | `"outcome"` | la vista usa `"income"` |
| `limit` | `number` | `1`–`20` | ❌ | `5` | la vista usa `5` |
| `start_date` | `string` | fecha ISO `YYYY-MM-DD` | ❌ | `null` | — |
| `end_date` | `string` | fecha ISO `YYYY-MM-DD` | ❌ | `null` | — |
| `business_type` | `BusinessType` | `"B2B"` \| `"B2C"` | ❌ | `null` | **requerido por la vista** |

> Tipo TS del conjunto de params: `TopCategoriesParams`.

Respuesta: `list[TopCategoryItem]` (tipo TS `TopCategoriesResponse = CategoryEntry[]`).

| Campo | Tipo TS | Valores válidos | Restricciones |
|---|---|---|---|
| `category` | `Category` | 5 valores posibles | — |
| `operation_type` | `OperationType` | `"income"` \| `"outcome"` | — |
| `total_amount` | `number` | ≥ 0 | suma de `amount`, USD |

> ⚠️ El backend **no devuelve porcentajes**; el `% of Group` se calcula en el frontend.

### Endpoint 2: `GET /api/metrics/summary` (llamada ×2: B2B y B2C)

| Parámetro (query) | Tipo TS | Valores válidos | Requerido | Default |
|---|---|---|---|---|
| `group_by` | `GroupBy` | `"day"` \| `"week"` \| `"month"` | ❌ | `"month"` |
| `operation_type` | `OperationType` | `"income"` \| `"outcome"` | ❌ | `null` |
| `business_type` | `BusinessType` | `"B2B"` \| `"B2C"` | ❌ | `null` |
| `start_date` | `string` | fecha ISO `YYYY-MM-DD` | ❌ | `null` |
| `end_date` | `string` | fecha ISO `YYYY-MM-DD` | ❌ | `null` |
| `category` | `Category` | 5 valores posibles | ❌ | `null` |

Respuesta: `list[MetricsSummaryItem]` (tipo TS `MetricsSummaryItem[]`).

| Campo | Tipo TS | Valores válidos | Restricciones |
|---|---|---|---|
| `period` | `string` | ej. `"2024-01"` | depende de `group_by` |
| `income` | `number` | ≥ 0 | USD |
| `outcome` | `number` | ≥ 0 | USD |
| `net` | `number` | puede ser negativo | `income − outcome`, USD |

### Endpoint 3: `GET /api/metrics/facets`

Igual que en F1 (referencia de rango y categorías). Respuesta `FacetsResponse`.

---

## Resumen de tipos TypeScript (Fase 2)

```ts
// api-types.ts
export type OperationType = 'income' | 'outcome'
export type Category = 'suppliers' | 'sales' | 'operational' | 'administrative' | 'others'
export type BusinessType = 'B2B' | 'B2C'

export interface FacetsResponse        { operation_types: OperationType[]; business_types: BusinessType[]; categories: Category[]; min_date: string; max_date: string }
export interface AlertEntry            { period: string; outcome_total: number; baseline_average: number; increase_ratio: number }
export type AlertResponse = AlertEntry[]
export interface CategoryEntry         { category: Category; operation_type: OperationType; total_amount: number }
export type TopCategoriesResponse = CategoryEntry[]
export interface MetricsSummaryItem    { period: string; income: number; outcome: number; net: number }

// param-types.ts
export type GroupBy = 'day' | 'week' | 'month'
export interface DateRangeFilter       { startDate: string | null; endDate: string | null }
export interface AlertsParams          { threshold: number; groupBy?: GroupBy; startDate?: string | null; endDate?: string | null; businessType?: BusinessType | null }
export interface TopCategoriesParams   { operationType?: OperationType; limit?: number; startDate?: string | null; endDate?: string | null; businessType?: BusinessType | null }
export interface MetricsParams         { startDate?: string | null; endDate?: string | null; category?: Category | null; operationType?: OperationType | null; businessType?: BusinessType | null }
```

---

## Casos límite por funcionalidad y comportamiento de la UI

### F1 — Rango de fechas (2+ casos)

1. **Ambos inputs vacíos (`startDate = endDate = null`)**
   → Se hace `GET /api/metrics` **sin** `start_date` ni `end_date`. La UI muestra el dashboard completo con todos los datos y el helper `Available range: {min_date} — {max_date}`.

2. **Solo `start_date` definido**
   → La URL incluye únicamente `start_date` (se omite `end_date`). La UI muestra KPIs y gráficos desde esa fecha hacia adelante; el input de fin queda vacío.

3. **`startDate > endDate` (rango invertido)**
   → **No se dispara fetch.** La UI marca el input de fin con `aria-invalid`/borde destructivo. El dashboard conserva el último rango válido renderizado.

4. **Rango válido pero sin datos en él**
   → La API devuelve `[]`. La UI muestra el empty state existente ("No data available...") en los gráficos y `$0`/`—` en los KPIs si procede; el filtro sigue activo (no se resetea).

### F2 — Alertas (2+ casos)

1. **Ninguna anomalía para el umbral actual**
   → `AlertResponse = []`. La UI **muestra explícitamente** "No anomalies detected for the current threshold." dentro del Card (la tabla/formato no desaparece). La altura del Card se mantiene para evitar salto de layout.

2. **Umbral editado fuera de rango (p. ej. `1.5` o `0`)**
   → El input se marca `aria-invalid` y **no se hace fetch** con un valor inválido. La tabla conserva el último estado válido; se muestra un tooltip/mensaje de rango válido `0.01–1.0`.

3. **Rango de fechas (F1) activo sin períodos previos al baseline**
   → El primer período del rango nunca genera alerta (no hay histórico previo). La UI muestra las alertas de los períodos posteriores; la columna **Baseline Avg** refleja la media de los períodos anteriores disponibles en el rango.

4. **Aumento del umbral por encima del incremento real**
   → Al subir `threshold` disminuyen/desaparecen las filas; con empty state del caso 1. Al bajarlo reaparecen (refetch en vivo, debounce 300 ms).

### F3 — Vista B2B vs B2C (2+ casos)

1. **Error en una de las 4 llamadas paralelas**
   → La UI muestra un banner de error en la **sección afectada** (tabla B2B, tabla B2C o gráfico) y las demás secciones siguen renderizando con sus datos. Solo si fallan las 4 se muestra un banner general con "Retry".

2. **Sin datos de ingreso en el rango para un grupo**
   → La tabla de ese grupo muestra empty "No revenue data available for the selected period."; la **otra tabla y el gráfico** se renderizan normalmente (el punto del grupo sin datos aporta `0` a `b2bIncome`/`b2cIncome` del gráfico).

3. **Menos de 5 categorías de ingreso disponibles**
   → El mock solo genera `sales` y `others` para income (limitación documentada). La UI muestra únicamente las filas devueltas (`limit=5` no se rellena con placeholders); el **% de grupo se calcula sobre las categorías devueltas**, por lo que suma 100% si hay ≤5 categorías de ingreso.

4. **`period` presente en un grupo pero ausente en el otro**
   → El merge por `period` rellena con `0` el lado faltante para mantener alineado el eje X del gráfico (meses sin dato se muestran como barra `0`).

---

## Notas sobre restricciones verificadas en OpenAPI

- `limit`: `1 ≤ limit ≤ 20` (default `5`).
- `threshold` (alerts): **solo `minimum=0`** en el backend; el tope `≤ 1.0` es una decisión de UI según el brief (`prompst.md`).
- `group_by`: enum cerrado `day | week | month`.
- `operation_type`, `category`, `business_type`: enums cerrados (literales comprobados contra OpenAPI).
- Fechas: tipo `date` de OpenAPI → se serializan como `YYYY-MM-DD` y se tipan como `string` en el frontend.
- Todos los campos de respuesta son `required` (no hay campos anulables en las respuestas de F1/F2/F3).