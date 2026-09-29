# Spec de Componentes — Frontend

> Especificación de componentes React para las tres funcionalidades de `prompst.md`.
> Las props de cada componente están **alineadas con los tipos de la Fase 2**
> (`frontend/specs/api-types.ts` y `frontend/specs/param-types.ts`).

## Convenciones del proyecto (aplicar en todos los componentes)

- **Named exports**: preferir `export function` sobre `export default` (excepto `App.tsx`).
- **`verbatimModuleSyntax`**: usar `import type` para imports de tipos.
- **shadcn/ui**: componentes `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`, `Skeleton` con patrón `data-slot` y `cn()` para merge de clases.
- **Tema**: clases semánticas de Tailwind usando variables CSS (`--background`, `--foreground`, `--card`, `--border`, etc.). Toggle de tema controlado por clase `.dark` en el contenedor raíz.
- **Formateo**: `formatCurrency()` y `formatPercent()` de `frontend/src/lib/financial-utils.ts`.
- **Estados por sección**: cada componente gestiona `loading`, `error` y `empty` de forma independiente (ver Punto 6 y 5 de `verification.md`).

---

# 1) Filtro de rango de fechas (Funcionalidad 1)

## Componente `DateRangeFilter`

Control de dos inputs (start/end) que filtran los datos del dashboard y de la tabla de alertas.

### Props (alineadas con Fase 2)

```ts
import type { DateRangeFilter as DateRange } from '../specs/param-types'

export interface DateRangeFilterProps {
  /** Fecha mínima disponible del dataset (del endpoint /facets). Formato YYYY-MM-DD. */
  minDate: string
  /** Fecha máxima disponible del dataset (del endpoint /facets). Formato YYYY-MM-DD. */
  maxDate: string
  /** Fecha de inicio seleccionada. `null` = sin límite inferior. Formato YYYY-MM-DD. */
  startDate: string | null
  /** Fecha de fin seleccionada. `null` = sin límite superior. Formato YYYY-MM-DD. */
  endDate: string | null
  /** Notifica un cambio del rango. Se dispara con el rango completo con cada edición. */
  onDateChange: (range: DateRange) => void
}
```

> El tipo `DateRange` (`{ startDate: string | null; endDate: string | null }`) está definido en `param-types.ts` y **se reutiliza aquí como contrato del estado del filtro**.

### Resolución de ambigüedades del brief

| # | Ambigüedad del brief | Decisión especificada |
|---|---|---|
| 1.1 | ¿Los inputs filtran **todos** los datos mostrados? | Sí: KPIs, gráficos (líneas) y también la tabla de alertas (la F2 lo exige). Todos leen el mismo `DateRange` estado desde `App.tsx`. |
| 1.2 | ¿Filtro automático o con botón "Aplicar"? | **Automático al cambiar** (sin botón). El dataset es mock y las respuestas son rápidas; filtrar en vivo da mejor UX. Se recomienda `debounce` de 300 ms opcional si el fetch se vuelve lento. |
| 1.3 | ¿Estado inicial? | Ambos inputs **vacíos** ⇒ `startDate = null`, `endDate = null` ⇒ el dashboard muestra todos los datos. |
| 1.4 | ¿Rango disponible mostrado dónde? | Texto de referencia bajo los inputs: `Available range: {minDate} — {maxDate}`. Es informativo, no restrictivo. |
| 1.5 | ¿Qué pasa si `startDate > endDate`? | El rango es **inválido**: no se dispara fetch y se muestra feedback visual (borde de error en el input de fin). La UI nunca envía un rango invertido. |
| 1.6 | ¿Dónde vive el estado del filtro? | En `App.tsx` (estado elevado), porque lo consumen `KPIs/gráficos` y `AlertsTable`. `DateRangeFilter` es controlado (props + `onDateChange`), no mantiene estado interno. |
| 1.7 | ¿Límites de los inputs? | `min={minDate}` y `max={maxDate}` en ambos inputs para guiar al usuario (pero no bloqueante si la API responde vacío fuera de rango). |

### Comportamiento / Estados

