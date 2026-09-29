# Verification — Puntos inconclusos / Pendientes

> Generado a partir del análisis del proyecto `luemartinezro-ai-eng-financial-dashboard-context-project`.
> Fecha: 2026-09-29

---

## 1. ❌ `frontend/.env.example` no existe

El README indica copiar `frontend/.env.example` a `frontend/.env` para configurar `VITE_API_BASE_URL`, pero **el archivo `.env.example` no está presente** en el repositorio.

**Acción:** Crear `frontend/.env.example` con el contenido:
```
VITE_API_BASE_URL=http://localhost:8000
```

---

## 2. ❌ `mock-data.ts` está incompleto y sin uso

El archivo `frontend/src/lib/mock-data.ts` contiene datos mock estáticos que **solo cubren hasta septiembre y la parte final está vacía/truncada**. Además, **no se utiliza en ninguna parte del código**: la aplicación real consume datos del backend vía `fetch()`.

**Acción:** Decidir si se completa (para testing offline) o se elimina.

---

## 3. ❌ `components.json` no accesible

Aparece listado en la raíz del proyecto (`/components.json`) pero no puede ser leído (posiblemente corrupto o eliminado). Probablemente es un artefacto de shadcn/ui.

**Acción:** Verificar su estado y regenerarlo si es necesario, o eliminarlo.

---

## 4. ⚠️ Sin tests de componentes frontend

Solo existe `frontend/src/lib/financial-utils.test.ts` con pruebas unitarias para `computeKPIs`, `computeMonthlyData` y formateadores.

**No hay tests para:**
- `kpi-card.tsx`
- `kpi-row.tsx`
- `income-outcome-chart.tsx`
- `profit-percent-chart.tsx`
- `dashboard-header.tsx`
- `App.tsx` (fetching de datos y manejo de estados)

---

## 5. ⚠️ Manejo de errores básico en frontend

`App.tsx` muestra un mensaje de error genérico si falla la petición a la API, pero falta:

- Reintento automático (retry mechanism)
- Estado vacío (empty state) cuando no hay datos
- Notificaciones o feedback para errores parciales

---

## 6. ⚠️ Estados de carga todo o nada

`KPICard`, `IncomeOutcomeChart` y `ProfitPercentChart` tienen estado `loading` con skeletons, pero el manejo es binario (todo cargando o todo listo). No hay:

- Carga progresiva de componentes
- Indicadores de carga individuales
- Skeleton diferenciado por componente

---

## 7. ⚠️ Sin toggle de modo oscuro / claro

Existen variables CSS completas para tema `dark` y el `App.tsx` renderiza con la clase `dark` fija en el `<main>`, pero:

- **No hay un toggle** para que el usuario cambie entre temas
- **No se respeta** la preferencia del sistema (`prefers-color-scheme`)
- El tema oscuro está forzado siempre

---

## 8. ⚠️ Frontend no consume los endpoints avanzados del backend

La app solo llama a `GET /api/metrics`. Los siguientes endpoints existen en el backend pero **no tienen UI asociada** en el frontend:

| Endpoint | Propósito |
|---|---|
| `GET /api/metrics/summary` | Resumen agrupado por día/semana/mes |
| `GET /api/metrics/comparison` | Comparación entre períodos |
| `GET /api/metrics/alerts` | Alertas de gastos anómalos |
| `GET /api/metrics/categories/top` | Top categorías por tipo |
| `GET /api/metrics/facets` | Facetas disponibles para filtrar |
| `GET /api/metrics/b2b` / `b2c` | Filtros por tipo de negocio |

Tampoco se aplican filtros (fechas, categorías, tipo de operación) desde la interfaz de usuario.

---

## Resumen

| # | Elemento | Estado | Prioridad |
|---|----------|--------|-----------|
| 1 | `.env.example` faltante | ❌ | Alta |
| 2 | `mock-data.ts` incompleto/sin uso | ❌ | Baja |
| 3 | `components.json` corrupto/inexistente | ❌ | Baja |
| 4 | Tests de componentes frontend ausentes | ⚠️ | Media |
| 5 | Manejo de errores básico | ⚠️ | Media |
| 6 | Estados de carga binarios | ⚠️ | Baja |
| 7 | Sin toggle de tema oscuro/claro | ⚠️ | Baja |
| 8 | Endpoints backend no consumidos | ⚠️ | Media |