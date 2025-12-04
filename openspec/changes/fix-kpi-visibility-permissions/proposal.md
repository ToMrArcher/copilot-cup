# Proposal: Fix KPI Visibility Permissions

## Change ID
`fix-kpi-visibility-permissions`

## Summary
Fix the KPI listing endpoint so that viewers and editors can only see KPIs they own or have been explicitly granted access to. Currently, all authenticated users can view all KPIs regardless of access permissions.

## Motivation
The current implementation of `GET /api/kpis` has a bug where:
1. When `ctx` is null (shouldn't happen for authenticated users but is a fallback), the filter becomes `{}` which returns all KPIs
2. More importantly, the filter IS correctly applied but the behavior was implemented assuming viewers should see KPIs - which contradicts the user's expectation

The access control model established in `add-access-control` should enforce:
- **Admins**: Can see all KPIs (system-wide visibility)
- **Editors/Viewers**: Can only see KPIs they **own** OR have been **explicitly granted access** to via `KpiAccess`

This is a bug fix to ensure the existing `getAccessibleKpisFilter` is applied correctly and consistently.

## Requirements Addressed
- Security: Users only see KPIs they have permission to access
- Privacy: KPIs created by other users are not visible unless explicitly shared
- Consistency: Align KPI visibility with the same access model used for dashboards

## Scope

### In Scope
1. **Backend fix**: Ensure KPI list endpoint requires authentication and applies access filter
2. **Backend fix**: Ensure single KPI endpoint (`GET /api/kpis/:id`) checks access
3. **Frontend handling**: Handle empty KPI list gracefully for new users
4. **Tests**: Add/update tests to verify access control behavior

### Out of Scope
- Changes to the access granting mechanism (already works via `KpiAccess`)
- Dashboard visibility (already working correctly)
- Admin access management UI (already exists)

## Design Overview

### Current Behavior (Bug)
```typescript
const ctx = getPermissionContext(req)
const accessFilter = ctx ? getAccessibleKpisFilter(ctx) : {}
// If ctx exists, filter is applied correctly
// But if no ctx, all KPIs are returned (security issue)
```

### Fixed Behavior
1. **Require authentication** for KPI listing (or return empty list for unauthenticated)
2. **Always apply access filter** for non-admin users
3. **Deny access** to individual KPIs if user doesn't have permission

### Access Logic
| Role | Owns KPI | Has KpiAccess | Can View? |
|------|----------|---------------|-----------|
| ADMIN | - | - | ✅ Yes |
| EDITOR | Yes | - | ✅ Yes |
| EDITOR | No | Yes | ✅ Yes |
| EDITOR | No | No | ❌ No |
| VIEWER | Yes | - | ✅ Yes |
| VIEWER | No | Yes | ✅ Yes |
| VIEWER | No | No | ❌ No |

## Impact Analysis

### Breaking Changes
- Users who could previously see all KPIs will now only see their own + shared ones
- New viewers will see an empty KPI list until KPIs are shared with them

### User Experience
- Add helpful empty state message: "No KPIs available. Ask an admin or KPI owner to share KPIs with you."
- Admins retain full visibility to manage access

## Testing Strategy
1. Create viewer user with no KPI access → should see 0 KPIs
2. Create KPI as editor → editor should see their own KPI
3. Share KPI with viewer → viewer should now see 1 KPI
4. Admin should see all KPIs regardless

## Estimated Effort
- Backend: ~30 minutes (small fix)
- Frontend: ~15 minutes (empty state)
- Tests: ~30 minutes
- Total: ~1.5 hours
