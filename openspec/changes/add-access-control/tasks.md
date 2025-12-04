# Tasks: Add Access Control for Dashboards and KPIs

## Phase 1: Database Schema

- [x] **1.1 Update Prisma schema**
  - Add `AccessPermission` enum (VIEW, EDIT)
  - Add `DashboardAccess` model with dashboardId, userId, permission, grantedAt
  - Add `KpiAccess` model with kpiId, userId, permission, grantedAt
  - Add `ownerId` field to `Kpi` model (nullable initially)
  - Add relations to User model

- [x] **1.2 Create and run migration**
  - Generate migration with `prisma migrate dev`
  - Name: `add_access_control`

- [x] **1.3 Data migration**
  - Set existing KPIs' ownerId to dashboard owner or first admin
  - Update schema to make ownerId required (if desired)

## Phase 2: Permission Service

- [x] **2.1 Create permission service**
  - File: `backend/src/services/permission.service.ts`
  - Implement `canAccessDashboard(ctx, dashboardId, permission)`
  - Implement `canAccessKpi(ctx, kpiId, permission)`
  - Implement `getAccessibleDashboardIds(ctx)`
  - Implement `getAccessibleKpiIds(ctx)`

- [x] **2.2 Add permission middleware**
  - Create reusable middleware for dashboard permission checks
  - Create reusable middleware for KPI permission checks

## Phase 3: Backend API Updates

- [x] **3.1 Update dashboard endpoints**
  - `GET /api/dashboards`: Filter by accessible dashboards
  - `GET /api/dashboards/:id`: Check view permission
  - `PUT /api/dashboards/:id`: Check edit permission
  - `DELETE /api/dashboards/:id`: Check owner/admin
  - `POST /api/dashboards`: Set ownerId to current user

- [x] **3.2 Update KPI endpoints**
  - `GET /api/kpis`: Filter by accessible KPIs
  - `GET /api/kpis/:id`: Check view permission
  - `PUT /api/kpis/:id`: Check edit permission
  - `DELETE /api/kpis/:id`: Check owner/admin
  - `POST /api/kpis`: Set ownerId to current user

- [x] **3.3 Add dashboard access endpoints**
  - `GET /api/dashboards/:id/access`: List access entries
  - `POST /api/dashboards/:id/access`: Grant access
  - `PATCH /api/dashboards/:id/access/:userId`: Update permission
  - `DELETE /api/dashboards/:id/access/:userId`: Revoke access

- [x] **3.4 Add KPI access endpoints**
  - `GET /api/kpis/:id/access`: List access entries
  - `POST /api/kpis/:id/access`: Grant access
  - `PATCH /api/kpis/:id/access/:userId`: Update permission
  - `DELETE /api/kpis/:id/access/:userId`: Revoke access

## Phase 4: Frontend Types & API

- [x] **4.1 Update TypeScript types**
  - Add `AccessPermission` type
  - Add `DashboardAccess` and `KpiAccess` types
  - Add `ownerId` to Dashboard and Kpi types
  - Add access-related API response types

- [x] **4.2 Add API methods**
  - `dashboardsApi.getAccess(id)`
  - `dashboardsApi.grantAccess(id, userId, permission)`
  - `dashboardsApi.updateAccess(id, userId, permission)`
  - `dashboardsApi.revokeAccess(id, userId)`
  - Same for KPIs

## Phase 5: Frontend UI

- [x] **5.1 Create AccessManagementDialog component**
  - Show owner (read-only)
  - List users with access
  - Permission dropdown per user
  - Add user form with email + permission
  - Remove access button

- [x] **5.2 Create UserSearchInput component**
  - Search users by email/name
  - Show matching users in dropdown
  - Select to add
  - (Integrated into AccessManagementDialog)

- [x] **5.3 Update Dashboard UI**
  - Add "Access" button to dashboard header (owner only)
  - Show access indicator (owned/shared with you)
  - Hide edit/delete buttons for non-owners/non-editors

- [x] **5.4 Update KPI UI**
  - Add access management button to KPI card (owner only)
  - Show access indicator (Shared badge)
  - Hide edit/delete/recalculate buttons for non-owners/non-editors

## Phase 6: Testing & Validation

- [x] **6.1 Backend tests**
  - Permission service unit tests (25 tests)
  - All 138 backend tests passing
  - Verify viewers cannot edit
  - Verify owners see only their resources

- [x] **6.2 Frontend tests**
  - Access dialog component (no TypeScript errors)
  - UI hides actions based on permissions

- [x] **6.3 Manual testing**
  - Create resources as different users
  - Verify access control works correctly
  - Test admin override

## Completion Checklist

- [x] All tasks marked complete
- [x] Tests pass (138 tests)
- [x] No TypeScript errors
- [x] Manual testing complete
- [x] Ready for review
