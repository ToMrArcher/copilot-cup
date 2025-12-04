# Tasks: Add Background Sync Workers

## Implementation Checklist

### Phase 1: Database Schema
- [ ] Add `syncInterval` field to Integration model (seconds, nullable for manual-only)
- [ ] Add `syncEnabled` field to Integration model (boolean, default true)
- [ ] Add `nextSyncAt` field to Integration model (DateTime, nullable)
- [ ] Create `SyncLog` model with status, timing, and error tracking
- [ ] Create `SyncStatus` enum (PENDING, RUNNING, SUCCESS, FAILED)
- [ ] Generate and run Prisma migration

### Phase 2: Sync Service
- [ ] Create `sync.service.ts` for sync logic
- [ ] Extract sync logic from `integration.router.ts` into reusable service
- [ ] Add function to calculate next sync time
- [ ] Add function to get integrations due for sync
- [ ] Add function to record sync start/completion
- [ ] Implement retry logic with exponential backoff
- [ ] Add rate limiting per integration

### Phase 3: Worker Process
- [ ] Create `worker/index.ts` as worker entry point
- [ ] Implement main worker loop (poll every 30 seconds)
- [ ] Process due integrations with concurrency limit
- [ ] Handle graceful shutdown (SIGTERM/SIGINT)
- [ ] Add health check endpoint for worker
- [ ] Add comprehensive logging

### Phase 4: Docker Configuration
- [ ] Add `worker` service to `docker-compose.yml`
- [ ] Configure worker to depend on `postgres` and use same environment
- [ ] Add restart policy for worker container
- [ ] Test worker starts correctly with `docker-compose up`

### Phase 5: API Endpoints
- [ ] Add `GET /api/integrations/:id/sync-history` endpoint
- [ ] Add `PATCH /api/integrations/:id/sync-settings` endpoint
- [ ] Update `GET /api/integrations/:id` to include sync settings
- [ ] Update `POST /api/integrations` to accept sync settings
- [ ] Update `PUT /api/integrations/:id` to allow sync setting changes

### Phase 6: Frontend - Integration Settings
- [ ] Add sync interval selector to IntegrationWizard
- [ ] Add sync enabled toggle to IntegrationWizard
- [ ] Show current sync settings in IntegrationCard
- [ ] Add sync settings section to integration edit mode

### Phase 7: Frontend - Sync History
- [ ] Create `SyncHistoryModal` component
- [ ] Add "View History" button to IntegrationCard
- [ ] Display sync history with status, time, duration
- [ ] Show error messages for failed syncs
- [ ] Add pagination for history list

### Phase 8: Testing
- [ ] Write unit tests for sync service
- [ ] Write tests for worker scheduling logic
- [ ] Test manual sync still works
- [ ] Test worker restart/recovery
- [ ] Test rate limiting
- [ ] Test error handling and retries

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
