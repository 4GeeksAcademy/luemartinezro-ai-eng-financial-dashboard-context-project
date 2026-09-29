# Spec 03 — Vista comparativa B2B vs B2C

## Descripción

Crear una nueva página/vista en el dashboard para comparar el rendimiento de ingresos entre las dos líneas de negocio: B2B y B2C. La vista tiene dos secciones en paralelo, cada una con una tabla de las 5 categorías de ingreso principales de esa línea. Bajo ambas secciones, un gráfico compara visualmente el total de ingresos de B2B frente a B2C. El usuario puede filtrar por rango de fechas. Las categorías disponibles deben obtenerse del endpoint de facetas.

**Estado del backend:** 🟡 Incompatibilidades medias. No existe un endpoint unificado; requiere múltiples llamadas paralelas.

---

## Endpoints involucrados

### `GET /api/metrics/categories/top` — Tablas de categorías

**Query params:**

| Parámetro | Tipo | Requerido | Default | Restricciones |
|---|---|---|---|---|
| `operation_type` | `OperationType` | ❌ Opcional | `"outcome"` | — |
| `limit` | `int` | ❌ Opcional | `5` | `ge=1, le=20` |
| `business_type` | `BusinessType` | ❌ Opcional | `None` | — |
| `start_date` | `date` (ISO) | ❌ Opcional | `None` | — |
| `end_date` | `date` (ISO) | ❌ Opcional | `None` | — |

**Llamadas necesarias:**

```
GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2B
GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2C
```

**Respuesta:** `list[TopCategoryItem]`

```json
[
  {"category": "sales", "operation_type": "income", "total_amount": 48200.0},
  {"category": "others", "operation_type": "income", "total_amount": 3200.0}
]
```

### `GET /api/metrics/summary` — Gráfico comparativo

**Query params relevantes:**

| Parámetro | Tipo | Requerido | Default |
|---|---|---|---|
| `group_by` | `Literal["day","week","month"]` | ❌ Opcional | `"month"` |
| `operation_type` | `OperationType` | ❌ Opcional | `None` |
| `business_type` | `BusinessType` | ❌ Opcional | `None` |
| `start_date` | `date` (ISO) | ❌ Opcional | `None` |
| `end_date` | `date` (ISO) | ❌ Opcional | `None` |

**Llamadas necesarias:**

```
GET /api/metrics/summary?operation_type=income&business_type=B2B&group_by=month
GET /api/metrics/summary?operation_type=income&business_type=B2C&group_by=month
```

**Respuesta:** `list[MetricsSummaryItem]`

```json
[
  {"period": "2024-01", "income": 48200.0, "outcome": 15340.0, "net": 32860.0}
]
```

### `GET /api/metrics/facets` — Categorías disponibles

Mismo endpoint que Funcionalidad 1. Se puede cachear la respuesta o reutilizarla.

---

## Incompatibilidades documentadas

| # | Aspecto | `prompst.md` dice | Backend implementa | Acción requerida |
|---|---|---|---|---|
| 1 | Endpoint unificado | Se asume un endpoint que devuelva B2B y B2C juntos | No existe. Hay endpoints separados con filtro `business_type` | El frontend debe hacer **4 llamadas paralelas** (2 a `/categories/top` + 2 a `/summary`) |
| 2 | Variedad de categorías income | "tabla con las 5 categorías de ingreso principales" | El mock genera income solo como `"sales"` (90%) y `"others"` (10%) | No requiere acción inmediata; documentar que con datos reales se verán más categorías |
| 3 | Porcentaje sobre total del grupo | Columna "% sobre total del grupo" | El backend no calcula porcentajes | El frontend debe calcular: `(total_amount / sum_of_all_categories_in_group) * 100` |

---

## Nuevos tipos TypeScript necesarios

Agregar en `frontend/src/lib/financial-types.ts`:

```typescript
export interface TopCategoryItem {
  category: Category
  operation_type: OperationType
  total_amount: number
}

export interface MetricsSummaryItem {
  period: string
  income: number
  outcome: number
  net: number
}

// Datos procesados para la vista B2B vs B2C
export interface CategoryWithPercentage extends TopCategoryItem {
  percentage: number   // calculado en frontend
}

export interface BusinessLineSummary {
  businessType: BusinessType
  categories: CategoryWithPercentage[]
  totalIncome: number
}

export interface B2BvsB2CMonthlyComparison {
  period: string
  b2bIncome: number
  b2cIncome: number
}
```

---

## Componentes a crear

### `B2BvsB2CView` (nuevo componente — página completa)

- Encabezado: "B2B vs B2C Revenue Comparison"
- Filtro de rango de fechas (reutilizar lógica de DateRangeFilter o implementar uno local)
- Dos secciones en paralelo (`grid grid-cols-1 xl:grid-cols-2`)
  - Izquierda: tabla B2B
  - Derecha: tabla B2C
- Debajo: gráfico comparativo de ingresos mensuales

**Props:**

```typescript
interface B2BvsB2CViewProps {
  // Sin props externas; maneja su propio fetch y estado
}
```

### `CategoryTable` (subcomponente interno)

- Tabla simple con 3 columnas: **Category**, **Total Revenue**, **% of Group**
- Título tipo: "B2B Top Income Categories" / "B2C Top Income Categories"
- Empty state si no hay categorías
- Loading state con skeleton de filas

**Props:**

```typescript
interface CategoryTableProps {
  title: string
  categories: CategoryWithPercentage[]
  loading: boolean
  error: string | null
}
```

### `B2BvsB2CChart` (subcomponente interno)

- Gráfico de líneas (Recharts) con dos series: "B2B Income" y "B2C Income"
- Eje X: períodos (meses)
- Eje Y: monto en USD
- Tooltip con formato de moneda
- Leyenda para identificar cada serie

**Props:**

```typescript
interface B2BvsB2CChartProps {
  data: B2BvsB2CMonthlyComparison[]
  loading: boolean
  error: string | null
}
```

---

## Diagrama de datos

```
B2BvsB2CView
  ├── DateRangeFilter (local)
  │
  ├── Grid 2 columnas
  │   ├── CategoryTable (B2B)
  │   │   └── GET /api/metrics/categories/top?business_type=B2B&operation_type=income&limit=5&...
  │   └── CategoryTable (B2C)
  │       └── GET /api/metrics/categories/top?business_type=B2C&operation_type=income&limit=5&...
  │
  └── B2BvsB2CChart
      ├── GET /api/metrics/summary?business_type=B2B&operation_type=income&group_by=month&...
      └── GET /api/metrics/summary?business_type=B2C&operation_type=income&group_by=month&...
```

**Procesamiento de datos (frontend):**

```
categoriesB2B → calcular % → CategoryWithPercentage[]
categoriesB2C → calcular % → CategoryWithPercentage[]
summaryB2B + summaryB2C → merge por period → B2BvsB2CMonthlyComparison[]
```

---

## Estados UX

| Estado | UI |
|---|---|
| Carga inicial (todo) | Skeleton con 2 columnas + placeholder del gráfico |
| Carga de categorías individual | Skeleton en la tabla correspondiente (3-4 filas simuladas) |
| Carga del gráfico | Skeleton del contenedor del gráfico |
| Empty (sin datos) | Mensaje: "No revenue data available for the selected period" en cada sección |
| Error parcial en tabla | Error banner en la tabla que falló; la otra tabla y el gráfico siguen funcionando |
| Error parcial en gráfico | Error banner en el gráfico; las tablas siguen funcionando |
| Error total | Error banner general con opción de reintentar |

---

## Navegación

- Añadir un enlace/pestaña en el `DashboardHeader` para cambiar entre "Dashboard" y "B2B vs B2C"
- Se puede implementar como:
  - **Opción A:** Estado `view` en `App.tsx` que alterna entre el dashboard actual y la vista B2B vs B2C (sin router)
  - **Opción B:** React Router con ruta `/b2b-vs-b2c` (requiere instalar `react-router-dom`)
- El rango de fechas puede ser independiente del dashboard principal