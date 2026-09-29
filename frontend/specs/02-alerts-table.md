# Spec 02 — Tabla de alertas de anomalías en el dashboard principal

## Descripción

Añadir bajo los gráficos existentes una tabla que destaque los períodos donde el gasto (outcome) subió de forma inesperada. La tabla tiene cuatro columnas: período, outcome registrado, media de referencia e incremento porcentual. El umbral de alerta es configurable mediante un input numérico (ratio entre 0.01 y 1.0, por defecto 0.3). La tabla debe respetar el rango de fechas establecido en la Funcionalidad 1 si está activo.

**⚠️ Incompatibilidad detectada:** El `prompst.md` especifica *"media móvil de los 3 períodos anteriores"* (rolling window de 3), pero el backend calcula el promedio de **todos los períodos anteriores** (media acumulativa completa). Esto debe resolverse antes de implementar.

---

## Endpoint involucrado

### `GET /api/metrics/alerts`

**Query params:**

| Parámetro | Tipo | Requerido | Default | Restricciones |
|---|---|---|---|---|
| `threshold` | `float` | ❌ Opcional | `0.3` | `ge=0` (solo ≥ 0; **no valida ≤ 1.0**) |
| `group_by` | `Literal["day","week","month"]` | ❌ Opcional | `"month"` | — |
| `start_date` | `date` (ISO) | ❌ Opcional | `None` | — |
| `end_date` | `date` (ISO) | ❌ Opcional | `None` | — |
| `business_type` | `Literal["B2B","B2C"]` | ❌ Opcional | `None` | — |

**Uso:** `GET /api/metrics/alerts?threshold=0.3&group_by=month&start_date=2024-01-01&end_date=2024-06-30`

**Respuesta:** `list[MetricsAlert]`

```json
[
  {
    "period": "2024-01",
    "outcome_total": 15340.0,
    "baseline_average": 10250.0,
    "increase_ratio": 0.4966
  }
]
```

| Campo | Tipo Python | Tipo TS | Descripción |
|---|---|---|---|
| `period` | `str` | `string` | Período (ej: "2024-01", "2024-W03", "2024-01-15") |
| `outcome_total` | `float` | `number` | Gasto total registrado en el período |
| `baseline_average` | `float` | `number` | **Promedio de todos los períodos anteriores** (no rolling window de 3) |
| `increase_ratio` | `float` | `number` | `(outcome_total - baseline_average) / baseline_average` |

---

## Lógica actual del backend (`detect_outcome_alerts`)

```python
def detect_outcome_alerts(
    summary: list[MetricsSummaryItem],
    threshold: float,
) -> list[MetricsAlert]:
    alerts: list[MetricsAlert] = []
    historical_outcomes: list[float] = []
    for item in summary:
        if historical_outcomes:
            baseline = sum(historical_outcomes) / len(historical_outcomes)  # ← media de TODO el histórico
            if baseline > 0:
                increase_ratio = (item.outcome - baseline) / baseline
                if increase_ratio > threshold:
                    alerts.append(...)
        historical_outcomes.append(item.outcome)
    return alerts
```

La media incluye **todos los períodos anteriores**, no solo los últimos 3.

---

## Incompatibilidades documentadas

| # | Aspecto | `prompst.md` dice | Backend implementa | Acción requerida |
|---|---|---|---|---|
| 1 | Media móvil | "media móvil de los 3 períodos anteriores" | Promedio de **todo el histórico** (no ventana deslizante) | Decidir si se modifica backend o se ajusta el spec |
| 2 | Validación threshold | "ratio entre 0.01 y 1.0" | Solo `ge=0` (acepta 0, permite >1.0) | Añadir validación `le=1.0` en backend, o limitar input en frontend |

### Recomendación

Si se requiere estrictamente rolling window de 3, modificar `detect_outcome_alerts()` en `backend/app/routes.py`:

```python
def detect_outcome_alerts(
    summary: list[MetricsSummaryItem],
    threshold: float,
    window: int = 3,
) -> list[MetricsAlert]:
    alerts: list[MetricsAlert] = []
    for i in range(len(summary)):
        if i < window:
            continue  # no hay suficientes períodos previos
        baseline = sum(item.outcome for item in summary[i-window:i]) / window
        if baseline > 0:
            increase_ratio = (summary[i].outcome - baseline) / baseline
            if increase_ratio > threshold:
                alerts.append(
                    MetricsAlert(
                        period=summary[i].period,
                        outcome_total=round(summary[i].outcome, 2),
                        baseline_average=round(baseline, 2),
                        increase_ratio=round(increase_ratio, 4),
                    )
                )
    return alerts
```

---

## Nuevos tipos TypeScript necesarios

Agregar en `frontend/src/lib/financial-types.ts`:

```typescript
export interface MetricsAlert {
  period: string
  outcome_total: number
  baseline_average: number
  increase_ratio: number
}
```

---

## Componentes a crear

### `AlertsTable` (nuevo componente)

- Tabla con 4 columnas: **Period**, **Outcome**, **Baseline Avg**, **Increase %**
- Input numérico para el threshold (`type="number"`, `min=0.01`, `max=1.0`, `step=0.05`, `default=0.3`)
- Los datos se filtran por el rango de fechas de la Funcionalidad 1 si está activo
- Si no hay alertas para el threshold actual: mostrar mensaje **explícito** de empty state (no ocultar ni desaparecer la sección)

**Props:**

```typescript
interface AlertsTableProps {
  startDate: string | null   // desde DateRangeFilter (Funcionalidad 1)
  endDate: string | null     // desde DateRangeFilter (Funcionalidad 1)
}
```

### Lógica interna del componente

```
Estado interno:
  - threshold: number (default 0.3)
  - alerts: MetricsAlert[]
  - loading: boolean
  - error: string | null

useEffect([threshold, startDate, endDate]):
  GET /api/metrics/alerts?threshold={threshold}&group_by=month&start_date={startDate}&end_date={endDate}
  → setAlerts(response)
  → catch → setError(...)
```

---

## Diseño de la tabla

| Period | Outcome | Baseline Avg | Increase % |
|---|---|---|---|
| 2024-01 | $15,340 | $10,250 | +49.7% |
| 2024-04 | $22,300 | $14,200 | +57.0% |

- Columna Increase % con color rojo si supera el threshold, neutral si no
- Montos formateados con `formatCurrency()`
- Porcentajes formateados con `formatPercent()` (mostrar con signo +)
- Última columna alineada a la derecha

---

## Estados UX

| Estado | Condición | UI |
|---|---|---|
| Carga | Fetch en progreso | Skeleton de filas (3-4 filas simuladas con Skeleton) |
| Sin datos (empty) | alerts array vacío | **Mensaje visible**: "No anomalies detected for the current threshold." — no ocultar la sección |
| Con datos | alerts con elementos | Tabla renderizada con filas |
| Error | Fallo en fetch | Error banner con opción de reintentar |
| Umbral inválido | threshold < 0.01 o > 1.0 | Input inválido (validación HTML5 nativa) |

---

## Integración con Funcionalidad 1

- `AlertsTable` recibe `startDate` y `endDate` desde `App.tsx` (o desde el estado compartido de DateRangeFilter)
- Cuando el usuario cambia el rango de fechas, la tabla se refetchea automáticamente
- El threshold se maneja internamente en el componente (no afecta al dashboard principal)