| Estado | Condición | UI |
|---|---|---|
| Carga de facets | Esperando `/api/metrics/facets` | `Skeleton` en el contenedor del filtro; no se muestran inputs |
| Facets cargados | `minDate` y `maxDate` disponibles | Inputs visibles + texto `Available range: ...` |
| Rango inválido | `startDate > endDate` | Inputs en estado `aria-invalid` / borde destructivo; sin fetch |
| Rango válido | Ambos nulos o `startDate <= endDate` | Fetch con `start_date`, `end_date` (solo los no nulos) |

---

# 2) Tabla de alertas de anomalías (Funcionalidad 2)

## Componente `AlertsTable`

Tabla de 4 columnas debajo de los gráficos con las anomalías de gasto, umbral configurable y empty state explícito.

### Props (alineadas con Fase 2)

```ts
import type { AlertEntry } from '../specs/api-types'

export interface AlertsTableProps {
  /** Fecha de inicio activa del DateRangeFilter (F1). `null` = sin límite inferior. */
  startDate: string | null
  /** Fecha de fin activa del DateRangeFilter (F1). `null` = sin límite superior. */
  endDate: string | null
  /** Umbral por defecto con el que arranca el input. Rango válido 0.01–1.0. Default 0.3. */
  defaultThreshold?: number
}
```

> `AlertsTable` construye internamente un objeto `AlertsParams` (de `param-types.ts`) para el fetch, combinando `threshold`, `startDate`, `endDate`. No expone `groupBy` ni `businessType` en esta iteración.

### Tabla (4 columnas del brief)

| Período | Outcome | Baseline Avg | Increase % |
|---|---|---|---|
| `period` | `outcome_total` | `baseline_average` | `increase_ratio` |

- Cada fila se alimenta de un `AlertEntry` (Fase 2): `period: string`, `outcome_total: number`, `baseline_average: number`, `increase_ratio: number`.
- Formato: montos con `formatCurrency()`, porcentaje con `formatPercent()` con signo `+`/`-`.

### Resolución de ambigüedades del brief

| # | Ambigüedad del brief | Decisión especificada |
|---|---|---|
| 2.1 | "Media móvil de los 3 períodos anteriores" vs backend | **Incompatibilidad documentada en spec 02**: el backend devuelve `baseline_average` = media de **todo el histórico**, no rolling window de 3. La columna muestra el valor que viene del backend tal cual. (Cambio de backend = decisión de producto, fuera del alcance de este spec de componentes). |
| 2.2 | Tipo de input del umbral | `input type="number"` con `min=0.01`, `max=1.0`, `step=0.05`, `default=0.3`. El backend solo valida `>= 0` (OpenAPI), así que **la UI aplica el tope de 1.0** según el brief. |
| 2.3 | ¿Refetch al cambiar el umbral? | Sí, en vivo. Se aplica `debounce` de 300 ms sobre el input del umbral para evitar un fetch por cada tecla. |
| 2.4 | ¿`group_by` elegible desde la UI? | No en esta iteración: se usa `group_by=month` fijo (default del backend). El títulado del período ("2024-01") refleja el mes. |
| 2.5 | Umbral fuera de rango (ej. > 1.0) | Input `aria-invalid`, feedback visual, **no se dispara fetch** hasta corregir. |
| 2.6 | Empty state | **Obligatorio y explícito**: si no hay alertas se muestra "No anomalies detected for the current threshold." dentro del `Card` (no se oculta la sección). |
| 2.7 | ¿Fila con `increase_ratio <= threshold`? | No aparece: el backend solo devuelve los que superan el threshold. La columna % siempre muestra valores > threshold. |
| 2.8 | ¿Las alertas respetan el rango de F1? | Sí: `AlertsTable` recibe `startDate`/`endDate` y los incluye en `AlertsParams`; al cambiar el rango se refetchea. |

### Comportamiento / Estados

| Estado | Condición | UI |
|---|---|---|
| Carga | Fetch en progreso | `Skeleton` de 4-5 filas dentro del `Card` |
| Empty | `AlertResponse` = `[]` | Mensaje explícito "No anomalies detected for the current threshold." |
| Datos | Alertas presentes | Tabla con encabezado + filas |
| Error | Fallo de red / 5xx | Banner de error con botón "Retry" |
| Umbral inválido | Fuera de [0.01, 1.0] | Input `aria-invalid`; sin fetch; tabla conserva el último estado válido |

---

# 3) Vista comparativa B2B vs B2C (Funcionalidad 3)

