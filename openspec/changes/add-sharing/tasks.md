# Tasks: External Sharing System

## Status: 🚧 IN PROGRESS

---

## Phase 1: Database & Service Layer

### 1.1 Database Migration
- [ ] Add `name` field to ShareLink model
- [ ] Add `accessCount` field (default: 0)
- [ ] Add `lastAccessedAt` field
- [ ] Add index on `createdById`
- [ ] Run migration

### 1.2 Sharing Service
- [ ] Create `sharing.service.ts`
- [ ] Implement `generateShareToken()` with crypto
- [ ] Implement `verifyShareToken()` with HMAC
- [ ] Implement `calculateExpiration()` helper
- [ ] Add `SHARE_LINK_SECRET` to environment
- [ ] Write unit tests for token generation/verification

---

## Phase 2: Backend API - Protected Routes

### 2.1 Create Share Link
- [ ] `POST /api/sharing` endpoint
- [ ] Validate resourceType (dashboard | kpi)
- [ ] Verify user has access to resource
- [ ] Generate secure token
- [ ] Store in database
- [ ] Return full URL

### 2.2 List Share Links
- [ ] `GET /api/sharing` endpoint
- [ ] Filter by createdById (current user)
- [ ] Optional filter by resourceType
- [ ] Optional filter by resourceId
- [ ] Include resource name in response
- [ ] Include access statistics

### 2.3 Get Share Link Details
- [ ] `GET /api/sharing/:id` endpoint
- [ ] Verify ownership
- [ ] Return full details with stats

### 2.4 Update Share Link
- [ ] `PATCH /api/sharing/:id` endpoint
- [ ] Verify ownership
- [ ] Allow updating: name, active, expiresAt, showTarget
- [ ] Return updated link

### 2.5 Delete Share Link
- [ ] `DELETE /api/sharing/:id` endpoint
- [ ] Verify ownership
- [ ] Hard delete from database
- [ ] Return 204 No Content

---

## Phase 3: Backend API - Public Access

### 3.1 Access Shared Resource
- [ ] `GET /api/share/:token` endpoint
- [ ] Verify token signature
- [ ] Check if link is active
- [ ] Check if link is expired
- [ ] Increment access count
- [ ] Update lastAccessedAt
- [ ] Return resource data

### 3.2 Dashboard Response
- [ ] Fetch dashboard with widgets
- [ ] Fetch KPIs for each widget
- [ ] Filter out target fields if showTarget=false
- [ ] Include layout and positions

### 3.3 KPI Response
- [ ] Fetch KPI with current value
- [ ] Calculate comparison to previous period
- [ ] Fetch history data (last 30 days)
- [ ] Filter out target fields if showTarget=false

### 3.4 Error Handling
- [ ] Return 404 for invalid token
- [ ] Return 410 Gone for expired links
- [ ] Return 410 Gone for inactive links
- [ ] Return appropriate error messages

---

## Phase 4: Frontend - Types & API

### 4.1 TypeScript Types
- [ ] Create `types/sharing.ts`
- [ ] Define `ShareLink` interface
- [ ] Define request/response types
- [ ] Define error types

### 4.2 API Client
- [ ] Add sharing endpoints to `lib/api.ts`
- [ ] `createShareLink()`
- [ ] `listShareLinks()`
- [ ] `getShareLink()`
- [ ] `updateShareLink()`
- [ ] `deleteShareLink()`
- [ ] `accessSharedResource()`

### 4.3 React Query Hooks
- [ ] Create `hooks/useSharing.ts`
- [ ] `useShareLinks()` - list query
- [ ] `useShareLink()` - single query
- [ ] `useCreateShareLink()` - mutation
- [ ] `useUpdateShareLink()` - mutation
- [ ] `useDeleteShareLink()` - mutation
- [ ] `useSharedResource()` - public access query

---

## Phase 5: Frontend - Management UI

