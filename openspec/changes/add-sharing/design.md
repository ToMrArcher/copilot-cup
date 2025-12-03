# Design: External Sharing System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Authenticated User                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Dashboard/KPI Page                                   │   │
│  │  [Share] button → CreateShareModal                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  SharingPage                                          │   │
│  │  - List all share links                               │   │
│  │  - Manage (deactivate, delete, copy)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ POST /api/sharing
                            │ GET /api/sharing
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                     Backend API                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Sharing Router (Protected)                               │ │
│  │  - CRUD for share links                                   │ │
│  │  - Validates ownership                                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           │                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Sharing Service                                          │ │
│  │  - generateToken() - crypto secure                        │ │
│  │  - signToken() - HMAC signature                           │ │
│  │  - verifyToken() - validate signature                     │ │
│  │  - validateAccess() - check expiry/active                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           │                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Public Share Router                                      │ │
│  │  GET /api/share/:token                                    │ │
│  │  - No auth required                                       │ │
│  │  - Rate limited                                           │ │
│  │  - Returns resource data                                  │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                     Database                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  ShareLink                                                │ │
│  │  - token (unique, indexed)                                │ │
│  │  - resourceType, dashboardId/kpiId                        │ │
│  │  - showTarget, expiresAt, active                          │ │
│  │  - accessCount, lastAccessedAt                            │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                   External User (No Auth)                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  /share/:token                                            │ │
│  │  - SharedDashboardView or SharedKpiView                   │ │
│  │  - Read-only, no navigation                               │ │
│  │  - Branded minimal header                                 │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

## Token Generation

### Format
```
<random-32-bytes-base64url>.<hmac-signature>
```

Example: `dGhpcyBpcyBhIHRlc3Q.a1b2c3d4e5f6`

### Generation Process
```typescript
function generateShareToken(): string {
  const random = crypto.randomBytes(32).toString('base64url')
  const signature = crypto
    .createHmac('sha256', SHARE_LINK_SECRET)
    .update(random)
    .digest('base64url')
    .slice(0, 16) // First 16 chars of signature
  return `${random}.${signature}`
}
```

### Verification Process
```typescript
function verifyShareToken(token: string): boolean {
  const [random, signature] = token.split('.')
  if (!random || !signature) return false
  
  const expectedSignature = crypto
    .createHmac('sha256', SHARE_LINK_SECRET)
    .update(random)
    .digest('base64url')
    .slice(0, 16)
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

## API Specifications

### Create Share Link
```typescript
// POST /api/sharing
// Requires: Authentication (EDITOR or ADMIN)

interface CreateShareLinkRequest {
  resourceType: 'dashboard' | 'kpi'
  resourceId: string
  name?: string
  expiresIn?: '1h' | '24h' | '7d' | '30d' | 'never'
  showTarget?: boolean  // default: true
}

interface CreateShareLinkResponse {
  id: string
  token: string
  url: string           // Full shareable URL
  resourceType: string
  resourceId: string
  resourceName: string  // Dashboard/KPI name
  showTarget: boolean
  expiresAt: string | null
  createdAt: string
}
```

### List Share Links
```typescript
// GET /api/sharing
// Query params: ?resourceType=dashboard&resourceId=xxx
// Requires: Authentication

interface ShareLinkListItem {
  id: string
  name: string | null
  resourceType: 'dashboard' | 'kpi'
  resourceId: string
  resourceName: string
  url: string
  showTarget: boolean
  expiresAt: string | null
  active: boolean
  accessCount: number
  lastAccessedAt: string | null
  createdAt: string
}

interface ListShareLinksResponse {
  links: ShareLinkListItem[]
}
```

### Update Share Link
```typescript
// PATCH /api/sharing/:id
// Requires: Authentication (owner only)

interface UpdateShareLinkRequest {
  name?: string
  active?: boolean
  expiresAt?: string | null
  showTarget?: boolean
}

interface UpdateShareLinkResponse {
  id: string
  name: string | null
  active: boolean
  expiresAt: string | null
  showTarget: boolean
  updatedAt: string
}
```

### Access Shared Resource (Public)
```typescript
// GET /api/share/:token
// No authentication required
// Rate limited: 60 requests per minute per IP

interface SharedDashboardResponse {
  type: 'dashboard'
  dashboard: {
    id: string
    name: string
    widgets: Array<{
      id: string
      type: string
      position: { x: number, y: number, w: number, h: number }
      kpi: {
        id: string
        name: string
        currentValue: number | null
        targetValue?: number | null      // Only if showTarget=true
        targetDirection?: string | null  // Only if showTarget=true
        change?: { value: number, direction: 'up' | 'down' }
      } | null
      config: Record<string, unknown>
    }>
  }
  expiresAt: string | null
  showTarget: boolean
}

