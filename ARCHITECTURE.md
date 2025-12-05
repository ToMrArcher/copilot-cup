# KPI Dashboard - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    BROWSER                                           │
│                                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                         React Frontend (Vite)                                │    │
│  │                           http://localhost:3000                              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │    │
│  │  │   Auth   │ │Dashboard │ │   KPIs   │ │Integra-  │ │    Sharing       │  │    │
│  │  │  Pages   │ │  Editor  │ │  Builder │ │  tions   │ │  (Public URLs)   │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTP/REST
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               DOCKER NETWORK (kpi-network)                           │
│                                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                        Express Backend (Node.js)                             │    │
│  │                           http://localhost:4000                              │    │
│  │                                                                               │    │
│  │  ┌──────────────────────────────────────────────────────────────────────┐   │    │
│  │  │                           API Modules                                 │   │    │
│  │  │  ┌────────┐ ┌──────────┐ ┌────────┐ ┌────────────┐ ┌───────────┐    │   │    │
│  │  │  │  Auth  │ │Dashboard │ │  KPI   │ │Integration │ │  Sharing  │    │   │    │
│  │  │  │ Router │ │  Router  │ │ Router │ │   Router   │ │   Router  │    │   │    │
│  │  │  └────────┘ └──────────┘ └────────┘ └────────────┘ └───────────┘    │   │    │
│  │  └──────────────────────────────────────────────────────────────────────┘   │    │
│  │                                    │                                          │    │
│  │  ┌──────────────────────────────────────────────────────────────────────┐   │    │
│  │  │                           Services                                    │   │    │
│  │  │  ┌────────┐ ┌───────────┐ ┌────────┐ ┌────────────┐ ┌────────────┐  │   │    │
│  │  │  │  Auth  │ │Permission │ │Formula │ │    KPI     │ │   Sync     │  │   │    │
│  │  │  │Service │ │  Service  │ │ Engine │ │ Calculator │ │  Service   │  │   │    │
│  │  │  └────────┘ └───────────┘ └────────┘ └────────────┘ └────────────┘  │   │    │
│  │  │  ┌────────┐ ┌───────────┐ ┌──────────────────────────────────────┐  │   │    │
│  │  │  │Sharing │ │  Crypto   │ │         KPI History Service          │  │   │    │
│  │  │  │Service │ │  Service  │ │    (Time series aggregation)         │  │   │    │
│  │  │  └────────┘ └───────────┘ └──────────────────────────────────────┘  │   │    │
│  │  └──────────────────────────────────────────────────────────────────────┘   │    │
│  │                                    │                                          │    │
│  │  ┌──────────────────────────────────────────────────────────────────────┐   │    │
│  │  │                    Middleware Layer                                   │   │    │
│  │  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────────────┐   │   │    │
│  │  │  │ Auth Middleware│ │Error Handler   │ │ Permission Middleware  │   │   │    │
│  │  │  │ (JWT Verify)   │ │                │ │ (RBAC Checks)          │   │   │    │
│  │  │  └────────────────┘ └────────────────┘ └────────────────────────┘   │   │    │
│  │  └──────────────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                        │                                             │
│              ┌─────────────────────────┼─────────────────────────┐                  │
│              │                         │                         │                  │
│              ▼                         ▼                         ▼                  │
│  ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐           │
│  │   Background      │    │    PostgreSQL     │    │  External APIs    │           │
│  │   Sync Worker     │    │    Database       │    │  (Data Sources)   │           │
│  │                   │    │    :5432          │    │                   │           │
│  │  - Scheduled      │    │                   │    │ ┌───────────────┐ │           │
│  │    syncs          │◄───┤  ┌─────────────┐  │    │ │ Dummy Server  │ │           │
│  │  - Retry logic    │    │  │   Users     │  │    │ │   :5050       │ │           │
│  │  - KPI recalc     │    │  │ Dashboards  │  │    │ └───────────────┘ │           │
│  │                   │────►  │    KPIs     │  │    │ ┌───────────────┐ │           │
│  └───────────────────┘    │  │Integrations │  │    │ │ Xledger Mock  │ │           │
│                           │  │ DataFields  │  │    │ │   (GraphQL)   │ │           │
│                           │  │ DataValues  │  │    │ │   :5001       │ │           │
│                           │  │  SyncLogs   │  │    │ └───────────────┘ │           │
│                           │  │ ShareLinks  │  │    │ ┌───────────────┐ │           │
│                           │  │   Access    │  │    │ │  Real APIs    │ │           │
│                           │  └─────────────┘  │    │ │  (Xledger,    │ │           │
│                           │                   │    │ │   etc.)       │ │           │
│                           └───────────────────┘    │ └───────────────┘ │           │
│                                                    └───────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Docker Services

