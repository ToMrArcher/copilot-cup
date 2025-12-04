# Design: Fix KPI Visibility Permissions

## Technical Changes

### 1. KPI Router Changes (`backend/src/modules/kpi/kpi.router.ts`)

#### GET /api/kpis (List KPIs)

**Current code:**
```typescript
kpiRouter.get('/', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    const accessFilter = ctx ? getAccessibleKpisFilter(ctx) : {}
    // ...
```

**Fixed code:**
```typescript
kpiRouter.get('/', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    
    // If not authenticated, return empty list (KPIs require auth to view)
    if (!ctx) {
      return res.json({ kpis: [] })
    }
    
    const accessFilter = getAccessibleKpisFilter(ctx)
    // ...
```

#### GET /api/kpis/:id (Get Single KPI)

Add permission check before returning KPI data:
```typescript
kpiRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    const { id } = req.params

    // Check if user has access to this KPI
    if (ctx && ctx.userRole !== 'ADMIN') {
      const hasAccess = await canAccessKpi(ctx, id, 'VIEW')
      if (!hasAccess) {
        return res.status(404).json({ error: 'KPI not found' })
      }
    }
    // ... rest of handler
```

#### GET /api/kpis/:id/history (Get KPI History)

Same pattern - check VIEW permission before returning history.

### 2. Permission Service (`backend/src/services/permission.service.ts`)

The `getAccessibleKpisFilter` function is already correctly implemented:
```typescript
export function getAccessibleKpisFilter(ctx: PermissionContext) {
  if (ctx.userRole === 'ADMIN') {
    return {} // No filter for admins
  }

  return {
    OR: [
      { ownerId: ctx.userId },
      { accessList: { some: { userId: ctx.userId } } },
    ],
  }
}
```

No changes needed here.

### 3. Frontend Empty State

Add an empty state component for the KPIs page when no KPIs are accessible:

```tsx
// In KPIsPage or KPI list component
{kpis.length === 0 && (
  <div className="text-center py-12">
    <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
    <h3 className="mt-4 text-lg font-semibold">No KPIs Available</h3>
    <p className="mt-2 text-muted-foreground">
      You don't have access to any KPIs yet.
      {user?.role !== 'ADMIN' && (
        <> Ask an admin or KPI owner to share KPIs with you.</>
      )}
    </p>
  </div>
)}
```

## Security Considerations

1. **404 vs 403**: Return 404 "KPI not found" instead of 403 "Access denied" to prevent information leakage about what KPIs exist
2. **Share links**: Public share links should still work without authentication (handled by separate endpoint)
3. **Widgets on dashboards**: KPIs in dashboard widgets should be visible if user has dashboard access (this is existing behavior, not changed)
