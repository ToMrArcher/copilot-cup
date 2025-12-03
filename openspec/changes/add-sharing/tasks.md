# Tasks: External Sharing System

## Status: ✅ COMPLETE

---

## Phase 1: Database & Service Layer

### 1.1 Database Migration
- [x] Add `name` field to ShareLink model
- [x] Add `accessCount` field (default: 0)
- [x] Add `lastAccessedAt` field
- [x] Add index on `createdById`
- [x] Run migration

### 1.2 Sharing Service
- [x] Create `sharing.service.ts`
- [x] Implement `generateShareToken()` with crypto
- [x] Implement `verifyShareToken()` with HMAC
- [x] Implement `calculateExpiration()` helper
- [x] Add `SHARE_LINK_SECRET` to environment
- [x] Write unit tests for token generation/verification

---

## Phase 2: Backend API - Protected Routes

### 2.1 Create Share Link
- [x] `POST /api/sharing` endpoint
- [x] Validate resourceType (dashboard | kpi)
- [x] Verify user has access to resource
- [x] Generate secure token
- [x] Store in database
- [x] Return full URL

### 2.2 List Share Links
- [x] `GET /api/sharing` endpoint
- [x] Filter by createdById (current user)
- [x] Optional filter by resourceType
- [x] Optional filter by resourceId
- [x] Include resource name in response
- [x] Include access statistics

### 2.3 Get Share Link Details
- [x] `GET /api/sharing/:id` endpoint
- [x] Verify ownership
- [x] Return full details with stats

### 2.4 Update Share Link
- [x] `PATCH /api/sharing/:id` endpoint
- [x] Verify ownership
- [x] Allow updating: name, active, expiresAt, showTarget
- [x] Return updated link

### 2.5 Delete Share Link
- [x] `DELETE /api/sharing/:id` endpoint
- [x] Verify ownership
- [x] Hard delete from database
- [x] Return 204 No Content

---

## Phase 3: Backend API - Public Access

### 3.1 Access Shared Resource
- [x] `GET /api/share/:token` endpoint
- [x] Verify token signature
- [x] Check if link is active
- [x] Check if link is expired
- [x] Increment access count
- [x] Update lastAccessedAt
- [x] Return resource data

### 3.2 Dashboard Response
- [x] Fetch dashboard with widgets
- [x] Fetch KPIs for each widget
- [x] Filter out target fields if showTarget=false
- [x] Include layout and positions

### 3.3 KPI Response
- [x] Fetch KPI with current value
- [x] Calculate comparison to previous period
- [x] Fetch history data (last 30 days)
- [x] Filter out target fields if showTarget=false

### 3.4 Error Handling
- [x] Return 404 for invalid token
- [x] Return 410 Gone for expired links
- [x] Return 410 Gone for inactive links
- [x] Return appropriate error messages

---

## Phase 4: Frontend - Types & API

### 4.1 TypeScript Types
- [x] Create `types/sharing.ts`
- [x] Define `ShareLink` interface
- [x] Define request/response types
- [x] Define error types

### 4.2 API Client
- [x] Add sharing endpoints to `lib/api.ts`
- [x] `createShareLink()`
- [x] `listShareLinks()`
- [x] `getShareLink()`
- [x] `updateShareLink()`
- [x] `deleteShareLink()`
- [x] `accessSharedResource()`

### 4.3 React Query Hooks
- [x] Create `hooks/useSharing.ts`
- [x] `useShareLinks()` - list query
- [x] `useShareLink()` - single query
- [x] `useCreateShareLink()` - mutation
- [x] `useUpdateShareLink()` - mutation
- [x] `useDeleteShareLink()` - mutation
- [x] `useSharedResource()` - public access query

---

## Phase 5: Frontend - Management UI

### 5.1 SharingPage
- [x] Replace placeholder with full implementation
- [x] List all user's share links
- [x] Filter by type (all, dashboard, kpi)
- [x] Filter by status (all, active, expired)
- [x] Empty state with helpful message
- [x] Loading and error states

### 5.2 ShareLinkCard
- [x] Display resource type icon
- [x] Display resource name and link name
- [x] Status badge (active/expired/inactive)
- [x] Expiration with relative time
- [x] Access count display
- [x] Copy URL button with toast feedback
- [x] Toggle active/inactive
- [x] Delete with confirmation

### 5.3 CreateShareModal
- [x] Modal with form
- [x] Name input (optional)
- [x] Expiration dropdown (1h, 24h, 7d, 30d, never)
- [x] Show target checkbox (default: true)
- [x] Generate button
- [x] Display generated URL
- [x] Copy button
- [x] Close/Done button

### 5.4 Share Buttons
- [ ] Add Share button to Dashboard page
- [ ] Add Share button to KPI detail view
- [ ] Button opens CreateShareModal with context

---

## Phase 6: Frontend - Public Views

### 6.1 Routing
- [x] Add `/share/:token` route
- [x] Route renders SharedView component
- [x] No auth wrapper on this route

### 6.2 SharedView Container
- [x] Fetch shared resource using token
- [x] Determine resource type
- [x] Render appropriate view component
- [x] Handle loading state
- [x] Handle error states (expired, inactive, not found)

### 6.3 SharedDashboardView
- [x] Minimal branded header
- [x] Dashboard name
- [x] Grid layout with widgets
- [x] Widgets display KPI data
- [x] Respect showTarget setting
- [ ] Expiration warning if < 24h remaining
- [x] Read-only (no interactions)

### 6.4 SharedKpiView
- [x] Minimal branded header
- [x] KPI name and description
- [x] Large current value display
- [x] Target info (if showTarget=true)
- [x] Comparison to previous period
- [x] History chart (line chart)
- [ ] Expiration warning if applicable

### 6.5 Error Pages
- [x] Expired link page with message
- [x] Inactive link page with message
- [x] Not found page
- [x] Consistent styling with main app

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
