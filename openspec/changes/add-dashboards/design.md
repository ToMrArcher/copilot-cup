# Design: Dashboard & Visualization

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │  DataValue  │────▶│   KPI       │────▶│   Widget    │                   │
│  │ (historical)│     │ Calculator  │     │   Render    │                   │
│  └─────────────┘     └─────────────┘     └─────────────┘                   │
│        │                   │                    │                           │
│        ▼                   ▼                    ▼                           │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │  Aggregate  │     │  Compare    │     │   Chart.js  │                   │
│  │  by Period  │     │  Periods    │     │   Render    │                   │
│  └─────────────┘     └─────────────┘     └─────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## KPI History API

### Request
```
GET /api/kpis/:id/history?period=30d&interval=daily
```

### Response
```json
{
  "kpiId": "kpi_123",
  "name": "Total Revenue",
  "period": "30d",
  "interval": "daily",
  "data": [
    { "timestamp": "2025-11-03T00:00:00Z", "value": 85000 },
    { "timestamp": "2025-11-04T00:00:00Z", "value": 87500 },
    { "timestamp": "2025-11-05T00:00:00Z", "value": 89200 },
    // ... 27 more days
    { "timestamp": "2025-12-03T00:00:00Z", "value": 95900 }
  ],
  "comparison": {
    "previousValue": 78000,
    "currentValue": 95900,
    "change": 22.9,
    "direction": "up"
  }
}
```

### Aggregation Logic
```typescript
// Group DataValues by interval
function aggregateByInterval(
  values: DataValue[],
  interval: 'hourly' | 'daily' | 'weekly'
): AggregatedValue[] {
  // For each interval bucket:
  // 1. Find all values in that time range
  // 2. Take the latest value (or average, configurable)
  // 3. Return { timestamp, value }
}
```

## Widget Types

### Number Widget
```
┌─────────────────────────────┐
│  Total Revenue              │
│                             │
│      $95,900               │
│                             │
│  Target: $100,000           │
└─────────────────────────────┘
```

Config:
```json
{
  "type": "number",
  "kpiId": "kpi_123",
  "config": {
    "showTarget": true,
    "format": "currency",
    "prefix": "$"
  }
}
```

### Stat Widget (with comparison)
```
┌─────────────────────────────┐
│  Revenue                    │
│                             │
│      $95,900               │
│      ↑ +22.9% vs last month │
│                             │
└─────────────────────────────┘
```

Config:
```json
{
  "type": "stat",
  "kpiId": "kpi_123",
  "config": {
    "comparePeriod": "month",
    "format": "currency"
  }
}
```

### Gauge Widget
```
┌─────────────────────────────┐
│  Progress to Target         │
│                             │
│         ╭───────╮           │
│       ╱           ╲         │
│      │    95.9%    │        │
│       ╲           ╱         │
│         ╰───────╯           │
│                             │
│  $95,900 / $100,000         │
└─────────────────────────────┘
```

Config:
```json
{
  "type": "gauge",
  "kpiId": "kpi_123",
  "config": {
    "showValue": true,
    "showTarget": true
  }
}
```

### Line Chart Widget
```
┌─────────────────────────────────────────┐
│  Revenue Over Time           [30d ▼]   │
│                                         │
│  100k ┤                          ╭──    │
│   90k ┤              ╭───────────╯      │
│   80k ┤    ╭─────────╯                  │
│   70k ┤────╯                            │
│       └──────────────────────────────   │
│        Nov 3    Nov 15    Nov 27  Dec 3 │
└─────────────────────────────────────────┘
```

Config:
```json
{
  "type": "line",
  "kpiId": "kpi_123",
  "config": {
    "period": "30d",
    "interval": "daily",
    "showTarget": true,
    "fill": false
  }
}
```

## Grid Layout

### Position Schema
```json
{
  "position": {
    "x": 0,      // Column (0-11)
    "y": 0,      // Row
    "w": 3,      // Width in columns
    "h": 2       // Height in rows
  }
}
```

### Dashboard Layout JSON
```json
{
  "layout": {
    "lg": [
      { "i": "widget_1", "x": 0, "y": 0, "w": 3, "h": 2 },
      { "i": "widget_2", "x": 3, "y": 0, "w": 3, "h": 2 },
      { "i": "widget_3", "x": 6, "y": 0, "w": 6, "h": 3 }
    ],
    "md": [
      { "i": "widget_1", "x": 0, "y": 0, "w": 6, "h": 2 },
      { "i": "widget_2", "x": 6, "y": 0, "w": 6, "h": 2 },
      { "i": "widget_3", "x": 0, "y": 2, "w": 12, "h": 3 }
    ],
    "sm": [
      { "i": "widget_1", "x": 0, "y": 0, "w": 12, "h": 2 },
      { "i": "widget_2", "x": 0, "y": 2, "w": 12, "h": 2 },
      { "i": "widget_3", "x": 0, "y": 4, "w": 12, "h": 3 }
    ]
  }
}
```

## Component Hierarchy

```
DashboardPage
├── DashboardHeader
│   ├── Title
│   ├── EditButton
│   └── AddWidgetButton
├── GridLayout (react-grid-layout)
│   ├── Widget (wrapper)
│   │   ├── WidgetHeader
│   │   │   ├── Title
│   │   │   └── MenuDropdown
│   │   └── WidgetContent
│   │       └── NumberWidget | StatWidget | GaugeWidget | ChartWidget
│   └── ... more widgets
└── WidgetPickerModal
    ├── KpiSelector
    ├── TypeSelector
    └── ConfigForm
```

## Chart.js Configuration

### Default Theme
```typescript
const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true }
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: false }
  }
}
```

### Color Palette
```typescript
const colors = {
  primary: '#3B82F6',    // Blue
  success: '#10B981',    // Green
  warning: '#F59E0B',    // Amber
  danger: '#EF4444',     // Red
  neutral: '#6B7280',    // Gray
}
```

## Technology Choices

### Chart.js
- **Why**: Lightweight (~60KB), all chart types, good React integration
- **Alternative**: Recharts (larger), D3 (complex)

### react-grid-layout
- **Why**: Industry standard, battle-tested, responsive breakpoints
- **Alternative**: react-mosaic, muuri (less mature)

### Date Handling
- **Why**: Use native Date for simplicity
- **Alternative**: date-fns if more complex operations needed
