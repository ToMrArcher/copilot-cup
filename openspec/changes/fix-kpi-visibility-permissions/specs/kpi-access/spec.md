# KPI Access Control Delta

## MODIFIED Requirements

### Requirement: KPI List Filtering
The KPI listing endpoint SHALL filter results based on user's access permissions.

- Admins SHALL view all KPIs in the system
- Editors and Viewers SHALL only view KPIs they own OR have been explicitly granted access to via KpiAccess
- Unauthenticated requests SHALL receive an empty KPI list

#### Scenario: Viewer with no KPI access sees empty list
Given a user with role VIEWER
And the user owns no KPIs
And the user has no KpiAccess entries
When the user requests GET /api/kpis
Then the response contains an empty kpis array

#### Scenario: Viewer with granted access sees shared KPIs
Given a user with role VIEWER
And a KPI exists owned by another user
And a KpiAccess entry grants VIEW permission to the viewer for that KPI
When the user requests GET /api/kpis
Then the response contains only the shared KPI

#### Scenario: Editor sees their own KPIs
Given a user with role EDITOR
And the user owns 2 KPIs
And other KPIs exist owned by different users
When the user requests GET /api/kpis
Then the response contains exactly their 2 owned KPIs

#### Scenario: Admin sees all KPIs
Given a user with role ADMIN
And multiple KPIs exist with different owners
When the user requests GET /api/kpis
Then the response contains all KPIs in the system

### Requirement: Single KPI Access Check
The individual KPI detail endpoint SHALL verify user has VIEW access before returning data.

- The endpoint SHALL return 404 "KPI not found" if user lacks access (prevents information leakage)
- Admins SHALL access any KPI
- Owners SHALL access their own KPIs
- Users with KpiAccess SHALL access granted KPIs

#### Scenario: Viewer without access gets 404
Given a user with role VIEWER
And a KPI exists owned by another user
And no KpiAccess entry exists for the viewer
When the user requests GET /api/kpis/:id for that KPI
Then the response status is 404
And the response contains error "KPI not found"

#### Scenario: Viewer with access can view KPI details
Given a user with role VIEWER
And a KpiAccess entry grants VIEW permission for a KPI
When the user requests GET /api/kpis/:id for that KPI
Then the response status is 200
And the response contains the KPI details

### Requirement: KPI History Access Check
The KPI history endpoint SHALL verify user has VIEW access before returning data.

#### Scenario: User without access cannot view history
Given a user with role EDITOR
And a KPI exists owned by another user with no shared access
When the user requests GET /api/kpis/:id/history
Then the response status is 404

## ADDED Requirements

### Requirement: Empty State UI for KPIs
The frontend SHALL display a helpful message when user has no accessible KPIs.

- The UI SHALL display an icon and message explaining no KPIs are available
- For non-admin users, the UI SHALL suggest contacting admin or KPI owner for access
- The UI SHALL provide clear guidance based on user role

#### Scenario: Viewer sees empty state message
Given a logged-in user with role VIEWER
And the user has no accessible KPIs
When the user views the KPIs page
Then they see a message "No KPIs Available"
And they see guidance to contact admin or KPI owner
