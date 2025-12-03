## Context
This is the initial project setup for a no-code KPI/dashboard platform. The platform must support:
- Configurable data source integrations (no hardcoding)
- KPI calculations with user-defined formulas
- Drag-and-drop dashboard building
- Role-based access control
- Secure external sharing via time-limited URLs

Stakeholders: Development team, future users needing KPI visualization

## Goals / Non-Goals

### Goals
- Establish a clean, modular monorepo structure
- Enable rapid local development with Docker Compose
- Set up TypeScript with strict mode for type safety
- Create foundation for the 5 core modules: integrations, kpi-engine, dashboard, auth, sharing
- Ensure AWS deployment readiness

### Non-Goals
- Implementing actual features (this is infrastructure only)
- Setting up CI/CD pipelines (separate proposal)
- Configuring production AWS resources (separate proposal)
- Adding authentication providers (separate proposal)

## Decisions

### Monorepo Structure
**Decision**: Use a simple monorepo with `frontend/` and `backend/` at root level
**Rationale**: Simple to understand, easy Docker configuration, no need for complex tooling like Nx or Turborepo at this scale

### Frontend: Vite + React + TypeScript
**Decision**: Use Vite as build tool instead of Create React App
**Rationale**: Faster development experience, better ESM support, smaller bundle sizes, actively maintained
**Alternatives**: CRA (slow, deprecated), Next.js (adds complexity we don't need for SPA dashboard)

### Backend: Express + TypeScript
**Decision**: Use Express with TypeScript
**Rationale**: Mature, well-documented, large ecosystem, team familiarity
**Alternatives**: Fastify (faster but smaller ecosystem), NestJS (too opinionated for our needs)

### Database: PostgreSQL 15+
**Decision**: Use PostgreSQL with Docker container for local dev
**Rationale**: Robust, supports JSON for flexible schema parts, excellent for relational KPI data

### Styling: TailwindCSS
**Decision**: Use TailwindCSS for styling
**Rationale**: Utility-first approach enables rapid UI development, consistent design system

## Folder Structure

```
copilot-cup/
├── frontend/
│   ├── src/
│   │   ├── components/        # Shared UI components
│   │   ├── features/          # Feature-specific modules
│   │   │   ├── dashboard/     # Dashboard widgets and layout
│   │   │   ├── kpi/           # KPI display and configuration
│   │   │   ├── integrations/  # Data source management UI
│   │   │   ├── auth/          # Login, roles UI
│   │   │   └── sharing/       # Share link management
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities and helpers
│   │   ├── types/             # TypeScript type definitions
│   │   └── App.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── backend/
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   │   ├── integrations/  # Data source adapters
│   │   │   ├── kpi/           # KPI engine and formulas
│   │   │   ├── dashboard/     # Dashboard persistence
│   │   │   ├── auth/          # Authentication/authorization
│   │   │   └── sharing/       # External link generation
│   │   ├── middleware/        # Express middleware
│   │   ├── db/                # Database connection and migrations
│   │   ├── types/             # Shared TypeScript types
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Monorepo complexity as project grows | Start simple, add tooling (Turborepo) only if needed |
| Docker adds local dev overhead | Provide clear setup docs, fast rebuild configs |
| PostgreSQL learning curve | Use Prisma ORM for simpler database interactions |

## Migration Plan
N/A - This is a greenfield setup.

## Open Questions
- [x] Should we add Prisma ORM now or use raw SQL initially? **Decision: Yes, add Prisma from the start**
- [x] Do we need Redis for caching in initial setup or add later? **Decision: Add later when needed**
- [x] Should we include Chart.js setup in frontend now or defer to dashboard feature? **Decision: Defer to dashboard feature**
