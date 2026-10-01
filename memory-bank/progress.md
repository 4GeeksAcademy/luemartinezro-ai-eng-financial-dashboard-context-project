# Progreso

> Log cronológico de avances relevantes para agentes. Para el estado actual (snapshot), ver `current-status.md`.

---

## 2026-10-01 — Instalación y adaptación de agent skills

**Contexto:** El tech lead pidió (ver `propmts.md`) aplicar las skills `accessibility` y `vercel-react-best-practices` al dashboard, y explorar el ecosistema (`npx skills find <tema>`) antes de adivinar nombres.

**Hecho:**

1. Se exploró el registro real (`npx skills find accessibility|performance|seo`) en vez de asumir nombres. Resultado: `accessibility` → `addyosmani/web-quality-skills@accessibility` (match literal del nombre pedido); `vercel-react-best-practices` → `vercel-labs/agent-skills@vercel-react-best-practices`; se agregó además `performance` del mismo vendor que accessibility. Se evaluó `seo` y se descartó (dashboard interno de una sola vista, sin necesidad de indexación).
2. Se instalaron los 3 skills vía `npx skills add ... --agent github-copilot` en `.agents/skills/`, confirmado con `npx skills list`.
3. Se adaptó cada `SKILL.md` instalado con una sección "Adaptation for this project" que acota las reglas a un **Vite + React 19 SPA sin Next.js/SSR** (ver detalle en `agent-skills.md`).
4. Se aplicaron los fixes de código derivados de las skills:
   - `frontend/index.html`: título descriptivo + meta description.
   - `income-outcome-chart.tsx` / `profit-percent-chart.tsx`: `role="img"` + `aria-label`, y tabla `sr-only` como alternativa textual (Recharts no emite ARIA).
   - `theme-toggle.tsx`: `aria-pressed` para exponer el estado del toggle.
   - `App.tsx`: `aria-busy`/`aria-live` en las secciones con loading; mensaje de error traducido al inglés (coincide con `lang="en"`); `IncomeOutcomeChart`/`ProfitPercentChart` cargados con `React.lazy` + `Suspense` (reduce bundle inicial, fallback dimensionado igual al skeleton real para evitar CLS).
5. Se identificó un gap específico de este repo que ninguna skill comunitaria cubre: sincronización de tipos entre los modelos Pydantic de `backend/app/routes.py` y `frontend/src/lib/financial-types.ts` (sin OpenAPI codegen/Zod/tRPC). Se documentó en `README.md` y se creó la skill propia `.agents/skills/fe-be-type-sync/SKILL.md` con estructura objetivo/inputs/output esperado/criterios de aceptación.
6. Se verificó `npm run lint`, `tsc -b` y `npm run test -- --run` en verde después de los cambios de código.
7. Se documentó todo en `memory-bank/agent-skills.md` (nueva sección) y en este archivo.

**Commits (rama `feature/agent-skills`):**
- `322a1e2` — Add accessibility and vercel-react-best-practices agent skills
- `393e126` — Add performance agent skill, adapted for this project
- `b203f30` — Apply accessibility and performance fixes from installed skills
- siguiente commit — Add fe-be-type-sync skill + memory-bank/README updates (ver `git log` para el hash)

**Pendiente / siguiente sesión:**
- Verificación manual de navegación por teclado y lectores de pantalla (no se pudo hacer en este entorno sin navegador).
- Evaluar si conviene introducir Zod en el frontend como solución estructural al gap de `fe-be-type-sync` (ver `improvement-plan.md` punto 2), en vez de solo el chequeo manual campo por campo.
