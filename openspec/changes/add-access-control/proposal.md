# Proposal: Add Access Control for Dashboards and KPIs

## Change ID
`add-access-control`

## Summary
Implement fine-grained access control for dashboards and KPIs, allowing owners to share specific resources with selected users at different permission levels (view/edit). Ensure owners only see their own resources and viewers cannot edit anything.

## Motivation
Currently, all authenticated users can see all dashboards and KPIs in the system. The project requirements specify:
- "Når jeg administrerer dashboards, vil jeg styre tilgangen per bruker eller team, slik at ingen ser mer enn de skal"
- Role-based access control (RBAC) with Admin/Editor/Viewer roles

This change implements resource-level access control to complement the existing role system.

## Requirements Addressed
- Security: Per-user/team access control for dashboards
- Roles: Viewers have read-only access, Editors can create/edit, Admins have full access
- Ownership: Users only see dashboards/KPIs they own or have been granted access to

## Scope

### In Scope
1. **Database schema changes**: Add DashboardAccess and KpiAccess junction tables
2. **Backend API changes**: Filter queries by user access, add access management endpoints
3. **Frontend UI**: Add sharing/access management dialogs for dashboards and KPIs
4. **Permission enforcement**: Ensure viewers cannot edit, owners see only their resources

### Out of Scope
- Team/group-based access (future enhancement)
- OAuth/SSO integration
- Audit logging of access changes

## Design Overview

### Access Model
- **Owner**: Full control (edit, delete, manage access) - automatically assigned on creation
- **Editor**: Can edit resource but not delete or manage access
- **Viewer**: Read-only access

### Permission Hierarchy
1. **Admin users**: Can see and manage all resources (system-wide)
2. **Resource owner**: Full control over their own resources
3. **Granted access**: Users with explicit DashboardAccess/KpiAccess entries
4. **No access**: Resource not visible

### API Changes
- All dashboard/KPI list endpoints filter by user access
- All mutation endpoints check write permissions
- New endpoints for managing access grants

## Impact Analysis

### Breaking Changes
- Dashboard/KPI list endpoints will return fewer results (only accessible resources)
- Existing dashboards need migration to set ownerId correctly

### Migration Strategy
- Add `ownerId` to KPI model (mirrors Dashboard pattern)
- Set existing KPIs' ownerId to first admin user
- Existing dashboards already have ownerId

### Dependencies
- Existing auth middleware (userId in request)
- Existing Role enum (ADMIN, EDITOR, VIEWER)

## Success Criteria
- [ ] Users only see dashboards they own or have access to
- [ ] Users only see KPIs they own or have access to
- [ ] Viewers cannot edit any resources
- [ ] Editors can create and edit resources they own or have edit access to
- [ ] Admins can see and manage all resources
- [ ] Dashboard/KPI owners can grant access to other users
- [ ] Access can be revoked at any time

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Existing data becomes inaccessible | Migration sets sensible defaults |
| Performance impact on list queries | Add indexes on access tables |
| Complex permission logic | Centralize in permission service |

## Approval
- [ ] Proposal reviewed
- [ ] Design approved
- [ ] Ready for implementation
