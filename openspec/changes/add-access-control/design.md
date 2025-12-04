# Design: Access Control for Dashboards and KPIs

## Database Schema

### New Models

```prisma
// Access control for dashboards
model DashboardAccess {
  id          String           @id @default(cuid())
  dashboardId String
  dashboard   Dashboard        @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
  userId      String
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission  AccessPermission @default(VIEW)
  grantedAt   DateTime         @default(now())
  grantedById String?

  @@unique([dashboardId, userId])
  @@index([userId])
}

// Access control for KPIs
model KpiAccess {
  id          String           @id @default(cuid())
  kpiId       String
  kpi         Kpi              @relation(fields: [kpiId], references: [id], onDelete: Cascade)
  userId      String
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission  AccessPermission @default(VIEW)
  grantedAt   DateTime         @default(now())
  grantedById String?

  @@unique([kpiId, userId])
  @@index([userId])
}

enum AccessPermission {
  VIEW    // Read-only access
  EDIT    // Can modify the resource
}
```

### Model Updates

```prisma
model Kpi {
  // ... existing fields ...
  ownerId     String?   // NEW: Owner of this KPI
  owner       User?     @relation(fields: [ownerId], references: [id])
  accessList  KpiAccess[]
}

model Dashboard {
  // ... existing fields ...
  accessList  DashboardAccess[]
}

model User {
  // ... existing fields ...
  ownedKpis         Kpi[]
  dashboardAccess   DashboardAccess[]
  kpiAccess         KpiAccess[]
}
```

## Permission Service

Create a centralized permission service to handle all access checks:

```typescript
// backend/src/services/permission.service.ts

export interface PermissionContext {
  userId: string
  userRole: Role
}

export async function canAccessDashboard(
  ctx: PermissionContext,
  dashboardId: string,
  requiredPermission: 'VIEW' | 'EDIT' | 'DELETE' | 'MANAGE'
): Promise<boolean> {
  // Admins can do everything
  if (ctx.userRole === 'ADMIN') return true
  
  const dashboard = await prisma.dashboard.findUnique({
    where: { id: dashboardId },
    include: { accessList: { where: { userId: ctx.userId } } }
  })
  
  if (!dashboard) return false
  
  // Owner has full access
  if (dashboard.ownerId === ctx.userId) return true
  
  // Check granted permissions
  const access = dashboard.accessList[0]
  if (!access) return false
  
  switch (requiredPermission) {
    case 'VIEW':
      return true // Any access grants view
    case 'EDIT':
      return access.permission === 'EDIT'
    case 'DELETE':
    case 'MANAGE':
      return false // Only owners can delete/manage
  }
}

export async function canAccessKpi(
  ctx: PermissionContext,
  kpiId: string,
  requiredPermission: 'VIEW' | 'EDIT' | 'DELETE' | 'MANAGE'
): Promise<boolean> {
  // Similar logic as dashboard
}

export async function getAccessibleDashboardIds(
  ctx: PermissionContext
): Promise<string[]> {
  // Returns list of dashboard IDs user can access
}

export async function getAccessibleKpiIds(
  ctx: PermissionContext
): Promise<string[]> {
  // Returns list of KPI IDs user can access
}
```

## API Endpoints

### Dashboard Access Management

```
GET    /api/dashboards/:id/access       - List users with access
POST   /api/dashboards/:id/access       - Grant access to user
PATCH  /api/dashboards/:id/access/:userId - Update permission level
DELETE /api/dashboards/:id/access/:userId - Revoke access
```

### KPI Access Management

```
GET    /api/kpis/:id/access             - List users with access
POST   /api/kpis/:id/access             - Grant access to user
PATCH  /api/kpis/:id/access/:userId     - Update permission level
DELETE /api/kpis/:id/access/:userId     - Revoke access
```

### Request/Response Examples

**Grant Access**
```json
POST /api/dashboards/abc123/access
{
  "userId": "user456",
  "permission": "VIEW"
}
```

**List Access**
```json
GET /api/dashboards/abc123/access
{
  "owner": {
    "id": "owner123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "accessList": [
    {
      "userId": "user456",
      "userName": "Jane Smith",
      "userEmail": "jane@example.com",
      "permission": "VIEW",
      "grantedAt": "2025-12-04T10:00:00Z"
    }
  ]
}
```

## Frontend Components

### Access Management Dialog

```tsx
// features/dashboard/AccessManagementDialog.tsx
interface AccessManagementDialogProps {
  resourceType: 'dashboard' | 'kpi'
  resourceId: string
  resourceName: string
  isOpen: boolean
  onClose: () => void
}

// Shows:
// - Current owner (read-only)
// - List of users with access (permission dropdown)
// - Add user form (email input + permission select)
// - Remove access button per user
```

### Integration Points

1. **Dashboard header**: Add "Share" button (visible to owners only)
2. **KPI card/list**: Add share icon (visible to owners only)
3. **Dashboard list**: Show access indicator (owned/shared)
4. **KPI list**: Show access indicator (owned/shared)

## Query Modifications

### Dashboard List Query

```typescript
// Before: Returns all dashboards
const dashboards = await prisma.dashboard.findMany()

// After: Returns only accessible dashboards
const dashboards = await prisma.dashboard.findMany({
  where: {
    OR: [
      { ownerId: userId },
      { accessList: { some: { userId } } },
      // Admin sees all (handled in code)
    ]
  }
})
```

### KPI List Query

```typescript
// Similar pattern for KPIs
const kpis = await prisma.kpi.findMany({
  where: {
    OR: [
      { ownerId: userId },
      { accessList: { some: { userId } } },
    ]
  }
})
```

## Migration Strategy

### Step 1: Schema Migration
1. Add `ownerId` to Kpi model (nullable initially)
2. Add DashboardAccess and KpiAccess models
3. Add AccessPermission enum

### Step 2: Data Migration
```sql
-- Set KPI owners to the first admin user
UPDATE "Kpi" SET "ownerId" = (
  SELECT id FROM "User" WHERE role = 'ADMIN' ORDER BY "createdAt" LIMIT 1
) WHERE "ownerId" IS NULL;

-- Alternatively, set to dashboard owner if KPI is on a dashboard
UPDATE "Kpi" k SET "ownerId" = (
  SELECT d."ownerId" FROM "Widget" w
  JOIN "Dashboard" d ON w."dashboardId" = d.id
  WHERE w."kpiId" = k.id
  LIMIT 1
) WHERE "ownerId" IS NULL;
```

### Step 3: Make ownerId Required
After migration, update schema to make `ownerId` required on Kpi.

## Security Considerations

1. **Always check permissions server-side** - Never trust frontend
2. **Use middleware for common checks** - Extract userId and role from auth
3. **Fail closed** - Default to deny if permission check fails
4. **Validate user exists** - When granting access, verify userId is valid
5. **Prevent self-removal** - Owners cannot remove their own access
