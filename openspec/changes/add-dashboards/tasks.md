# Tasks: Dashboards & Visualization

## Phase 1: Backend - KPI History API ✅
- [x] **1.1 History Endpoint**
  - Add `GET /api/kpis/:id/history` endpoint
  - Query params: `period` (7d, 30d, 90d, 1y), `interval` (hourly, daily, weekly)
  - Aggregate DataValues by interval
  - Return `{ data: [{ timestamp, value }], period, interval }`

- [x] **1.2 Period Comparison**
  - Add comparison calculation to KPI response
  - Compare current value to previous period (same duration)
  - Return `{ change: 12.5, direction: "up" }`

## Phase 2: Backend - Dashboard API ✅
- [x] **2.1 Dashboard CRUD**
  - `GET /api/dashboards` - List all
  - `GET /api/dashboards/:id` - Get with widgets
  - `POST /api/dashboards` - Create
  - `PUT /api/dashboards/:id` - Update name/layout
  - `DELETE /api/dashboards/:id` - Delete

- [x] **2.2 Widget CRUD**
  - `POST /api/dashboards/:id/widgets` - Add widget
  - `PUT /api/dashboards/:id/widgets/:widgetId` - Update widget
  - `DELETE /api/dashboards/:id/widgets/:widgetId` - Delete widget

- [x] **2.3 Layout Persistence**
  - Store grid positions in Dashboard.layout JSON
  - `PUT /api/dashboards/:id/layout` - Batch update positions
  - Support responsive breakpoints (lg, md, sm)

## Phase 3: Frontend - Chart Library Setup ✅
- [x] **3.1 Install Dependencies**
  - Install `chart.js` and `react-chartjs-2`
  - Install `react-grid-layout`
  - Configure Chart.js defaults (colors, fonts)

- [x] **3.2 Chart Components**
  - Create `LineChart` component
  - Create `BarChart` component
  - Create `AreaChart` component
  - Create `GaugeChart` component (using doughnut)

## Phase 4: Frontend - Widget Components ✅
- [x] **4.1 Base Widget**
  - Create `Widget` wrapper with common styling
  - Header with title, menu (edit, delete)
  - Loading and error states

- [x] **4.2 Number Widget**
  - Large value display
  - Label and optional target
  - Color coding based on status

- [x] **4.3 Stat Widget**
  - Current value
  - Comparison to previous period
  - Trend arrow (↑/↓) with percentage

- [x] **4.4 Gauge Widget**
  - Circular progress indicator
  - Current value and target
  - Percentage display

- [x] **4.5 Chart Widget**
  - Support line, bar, area types
  - Period selector (7d, 30d, 90d)
  - Responsive sizing

## Phase 5: Frontend - Dashboard UI ✅
- [x] **5.1 Types and API**
  - Define TypeScript types for Dashboard, Widget
  - Create API client functions
  - React Query hooks for dashboard operations

- [x] **5.2 Dashboard List**
  - Grid of dashboard cards
  - Create new dashboard button
  - Empty state

- [x] **5.3 Dashboard View**
  - Render widgets in grid layout
  - View mode (read-only)
  - Edit mode toggle

- [x] **5.4 Dashboard Editor**
  - Widget positioning via CSS Grid
  - Delete widget support
  - Add widget button

- [x] **5.5 Widget Picker**
  - Modal to add new widget
  - Select KPI
  - Select widget type
  - Configure options (period, show target, etc.)

## Phase 6: Integration & Polish ✅
- [x] **6.1 Default Dashboard**
  - Create default dashboard on first load
  - Pre-populate with existing KPIs
  - "Quick Start" button in empty state

- [x] **6.2 Responsive Layout**
  - Mobile breakpoint (single column / 4 cols)
  - Tablet breakpoint (8 columns)
  - Desktop breakpoint (12 columns)
  - CSS Grid with responsive scaling

- [x] **6.3 End-to-End Testing**
  - ✅ Dashboard API working (CRUD)
  - ✅ Widget API working (create, update, delete)
  - ✅ KPI history API returning data
  - ✅ 59 backend tests passing
  - ✅ Frontend serving correctly

## Estimated Effort
- Phase 1: 30 min (History API)
- Phase 2: 30 min (Dashboard API)
- Phase 3: 20 min (Chart setup)
- Phase 4: 60 min (Widget components)
- Phase 5: 90 min (Dashboard UI)
- Phase 6: 30 min (Polish)
- **Total: ~4.5 hours**

## Notes
- Using Chart.js for simplicity and small bundle size
- react-grid-layout handles all drag-and-drop complexity
- Layout stored as JSON, no additional DB migrations needed
- Gauge uses doughnut chart with custom rendering
