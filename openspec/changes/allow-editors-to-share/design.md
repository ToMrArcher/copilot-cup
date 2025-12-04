# Design: Allow Editors to Share Dashboards and KPIs

## Technical Design

### Permission Model Update

Current permission hierarchy in `permission.service.ts`:
```typescript
export type RequiredPermission = 'VIEW' | 'EDIT' | 'DELETE' | 'MANAGE'
```

The `MANAGE` permission is currently reserved for owners only. We'll add a new `SHARE` permission level that is less privileged than `MANAGE` but allows granting access.

```typescript
export type RequiredPermission = 'VIEW' | 'EDIT' | 'DELETE' | 'MANAGE' | 'SHARE'
```

### Permission Matrix

| Action | VIEW access | EDIT access | Owner | Admin |
|--------|-------------|-------------|-------|-------|
| View resource | ✓ | ✓ | ✓ | ✓ |
| Edit resource | ✗ | ✓ | ✓ | ✓ |
| Delete resource | ✗ | ✗ | ✓ | ✓ |
| Share (grant access) | ✗ | ✓ | ✓ | ✓ |
| Manage (full control) | ✗ | ✗ | ✓ | ✓ |

### Code Changes

#### 1. permission.service.ts

Update `canAccessDashboard()`:
```typescript
case 'SHARE':
  // Editors can share, owners and admins handled above
  return access.permission === 'EDIT'
```

Same pattern for `canAccessKpi()`.

#### 2. dashboard.router.ts - Access Endpoints

Current check (owner only):
```typescript
if (dashboard.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
  res.status(403).json({ error: 'You do not have permission to manage access' })
  return
}
```

New check (using permission service):
```typescript
const canShare = await canAccessDashboard(
  { userId: req.user!.id, userRole: req.user!.role },
  dashboardId,
  'SHARE'
)
if (!canShare) {
  res.status(403).json({ error: 'You do not have permission to share this dashboard' })
  return
}
```

#### 3. Restrictions for Non-Owners

When an editor revokes access, enforce these rules:
- Cannot remove access from the owner (owner has implicit full access)
- Cannot remove access from admins (admins have implicit full access)

```typescript
// Check if trying to modify owner or admin access
const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
if (targetUser?.role === 'ADMIN') {
  res.status(403).json({ error: 'Cannot modify admin access' })
  return
}

if (dashboard.ownerId === targetUserId) {
  res.status(403).json({ error: 'Cannot modify owner access' })
  return
}
```

#### 4. Frontend: canManage Flag

Update the logic for `canManage` in list endpoints:

Current:
```typescript
canManage: isOwner || isAdmin
```

New:
```typescript
canManage: isOwner || isAdmin  // Full management (delete, transfer ownership)
canShare: isOwner || isAdmin || hasEditAccess  // Can grant/revoke access
```

Or simplify by making `canManage` include editors for the sharing dialog:
```typescript
canManage: isOwner || isAdmin || (access?.permission === 'EDIT')
```

### API Response Changes

No changes to API structure. The `canManage` or `canShare` flag determines UI visibility.

### Security Considerations

1. **Rate limiting**: Consider rate limiting access grants to prevent abuse
2. **Audit trail**: `createdById` on access records tracks who granted access
3. **Cascading permissions**: If an editor's access is revoked, the access they granted remains (owner can clean up)

### Testing Strategy

1. **Unit tests**: Test `canAccessDashboard/Kpi` with SHARE permission
2. **Integration tests**: 
   - Editor grants VIEW access → succeeds
   - Editor grants EDIT access → succeeds
   - Editor revokes access they granted → succeeds
   - Editor tries to remove owner → fails
   - Viewer tries to share → fails
3. **E2E tests**: Full flow from UI for editor sharing
