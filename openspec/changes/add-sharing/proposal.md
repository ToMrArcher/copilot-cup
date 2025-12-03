# Proposal: External Sharing System

## Context
The KPI Dashboard platform needs to share dashboards and individual KPIs with external users who don't have accounts. This enables stakeholders, clients, or partners to view specific data without requiring login credentials.

## Problem Statement
Currently, all dashboard and KPI data is only accessible to authenticated users. The platform needs:
- Time-limited, secure URLs for external access
- Ability to instantly revoke shared links
- Control over what data is exposed (e.g., hide target achievement)
- No account required for recipients

## Requirements (from project.md)

> Når jeg deler rapporter eksternt,
> vil jeg generere tidsbegrensede hemmelige URLer,
> slik at mottaker får kontrollert tilgang uten konto.

> Når jeg avslutter deling,
> vil jeg kunne deaktivere lenken umiddelbart,
> slik at tilgangen ikke lever videre.

> Når jeg deler en KPI eksternt,
> vil jeg velge om måloppnåelse skal vises eller skjules,
> slik at vi kontrollerer narrativet.

## Proposed Solution

### 1. Share Link Creation
- Generate cryptographically secure tokens (32 bytes, URL-safe base64)
- Optional expiration date (1 hour, 24 hours, 7 days, 30 days, never)
- Choose to show or hide target achievement for KPIs
- Links signed with HMAC to prevent tampering

### 2. Share Link Management
- List all active share links for a dashboard/KPI
- Deactivate links instantly (soft delete, keeps audit trail)
- View link usage statistics (access count, last accessed)

### 3. Public View
- Dedicated `/share/:token` route (no authentication required)
- Read-only view of shared dashboard or KPI
- Respects `showTarget` setting
- Displays expiration warning if link expires soon
- Shows "Link expired" or "Link inactive" for invalid tokens

### 4. Security
- Tokens are cryptographically random (not guessable)
- HMAC signature prevents token manipulation
- Links can be deactivated immediately
- Expired links return 410 Gone
- Rate limiting on public endpoints
- No sensitive configuration data exposed

## API Endpoints

### Protected (requires authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sharing` | Create share link |
| GET | `/api/sharing` | List user's share links |
| GET | `/api/sharing/:id` | Get share link details |
| PATCH | `/api/sharing/:id` | Update (deactivate, extend expiry) |
| DELETE | `/api/sharing/:id` | Permanently delete link |

### Public (no authentication)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/share/:token` | Access shared resource |

## Data Model

Already defined in Prisma schema:
```prisma
model ShareLink {
  id           String     @id @default(cuid())
  token        String     @unique
  resourceType String     // dashboard, kpi
  dashboardId  String?
  dashboard    Dashboard? @relation(...)
  kpiId        String?
  kpi          Kpi?       @relation(...)
  createdById  String
  createdBy    User       @relation(...)
  showTarget   Boolean    @default(true)
  expiresAt    DateTime?
  active       Boolean    @default(true)
  createdAt    DateTime   @default(now())
}
```

### Additional Fields Needed
- `accessCount` - Number of times accessed
- `lastAccessedAt` - Last access timestamp
- `name` - Optional friendly name for the link

## Frontend Components

### SharingPage
- List of all share links created by user
- Filter by resource type (dashboard/KPI)
- Quick actions: copy link, deactivate, delete

### ShareLinkCard
- Shows resource name, type, status
- Expiration date/time
- Access statistics
- Copy URL button
- Deactivate toggle

### CreateShareModal
- Select resource (dashboard or KPI)
- Set expiration (preset options + custom)
- Toggle "Show target achievement"
- Generate and copy link

### SharedView (Public)
- Minimal header with branding
- Dashboard or KPI display (read-only)
- No navigation to other content
- Expiration notice if applicable

## Success Criteria
- [ ] Users can create share links for dashboards
- [ ] Users can create share links for individual KPIs
- [ ] Share links work without authentication
- [ ] Links can be deactivated immediately
- [ ] Expired links show appropriate message
- [ ] Target achievement can be hidden on shared KPIs
- [ ] Access statistics are tracked

## Out of Scope
- Password-protected share links
- Email notification when link is accessed
- Embed code generation (iframe)
- Collaborative editing via share links
- Share link analytics dashboard

## Dependencies
- Authentication system (for protected endpoints)
- Dashboard display components (for shared view)
- KPI display components (for shared view)
