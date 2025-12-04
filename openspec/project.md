# Project Context

## Purpose
A minimal, extendable, tech-agnostic skeleton for a no-code KPI/dashboard platform. Designed to be Docker-first and AWS-ready.

Funksjonelle krav:
1. Integrasjoner (no-code)
Når jeg kobler på en ny datakilde,
vil jeg konfigurere tilgang og felter i et visuelt grensesnitt,
slik at integrasjoner kan settes opp uten kodeendringer.

Når jeg legger inn API-nøkler eller OAuth-tokens,
vil jeg at systemet håndterer dem sikkert og skjult,
slik at sensitive data ikke eksponeres.

Når jeg mapper felter,
vil jeg se live-eksempler på data,
slik at jeg kan validere mappet umiddelbart.

2. KPIer og transformasjoner
Når jeg oppretter en KPI,
vil jeg kunne velge hvilke felter fra hvilke datakilder som inngår,
slik at KPI-logikken er gjenbrukbar og ikke skjult i kode.

Når jeg må transformere eller kombinere data,
vil jeg kunne bruke et lettfattelig formel-/funksjonsverktøy,
slik at jeg kan lage KPIer basert på flere kilder.

Når jeg definerer en KPI med et mål,
vil jeg kunne sette målverdi, periode og retning,
slik at systemet vet hva som kvalifiserer som «på vei mot mål».

Når en KPI har flere mål (måned/kvartal/år),
vil jeg enkelt kunne bytte aktivt mål,
slik at visualiseringen følger riktig periode.

3. Sikkerhet og tilgang
Når jeg logger inn,
vil jeg bruke en sikker metode med roller og rettigheter,
slik at kun autoriserte personer ser sensitive KPIer.

Når jeg administrerer dashboards,
vil jeg styre tilgangen per bruker eller team,
slik at ingen ser mer enn de skal.

4. Presentasjon og visualisering
Når jeg åpner dashboardet,
vil jeg se en klar struktur med KPIer gruppert etter tema,
slik at jeg kan forstå situasjonen uten å lete.

Når jeg vil endre rekkefølge eller oppsett,
vil jeg kunne dra-og-slippe widgets,
slik at jeg kan skreddersy visningen uten å lage en ny rapport.

Når jeg ser en KPI,
vil jeg kunne sammenligne med samme periode tidligere (f.eks. forrige uke, måned eller kvartal),
slik at jeg ser om utviklingen går i riktig retning.

5. Deling
Når jeg deler rapporter eksternt,
vil jeg generere tidsbegrensede hemmelige URLer, 
slik at mottaker får kontrollert tilgang uten konto.

Når jeg avslutter deling,
vil jeg kunne deaktivere lenken umiddelbart,
slik at tilgangen ikke lever videre.

Når jeg deler en KPI eksternt,
vil jeg velge om måloppnåelse skal vises eller skjules,
slik at vi kontrollerer narrativet.

6. Dataflyt og refresh
Når jeg trenger oppdaterte tall,
vil jeg trigge refresh manuelt eller tidsstyre den,
slik at dashboardet alltid viser ferske data.

Når en integrasjon feiler,
vil jeg få en tydelig feilmelding med forslag til løsning,
slik at jeg kan fikse det raskt.

Supplerende konkurransekriterier
AI-first arbeid: Teamet skal eksplisitt vise hvor AI ga hastighetsgevinst (kode, UI, dokumentasjon, arkitektur).

Ingen hardkoding av integrasjoner: Struktur må støtte at nye kilder kan legges til gjennom UI.

Minstekrav demo: Én dashboard-side, minst 3 KPIer, minst 2 datakilder (API + manuell input).

Modulær arkitektur: Integrasjons-adaptere, formel-engine, dashboard-widgets.

Sikkerhetsbaseline: Kryptert nøkkellagring, beskyttet API, tydelig rollemodell.

Delingsbaseline: Signerte hemmelige URLer med optional expiry.

Brukervennlighet: Wizard for integrasjoner, live preview, drag-and-drop layout.

Visuell kvalitet: Smarte defaults, konsekvent typografi, ren grid-oppbygning.

Observability: Enkel logg av sync-status og siste refresh.

Inline metadata: «Kilde», «Sist oppdatert», «Synk-status».

