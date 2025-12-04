# Tasks: Fix KPI Visibility Permissions

## Phase 1: Backend Fixes

- [x] **1.1** Update `GET /api/kpis` to require authentication or return empty list
  - Modify the fallback when `ctx` is null to return empty array instead of all KPIs
  - Ensure `getAccessibleKpisFilter` is always applied for authenticated users

- [x] **1.2** Update `GET /api/kpis/:id` to check access permissions
  - Verify user has VIEW permission before returning KPI details
  - Return 404 Not Found if user doesn't have access (prevents info leakage)

- [x] **1.3** Review and update other KPI endpoints for consistency
  - `GET /api/kpis/:id/history` - check VIEW permission
  - Ensure all read operations respect access control

## Phase 2: Frontend Improvements

- [x] **2.1** Add empty state for KPIs list when user has no accessible KPIs
  - Display helpful message explaining why no KPIs are visible
  - Suggest contacting admin or KPI owner for access

- [x] **2.2** Handle permissions in UI
  - Hide "Create KPI" button for viewers
  - Show role-appropriate empty state message

## Phase 3: Testing

- [x] **3.1** Add backend tests for KPI access control
  - Test admin sees all KPIs (empty filter)
  - Test viewer/editor filter requires ownership OR access grant
  - Created `src/tests/kpi-visibility.test.ts`

- [ ] **3.2** Manual testing
  - Create new viewer account
  - Verify they see no KPIs initially
  - Share a KPI with them
  - Verify they can now see the shared KPI
