# Tasks: Add Background Sync Workers

## Implementation Checklist

### Phase 1: Database Schema ✅
- [x] Add `syncInterval` field to Integration model (seconds, nullable for manual-only)
- [x] Add `syncEnabled` field to Integration model (boolean, default true)
- [x] Add `nextSyncAt` field to Integration model (DateTime, nullable)
- [x] Add `retryCount` field to Integration model (Int, default 0)
- [x] Create `SyncLog` model with status, timing, and error tracking
- [x] Create `SyncStatus` enum (PENDING, RUNNING, SUCCESS, FAILED)
- [x] Generate and run Prisma migration

### Phase 2: Sync Service ✅
- [x] Create `sync.service.ts` for sync logic
- [x] Extract sync logic from `integration.router.ts` into reusable service
- [x] Add function to calculate next sync time
- [x] Add function to get integrations due for sync
- [x] Add function to record sync start/completion
- [x] Implement retry logic with exponential backoff
- [x] Add rate limiting per integration
- [x] Add `GET /api/integrations/:id/sync-history` endpoint
- [x] Update `POST /api/integrations/:id/sync` to use service

### Phase 3: Worker Process ✅
- [x] Create `worker/index.ts` as worker entry point
- [x] Implement main worker loop (poll every 30 seconds)
- [x] Process due integrations with concurrency limit
- [x] Handle graceful shutdown (SIGTERM/SIGINT)
- [x] Add comprehensive logging
- [ ] Add health check endpoint for worker (optional, deferred)

### Phase 4: Docker Configuration ✅
- [x] Add `worker` service to `docker-compose.yml`
- [x] Configure worker to depend on `postgres` and use same environment
- [x] Add restart policy for worker container
- [ ] Test worker starts correctly with `docker-compose up`

### Phase 5: API Endpoints ✅
- [x] Add `GET /api/integrations/:id/sync-history` endpoint (added in Phase 2)
- [x] Add `PATCH /api/integrations/:id/sync-settings` endpoint
- [x] Update `GET /api/integrations/:id` to include sync settings (via Prisma)
- [x] Update `POST /api/integrations` to accept sync settings
- [x] Update `PUT /api/integrations/:id` to allow sync setting changes

### Phase 6: Frontend - Integration Settings ✅
- [x] Add sync interval selector to IntegrationWizard
- [x] Add sync enabled toggle to IntegrationWizard
- [x] Show current sync settings in IntegrationCard
- [x] Add sync settings section to integration edit mode
- [x] Update Integration type with sync fields
- [x] Update API client to include sync settings in create/update

### Phase 7: Frontend - Sync History ✅
- [x] Create `SyncHistoryModal` component
- [x] Add "View History" button to IntegrationCard
- [x] Display sync history with status, time, duration
- [x] Show error messages for failed syncs
- [x] Add pagination for history list
- [x] Add `getSyncHistory` API function

### Phase 8: Testing ✅
- [x] Write unit tests for sync service (21 tests)
  - calculateNextSyncAt (8 tests)
  - getIntegrationsDueForSync (3 tests)
  - startSyncLog (1 test)
  - completeSyncLog (2 tests)
  - updateIntegrationAfterSync (4 tests)
  - getSyncHistory (3 tests)
- [x] Test error handling and retries (exponential backoff)
- [x] Test retry count tracking and auto-disable after MAX_RETRIES
- [ ] Integration tests for worker (deferred - requires running containers)

## Dependencies
- Prisma for database schema
- Existing integration sync logic
- Docker Compose for worker service

## Configuration
Default sync intervals to support:
- 5 minutes (300 seconds)
- 15 minutes (900 seconds)
- 30 minutes (1800 seconds)
- 1 hour (3600 seconds) - default
- 6 hours (21600 seconds)
- Daily (86400 seconds)
- Manual only (null)

## Notes
- Worker and API share the same codebase, different entry points
- Worker should be stateless - all state in database
- Use same DATABASE_URL as main backend
- Consider adding worker-specific healthcheck endpoint
