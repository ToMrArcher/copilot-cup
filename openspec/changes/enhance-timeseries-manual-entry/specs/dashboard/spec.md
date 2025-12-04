# Dashboard Spec Delta: Enhanced Time Series

## ADDED Requirements

### Requirement: Extended Time Range Options
The system SHALL provide extended time range options for viewing KPI history beyond the default 7d/30d/90d.

#### Scenario: View last hour of data
- **GIVEN** a KPI with data points in the last hour
- **WHEN** user selects "1h" time range
- **THEN** the chart SHALL display data aggregated by minute

#### Scenario: View last 6 hours of data
- **GIVEN** a KPI with data points in the last 6 hours
- **WHEN** user selects "6h" time range
- **THEN** the chart SHALL display data aggregated by minute

#### Scenario: View last year of data
- **GIVEN** a KPI with data points over the past year
- **WHEN** user selects "1y" time range
- **THEN** the chart SHALL display data aggregated by month

#### Scenario: View all historical data
- **GIVEN** a KPI with historical data
- **WHEN** user selects "all" time range
- **THEN** the chart SHALL display all available data with appropriate aggregation

### Requirement: Custom Date Range Selection
The system SHALL allow users to specify a custom date range for viewing KPI history.

#### Scenario: Select custom date range
- **GIVEN** a KPI chart widget
- **WHEN** user selects "Custom range" option
- **THEN** the system SHALL display a date range picker

#### Scenario: Apply custom date range
- **GIVEN** the date range picker is open
- **WHEN** user selects start date and end date
- **THEN** the chart SHALL update to show data within that range

### Requirement: Minute-Level Aggregation
The system SHALL support minute-level aggregation for short time periods.

#### Scenario: Minute aggregation for hourly view
- **GIVEN** user selects 1h or 6h time range
- **WHEN** the chart data is fetched
- **THEN** the backend SHALL return data aggregated by minute

#### Scenario: Appropriate aggregation scaling
- **GIVEN** different time ranges
- **WHEN** data is displayed
- **THEN** aggregation SHALL scale appropriately (minute→hourly→daily→weekly→monthly)
