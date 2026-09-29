# Reglas del proyecto — Financial Dashboard

> Archivo de reglas para agentes de IA que editen este repositorio.
> Priorizado del riesgo más alto al más bajo.
> Cada regla mitiga uno o más riesgos identificados en `verification.md`.

---

## 🔴 R1 — Sincronizar tipos entre frontend y backend

**Riesgo:** Los tipos de datos se definen de forma independiente en Python (Pydantic) y TypeScript. Un cambio en un modelo del backend no se refleja automáticamente en el frontend, causando fallos silenciosos en runtime.

**Regla:** Cada vez que agregues, elimines o renombres un campo en un modelo Pydantic de `backend/app/routes.py`, **debes actualizar el tipo equivalente** en `frontend/src/lib/financial-types.ts` en el mismo commit. Si agregas un nuevo endpoint, define también su tipo de respuesta en TypeScript. No dejes cambios parciales.

---

## 🔴 R2 — No alterar la semilla ni la estructura de datos mock sin actualizar tests

**Riesgo:** `generate_mock_movements(seed=42)` produce datos deterministas que los tests existentes verifican (longitudes, filtros, valores). Cambiar la lógica de generación rompe los tests sin causa obvia.

**Regla:** Si modificas `generate_mock_movements()` en `backend/app/routes.py` (cambiar número de iteraciones, rangos de fechas, categorías, distribución de tipos de negocio, o la semilla), **debes actualizar todos los tests** en `backend/tests/test_routes.py` que dependan de esos valores concretos. Verifica que `pytest` pase completo antes de hacer commit.

---

## 🔴 R3 — No hardcodear valores visuales; usar siempre variables CSS del tema

**Riesgo:** El proyecto tiene dos temas (claro y oscuro) definidos mediante variables CSS en `index.css`. Un componente que use colores fijos en lugar de `var(--foreground)`, `var(--muted-foreground)`, etc., se verá incorrecto en uno de los dos temas.

**Regla:** Al crear o modificar componentes React:
- Usa siempre las clases de Tailwind (ej. `text-foreground`, `bg-card`, `border-border`) o variables CSS (`var(--foreground)`, `var(--chart-income)`).
- **No uses** valores de color hardcodeados como `#333`, `text-black`, `bg-white`, `text-gray-700`.
- El tema se controla mediante la clase `.dark` en el contenedor raíz — no asumas que siempre es dark.
- Si introduces un nuevo color semántico, agrégalo como variable CSS tanto en `:root` (tema claro) como en `.dark` (tema oscuro) en `frontend/src/index.css`.

---

## 🔴 R4 — Validar esquemas de datos entre frontend y backend

**Riesgo:** No hay capa de validación compartida (OpenAPI/Zod/tRPC). El frontend parsea respuestas del backend sin verificación runtime. Un cambio en la estructura de respuesta del backend puede pasar desapercibido en build y manifestarse como `undefined` o NaN en la UI.

**Regla:** Cuando consumas un endpoint del backend desde el frontend:
1. Define o actualiza la interfaz TypeScript correspondiente en `frontend/src/lib/financial-types.ts`.
2. Agrega validación básica en runtime usando una función `parseResponse()` o `zod` si se introduce, verificando que los campos esperados existan y tengan los tipos correctos.
3. Si el backend cambia el nombre, tipo o estructura de un campo, actualiza tanto el tipo como el parseo en el frontend en el mismo commit.

---

## 🟡 R5 — Mantener actualizados los directorios de referencia del agente

**Riesgo:** `AGENTS.md` indica buscar reglas en `./.agents/rules`, skills en `./.agents/skills`, y memory bank en `./memory-bank/`, pero estos directorios pueden no existir o estar desactualizados, causando que el agente pierda tiempo o ignore convenciones reales.

**Regla:** Después de crear, mover o eliminar cualquier archivo de configuración para agentes (`AGENTS.md`, `.agents/`, `memory-bank/`), verifica que todas las rutas referenciadas en `AGENTS.md` existan realmente. Si eliminas o renombras un directorio, actualiza `AGENTS.md` en el mismo commit para reflejar la nueva ubicación.

---

## 🟡 R6 — Respetar verbatimModuleSyntax y linting estricto