| Service | Port | Purpose | Dependencies |
|---------|------|---------|--------------|
| **frontend** | 3000 | React SPA with Vite, TailwindCSS | backend |
| **backend** | 4000 | Express REST API with Prisma ORM | postgres |
| **postgres** | 5432 | PostgreSQL 15 database | - |
| **worker** | - | Background sync worker for scheduled data pulls | postgres, backend |
| **dummy-server** | 5050 | Mock REST API for testing integrations | - |
| **xledger-mock** | 5001 | Mock GraphQL API (Xledger financial data) | - |

## Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Data Source │────►│ Integration  │────►│  DataField   │────►│  DataValue   │
│  (API/Manual)│     │  (config)    │     │  (mapping)   │     │  (synced)    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                      │
                                                                      ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Widget     │◄────│  Dashboard   │◄────│     KPI      │◄────│  KpiSource   │
│  (display)   │     │  (layout)    │     │  (formula)   │     │  (binding)   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

## Database Schema (Key Entities)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │   Integration   │       │    Dashboard    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │       │ id              │
│ email           │       │ name            │       │ name            │
│ passwordHash    │       │ type (API/      │       │ ownerId ────────┼──┐
│ name            │       │   MANUAL/GRAPHQL│       │ layout (JSON)   │  │
│ role (ADMIN/    │◄──────┤ config (JSON)   │       └─────────────────┘  │
│   EDITOR/VIEWER)│       │ syncInterval    │              │              │
└─────────────────┘       │ lastSync        │              │              │
        │                 └─────────────────┘              ▼              │
        │                        │              ┌─────────────────┐       │
        │                        ▼              │     Widget      │       │
        │                 ┌─────────────────┐   ├─────────────────┤       │
        │                 │   DataField     │   │ dashboardId     │       │
        │                 ├─────────────────┤   │ kpiId           │       │
        │                 │ integrationId   │   │ type            │       │
        │                 │ name            │   │ position (JSON) │       │
        │                 │ path            │   │ config (JSON)   │       │
        │                 │ dataType        │   └─────────────────┘       │
        │                 └─────────────────┘                             │
        │                        │                                        │
        │                        ▼                                        │
        │                 ┌─────────────────┐                             │
        │                 │   DataValue     │                             │
        │                 ├─────────────────┤                             │
        │                 │ dataFieldId     │                             │
        │                 │ value (JSON)    │                             │
        │                 │ syncedAt        │                             │
        │                 └─────────────────┘                             │
        │                        ▲                                        │
        │                        │                                        │
        │                 ┌─────────────────┐       ┌─────────────────┐  │
        │                 │   KpiSource     │◄──────│       KPI       │  │
        │                 ├─────────────────┤       ├─────────────────┤  │
        │                 │ kpiId           │       │ id              │  │
        │                 │ dataFieldId     │       │ name            │  │
        │                 │ alias           │       │ formula         │◄─┘
        │                 └─────────────────┘       │ ownerId         │
        │                                           │ targetValue     │
        │                                           │ currentValue    │
        │                                           └─────────────────┘
        │                                                  │
        ▼                                                  ▼
┌─────────────────┐                              ┌─────────────────┐
│ DashboardAccess │                              │    KpiAccess    │
├─────────────────┤                              ├─────────────────┤
│ dashboardId     │                              │ kpiId           │
│ userId          │                              │ userId          │
│ permission      │                              │ permission      │
│ (VIEW/EDIT)     │                              │ (VIEW/EDIT)     │
└─────────────────┘                              └─────────────────┘
```

## Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────┐
│                        Role Hierarchy                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ADMIN ──────────────────────────────────────────────────────► │
│   • Full system access                                           │
│   • Manage all users, roles                                      │
│   • View/edit all dashboards & KPIs                             │
│   • Delete any resource                                          │
│                                                                  │
│   EDITOR ─────────────────────────────────────────────────────► │
│   • Create dashboards & KPIs                                     │
│   • Edit own resources                                           │
│   • Share resources with others                                  │
│   • View shared resources                                        │
│                                                                  │
│   VIEWER ─────────────────────────────────────────────────────► │
│   • View own resources                                           │
│   • View resources shared with them                              │
│   • Cannot create/edit (read-only)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Access Control Flow

```
Request ──► Auth Middleware ──► Permission Check ──► Resource Access
               │                      │
               │ JWT Verify           │ Check:
               │                      │ 1. Is user ADMIN? → Allow all
               ▼                      │ 2. Is user owner? → Allow
         Extract user                 │ 3. Has explicit access? → Allow
         from token                   │ 4. Otherwise → Deny (404)
                                      ▼
                              Return resource or error
```

## Frontend Structure

```
frontend/src/
├── components/           # Shared UI components
│   ├── charts/          # Chart components (line, bar, etc.)
│   ├── Layout.tsx       # Main app layout with sidebar
│   └── AccessManagementDialog.tsx
├── features/            # Feature modules
│   ├── auth/           # Login, Register, Profile, Admin pages
│   ├── dashboard/      # Dashboard editor, widgets, drag-drop
│   ├── integrations/   # Integration wizard, field mapping
│   ├── kpis/           # KPI list, cards, wizard, history
│   └── sharing/        # Share dialogs, public view pages
├── hooks/              # Custom React hooks (useAuth, useKpis, etc.)
├── contexts/           # React contexts (Auth, Theme, AutoRefresh)
├── lib/                # API client, utilities
└── types/              # TypeScript type definitions
```

## Backend Structure

```
backend/src/
├── modules/            # Feature modules (routers)
│   ├── auth/          # Authentication endpoints
│   ├── dashboard/     # Dashboard CRUD + widgets
│   ├── kpi/           # KPI CRUD + history + access
│   ├── integrations/  # Integration management + sync
│   └── sharing/       # Share links + public access
├── services/          # Business logic
│   ├── auth.service.ts
│   ├── permission.service.ts
│   ├── formula.service.ts
│   ├── kpi-calculator.service.ts
│   ├── kpi-history.service.ts
│   ├── sync.service.ts
│   ├── sharing.service.ts
│   └── crypto.service.ts
├── middleware/        # Express middleware
│   ├── auth.middleware.ts
│   ├── permission.middleware.ts
│   └── errorHandler.ts
├── worker/            # Background sync worker
└── prisma/            # Database schema & migrations
```

## Key Features

### 1. No-Code Integrations
- Visual configuration of API/GraphQL/Manual data sources
- Encrypted credential storage
- Field mapping with live preview
- Scheduled or manual sync

### 2. Formula Engine
- Math expressions: `revenue - costs`
- Field references: `fieldName.total`, `fieldName.average`
- Functions: `SUM()`, `AVG()`, `MIN()`, `MAX()`
- Comparisons: `(actual / target) * 100`

### 3. Dashboard Builder
- Drag-and-drop widget placement
- Multiple chart types (line, bar, gauge, number)
- Responsive grid layout
- Real-time auto-refresh

### 4. Secure Sharing
- Time-limited public URLs
- Signed tokens (HMAC)
- Optional target visibility
- Access analytics

### 5. Background Sync
- Configurable sync intervals
- Retry logic with backoff
- Sync status logging
- Error notifications

## Quick Start Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend

# Seed demo users
docker compose exec backend npx ts-node scripts/seed-users.ts

# Access database GUI
docker compose exec backend npx prisma studio

# Run tests
docker compose exec backend npm test

# Stop everything
docker compose down
```

## Demo Users

| Email | Password | Role |
|-------|----------|------|
| admin@checkin.no | Admin123! | ADMIN |
| editor@checkin.no | Editor123! | EDITOR |
| viewer@checkin.no | Viewer123! | VIEWER |