interface SharedKpiResponse {
  type: 'kpi'
  kpi: {
    id: string
    name: string
    description: string | null
    currentValue: number | null
    targetValue?: number | null      // Only if showTarget=true
    targetDirection?: string | null  // Only if showTarget=true
    change?: { value: number, direction: 'up' | 'down' }
    history: Array<{ timestamp: string, value: number }>
  }
  expiresAt: string | null
  showTarget: boolean
}

// Error responses
interface ShareLinkErrorResponse {
  error: 'not_found' | 'expired' | 'inactive' | 'invalid'
  message: string
}
```

## Database Schema Updates

Add to ShareLink model:
```prisma
model ShareLink {
  // ... existing fields ...
  
  name           String?   // Optional friendly name
  accessCount    Int       @default(0)
  lastAccessedAt DateTime?
}
```

## Frontend Components

### SharingPage (`/sharing`)
```tsx
interface SharingPageProps {}

// Features:
// - List all user's share links
// - Filter by type (all, dashboard, kpi)
// - Filter by status (all, active, expired)
// - Search by name/resource name
// - Bulk actions (deactivate selected)
```

### ShareLinkCard
```tsx
interface ShareLinkCardProps {
  link: ShareLinkListItem
  onCopy: (url: string) => void
  onToggleActive: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}

// Displays:
// - Resource icon (dashboard/KPI)
// - Resource name + link name
// - Status badge (active/expired/inactive)
// - Expiration date (relative time)
// - Access count
// - Actions: Copy, Toggle, Delete
```

### CreateShareModal
```tsx
interface CreateShareModalProps {
  isOpen: boolean
  onClose: () => void
  resourceType: 'dashboard' | 'kpi'
  resourceId: string
  resourceName: string
}

// Form fields:
// - Name (optional, placeholder: "Untitled link")
// - Expiration (dropdown: 1 hour, 24 hours, 7 days, 30 days, Never)
// - Show target achievement (checkbox, default: checked)
// - Generated URL (read-only, with copy button)
```

### SharedDashboardView (`/share/:token`)
```tsx
interface SharedDashboardViewProps {}

// Features:
// - Minimal branded header
// - Full dashboard with widgets
// - Widgets respect showTarget setting
// - No navigation/editing capabilities
// - Expiration warning banner if < 24h remaining
// - Error states: expired, inactive, not found
```

### SharedKpiView (`/share/:token`)
```tsx
interface SharedKpiViewProps {}

// Features:
// - Single KPI card with details
// - History chart
// - Target info (if showTarget=true)
// - Minimal branded header
// - Same error states as dashboard
```

## Environment Variables

```env
# Required for share link signing
SHARE_LINK_SECRET=your-secret-key-for-hmac-signing

# Optional: Base URL for share links (defaults to request origin)
SHARE_LINK_BASE_URL=https://app.example.com
```

## Security Considerations

### Token Security
- 32 bytes of random data = 256 bits of entropy
- HMAC signature prevents crafting valid tokens
- Timing-safe comparison prevents timing attacks

### Access Control
- Only EDITOR and ADMIN can create share links
- Users can only manage their own share links
- Deactivation is immediate (no caching)

### Rate Limiting
- Public endpoint: 60 requests/minute/IP
- Prevents brute-force token guessing
- Returns 429 Too Many Requests when exceeded

### Data Exposure
- No sensitive config data in shared responses
- No user information exposed
- No links to other resources

## Testing Strategy

### Unit Tests
- Token generation/verification
- Expiration calculation
- showTarget filtering logic

### Integration Tests
- Create share link (success, validation errors)
- Access shared resource (valid, expired, inactive)
- Update share link (activate/deactivate)
- Delete share link

### E2E Tests
- Create link → copy URL → access in incognito
- Deactivate link → verify 410 response
- Expired link → verify error message

## File Structure

```
backend/
  src/
    modules/
      sharing/
        index.ts              # Module exports
        sharing.router.ts     # Protected CRUD endpoints
        share.router.ts       # Public access endpoint
        sharing.service.ts    # Token generation, validation
    services/
      # sharing.service.ts moved to modules

frontend/
  src/
    features/
      sharing/
        index.ts
        SharingPage.tsx       # Link management page
        ShareLinkCard.tsx     # Individual link display
        CreateShareModal.tsx  # Creation modal
        SharedView.tsx        # Public view container
        SharedDashboardView.tsx
        SharedKpiView.tsx
    hooks/
      useSharing.ts           # React Query hooks
    types/
      sharing.ts              # TypeScript types
```

## Migration Notes

The ShareLink model already exists in the schema. Need to add:
1. Migration for `name`, `accessCount`, `lastAccessedAt` fields
2. Index on `token` field (already unique)
3. Index on `createdById` for listing user's links

```sql
ALTER TABLE "ShareLink" ADD COLUMN "name" TEXT;
ALTER TABLE "ShareLink" ADD COLUMN "accessCount" INTEGER DEFAULT 0;
ALTER TABLE "ShareLink" ADD COLUMN "lastAccessedAt" TIMESTAMP;
CREATE INDEX "ShareLink_createdById_idx" ON "ShareLink"("createdById");
```
