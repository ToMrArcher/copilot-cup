# Design: Background Sync Workers

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Compose                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │    │   Backend    │    │    Worker    │      │
│  │   (React)    │───▶│   (Express)  │    │   (Node.js)  │      │
│  │   :3000      │    │   :4000      │    │   No Port    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                             │                    │               │
│                             ▼                    ▼               │
│                      ┌──────────────────────────────┐           │
│                      │        PostgreSQL            │           │
│                      │          :5432               │           │
│                      └──────────────────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Worker Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Worker Main Loop                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Poll every 30 seconds                                        │
│     │                                                            │
│     ▼                                                            │
│  2. Query: SELECT * FROM Integration                            │
│     WHERE syncEnabled = true                                     │
│     AND nextSyncAt <= NOW()                                      │
│     ORDER BY nextSyncAt ASC                                      │
│     LIMIT 10                                                     │
│     │                                                            │
│     ▼                                                            │
│  3. For each integration (with concurrency limit = 3):          │
│     │                                                            │
│     ├─▶ Create SyncLog (status: RUNNING)                        │
│     │                                                            │
│     ├─▶ Execute sync (reuse existing sync logic)                │
│     │   │                                                        │
│     │   ├─ Success: Update SyncLog (status: SUCCESS)            │
│     │   │           Update Integration.lastSync                  │
│     │   │           Calculate nextSyncAt                         │
│     │   │                                                        │
│     │   └─ Failure: Update SyncLog (status: FAILED)             │
│     │               Log error message                            │
│     │               Schedule retry with backoff                  │
│     │                                                            │
│     └─▶ Rate limit delay (if configured)                        │
│                                                                  │
│  4. Sleep 30 seconds, repeat                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Integration Model Updates

```prisma
model Integration {
  id            String          @id @default(cuid())
  name          String
  type          IntegrationType
  config        Json
  status        String          @default("pending")
  lastSync      DateTime?
  
  // New fields for scheduled sync
  syncInterval  Int?            @default(3600)  // seconds, null = manual only
  syncEnabled   Boolean         @default(true)
  nextSyncAt    DateTime?
  retryCount    Int             @default(0)
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  dataFields    DataField[]
  kpis          Kpi[]
  syncLogs      SyncLog[]
}
```

### New SyncLog Model

```prisma
model SyncLog {
  id            String      @id @default(cuid())
  integrationId String
  integration   Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  
  status        SyncStatus
  startedAt     DateTime    @default(now())
  completedAt   DateTime?
  duration      Int?        // milliseconds
  recordsCount  Int?        // number of data values synced
  errorMessage  String?     @db.Text
  
  createdAt     DateTime    @default(now())
  
  @@index([integrationId, createdAt(sort: Desc)])
}

enum SyncStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
}
```

## Sync Service API

```typescript
// sync.service.ts

interface SyncResult {
  success: boolean
  recordsCount?: number
  duration: number
  error?: string
}

// Get integrations due for sync
async function getIntegrationsDueForSync(limit: number): Promise<Integration[]>

// Execute sync for a single integration
async function syncIntegration(integrationId: string): Promise<SyncResult>

// Calculate next sync time based on interval and retry count
function calculateNextSyncAt(interval: number, retryCount: number): Date

// Record sync start
async function startSyncLog(integrationId: string): Promise<SyncLog>

// Record sync completion
async function completeSyncLog(
  logId: string, 
  result: SyncResult
): Promise<SyncLog>
```

## Worker Entry Point

```typescript
// worker/index.ts

const POLL_INTERVAL = 30_000        // 30 seconds
const CONCURRENCY_LIMIT = 3          // max parallel syncs
const MAX_RETRIES = 3                // retry failed syncs
const BASE_BACKOFF = 60_000          // 1 minute base backoff

async function main() {
  console.log('🔄 Sync worker starting...')
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => shutdown())
  process.on('SIGINT', () => shutdown())
  
  while (running) {
    try {
      await processDueSyncs()
    } catch (error) {
      console.error('Worker loop error:', error)
    }
    
    await sleep(POLL_INTERVAL)
  }
}

async function processDueSyncs() {
  const integrations = await getIntegrationsDueForSync(10)
  
  // Process with concurrency limit
  const chunks = chunk(integrations, CONCURRENCY_LIMIT)
  for (const batch of chunks) {
    await Promise.all(batch.map(processSync))
  }
}

async function processSync(integration: Integration) {
  const log = await startSyncLog(integration.id)
  
  try {
    const result = await syncIntegration(integration.id)
    await completeSyncLog(log.id, result)
    await updateIntegrationAfterSync(integration.id, result)
  } catch (error) {
    await completeSyncLog(log.id, {
      success: false,
      duration: Date.now() - log.startedAt.getTime(),
      error: error.message
    })
    await scheduleRetry(integration.id)
  }
}
```

## Retry Strategy

```
Attempt | Backoff
--------|----------
   1    | 1 minute
   2    | 2 minutes
   3    | 4 minutes
  (max) | Give up, require manual intervention
```

After max retries, set `syncEnabled = false` and notify user.

## Docker Compose Addition

```yaml
  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/kpi_dashboard
      - WORKER_MODE=true
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - kpi-network
    restart: unless-stopped
    command: npm run worker
```

## API Endpoints

### GET /api/integrations/:id/sync-history
Returns paginated sync history for an integration.

```json
{
  "logs": [
    {
      "id": "...",
      "status": "SUCCESS",
      "startedAt": "2025-12-04T10:00:00Z",
      "completedAt": "2025-12-04T10:00:02Z",
      "duration": 2000,
      "recordsCount": 15
    },
    {
      "id": "...",
      "status": "FAILED",
      "startedAt": "2025-12-04T09:00:00Z",
      "completedAt": "2025-12-04T09:00:05Z",
      "duration": 5000,
      "errorMessage": "Connection timeout"
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 20
}
```

### PATCH /api/integrations/:id/sync-settings
Update sync configuration.

```json
{
  "syncInterval": 1800,
  "syncEnabled": true
}
```

## Frontend Components

### Sync Settings (in IntegrationWizard)
- Dropdown for sync interval
- Toggle for sync enabled
- Shows next scheduled sync time

### Sync History Modal
- List of recent syncs with status icons
- Duration and record count
- Expandable error messages
- Pagination for history

### Integration Card Updates
- Show sync status indicator (green/yellow/red)
- Show "Next sync in X minutes"
- Show "Last sync failed" warning if applicable
