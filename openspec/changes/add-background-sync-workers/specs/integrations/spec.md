# Background Sync Workers - Integration Sync

## ADDED Requirements

### Requirement: REQ-SYNC-SCHEDULE-001: Configurable Sync Intervals
Each integration MUST support configurable sync intervals to control automatic data refresh frequency.

#### Scenario: Admin configures sync interval for an integration
- GIVEN an admin is editing an integration
- WHEN they set the sync interval to "15 minutes"
- THEN the integration will automatically sync every 15 minutes
- AND the next sync time is calculated and stored

#### Scenario: Integration is set to manual-only sync
- GIVEN an admin is editing an integration
- WHEN they set the sync interval to "Manual only"
- THEN the integration will not sync automatically
- AND the integration can still be synced manually

### Requirement: REQ-SYNC-WORKER-001: Background Sync Worker
The system MUST run a background worker that processes scheduled integration syncs independently from user interactions.

#### Scenario: Worker processes due integrations
- GIVEN integrations have scheduled sync times
- WHEN the current time passes an integration's nextSyncAt time
- THEN the worker automatically syncs that integration
- AND updates the lastSync and nextSyncAt times

#### Scenario: Worker handles multiple integrations
- GIVEN multiple integrations are due for sync
- WHEN the worker runs
- THEN it processes them with a concurrency limit
- AND respects rate limiting between syncs

### Requirement: REQ-SYNC-HISTORY-001: Sync History Tracking
The system MUST track sync history including status, duration, and errors for observability.

#### Scenario: Successful sync is logged
- GIVEN an integration sync completes successfully
- WHEN the sync finishes
- THEN a sync log entry is created with status SUCCESS
- AND the duration and record count are recorded

#### Scenario: Failed sync is logged with error
- GIVEN an integration sync fails
- WHEN the sync encounters an error
- THEN a sync log entry is created with status FAILED
- AND the error message is recorded for troubleshooting

### Requirement: REQ-SYNC-RETRY-001: Automatic Retry with Backoff
The system MUST automatically retry failed syncs with exponential backoff.

#### Scenario: Failed sync is retried
- GIVEN an integration sync fails
- WHEN the failure is recorded
- THEN the system schedules a retry with exponential backoff
- AND the retry count is incremented

#### Scenario: Max retries exceeded
- GIVEN an integration has failed 3 consecutive times
- WHEN the third retry fails
- THEN automatic syncing is disabled for that integration
- AND the user is notified in the UI

### Requirement: REQ-SYNC-PAUSE-001: Pause/Resume Sync
Admins MUST be able to pause and resume scheduled syncs for any integration.

#### Scenario: Admin pauses scheduled sync
- GIVEN an integration has scheduled syncing enabled
- WHEN the admin disables sync for that integration
- THEN the worker skips this integration during scheduled runs
- AND manual sync remains available

#### Scenario: Admin resumes scheduled sync
- GIVEN an integration has paused syncing
- WHEN the admin enables sync for that integration
- THEN the next sync time is calculated
- AND the worker resumes processing this integration

### Requirement: REQ-SYNC-UI-HISTORY-001: View Sync History in UI
Users MUST be able to view sync history for each integration in the UI.

#### Scenario: User views sync history
- GIVEN a user is viewing an integration
- WHEN they click "View Sync History"
- THEN a modal shows recent sync logs
- AND each log displays status, time, duration, and any errors
