# Proposal: Add KPI Editing Capability

## Change ID
`add-kpi-editing`

## Summary
Add the ability to edit existing KPIs. Currently, users can only create and delete KPIs. This change will allow users to modify KPI name, description, formula, data sources, and target values after creation.

## Motivation
Users need to be able to:
- Fix typos or rename KPIs
- Update formulas as business logic changes
- Add or remove data sources
- Adjust target values over time
- Update descriptions to reflect current understanding

Without edit capability, users must delete and recreate KPIs to make any changes, losing historical data and dashboard widget references.

## Requirements Addressed
- Usability: Users can modify KPIs without deletion
- Data Integrity: Dashboard widgets referencing the KPI continue to work
- Flexibility: Business metrics evolve and KPIs should too

## Scope

### In Scope
1. **Backend API**: Add `PATCH /api/kpis/:id` endpoint for updating KPIs
2. **Frontend KpiWizard**: Support edit mode (load existing data, update vs create)
3. **KpiCard**: Add Edit button alongside existing actions
4. **KPI Page**: Handle edit modal/wizard state
5. **Permission checks**: Only owners, admins, or users with EDIT access can modify

### Out of Scope
- Bulk editing of multiple KPIs
- Version history / audit trail of KPI changes
- KPI templates or cloning

## Design Overview

### Backend Changes
- Add `PATCH /api/kpis/:id` endpoint
- Accept partial updates: name, description, formula, targetValue, targetDirection
- Support updating sources (add/remove data field references)
- Check EDIT permission before allowing changes

### Frontend Changes
- **KpiWizard**: Add `kpiId` prop to enable edit mode
  - Load existing KPI data on mount when `kpiId` is provided
  - Pre-populate all form fields
  - Change "Create" to "Save Changes" button
  - Use `updateKpi` mutation instead of `createKpi`
- **KpiCard**: Add Edit button (pencil icon) visible when `canEdit` is true
- **KpiPage/KpiList**: Track `editingKpiId` state to open wizard in edit mode

### API Request/Response
```typescript
// PATCH /api/kpis/:id
interface UpdateKpiRequest {
  name?: string
  description?: string
  formula?: string
  targetValue?: number | null
  targetDirection?: 'increase' | 'decrease' | null
  sources?: Array<{ dataFieldId: string; alias: string }>
}
```

## Impact Analysis

### Breaking Changes
None. This is an additive feature.

### Migration Strategy
No migration required. Existing KPIs continue to work.

### Dependencies
- Existing KPI CRUD endpoints
- Permission service (EDIT check)
- KpiWizard component

## Success Criteria
- [ ] Users with EDIT access can click "Edit" on a KPI
- [ ] KpiWizard opens with all existing data pre-filled
- [ ] Users can modify any field and save changes
- [ ] Changes persist and are reflected in dashboards
- [ ] Users without EDIT access cannot see the Edit button
- [ ] Validation errors are shown appropriately

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Breaking dashboard widgets | Update KPI in-place, keep same ID |
| Formula validation on edit | Reuse existing validation logic |
| Source changes breaking formula | Validate formula against new sources |

## Approval
- [ ] Proposal reviewed
- [ ] Design approved
- [ ] Ready for implementation
