# Tasks: Allow Editors to Share Dashboards and KPIs

## Implementation Checklist

### Phase 1: Permission Service Updates
- [x] Add `SHARE` as a new `RequiredPermission` level in `permission.service.ts`
- [x] Update `canAccessDashboard()` to return `true` for `SHARE` when user has EDIT access
- [x] Update `canAccessKpi()` to return `true` for `SHARE` when user has EDIT access
- [x] Add unit tests for new SHARE permission level

### Phase 2: Backend Access Management Updates
- [x] Update `POST /api/dashboards/:id/access` to allow editors (check SHARE permission)
- [x] Update `PATCH /api/dashboards/:id/access/:userId` to allow editors
- [x] Update `DELETE /api/dashboards/:id/access/:userId` with restrictions:
  - Editors cannot remove owner's implicit access
  - Editors cannot remove admin's implicit access
- [x] Apply same changes to KPI access endpoints
- [x] Update sharing router (`/api/sharing`) to allow editors to create share links

### Phase 3: Frontend Updates
- [x] Add `canShare` flag to dashboard/KPI list and detail endpoints
- [x] Update Dashboard and KPI types to include `canShare`
- [x] Update `AccessManagementDialog` button visibility to use `canShare`
- [x] Update KPI card access button to use `canShare`

### Phase 4: Testing
- [x] Add unit tests for SHARE permission (5 new tests added)
- [x] All 143 backend tests passing

### Phase 5: Documentation
- [ ] Update API documentation if exists
- [ ] Update any user-facing documentation about sharing

## Dependencies
- Existing access control implementation (add-access-control)
- Permission service (`backend/src/services/permission.service.ts`)
- Access endpoints in dashboard and KPI routers

## Notes
- This builds on the existing access control system
- No database changes required
- Changes are purely in permission logic and API authorization
