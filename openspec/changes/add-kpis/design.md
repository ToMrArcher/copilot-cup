# Design: KPI System

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTEGRATION LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐             │
│  │   External  │ ───▶   │   Adapter   │ ───▶   │  DataValue  │             │
│  │     API     │  sync  │  (api.ts)   │ store  │  (database) │             │
│  └─────────────┘        └─────────────┘        └─────────────┘             │
│                                                       │                      │
└───────────────────────────────────────────────────────┼──────────────────────┘
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 KPI LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐             │
│  │  DataValue  │ ───▶   │   Formula   │ ───▶   │     KPI     │             │
│  │  (source)   │  read  │   Engine    │  calc  │  (result)   │             │
│  └─────────────┘        └─────────────┘        └─────────────┘             │
│                              │                        │                      │
│                              ▼                        ▼                      │
│                        ┌─────────────┐        ┌─────────────┐             │
│                        │   mathjs    │        │   Target    │             │
│                        │ (evaluate)  │        │  Tracking   │             │
│                        └─────────────┘        └─────────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Formula Engine Design

### Supported Operations
```
Arithmetic: + - * / () ^
Comparison: < > <= >= == !=
Aggregation: sum(array), avg(array), min(array), max(array), count(array)
```

### Variable Binding
KpiSource defines an `alias` that becomes a variable in the formula:

```typescript
// Example KPI
{
  name: "Revenue per Employee",
  formula: "revenue / employees",
  sources: [
    { dataFieldId: "df_revenue", alias: "revenue" },
    { dataFieldId: "df_headcount", alias: "employees" }
  ]
}
```

### Formula Examples
| KPI Name | Formula | Sources |
|----------|---------|---------|
| Total Revenue | `revenue` | revenue |
| Profit Margin | `(revenue - costs) / revenue * 100` | revenue, costs |
| Avg Order Value | `revenue / orders` | revenue, orders |
| Employee Productivity | `revenue / headcount` | revenue, headcount |

## UI Design

### KPI Card Layout
```
┌─────────────────────────────────────────┐
│  📊 Revenue per Employee                │
│                                         │
│      $125,000                          │
│      ↑ +12% vs target                  │
│                                         │
│  ████████████░░░░░░░░  72%             │
│  Target: $175,000 · Monthly            │
│                                         │
│  Updated: 2 min ago                     │
└─────────────────────────────────────────┘
```

### KPI Wizard Steps
```
Step 1: Basic Info          Step 2: Data Sources
┌─────────────────────┐    ┌─────────────────────┐
│ Name: Revenue/Emp   │    │ Select fields:      │
│                     │    │ ☑ Sales Revenue     │
│ Description:        │    │ ☑ Employee Count    │
│ Revenue divided by  │    │ ☐ Customer Count    │
│ employee headcount  │    │                     │
│                     │    │ Assign aliases:     │
│ [Next →]            │    │ revenue, employees  │
└─────────────────────┘    └─────────────────────┘

Step 3: Formula             Step 4: Target
┌─────────────────────┐    ┌─────────────────────┐
│ Build your formula: │    │ Set a goal:         │
│                     │    │                     │
│ [revenue/employees] │    │ Target: 175000      │
│                     │    │ Period: Monthly  ▼  │
│ Variables:          │    │ Direction:          │
│ • revenue           │    │ ● Increase          │
│ • employees         │    │ ○ Decrease          │
│                     │    │                     │
│ [← Back] [Next →]   │    │ [← Back] [Create]   │
└─────────────────────┘    └─────────────────────┘
```

## API Response Examples

### GET /api/kpis
```json
{
  "kpis": [
    {
      "id": "kpi_123",
      "name": "Revenue per Employee",
      "description": "Revenue divided by employee headcount",
      "formula": "revenue / employees",
      "currentValue": 125000,
      "targetValue": 175000,
      "targetDirection": "increase",
      "targetPeriod": "monthly",
      "progress": 71.4,
      "onTrack": true,
      "sources": [
        { "id": "src_1", "alias": "revenue", "dataField": { "name": "Total Revenue" } },
        { "id": "src_2", "alias": "employees", "dataField": { "name": "Employee Count" } }
      ],
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/kpis
```json
{
  "name": "Revenue per Employee",
  "description": "Revenue divided by employee headcount",
  "formula": "revenue / employees",
  "targetValue": 175000,
  "targetDirection": "increase",
  "targetPeriod": "monthly",
  "sources": [
    { "dataFieldId": "df_revenue", "alias": "revenue" },
    { "dataFieldId": "df_headcount", "alias": "employees" }
  ]
}
```

## Error Handling

| Scenario | Response |
|----------|----------|
| Missing data source | `{ error: "Missing value for: revenue" }` |
| Invalid formula | `{ error: "Formula syntax error: unexpected token" }` |
| Division by zero | `{ currentValue: null, error: "Division by zero" }` |
| No data synced yet | `{ currentValue: null, warning: "No data available" }` |

## Technology Choices

### Formula Evaluation: mathjs
- **Why mathjs**: Safe, no eval(), supports custom functions
- **Alternative considered**: expr-eval (smaller, but less features)

```typescript
import { evaluate } from 'mathjs'

const formula = 'revenue / employees'
const scope = { revenue: 1250000, employees: 10 }
const result = evaluate(formula, scope) // 125000
```

### Data Storage: JSON Column
- **Why JSON**: Flexibility for any field type (number, string, object, array)
- **Trade-off**: Less query optimization vs structured columns
