# Estado Actual del Proyecto

## Estado general

El proyecto es funcional: se despliega con `docker compose up --build`, el frontend (React + Vite) se comunica con el backend (FastAPI) y muestra KPIs y gráficos correctamente. Sin embargo, existen varios puntos inconclusos y riesgos documentados.

---

## Puntos inconclusos / Pendientes (de `verification.md`)

| # | Elemento | Estado | Prioridad |
|---|---|---|---|
| 1 | `.env.example` faltante | ❌ | Alta |
| 2 | `mock-data.ts` incompleto/sin uso | ❌ | Baja |
| 3 | `components.json` corrupto/inexistente | ❌ | Baja |
| 4 | Tests de componentes frontend ausentes | ⚠️ | Media |
| 5 | Manejo de errores básico | ⚠️ | Media |
| 6 | Estados de carga binarios | ⚠️ | Baja |
| 7 | Sin toggle de tema oscuro/claro | ⚠️ | Baja |
| 8 | Endpoints backend no consumidos | ⚠️ | Media |

### Detalle

1. **`.env.example`** — README referencia `frontend/.env.example` para configurar `VITE_API_BASE_URL`, pero el archivo no existe. Cualquier nuevo desarrollador no sabrá qué variable configurar.

2. **`mock-data.ts`** — Archivo con datos mock estáticos truncados (solo cubre hasta septiembre). No se usa en la aplicación real. Decidir si se completa o elimina.

3. **`components.json`** — Listado en la raíz pero ilegible/corrupto. Artefacto de shadcn/ui. Regenerar o eliminar.

4. **Tests frontend** — Solo existe `financial-utils.test.ts`. No hay tests para componentes React (`kpi-card`, `kpi-row`, charts, `dashboard-header`, `App.tsx`).

5. **Manejo de errores** — `App.tsx` muestra error genérico si falla el fetch. Falta retry automático, empty state, notificaciones para errores parciales.

6. **Carga binaria** — Los componentes muestran skeleton mientras cargan, pero es todo o nada. No hay carga progresiva ni skeletons individuales.

7. **Toggle de tema** — ✅ **RESUELTO** — Se creó `theme-toggle.tsx`, se integró en `App.tsx` y `dashboard-header.tsx`. Se usa la clase `.dark` dinámica en el contenedor raíz. *(Era ⚠️, ahora ✅)*

8. **Endpoints no consumidos** — La UI solo consume `GET /api/metrics`. Hay 6+ endpoints más sin UI: `/summary`, `/comparison`, `/alerts`, `/categories/top`, `/facets`, `/b2b`, `/b2c`.

---

## Riesgos identificados (de `.agents/rules.md`)

| ID | Riesgo | Severidad |
|---|---|---|
| R1 | Tipos desincronizados FE/BE | 🔴 Alta |
| R2 | Cambio en seed mock rompe tests | 🔴 Alta |
| R3 | Colores hardcodeados rompen tema | 🔴 Alta |
| R4 | Sin validación runtime FE/BE | 🔴 Alta |
| R5 | Directorios agente desactualizados | 🟡 Media |
| R6 | verbatimModuleSyntax estricto | 🟡 Media |
| R7 | Mezcla named/default exports | 🟡 Media |
| R8 | Inconsistencia shadcn/ui | 🟡 Media |
| R9 | Types literales desincronizados | 🟢 Baja |
| R10 | Ubicación tests inconsistente | 🟢 Baja |
| R11 | Sin convención tests componentes | 🟢 Baja |

---

## Convenciones del proyecto

- **Tema:** Controlado por clase `.dark` en el contenedor raíz. Variables CSS en `:root` (claro) y `.dark` (oscuro) en `index.css`. Usar siempre clases semánticas de Tailwind.
- **Componentes shadcn/ui:** Patrón `data-slot` y `cn()` para merge de clases.
- **Named exports:** Preferir `export function` sobre `export default` (excepto `App.tsx`).
- **verbatimModuleSyntax:** Usar `import type` para imports de tipos.
- **Datos mock:** Backend genera datos deterministas con `seed=42` (360 movimientos: 12 meses × 30 días).
- **Proxy:** Vite redirige `/api/*` → `http://backend:8000`.

---