# Panel de Métricas Financieras

<!-- hide -->

Por [@marcogonzalo](https://github.com/marcogonzalo) y [otros contribuidores](https://github.com/4GeeksAcademy/ai-eng-financial-dashboard-context-project/graphs/contributors) en [4Geeks Academy](https://4geeksacademy.com/)

[![build by developers](https://img.shields.io/badge/build_by-Developers-blue)](https://4geeks.com)
[![4Geeks Academy](https://img.shields.io/twitter/follow/4geeksacademy?style=social&logo=x)](https://x.com/4geeksacademy)

_These instructions are [available in English](./README.md)._

**Antes de empezar**: 📗 [Lee las instrucciones](https://4geeks.com/es/lesson/como-comenzar-un-proyecto-de-codificacion) sobre cómo comenzar un proyecto de programación.

<!-- endhide -->

---

_Dashboard de métricas financieras con frontend en React + TypeScript y backend en FastAPI._

## Pasos recomendados

1. Haz un fork de este repositorio a tu cuenta.
2. Abre tu fork en GitHub Codespaces o clónalo y ejecútalo en tu entorno local.
3. Ejecuta tu agente de IA para inspeccionar frontend y backend.
4. Documenta las reglas propuestas y el banco de memoria en tu fork.
5. Ajusta y valida las reglas hasta que sean aplicables al flujo real del proyecto.

## Estructura esperada del directorio para agentes

```text
./.agents
└─ /rules
   └─ <nombre-regla>.md
└─ /skills
   └─ /<nombre-skill>
      └─ /SKILL.md
```

## Skills del agente

`.agents/skills/` tiene actualmente cuatro skills, instalados con la [CLI `skills`](https://skills.sh):

| Skill | Fuente | Cubre |
|---|---|---|
| `accessibility` | `addyosmani/web-quality-skills` | Auditorías WCAG 2.2 (aria-label, foco, alt, contraste) |
| `performance` | `addyosmani/web-quality-skills` | Presupuestos de carga, critical rendering path, runtime |
| `vercel-react-best-practices` | `vercel-labs/agent-skills` | Reglas de performance para React/Next.js (las reglas exclusivas de Next.js se marcan como no aplicables, porque el frontend es una SPA Vite sin SSR) |
| `fe-be-type-sync` | Creado para este repo | Ver "Gap identificado" abajo |

Cada `SKILL.md` instalado se adaptó con una sección breve "Adaptation for this project". Ver `memory-bank/agent-skills.md` para el detalle completo y `npx skills list` para confirmar que están cargados.

### Gap identificado: sincronización de tipos frontend-backend

Este repo combina un backend FastAPI/Pydantic (Python) con un frontend TypeScript, sin generación de esquema compartido (no hay OpenAPI codegen, Zod ni tRPC): los tipos se mantienen sincronizados a mano entre `backend/app/routes.py` y `frontend/src/lib/financial-types.ts`. Ninguna skill comunitaria instalada cubre este riesgo específico de un stack políglota — todas asumen un frontend-only o un full-stack con tipos ya compartidos. Por eso se creó la skill propia `.agents/skills/fe-be-type-sync/SKILL.md`, con la estructura objetivo/inputs/output esperado/criterios de aceptación, para detectar y corregir esa divergencia campo por campo antes de cada commit.

## Cómo ejecutar en local

```bash
docker compose up --build
```

El frontend usa por defecto el proxy de Vite para `/api`, así que no necesitas variables de entorno extra ni en desarrollo local ni en Codespaces.
Si necesitas apuntar a otro backend, copia `frontend/.env.example` como `.env` y define `VITE_API_BASE_URL`.

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Documentación API: http://localhost:8000/docs

---

Este y muchos otros proyectos son construidos por estudiantes como parte de los [Coding Bootcamps](https://4geeksacademy.com/) de 4Geeks Academy. Encuentra más acerca de los [cursos](https://4geeksacademy.com/es/comparar-programas) de [Ingeniería de IA](https://4geeksacademy.com/es/coding-bootcamps/ingenieria-ia), [Data Science & Machine Learning](https://4geeksacademy.com/es/coding-bootcamps/curso-datascience-machine-learning), [Ciberseguridad](https://4geeksacademy.com/es/coding-bootcamps/curso-ciberseguridad) y [Full-Stack Software Developer con IA](https://4geeksacademy.com/es/coding-bootcamps/programador-full-stack).
