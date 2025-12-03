# Proposal: Add KPIs and Transformations

## Problem Statement
Data is being synced from integrations, but there's no way to use it. Users need to create KPIs that pull data from their connected sources, apply formulas, and track progress toward goals.

## Requirements (from Funksjonelle krav #2)
1. **Field Selection**: When creating a KPI, users can choose which fields from which data sources are included
2. **Formula Engine**: Users can transform or combine data using an easy-to-understand formula tool
3. **Target Tracking**: Users can set target value, period, and direction (increase/decrease)
4. **Multi-Period Goals**: Support monthly/quarterly/yearly targets with easy switching

## Proposed Solution

### Architecture Overview
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Integration   │────▶│   DataValue     │────▶│   KPI Engine    │
│   (sync data)   │     │   (storage)     │     │   (calculate)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   KPI + Target  │
                                                │   (tracking)    │
                                                └─────────────────┘
```

### Key Components

1. **DataValue Model** (NEW)
   - Stores actual synced values from integrations
   - Links to DataField (metadata) and Integration
   - Supports time-series storage for historical tracking

2. **KPI CRUD API**
   - Full REST API for KPI management
   - Uses existing Prisma models (Kpi, KpiSource)

3. **Formula Engine**
   - Parse and evaluate expressions (e.g., `revenue / units`)
   - Variable binding from KpiSource aliases
   - Safe evaluation (no arbitrary code execution)

4. **KPI Calculator**
   - Fetch latest DataValues for each source
   - Substitute variables in formula
   - Return calculated currentValue

5. **Target System**
   - Set goals with value, period, direction
   - Calculate progress percentage
   - Support period comparison

### Database Changes
```prisma
// NEW: Store synced values
model DataValue {
  id          String    @id @default(cuid())
  dataFieldId String
  dataField   DataField @relation(fields: [dataFieldId], references: [id], onDelete: Cascade)
  value       Json      // Actual value (supports any type)
  syncedAt    DateTime  @default(now())
  
  @@index([dataFieldId, syncedAt])
}

// Add relation to DataField
model DataField {
  // ... existing fields
  values DataValue[]
}
```

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kpis` | List all KPIs with calculated values |
| GET | `/api/kpis/:id` | Get KPI with current value and targets |
| POST | `/api/kpis` | Create KPI with formula and sources |
| PUT | `/api/kpis/:id` | Update KPI |
| DELETE | `/api/kpis/:id` | Delete KPI |
| POST | `/api/kpis/:id/recalculate` | Force recalculation |

### UI Components
- **KpiList** - Grid view of all KPIs with current values
- **KpiCard** - Visual card showing value, target, progress
- **KpiWizard** - Step-by-step KPI creation:
  1. Name & Description
  2. Select Data Sources (from mapped DataFields)
  3. Build Formula (with variable picker)
  4. Set Target (value, period, direction)
- **KpiEditor** - Edit existing KPIs

## Success Criteria
- [ ] Synced data is stored in DataValue table
- [ ] KPI CRUD operations work end-to-end
- [ ] Formula engine evaluates expressions correctly
- [ ] KPIs calculate current value from sources
- [ ] Targets show progress with direction indicator
- [ ] Frontend wizard allows no-code KPI creation
- [ ] All tests pass

## Out of Scope (for now)
- Multi-period goal switching (addressed in dashboard proposal)
- Historical trend charts (dashboard feature)
- Period comparisons (advanced feature)
- Scheduled recalculation (dataflow proposal)

## Dependencies
- Completed: Integration system with DataField mapping
- Required: Docker environment running