**Riesgo:** El `tsconfig.app.json` tiene `verbatimModuleSyntax: true`, `noUnusedLocals: true` y `noUnusedParameters: true`. Cualquier violación (ej. `import { X }` en lugar de `import type { X }` para tipos, o variables sin usar) detendrá el build.

**Regla:** Al editar archivos TypeScript:
- Usa `import type { ... }` para imports que solo sean tipos.
- No separes imports de tipos y valores en la misma línea (ej. no mezclar `import { type Foo, bar }`).
- Elimina cualquier variable, parámetro o import que quede sin usar después de tu edición.
- Siempre ejecuta `tsc -b` (o verifica que no haya errores en el panel de problemas) antes de dar el build por válido.

---

## 🟡 R7 — Preferir named exports para componentes

**Riesgo:** La mayoría del proyecto usa `export function Componente()` (named export), pero `App.tsx` usa `export default`. Usar default export en un componente nuevo rompe el patrón de importación del resto del proyecto.

**Regla:** Al crear o modificar componentes, hooks, utilidades o cualquier módulo:
- Usa **named exports** (`export function`, `export const`, `export interface`).
- **No uses** `export default` excepto en `App.tsx` (única excepción del proyecto).
- Si ves una importación con `import Foo from '...'` que espera un default export, refactorízala a `import { Foo } from '...'`.

---

## 🟡 R8 — Documentar y mantener consistencia en componentes shadcn/ui

**Riesgo:** Los componentes UI (`card.tsx`, `skeleton.tsx`) usan el patrón `data-slot` de shadcn/ui para estilos. Un agente que no conozca este patrón podría crear componentes visualmente inconsistentes.

**Regla:** Al crear o modificar un componente UI de base (bajo `components/ui/`):
- Mantén el patrón `data-slot` en elementos relevantes (ej. `data-slot="card"`, `data-slot="card-header"`).
- Usa `cn()` para merge de clases condicionales.
- Sigue la estructura de `card.tsx` como referencia: un componente por archivo con `React.ComponentProps` para las props extendidas.
- No uses estilos inline para propiedades visuales que deberían ser variables del tema.

---

## 🟢 R9 — Sincronizar tipos literales financieros

**Riesgo:** Los union types `Category`, `OperationType` y `BusinessType` existen tanto en Python (`Literal`) como en TypeScript. Agregar un nuevo valor en un lado pero no en el otro causa errores de parseo en producción.

**Regla:** Al agregar, eliminar o renombrar un valor en un `Literal` de Python (en `backend/app/routes.py`) o un union type de TypeScript (en `frontend/src/lib/financial-types.ts`), **actualiza ambos archivos en el mismo commit**. Los valores deben coincidir exactamente (mismo casing, mismos nombres).

---

## 🟢 R10 — Seguir la convención de ubicación de tests según la capa

**Riesgo:** Frontend usa tests co-locados (`financial-utils.test.ts` junto al fuente), mientras que backend usa un directorio `tests/` separado. Mezclar patrones rompe la estructura esperada.

**Regla:**
- **Frontend:** Los tests van co-locados junto al archivo fuente con sufijo `.test.ts` o `.test.tsx`. Ejemplo: `kpi-card.test.tsx` junto a `kpi-card.tsx`.
- **Backend:** Los tests van en `backend/tests/` con un archivo por módulo. Ejemplo: `backend/tests/test_routes.py` para `app/routes.py`.
- No mezcles las convenciones: no pongas un test de backend junto al fuente ni un test de frontend en un directorio separado.

---

## 🟢 R11 — Crear directorio de tests para componentes cuando sea necesario

**Riesgo:** No existe un directorio ni convención establecida para tests de componentes React. Un agente que necesite crear uno no tiene referencia.

**Regla:** Para tests de componentes React (`.tsx` con JSX):
1. Crea el archivo co-locado con el componente, usando sufijo `.test.tsx`. Ejemplo: `kpi-card.test.tsx` junto a `kpi-card.tsx`.
2. Usa `vitest` (configurado ya en el proyecto) con `describe`/`it`/`expect`.
3. Si el componente usa fetching de datos, mockea `fetch` o `import.meta.env.VITE_API_BASE_URL`.
4. Verifica que `npm run test` pase completo en el directorio `frontend/` antes de hacer commit.
5. Si el patrón se consolida, documenta la ubicación en `AGENTS.md` para futuros agentes.