### 5.1 SharingPage
- [ ] Replace placeholder with full implementation
- [ ] List all user's share links
- [ ] Filter by type (all, dashboard, kpi)
- [ ] Filter by status (all, active, expired)
- [ ] Empty state with helpful message
- [ ] Loading and error states

### 5.2 ShareLinkCard
- [ ] Display resource type icon
- [ ] Display resource name and link name
- [ ] Status badge (active/expired/inactive)
- [ ] Expiration with relative time
- [ ] Access count display
- [ ] Copy URL button with toast feedback
- [ ] Toggle active/inactive
- [ ] Delete with confirmation

### 5.3 CreateShareModal
- [ ] Modal with form
- [ ] Name input (optional)
- [ ] Expiration dropdown (1h, 24h, 7d, 30d, never)
- [ ] Show target checkbox (default: true)
- [ ] Generate button
- [ ] Display generated URL
- [ ] Copy button
- [ ] Close/Done button

### 5.4 Share Buttons
- [ ] Add Share button to Dashboard page
- [ ] Add Share button to KPI detail view
- [ ] Button opens CreateShareModal with context

---

## Phase 6: Frontend - Public Views

### 6.1 Routing
- [ ] Add `/share/:token` route
- [ ] Route renders SharedView component
- [ ] No auth wrapper on this route

### 6.2 SharedView Container
- [ ] Fetch shared resource using token
- [ ] Determine resource type
- [ ] Render appropriate view component
- [ ] Handle loading state
- [ ] Handle error states (expired, inactive, not found)

### 6.3 SharedDashboardView
- [ ] Minimal branded header
- [ ] Dashboard name
- [ ] Grid layout with widgets
- [ ] Widgets display KPI data
- [ ] Respect showTarget setting
- [ ] Expiration warning if < 24h remaining
- [ ] Read-only (no interactions)

### 6.4 SharedKpiView
- [ ] Minimal branded header
- [ ] KPI name and description
- [ ] Large current value display
- [ ] Target info (if showTarget=true)
- [ ] Comparison to previous period
- [ ] History chart (line chart)
- [ ] Expiration warning if applicable

### 6.5 Error Pages
- [ ] Expired link page with message
- [ ] Inactive link page with message
- [ ] Not found page
- [ ] Consistent styling with main app

---

## Phase 7: Integration & Polish

### 7.1 Environment Setup
- [ ] Add `SHARE_LINK_SECRET` to docker-compose.yml
- [ ] Add to .env.example
- [ ] Document in README

### 7.2 Testing
- [ ] Unit tests for sharing service
- [ ] Integration tests for API endpoints
- [ ] Test token expiration logic
- [ ] Test showTarget filtering
- [ ] Test access counting

### 7.3 Documentation
- [ ] Update API documentation
- [ ] Add sharing section to README
- [ ] Update OpenSpec tasks as completed

### 7.4 Final Verification
- [ ] Create share link from dashboard
- [ ] Access link without logging in
- [ ] Verify expiration works
- [ ] Verify deactivation works
- [ ] Verify showTarget works
- [ ] Test on mobile viewport

---

## Estimated Effort

| Phase | Time |
|-------|------|
| Phase 1: Database & Service | 30 min |
| Phase 2: Protected API | 45 min |
| Phase 3: Public API | 30 min |
| Phase 4: Frontend Types/API | 20 min |
| Phase 5: Management UI | 60 min |
| Phase 6: Public Views | 60 min |
| Phase 7: Integration | 30 min |
| **Total** | **~4.5 hours** |

---

## Dependencies

- Authentication system (for protected endpoints) ✅
- Dashboard components (for shared view) ✅
- KPI components (for shared view) ✅
- Chart components (for history display) ✅

---

## Notes

- ShareLink model already exists in Prisma schema
- Need to add 3 new fields via migration
- Token format: `<random>.<signature>` for security
- Public route needs to bypass auth middleware
- Consider adding rate limiting later (Phase 2)
