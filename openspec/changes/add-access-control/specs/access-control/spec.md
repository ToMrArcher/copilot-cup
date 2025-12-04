# Access Control Specification

## ADDED Requirements

### Requirement: Dashboard Access Control
The system SHALL restrict dashboard visibility to authorized users only.

#### Scenario: Owner views their own dashboard
Given a user who owns a dashboard
When they request the dashboard list
Then they see their dashboard in the list

#### Scenario: User with granted access views shared dashboard
Given a user with VIEW permission on a dashboard
When they request the dashboard list
Then they see the shared dashboard in the list

#### Scenario: User without access cannot see dashboard
Given a user with no access to a dashboard
When they request the dashboard list
Then the dashboard is not in the list

#### Scenario: Admin sees all dashboards
Given a user with ADMIN role
When they request the dashboard list
Then they see all dashboards in the system

---

### Requirement: KPI Access Control
The system SHALL restrict KPI visibility to authorized users only.

#### Scenario: Owner views their own KPIs
Given a user who owns a KPI
When they request the KPI list
Then they see their KPI in the list

#### Scenario: User with granted access views shared KPI
Given a user with VIEW permission on a KPI
When they request the KPI list
Then they see the shared KPI in the list

#### Scenario: User without access cannot see KPI
Given a user with no access to a KPI
When they request the KPI list
Then the KPI is not in the list

---

### Requirement: View Permission Enforcement
Users with VIEW permission SHALL only have read-only access to resources.

#### Scenario: Viewer cannot edit dashboard
Given a user with VIEW permission on a dashboard
When they attempt to update the dashboard
Then the request is rejected with 403 Forbidden

#### Scenario: Viewer cannot delete dashboard
Given a user with VIEW permission on a dashboard
When they attempt to delete the dashboard
Then the request is rejected with 403 Forbidden

#### Scenario: Viewer can read dashboard
Given a user with VIEW permission on a dashboard
When they request the dashboard details
Then they receive the dashboard data

---

### Requirement: Edit Permission Enforcement
Users with EDIT permission SHALL be able to modify but not delete or manage access.

#### Scenario: Editor can update dashboard
Given a user with EDIT permission on a dashboard
When they update the dashboard
Then the changes are saved successfully

#### Scenario: Editor cannot delete dashboard
Given a user with EDIT permission on a dashboard
When they attempt to delete the dashboard
Then the request is rejected with 403 Forbidden

#### Scenario: Editor cannot manage access
Given a user with EDIT permission on a dashboard
When they attempt to grant access to another user
Then the request is rejected with 403 Forbidden

---

### Requirement: Owner Permissions
Resource owners SHALL have full control over their resources.

#### Scenario: Owner can edit dashboard
Given a user who owns a dashboard
When they update the dashboard
Then the changes are saved successfully

#### Scenario: Owner can delete dashboard
Given a user who owns a dashboard
When they delete the dashboard
Then the dashboard is removed

#### Scenario: Owner can grant access
Given a user who owns a dashboard
When they grant VIEW access to another user
Then the other user can see the dashboard

#### Scenario: Owner can revoke access
Given a user who owns a dashboard
And another user has VIEW access
When the owner revokes the access
Then the other user can no longer see the dashboard

---

### Requirement: Access Management API
The system SHALL provide endpoints to manage resource access.

#### Scenario: List dashboard access
Given a dashboard owner
When they request GET /api/dashboards/:id/access
Then they receive the owner info and list of users with access

#### Scenario: Grant dashboard access
Given a dashboard owner
When they POST to /api/dashboards/:id/access with userId and permission
Then access is granted to the specified user

#### Scenario: Update dashboard access
Given a dashboard owner
When they PATCH /api/dashboards/:id/access/:userId with new permission
Then the user's permission level is updated

#### Scenario: Revoke dashboard access
Given a dashboard owner
When they DELETE /api/dashboards/:id/access/:userId
Then the user's access is removed

---

### Requirement: Resource Creation Ownership
When a user creates a resource, they SHALL automatically become the owner.

#### Scenario: Created dashboard has owner
Given an authenticated user
When they create a new dashboard
Then the dashboard's ownerId is set to their userId

#### Scenario: Created KPI has owner
Given an authenticated user
When they create a new KPI
Then the KPI's ownerId is set to their userId
