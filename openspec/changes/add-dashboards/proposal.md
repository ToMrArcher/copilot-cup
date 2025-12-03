# Proposal: Dashboards & Visualization

## Problem Statement
KPIs exist but there's no way to visualize them together. Users need customizable dashboards with widgets that display KPIs as numbers, gauges, and time-series charts.

## Requirements (from Funksjonelle krav #4)
1. **Clear Structure**: Dashboard with KPIs grouped by theme
2. **Drag-and-Drop**: Rearrange widgets without creating new reports
3. **Period Comparison**: Compare with previous periods (week, month, quarter)

## Proposed Solution

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                         DASHBOARD                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Number    │  │    Gauge    │  │      Line Chart         │  │
│  │   Widget    │  │   Widget    │  │       Widget            │  │
│  │             │  │             │  │                         │  │
│  │  $95,900    │  │    72%      │  │   📈 ─────────────      │  │
│  │  Revenue    │  │  Progress   │  │      KPI over time      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐  │
│  │        Bar Chart            │  │       Stat Card         │  │
│  │         Widget              │  │        Widget           │  │
│  │   ▄▄ ██ ▄▄ ██ ▄▄           │  │   ↑ +12% vs last week   │  │
│  └─────────────────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Dashboard CRUD**
   - Create/edit/delete dashboards
   - Store grid layout configuration
   - Uses existing Prisma models (Dashboard, Widget)

2. **Widget Types**
   - `number` - Large value display with label
   - `gauge` - Progress toward target (0-100%)
   - `stat` - Value with comparison to previous period
   - `line` - Time-series line chart
   - `bar` - Time-series bar chart
   - `area` - Time-series area chart

3. **KPI History API**
   - Endpoint: `GET /api/kpis/:id/history`
   - Query params: `period` (7d, 30d, 90d, 1y), `interval` (hourly, daily, weekly)
   - Returns: Array of `{ timestamp, value }` for charting

4. **Grid Layout System**
   - CSS Grid-based positioning
   - Drag-and-drop with react-grid-layout
   - Responsive breakpoints

5. **Period Comparison**
   - Compare current value to previous period
   - Calculate percentage change
   - Show trend direction (↑ / ↓)

### Database (Existing Models)
```prisma
model Dashboard {
  id        String   @id @default(cuid())
  name      String
  ownerId   String
  layout    Json?    // Grid layout: { lg: [...], md: [...] }
  widgets   Widget[]
}

model Widget {
  id          String    @id @default(cuid())
  dashboardId String
  kpiId       String?
  type        String    // number, gauge, line, bar, stat
  config      Json?     // { period: "30d", showTarget: true, ... }
  position    Json      // { x, y, w, h }
}
```

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboards` | List all dashboards |
| GET | `/api/dashboards/:id` | Get dashboard with widgets |
| POST | `/api/dashboards` | Create dashboard |
| PUT | `/api/dashboards/:id` | Update dashboard (name, layout) |
| DELETE | `/api/dashboards/:id` | Delete dashboard |
| POST | `/api/dashboards/:id/widgets` | Add widget |
| PUT | `/api/dashboards/:id/widgets/:widgetId` | Update widget |
| DELETE | `/api/dashboards/:id/widgets/:widgetId` | Delete widget |
| GET | `/api/kpis/:id/history` | Get KPI historical values |

### UI Components
- **DashboardList** - Grid of dashboard cards
- **DashboardView** - Main dashboard with widgets
- **DashboardEditor** - Drag-and-drop layout editing
- **WidgetPicker** - Modal to add new widgets
- **Widget components**:
  - `NumberWidget` - Simple value display
  - `GaugeWidget` - Circular progress
  - `StatWidget` - Value with trend
  - `ChartWidget` - Line/bar/area charts (using Chart.js)

## Success Criteria
- [ ] Dashboard CRUD works end-to-end
- [ ] Widgets display KPI values correctly
- [ ] Drag-and-drop layout saves and persists
- [ ] Time-series charts show KPI history
- [ ] Period comparison shows percentage change
- [ ] Responsive layout on mobile/tablet

## Out of Scope (for now)
- Real-time WebSocket updates
- Dashboard templates
- Export to PDF/image
- Team sharing (covered in Sharing proposal)

## Dependencies
- Completed: KPI system with calculated values
- Required: Chart.js or similar charting library
- Required: react-grid-layout for drag-and-drop

## Technical Notes
- Chart.js is lightweight and supports all required chart types
- react-grid-layout is the standard for dashboard layouts in React
- Historical data aggregation can be done in SQL or application layer