Caching: Lett caching-lag for å unngå å kalle eksterne APIer unødvendig.

Rate-limit-håndtering: Unngå overdrevent mange kall til hvert API.

## Tech Stack

### Frontend
- **TypeScript** - Primary language for type-safe development
- **React** - UI component framework
- **Chart.js** - Data visualization and charting library
- **TailwindCSS** (recommended) - Utility-first CSS framework

### Backend
- **Node.js** - Runtime environment
- **TypeScript** - Type-safe backend code
- **Express** or **Fastify** (TBD) - API framework

### Database
- **PostgreSQL** - Primary relational database for KPIs, configurations, and user data

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Local development orchestration
- **AWS** - Target cloud deployment platform

## Project Conventions

### Code Style
- Standard TypeScript conventions with strict mode enabled
- ESLint + Prettier for consistent formatting
- Use functional components with hooks in React
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable and function names (camelCase)
- Component files use PascalCase (e.g., `DashboardWidget.tsx`)
- Utility files use camelCase (e.g., `formatKpi.ts`)

### Architecture Patterns
- **Modular Architecture** - Separate concerns into distinct modules:
  - `integrations/` - Data source adapters (pluggable, no hardcoding)
  - `kpi-engine/` - KPI calculation and formula engine
  - `dashboard/` - Widget components and layout system
  - `auth/` - Authentication and authorization
  - `sharing/` - External link generation and management
- **Docker-first** - All services run in containers
- **API-first** - Backend exposes RESTful API consumed by frontend
- **Adapter Pattern** - Integration adapters for each data source type

### Testing Strategy
- **Unit Tests** - Jest for business logic, formula engine, and utilities
- **Component Tests** - React Testing Library for UI components
- **Integration Tests** - Test API endpoints and database operations
- **E2E Tests** (optional) - Playwright or Cypress for critical user flows
- Minimum coverage target: 70% for critical paths (KPI calculations, auth)

### Git Workflow
- **Branching**: `main` (production-ready), `feature/*`, `fix/*`, `chore/*`
- **Commits**: Conventional Commits format (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`)
- **Pull Requests**: Required for all changes to `main`
- **Reviews**: At least one approval before merge

## Domain Context

### Key Concepts
- **KPI (Key Performance Indicator)** - A measurable value that demonstrates progress toward a goal
- **Data Source / Integration** - An external system that provides data (API, manual input, etc.)
- **Widget** - A visual component displaying a KPI or chart on a dashboard
- **Formula** - User-defined calculation combining fields from one or more data sources
- **Target/Goal** - A defined objective for a KPI with period and direction (increase/decrease)
- **Shareable Link** - Time-limited, signed URL for external access to specific dashboards/KPIs

### User Roles
- **Admin** - Full access, manages integrations and users
- **Editor** - Can create/edit KPIs, dashboards, and widgets
- **Viewer** - Read-only access to assigned dashboards

## Important Constraints

### Technical
- No hardcoded integrations - all data sources must be configurable via UI
- Secure credential storage - API keys and OAuth tokens must be encrypted
- Rate limiting - Respect external API rate limits with caching layer
- Docker compatibility - All components must run in containers

### Business
- AI-first development - Document where AI provides speed improvements
- Demo requirements: 1 dashboard, 3+ KPIs, 2+ data sources (API + manual)
- Norwegian language support for UI (based on requirements in Norwegian)

### Security
- Encrypted key storage for sensitive credentials
- Protected API endpoints with authentication
- Role-based access control (RBAC)
- Signed, time-limited URLs for external sharing

## External Dependencies

### Required Services
- **PostgreSQL** - Database (Docker container or managed AWS RDS)
- **AWS Services** (planned):
  - ECR - Container registry
  - ECS/Fargate or EKS - Container orchestration
  - RDS - Managed PostgreSQL
  - Secrets Manager - Credential storage
  - CloudFront - CDN for frontend

### Third-party APIs (examples for integrations)
- Various business APIs (configured at runtime, not hardcoded)
- OAuth providers for authentication (Google, Microsoft, etc.)

### Development Tools
- Context7 MCP - AI documentation retrieval (configured in `.vscode/mcp.json`)

###
- Missing so far:
- OAuth for API integration