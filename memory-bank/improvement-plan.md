# Plan de Mejora

> Pasos priorizados para mejorar el proyecto, basados en los puntos inconclusos y riesgos identificados.

---

## Prioridad 🔴 — Crítica (debe hacerse antes de escalar)

### 1. Crear `.env.example`
**Ver:** Punto 1 de verification.md · R1

```bash
echo "VITE_API_BASE_URL=http://localhost:8000" > frontend/.env.example
```
Esto permite que cualquier desarrollador (o agente) configure el entorno sin adivinar variables.

### 2. Agregar validación runtime en frontend
**Ver:** R4

Implementar una función `parseMetricsResponse()` que verifique en runtime que la respuesta del backend contiene los campos esperados antes de pasarlos al render. Opcionalmente introducir Zod como dependencia.

### 3. Sincronizar tipos al agregar endpoints
**Ver:** R1 · R9

Cada nuevo endpoint del backend debe tener su interfaz TypeScript correspondiente en `financial-types.ts`. No dejar endpoints "huérfanos".

### 4. Pipeline de CI básico
**Ver:** R2 · R6 · R10

Agregar un workflow de GitHub Actions (o similar) que ejecute:
- `pytest` en backend
- `npm run test` en frontend
- `tsc -b` para verificar tipos

---

## Prioridad 🟡 — Media (próximo sprint)

### 5. Tests de componentes frontend
**Ver:** Punto 4 · R10 · R11

Agregar tests para al menos los componentes principales:
- `kpi-card.test.tsx` — renderiza KPIs, muestra skeleton en loading
- `income-outcome-chart.test.tsx` — renderiza gráfico con datos
- `profit-percent-chart.test.tsx` — renderiza gráfico con datos
- `dashboard-header.test.tsx` — renderiza título, fechas
- `theme-toggle.test.tsx` — cambia tema al hacer click

Usar Vitest con mocks de fetch y Recharts (que ya es compatible con test).

### 6. Mejorar manejo de errores
**Ver:** Punto 5

- Agregar un componente `ErrorBanner` que muestre errores con opción de reintentar
- Implementar retry automático (3 intentos con backoff exponencial)
- Agregar empty state cuando no hay datos

### 7. Consumir más endpoints del backend
**Ver:** Punto 8

Darle UI a los endpoints existentes:
- **Summary** — selector de agrupación (día/semana/mes)
- **Comparison** — comparación mes contra mes anterior
- **Alerts** — notificaciones de gastos anómalos
- **Categories** — top categorías como gráfico de barras o tabla
- **B2B/B2C** — toggle o filtro en la UI

### 8. Agregar filtros (fechas, categorías, tipo)
**Ver:** Punto 8

Un panel de filtros en el header o sidebar que permita:
- Seleccionar rango de fechas
- Filtrar por categoría
- Filtrar por tipo de operación (income/outcome)
- Filtrar por tipo de negocio (B2B/B2C)

---

## Prioridad 🟢 — Baja (mejora continua)

### 9. Manejar carga progresiva
**Ver:** Punto 6

En lugar de mostrar todos los skeletons a la vez, cargar KPIs primero (más rápidos) y luego los gráficos. Usar Suspense o estados intermedios.

### 10. Limpiar archivos muertos
**Ver:** Puntos 2 y 3

- Decidir si completar o eliminar `mock-data.ts`
- Eliminar o regenerar `components.json`

### 11. Respetar preferencia del sistema
**Ver:** Punto 7 (relacionado)

En futura iteración, leer `prefers-color-scheme` y usar ese valor como tema inicial en lugar de forzar dark.

### 12. Documentar decisión de tests en AGENTS.md
**Ver:** R11

Una vez que se establezca un patrón de tests de componentes, agregar la convención en `AGENTS.md` para que futuros agentes la sigan.

---

## Resumen de esfuerzo estimado

| Prioridad | Tareas | Esfuerzo estimado |
|---|---|---|
| 🔴 Crítica | 4 tareas | ~1-2 días |
| 🟡 Media | 3 tareas | ~3-5 días |
| 🟢 Baja | 4 tareas | ~2-3 días |

---