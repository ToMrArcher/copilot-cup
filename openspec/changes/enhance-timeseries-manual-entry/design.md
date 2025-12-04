# Design: Enhanced Time Series and Manual Data Entry

## Context
Users need to:
1. Debug real-time data changes (minute-by-minute view)
2. Analyze long-term trends (yearly view)
3. Enter historical survey data with actual measurement dates
4. Bulk import historical data from spreadsheets

## Goals
- Flexible time range selection from minutes to years
- Custom date entry for manual data
- CSV import for bulk historical data
- Backward compatible with existing data

## Non-Goals
- Real-time streaming/websocket updates (future enhancement)
- Complex date formulas or relative dates
- Excel file support (CSV only for simplicity)

## Decisions

### Decision: Time Range Options
**New options:**
```typescript
const timeRanges = [
  { value: '1h', label: 'Last hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },      // existing
  { value: '30d', label: 'Last 30 days' },    // existing
  { value: '90d', label: 'Last 90 days' },    // existing
  { value: '6m', label: 'Last 6 months' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range' },
]
```

### Decision: Aggregation Intervals
```typescript
function getDefaultInterval(period: string): AggregationInterval {
  switch (period) {
    case '1h': return 'minute'      // NEW
    case '6h': return 'minute'      // NEW
    case '24h': return 'hourly'
    case '7d': return 'hourly'
    case '30d': return 'daily'
    case '90d': return 'daily'
    case '6m': return 'weekly'
    case '1y': return 'monthly'
    case 'all': return 'monthly'
    default: return 'daily'
  }
}
```

### Decision: Manual Entry Date Field
Add optional `recordedAt` to the submission:
```typescript
// Request body
{
  values: { fieldId: value, ... },
  recordedAt?: string  // ISO 8601 date, optional
}

// If provided, use it; otherwise use new Date()
const syncedAt = recordedAt ? new Date(recordedAt) : new Date()
```

### Decision: CSV Import Format
Expected CSV format:
```csv
date,pmf_very_disappointed_pct,survey_respondents
2024-06-15,35,150
2024-09-20,38,180
2024-12-01,42,200
```

API:
```typescript
POST /integrations/:id/import
Content-Type: multipart/form-data

{
  file: <csv-file>,
  dateColumn: 'date',           // Which column has the date
  dateFormat: 'YYYY-MM-DD',     // Optional, for parsing
  fieldMappings: {              // Column -> Field ID mapping
    'pmf_very_disappointed_pct': 'field-uuid-1',
    'survey_respondents': 'field-uuid-2'
  }
}
```

## UI Mockups

### Time Range Selector (Expanded)
```
┌─────────────────────────────────────────┐
│ [1h] [6h] [24h] [7d] [30d] [90d] [1y]  │
│                                    [⚙️]  │  <- Custom range
└─────────────────────────────────────────┘
```

### Manual Entry with Date
```
┌─────────────────────────────────────────┐
│ Enter Data                          [×] │
├─────────────────────────────────────────┤
│ Date recorded: [📅 Dec 4, 2025    ] [▼] │  <- NEW
│                                         │
│ pmf_very_disappointed_pct               │
│ [84                                   ] │
│                                         │
│ survey_respondents                      │
│ [200                                  ] │
│                                         │
│ [Upload CSV] [Cancel] [Save]            │  <- CSV button NEW
└─────────────────────────────────────────┘
```

### CSV Import Modal
```
┌─────────────────────────────────────────┐
│ Import CSV                          [×] │
├─────────────────────────────────────────┤
│ [Choose file...] survey_data.csv        │
│                                         │
│ Preview (first 3 rows):                 │
│ ┌────────────┬─────────┬─────────────┐  │
│ │ date       │ pmf_pct │ respondents │  │
│ ├────────────┼─────────┼─────────────┤  │
│ │ 2024-06-15 │ 35      │ 150         │  │
│ │ 2024-09-20 │ 38      │ 180         │  │
│ └────────────┴─────────┴─────────────┘  │
│                                         │
│ Date column: [date           ▼]         │
│                                         │
│ Map columns to fields:                  │
│ pmf_pct → [pmf_very_disappointed_pct ▼] │
│ respondents → [survey_respondents    ▼] │
│                                         │
│ [Cancel] [Import 3 rows]                │
└─────────────────────────────────────────┘
```

## Migration
No migration needed - existing data continues to work. New features are additive.
