# Agent Skills

## Por qué importan

Los skills en `.agents/skills/` encapsulan conocimiento de dominio que un agente de IA puede cargar bajo demanda en lugar de que el humano lo repita en cada prompt. En este proyecto cumplen dos funciones:

1. **Calidad consistente** — accesibilidad y performance son fáciles de pasar por alto en iteraciones rápidas de un dashboard; tenerlos como skill convierte la auditoría en un paso reproducible, no en algo que depende de que alguien se acuerde de pedirlo.
2. **Conocimiento específico del repo** — las skills comunitarias son genéricas (cualquier sitio web, cualquier app React). La skill propia `fe-be-type-sync` captura un riesgo que **sólo existe en este repo**: la sincronización manual de tipos entre el backend Pydantic y el frontend TypeScript.

## Skills instalados

| Skill | Fuente | Propósito | Adaptación hecha |
|---|---|---|---|
| `accessibility` | `addyosmani/web-quality-skills` | Auditoría WCAG 2.2 (aria-label, foco, alt, contraste) | Alcance acotado a los componentes reales de `frontend/src/components/dashboard/`; nota de que Recharts no emite ARIA por defecto y requiere `role="img"` + tabla `sr-only` manual; sin Chrome DevTools MCP en este entorno, se usa revisión estática en vez de Lighthouse en vivo |
| `performance` | `addyosmani/web-quality-skills` | Presupuestos de carga, critical rendering path, runtime | Sin CDN/edge en este entorno (Vite + Docker Compose); solape con `bundle-*` delegado a `vercel-react-best-practices`; se marcó `recharts` y el `fetch` de `App.tsx` como primeros objetivos |
| `vercel-react-best-practices` | `vercel-labs/agent-skills` | 70 reglas de performance para React/Next.js | Se marcaron como **no aplicables** las reglas específicas de Next.js/RSC (`server-*`, `async-api-routes`, `rendering-hydration-*`) porque el frontend es una SPA Vite sin SSR; se documentaron equivalentes nativos para `next/image`, `next/font`, `next/script` |
| `fe-be-type-sync` | Propio (`local`) | Detectar divergencia de tipos entre `backend/app/routes.py` (Pydantic) y `frontend/src/lib/financial-types.ts` | N/A — creado específicamente para este repo, ver `.agents/skills/fe-be-type-sync/SKILL.md` |

## El gap que ninguna skill comunitaria cubre

Las skills de accesibilidad/performance/React asumen que el "contrato" entre frontend y backend ya está resuelto (por ejemplo, con Next.js full-stack o un cliente generado). Este repo es Python (FastAPI/Pydantic) + TypeScript sin OpenAPI codegen, Zod ni tRPC: los tipos se copian a mano. Es el riesgo **R1**/**R9** de `.agents/rules.md` y los puntos 2-3 de `improvement-plan.md`. La skill `fe-be-type-sync` formaliza ese chequeo campo por campo con objetivo, inputs, output esperado y criterios de aceptación explícitos. Ver también la sección correspondiente en el [README](../README.md#gap-identificado-sincronización-de-tipos-frontend-backend).

## Verificación

```bash
npx skills list
```

Debe listar los 4 skills bajo `./.agents/skills/<nombre>`, atribuidos al agente `GitHub Copilot`. Confirmado el 2026-10-01.

## Convención de mantenimiento

- Si se actualiza un skill comunitario (`npx skills update`), revisar si la sección "Adaptation for this project" / "Adaptación para este proyecto" en su `SKILL.md` sigue vigente tras el update.
- Si se agrega un nuevo endpoint consumido por la UI, correr mentalmente (o pedirle al agente) la skill `fe-be-type-sync` antes de dar el cambio por terminado.
- No instalar un skill nuevo sin antes anotar aquí qué aporta y qué hay que adaptar — evita repetir la exploración manual ya hecha en esta sesión.
