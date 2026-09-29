# Stack Tecnológico

## Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| React | 19.x | UI framework |
| TypeScript | ~6.0 | Lenguaje tipado |
| Vite | 8.x | Bundler / dev server |
| Tailwind CSS | 4.x | Estilos utilitarios |
| Recharts | 3.x | Gráficos (líneas) |
| Lucide React | 1.x | Iconos |
| clsx + tailwind-merge | — | Merge de clases condicional (`cn()`) |
| Vitest | 4.x | Tests unitarios |
| ESLint | 9.x | Linting |

### Estructura `frontend/src/`

```
src/
├── App.tsx                    # Componente raíz (fetching + layout)
├── main.tsx                   # Entry point
├── index.css                  # Variables CSS del tema (claro/oscuro)
├── components/
│   ├── dashboard/
│   │   ├── dashboard-header.tsx
│   │   ├── kpi-card.tsx
│   │   ├── kpi-row.tsx
│   │   ├── income-outcome-chart.tsx
│   │   ├── profit-percent-chart.tsx
│   │   └── theme-toggle.tsx
│   └── ui/
│       ├── card.tsx           # shadcn/ui
│       └── skeleton.tsx       # shadcn/ui
└── lib/
    ├── utils.ts               # cn()
    ├── financial-types.ts     # Tipos compartidos
    ├── financial-utils.ts     # computeKPIs, computeMonthlyData, formatters
    ├── financial-utils.test.ts
    └── mock-data.ts           # (incompleto, sin uso)
```

## Backend

| Tecnología | Versión | Propósito |
|---|---|---|
| Python | 3.13 | Lenguaje |
| FastAPI | — | Framework web |
| Uvicorn | — | Servidor ASGI |
| Pydantic | — | Validación de modelos |
| debugpy | — | Depuración remota (puerto 5678) |
| pytest + httpx + pytest-cov | — | Tests |

### Estructura `backend/`

```
backend/
├── Dockerfile
├── requirements.txt
├── app/
│   ├── __init__.py
│   ├── main.py                # Config FastAPI + CORS
│   └── routes.py              # 8 endpoints + lógica mock
└── tests/
    ├── conftest.py            # Config path
    └── test_routes.py         # 15 tests
```

## Infraestructura

| Herramienta | Propósito |
|---|---|
| Docker | Contenedores |
| Docker Compose | Orquestación de servicios |
| Vite proxy | Redirección `/api` → backend |

---