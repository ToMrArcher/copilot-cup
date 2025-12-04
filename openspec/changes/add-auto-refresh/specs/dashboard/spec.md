## ADDED Requirements

### Requirement: Dashboard Auto-Refresh
The system SHALL provide configurable automatic data refresh for dashboards.

#### Scenario: User enables auto-refresh
- **WHEN** user selects a refresh interval (30s, 1m, 5m, or 15m)
- **THEN** the dashboard data refreshes automatically at the selected interval
- **AND** a visual indicator shows that auto-refresh is active

#### Scenario: User triggers manual refresh
- **WHEN** user clicks the manual refresh button
- **THEN** all dashboard data refreshes immediately
- **AND** the last-updated timestamp updates to current time

#### Scenario: User disables auto-refresh
- **WHEN** user selects "Off" from the interval selector
- **THEN** automatic refresh stops
- **AND** the visual indicator is removed

#### Scenario: Refresh settings persist
- **WHEN** user sets a refresh interval for a dashboard
- **AND** user navigates away and returns to the same dashboard
- **THEN** the previously selected interval is restored

### Requirement: Refresh Status Display
The system SHALL display refresh status information to users.

#### Scenario: Last updated timestamp shown
- **WHEN** dashboard data has been refreshed
- **THEN** the dashboard header shows "Last updated: [relative time]"

#### Scenario: Loading state during refresh
- **WHEN** data is being refreshed (manually or automatically)
- **THEN** a loading indicator is displayed
- **AND** user can still view the previous data
