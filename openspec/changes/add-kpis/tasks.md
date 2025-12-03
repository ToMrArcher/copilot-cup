# Tasks: Add KPIs and Transformations

## Phase 1: Data Storage
- [ ] **1.1 DataValue Model**
  - Add DataValue model to Prisma schema
  - Run migration
  - Update DataField relation

- [ ] **1.2 Integration Sync Storage**
  - Update API adapter to store synced values in DataValue
  - Support both single values and arrays
  - Store timestamp for each sync

## Phase 2: Backend KPI System
- [ ] **2.1 Formula Engine**
  - Create formula parser using `mathjs` library
  - Support basic operations: +, -, *, /, ()
  - Support aggregation: sum(), avg(), min(), max()
  - Variable substitution from aliases
  - Safe evaluation (sandboxed)

- [ ] **2.2 KPI Calculator Service**
  - Fetch latest DataValues for each KpiSource
  - Substitute alias variables in formula
  - Evaluate formula and return result
  - Handle missing/null values gracefully

- [ ] **2.3 KPI API Routes**
  - `GET /api/kpis` - List all with calculated values
  - `GET /api/kpis/:id` - Get single with details
  - `POST /api/kpis` - Create with sources
  - `PUT /api/kpis/:id` - Update
  - `DELETE /api/kpis/:id` - Delete
  - `POST /api/kpis/:id/recalculate` - Force recalc

- [ ] **2.4 KPI Tests**
  - Unit tests for formula engine
  - Integration tests for KPI CRUD
  - Edge cases: missing data, division by zero

## Phase 3: Frontend KPI UI
- [ ] **3.1 Types and API Integration**
  - Define TypeScript types for KPI
  - Create API client functions
  - React Query hooks for KPI operations

- [ ] **3.2 KPI List Component**
  - Grid of KPI cards
  - Show current value, target, progress
  - Color coding for on-track/off-track

- [ ] **3.3 KPI Card Component**
  - Display name, value, unit
  - Progress bar toward target
  - Direction indicator (up/down arrow)
  - Last calculated timestamp

- [ ] **3.4 KPI Creation Wizard**
  - Step 1: Name and description
  - Step 2: Select data sources (DataFields from integrations)
  - Step 3: Build formula with variable picker
  - Step 4: Set target (value, period, direction)

- [ ] **3.5 KPI Page and Routing**
  - Add `/kpis` route
  - Add to navigation
  - List view with create button

## Phase 4: Integration and Validation
- [ ] **4.1 End-to-End Flow**
  - Sync data from integration
  - Verify DataValues stored
  - Create KPI using synced fields
  - Verify calculation works

- [ ] **4.2 Docker Rebuild**
  - Rebuild containers with new dependencies
  - Run migrations in container
  - Verify all services healthy

## Estimated Effort
- Phase 1: 30 min
- Phase 2: 60 min
- Phase 3: 60 min
- Phase 4: 20 min
- **Total: ~3 hours**

## Notes
- Using `mathjs` for formula evaluation (safe, no eval())
- DataValue stores JSON to support any field type
- KPI calculation is on-demand, not cached (can optimize later)
