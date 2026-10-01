---
name: fe-be-type-sync
description: Detect and fix type-contract drift between the FastAPI/Pydantic backend and the TypeScript frontend of this repo. Use when adding, changing, or removing a Pydantic model/response in backend/app/routes.py, a type in frontend/src/lib/financial-types.ts, or when asked to "sync types", "check FE/BE contract", "validate API response shape".
license: MIT
metadata:
  author: project
  version: "1.0.0"
---

# FE/BE Type Contract Sync

## Gap identificado

Este repo es un stack políglota (backend FastAPI/Pydantic en Python + frontend TypeScript) **sin** generación de esquema compartido: no hay OpenAPI-to-TS codegen, ni Zod/io-ts, ni tRPC. El contrato entre ambos lados se mantiene copiando tipos a mano en `frontend/src/lib/financial-types.ts`. Esto es el riesgo **R1** (tipos desincronizados) y **R9** (literales desincronizados) de `.agents/rules.md`, y el punto 2-3 de `memory-bank/improvement-plan.md` — pero ninguna skill comunitaria instalada (`accessibility`, `performance`, `vercel-react-best-practices`) cubre esto: todas son agnósticas de un backend Python y asumen frontend-only o Next.js full-stack con tipos compartidos nativos. Esta skill cubre específicamente ese hueco.

Evidencia concreta ya encontrada en este repo: `backend/app/routes.py` define 6 modelos Pydantic de respuesta (`FinancialMovement`, `MetricsFacets`, `MetricsSummaryItem`, `TopCategoryItem`, `MetricsComparison`, `MetricsAlert`), pero `frontend/src/lib/financial-types.ts` solo tiene tipos para `FinancialMovement` — los otros 5 no tienen contraparte TypeScript porque la UI aún no los consume. En cuanto se consuma cualquiera de esos endpoints, hace falta este chequeo.

## Objetivo

Antes de dar por cerrado un cambio que toque un modelo Pydantic en `backend/app/routes.py` o un tipo en `frontend/src/lib/financial-types.ts`, confirmar campo por campo que ambos lados describen exactamente la misma forma de datos, y corregir o señalar cualquier divergencia antes del commit.

## Inputs

- El modelo Pydantic (`BaseModel`) o la respuesta de ruta modificada/agregada en `backend/app/routes.py` (diff o archivo completo).
- La interfaz/tipo TypeScript correspondiente en `frontend/src/lib/financial-types.ts`.
- (Opcional) el sitio de consumo real (`fetch` en `frontend/src/App.tsx` u otro componente) si el endpoint ya tiene UI.

## Output esperado

Un reporte campo por campo con tres categorías:

1. **Coinciden** — mismo nombre, tipo compatible (`str`↔`string`, `int`/`float`↔`number`, `bool`↔`boolean`, `date`/`datetime`↔`string` con comentario `// ISO date`, `Literal[...]`↔union de string literals con los mismos valores exactos, `T | None`↔`T | null` o campo opcional `?`).
2. **Faltantes** — campo presente en un lado y ausente en el otro (modelo nuevo sin tipo TS, o tipo TS huérfano de un modelo eliminado).
3. **Tipos distintos** — mismo nombre de campo, forma incompatible (ej. unión de literales con valores que no coinciden exactamente en casing/contenido).

Más un parche propuesto para `frontend/src/lib/financial-types.ts` que cierre cualquier brecha encontrada.

## Criterios de aceptación

- [ ] Cada campo del modelo Pydantic/respuesta tiene un campo equivalente en la interfaz TS, con tipo compatible.
- [ ] Los valores de todo `Literal[...]` en Python coinciden exactamente (mismo casing, mismo conjunto) con el union type de TypeScript correspondiente (cubre R9).
- [ ] Ningún tipo de TypeScript referencia un campo o endpoint que ya no existe en el backend (sin tipos huérfanos).
- [ ] Si se agregó un endpoint nuevo, tiene su interfaz de respuesta en `financial-types.ts` en el mismo cambio (no se deja "huérfano", por R1).
- [ ] `tsc -b` en `frontend/` y `pytest` en `backend/` pasan ambos después del ajuste.

## Flujo de trabajo

1. Identificar el/los archivo(s) modificado(s): `backend/app/routes.py` y/o `frontend/src/lib/financial-types.ts`.
2. Extraer cada campo del modelo Pydantic afectado (nombre, tipo, si es `Optional`/tiene default) leyendo la definición de la clase y cualquier `Literal[...]` que use.
3. Extraer el campo equivalente de la interfaz TypeScript en `financial-types.ts`.
4. Producir el reporte de tres categorías descrito en "Output esperado".
5. Si hay una divergencia, proponer el parche mínimo a `financial-types.ts` (nunca cambiar en silencio el modelo del backend sin señalarlo explícitamente como cambio breaking).
6. Volver a correr `pytest` (`backend/tests/test_routes.py`) y `tsc -b` / `npm run test` (frontend) para confirmar que ambos lados compilan y pasan tras el ajuste.
7. Si el endpoint tocado no tiene validación runtime en el frontend (ningún `parseResponse()` o schema), señalarlo como hallazgo (R4) y sugerir agregarla como follow-up, sin bloquear el fix de tipos en curso.

## Alcance

Cubre: `backend/app/routes.py` (modelos Pydantic y formas de respuesta) y `frontend/src/lib/financial-types.ts` (tipos espejo en TS), más el sitio de consumo (`fetch`) cuando exista. No cubre accesibilidad, performance ni convenciones de React — para eso usar las skills `accessibility`, `performance` y `vercel-react-best-practices` ya instaladas en este mismo directorio.