## Vista `B2BvsB2CView`

Página/vista con dos tablas paralelas de top-5 categorías de ingreso (una por línea de negocio) y un gráfico único comparativo de ingresos B2B vs B2C.

### Props (alineadas con Fase 2)

```ts
import type {
  CategoryEntry,
  MetricsSummaryItem,
} from '../specs/api-types'
import type { DateRangeFilter as DateRange } from '../specs/param-types'

export interface B2BvsB2CViewProps {
  /** Rango de fechas aplicado a la comparativa. `null` dates = sin filtro. */
  dateRange: DateRange
  /** Notifica cambios del rango desde el DateRangeFilter local de la vista. */
  onDateRangeChange: (range: DateRange) => void
}
```

> La vista es **controlada** en cuanto al rango (recibe `dateRange` + callback), para permitir que el estado suba a `App.tsx` si más adelante se quiere compartir con el dashboard. El `DateRange` proviene de `param-types.ts`.

### Subcomponente `DateRangeFilter` (reutilizado)

Mismo componente de la F1, con rango de fechas **independiente** del dashboard principal (ambigüedad del brief resuelta: el PM no aclaró si comparte filtro con F1; se decide independiente por página).

### Subcomponente `CategoryTable`

Tabla de top categorías para **una** línea de negocio.

```ts
export interface CategoryTableRow extends CategoryEntry {
  /** Porcentaje de la categoría sobre el total del grupo. Calculado en frontend (0-100). */
  percentage: number
}

export interface CategoryTableProps {
  /** Línea de negocio de la tabla. Determina el título ("B2B Top Income Categories"). */
  businessType: BusinessType
  /** Categorías a renderizar (ya calculadas con su `percentage`). */
  categories: CategoryTableRow[]
  /** Índica que el fetch de esta tabla está en curso. */
  loading: boolean
  /** Mensaje de error si el fetch de esta tabla falló. `null` si no hay error. */
  error: string | null
}
```

| Columna | Fuente |
|---|---|
| Category | `CategoryEntry.category` |
| Total Revenue | `CategoryEntry.total_amount` (formato `formatCurrency`) |
| % of Group | `percentage` calculado en frontend |

**Cálculo de `percentage` (ambigüedad resuelta):**
- El backend no devuelve porcentajes (verificado contra OpenAPI: `TopCategoryItem` solo tiene `category`, `operation_type`, `total_amount`).
- Se calcula con `total_amount / Σ(total_amount de las categorías devueltas) * 100`.
- ⚠️ Para `operation_type=income` el mock genera solo `sales` y `others`, así que `limit=5` devuelve todas ⇒ la suma es el total real del grupo. **Limitación documentada**: si en el futuro hubiera más de 5 categorías de ingreso, el % sería sobre el top-5, no sobre el total del grupo.

### Subcomponente `B2BvsB2CChart`

Gráfico único comparando ingresos B2B vs B2C por período.

```ts
export interface ComparisonPoint {
  /** Período del bucket (ej. "2024-01"). Clave del eje X. */
  period: string
  /** Ingreso B2B en el período. USD. */
  b2bIncome: number
  /** Ingreso B2C en el período. USD. */
  b2cIncome: number
}

export interface B2BvsB2CChartProps {
  /** Serie combinada de ambos grupos, ordenada por período. */
  data: ComparisonPoint[]
  /** Índica que el fetch del gráfico está en curso. */
  loading: boolean
  /** Mensaje de error si el fetch falló. `null` si no hay error. */
  error: string | null
}
```

**Origen de `data` (merge de dos respuestas `MetricsSummaryItem[]`):**

```
GET /api/metrics/summary?operation_type=income&business_type=B2B&group_by=month
GET /api/metrics/summary?operation_type=income&business_type=B2C&group_by=month
  → merge por `period` → ComparisonPoint[]
```

| Campo `MetricsSummaryItem` | Uso |
|---|---|
| `period` | clave del merge y eje X |
| `income` (B2B) → `b2bIncome` | serie 1 |
| `income` (B2C) → `b2cIncome` | serie 2 |

