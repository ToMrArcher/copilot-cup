# Tasks: Add KPI Editing Capability

## Implementation Checklist

### Phase 1: Backend API
- [x] ~~Add `PATCH /api/kpis/:id` endpoint~~ Already exists as `PUT /api/kpis/:id`
- [x] Check EDIT permission before allowing update (already implemented)
- [x] Support partial updates (name, description, formula, target) (already implemented)
- [x] Support updating sources (delete old, create new) (already implemented)
- [x] Recalculate KPI value after update (already implemented)
- [x] ~~Add `useUpdateKpi` hook~~ Already exists in `useKpis.ts`

### Phase 2: Frontend - KpiWizard Edit Mode
- [x] Add `kpiId` and `onSave` props to `KpiWizard`
- [x] ~~Add `useKpi` hook~~ Already exists in `useKpis.ts`
- [x] Load existing KPI data when `kpiId` is provided
- [x] Pre-populate all wizard fields from loaded data
- [x] Show loading state while fetching KPI
- [x] Change header to "Edit KPI" in edit mode
- [x] Change submit button to "Save Changes" in edit mode
- [x] Use `updateKpi` mutation instead of `createKpi`

### Phase 3: Frontend - KpiCard & KpiList
- [x] Add Edit button to `KpiCard` (visible when `canEdit` is true)
- [x] Add `editingKpiId` state to `KpiList`
- [x] Pass `onEdit` handler to KpiCard
- [x] Pass `kpiId` to KpiWizard to trigger edit mode
- [x] Close wizard and reset editingKpiId after successful edit

### Phase 4: Testing
- [ ] Test editing KPI name and description
- [ ] Test editing formula with validation
- [ ] Test adding/removing data sources
- [ ] Test that widgets continue to work after edit
- [ ] Test permission checks (EDIT required)
- [ ] Test that viewers cannot edit

## Dependencies
- Existing KPI endpoints (`GET /api/kpis/:id`, `POST /api/kpis`)
- Existing `KpiWizard` component
- Permission service (EDIT check)

## Notes
- Similar pattern to IntegrationWizard edit mode implementation
- Keep KPI ID stable to preserve dashboard widget references
- Recalculation should happen automatically after save
