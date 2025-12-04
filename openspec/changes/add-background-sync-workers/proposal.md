# Proposal: Add Background Sync Workers

## Summary
Implement a background worker system that automatically syncs integrations on a configurable schedule, even when users are not actively using the application. This ensures dashboards always display fresh data without requiring manual intervention.

## Problem Statement
Currently, integrations only sync when:
1. A user manually clicks the "Sync" button
2. The page is refreshed

This creates several issues:
- Data becomes stale when users aren't actively viewing dashboards
- External stakeholders viewing shared links may see outdated information
- No visibility into sync status or history
- No retry mechanism for failed syncs
- No rate limiting coordination across multiple integrations

From `project.md` requirements:
> "Når jeg trenger oppdaterte tall, vil jeg trigge refresh manuelt eller tidsstyre den, slik at dashboardet alltid viser ferske data."

> "Når en integrasjon feiler, vil jeg få en tydelig feilmelding med forslag til løsning, slik at jeg kan fikse det raskt."

## Proposed Solution

### Architecture Overview
A dedicated background worker process that:
1. Runs independently from the main API server
2. Polls for integrations that need syncing based on their configured schedule
3. Executes syncs with proper error handling and retry logic
4. Respects rate limits for external APIs
5. Logs sync history for observability

### Key Components

#### 1. Sync Scheduler
- Configurable sync intervals per integration (e.g., every 5 min, 15 min, 1 hour, daily)
- Default sync interval for new integrations
- Ability to pause/resume scheduled syncs

#### 2. Worker Process
- Separate Docker container running the worker
- Uses the same codebase as the API
- Processes sync jobs from a queue or polling mechanism

#### 3. Sync History & Status
- Track last sync time, status, and duration
- Store error messages for failed syncs
- Display sync history in the UI

#### 4. Rate Limiting
- Per-integration rate limit configuration
- Global rate limiting to avoid overwhelming external services
- Exponential backoff for failures

## Scope

### In Scope
- Background worker Docker service
- Sync scheduling per integration (configurable intervals)
- Sync history tracking (success/failure/duration)
- Retry logic with exponential backoff
- Rate limiting for external API calls
- UI to configure sync schedule
- UI to view sync history
- Error notifications in UI

### Out of Scope (Future)
- Real-time webhooks for push-based updates
- Distributed workers (single worker is sufficient for MVP)
- Email/Slack notifications for failures
- Advanced cron expressions (simple intervals only)

## User Stories

1. **As an admin**, I want to configure how often each integration syncs, so that I can balance freshness vs API rate limits.

2. **As an admin**, I want to see the sync history for each integration, so that I can troubleshoot issues.

3. **As a user**, I want my dashboard data to be automatically updated, so that I always see fresh information without manual action.

4. **As an admin**, I want failed syncs to retry automatically, so that temporary failures don't require manual intervention.

5. **As an admin**, I want to pause scheduled syncs for an integration, so that I can perform maintenance without triggering syncs.

## Technical Approach

### Option A: Simple Polling Worker (Recommended for MVP)
- Worker runs on a fixed interval (e.g., every minute)
- Queries database for integrations due for sync
- Processes them sequentially with concurrency limit
- Simple, easy to debug, no additional dependencies

### Option B: Job Queue (BullMQ/Redis)
- More complex but scalable
- Better for distributed workers
- Overkill for MVP with few integrations

**Recommendation**: Start with Option A for simplicity, migrate to Option B if needed.

### Database Schema Changes
```prisma
model Integration {
  // existing fields...
  syncInterval    Int?      @default(3600)  // seconds, null = manual only
  syncEnabled     Boolean   @default(true)
  nextSyncAt      DateTime?
}

model SyncLog {
  id            String      @id @default(cuid())
  integrationId String
  integration   Integration @relation(...)
  status        SyncStatus  // PENDING, RUNNING, SUCCESS, FAILED
  startedAt     DateTime
  completedAt   DateTime?
  duration      Int?        // milliseconds
  recordsCount  Int?        // number of records synced
  errorMessage  String?
  createdAt     DateTime    @default(now())
}

enum SyncStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
}
```

## Dependencies
- Docker Compose update for worker service
- Prisma schema migration
- Existing integration sync logic (reuse from `integration.router.ts`)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Worker crashes during sync | Data inconsistency | Mark sync as FAILED on restart, implement proper shutdown handling |
| External API rate limits exceeded | Sync failures | Implement rate limiting, exponential backoff |
| Database connection issues | Worker hangs | Connection pooling, health checks, restart policy |
| Long-running syncs block others | Delayed updates | Timeout per sync, concurrency limits |

## Success Criteria
- [ ] Worker runs as separate Docker container
- [ ] Integrations sync automatically based on configured interval
- [ ] Sync history is recorded and viewable in UI
- [ ] Failed syncs retry with exponential backoff (max 3 retries)
- [ ] UI allows configuring sync interval per integration
- [ ] UI shows sync status and last sync time
- [ ] Manual sync still works alongside scheduled syncs
- [ ] Worker survives API server restarts

## Estimated Effort
- **Backend (worker + schema)**: 2-3 hours
- **Frontend (UI updates)**: 1-2 hours
- **Testing & debugging**: 1 hour
- **Total**: ~4-6 hours