**Tipo de gráfico (ambigüedad resuelta):** gráfico de **barras agrupadas** (Recharts `BarChart`) con dos barras por período, una por línea. Eje Y formateado en `$k`, tooltip con `formatCurrency`, leyenda "B2B Income" / "B2C Income". Se eligió barras (no líneas) por ser comparación de totales por grupo, siguiendo el patrón ya usado con Recharts en el proyecto.

### Fetch de la vista (4 llamadas paralelas)

```
useEffect(dateRange):
  Promise.all([
    fetch cats/top B2B,   // TopCategoriesParams { operationType:'income', limit:5, businessType:'B2B', ...dateRange }
    fetch cats/top B2C,   // TopCategoriesParams { operationType:'income', limit:5, businessType:'B2C', ...dateRange }
    fetch summary B2B,    // MetricsParams { operationType:'income', businessType:'B2B', ...dateRange }
    fetch summary B2C,    // MetricsParams { operationType:'income', businessType:'B2C', ...dateRange }
  ])
```

- Cada subcomponente tiene su propio `loading`/`error` para no bloquear toda la vista si una llamada falla (error parcial tolerado).

### Resolución de ambigüedades del brief

| # | Ambigüedad del brief | Decisión especificada |
|---|---|---|
| 3.1 | ¿Nueva página/ruta? | **Vista alternada por estado** en `App.tsx` (sin instalar React Router): `view: 'dashboard' \| 'b2b-vs-b2c'`. Navegación por pestañas/botones en `DashboardHeader`. |
| 3.2 | ¿Comparte el filtro de fechas con F1? | No: rango **independiente** por página (cada vista inicializa `{ startDate: null, endDate: null }`). |
| 3.3 | % sobre total del grupo | Calculado en frontend (backend no lo devuelve). Limitación del top-N documentada (ver `CategoryTable`). |
| 3.4 | Tipo de gráfico | Barras agrupadas por período (Recharts), 2 series. |
| 3.5 | Carga parcial | Cada tabla y el gráfico muestran su propio skeleton; si una llamada falla, el resto sigue operativo (error parcial). |
| 3.6 | Datos de facetas | La vista usa `operation_type=income` fijo. No se consume `/facets` para categorías en esta iteración (los ingresos solo tienen `sales`/`others`); queda preparado para cuando el mock tenga más variedad. |
| 3.7 | Empty states | Sin datos en el rango ⇒ mensaje "No revenue data available for the selected period." en la sección afectada. |

### Comportamiento / Estados

| Estado | Condición | UI |
|---|---|---|
| Carga total | Primer render | 2 `Skeleton` de tablas + `Skeleton` del gráfico |
| Carga individual | Fetch en curso de una sección | `Skeleton` de filas en esa tabla / `Skeleton` del gráfico |
| Empty | `TopCategoriesResponse`/summary vacío | Mensaje explícito en la sección |
| Error parcial | Fallo de una de las 4 llamadas | Banner en esa sección; el resto funciona |
| Error total | Las 4 fallan | Banner general con "Retry" |

---

## Resumen de componentes nuevos

| Componente | Funcionalidad | Consume (endpoint) | Alineado con (Fase 2) |
|---|---|---|---|
| `DateRangeFilter` | F1 (+ F2, F3) | `GET /api/metrics/facets` (min/max) | `DateRangeFilter` (`param-types.ts`) |
| `AlertsTable` | F2 | `GET /api/metrics/alerts` | `AlertEntry`, `AlertResponse` (`api-types.ts`), `AlertsParams` (`param-types.ts`) |
| `B2BvsB2CView` | F3 | `categories/top` ×2, `summary` ×2 | `CategoryEntry`, `TopCategoriesResponse`, `MetricsSummaryItem` (`api-types.ts`), `TopCategoriesParams`, `MetricsParams` (`param-types.ts`) |
| `CategoryTable` (sub) | F3 | (a través de la vista) | `CategoryEntry` + `percentage` calculado |
| `B2BvsB2CChart` (sub) | F3 | (a través de la vista) | `MetricsSummaryItem` (merge → `ComparisonPoint`) |

> **Nota**: `frontend/specs/` no está incluido en `tsconfig.app.json` (solo cubre `src`). Al implementar, los tipos de la Fase 2 se mueven/copian a `frontend/src/lib/` (p. ej. `api-types.ts` y `param-types.ts` en `src/lib/`) para que los componentes importen desde el árbol de `src`, siguiendo el alias `@/`.**