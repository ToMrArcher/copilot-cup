## ADDED Requirements

### Requirement: Integration Management
The system SHALL allow users to create, view, update, and delete data source integrations through a visual interface.

#### Scenario: Create new integration
- **WHEN** user clicks "Add Integration" on the integrations page
- **THEN** the system displays a wizard-style interface
- **AND** guides the user through configuration steps

#### Scenario: View integration list
- **WHEN** user navigates to the integrations page
- **THEN** the system displays all configured integrations
- **AND** shows status (connected, error, pending) for each

#### Scenario: Delete integration
- **WHEN** user deletes an integration
- **THEN** the system removes the integration and all associated field mappings
- **AND** shows confirmation before deletion

### Requirement: Pluggable Integration Types
The system SHALL support multiple integration types (API, Manual, Webhook) through a pluggable adapter architecture.

#### Scenario: API integration type
- **WHEN** user selects "API" as integration type
- **THEN** the system prompts for URL, headers, and authentication details
- **AND** validates the connection before saving

#### Scenario: Manual integration type
- **WHEN** user selects "Manual" as integration type
- **THEN** the system allows defining fields for manual data entry
- **AND** provides a form for entering data values

#### Scenario: Extensible adapter system
- **WHEN** a new integration type is added to the system
- **THEN** it can be implemented as an adapter without modifying core logic
- **AND** appears as an option in the integration wizard

### Requirement: Secure Credential Storage
The system SHALL encrypt API keys, tokens, and other sensitive credentials before storing them in the database.

#### Scenario: Credentials encrypted at rest
- **WHEN** user saves an integration with API credentials
- **THEN** the credentials are encrypted using AES-256-GCM
- **AND** stored as encrypted blob in the database

#### Scenario: Credentials decrypted only for use
- **WHEN** the system needs to make an API call
- **THEN** credentials are decrypted in memory
- **AND** never logged or exposed in responses

#### Scenario: Credentials hidden in UI
- **WHEN** user views an existing integration
- **THEN** sensitive values are masked (shown as `***`)
- **AND** can only be replaced, not retrieved

### Requirement: Connection Testing
The system SHALL allow users to test integration connections before saving.

#### Scenario: Successful connection test
- **WHEN** user clicks "Test Connection" with valid configuration
- **THEN** the system attempts to connect to the data source
- **AND** displays success message with response time

#### Scenario: Failed connection test
- **WHEN** user clicks "Test Connection" with invalid configuration
- **THEN** the system displays a clear error message
- **AND** suggests possible fixes based on error type

### Requirement: Field Discovery and Mapping
The system SHALL automatically discover available fields from the data source and allow users to map them.

#### Scenario: Automatic field discovery
- **WHEN** user completes connection configuration
- **THEN** the system fetches sample data from the source
- **AND** presents discovered fields with data types

#### Scenario: Field mapping with JSON path
- **WHEN** user maps a field from nested JSON response
- **THEN** user can specify JSON path notation (e.g., `$.data.items[0].value`)
- **AND** the system extracts the correct value

#### Scenario: Field alias assignment
- **WHEN** user maps a source field
- **THEN** user can assign a friendly alias name
- **AND** the alias is used in KPI formulas

### Requirement: Live Data Preview
The system SHALL show live sample data when users configure field mappings.

#### Scenario: Preview on field selection
- **WHEN** user selects a field to map
- **THEN** the system displays sample values from that field
- **AND** updates preview in real-time as mapping changes

#### Scenario: Preview row limit
- **WHEN** fetching preview data
- **THEN** the system limits to 5 sample rows
- **AND** does not impact source API rate limits significantly

### Requirement: Integration Status Tracking
The system SHALL track and display the sync status of each integration.

#### Scenario: Display last sync time
- **WHEN** user views an integration
- **THEN** the system shows when data was last synchronized
- **AND** displays relative time (e.g., "5 minutes ago")

#### Scenario: Error status display
- **WHEN** an integration sync fails
- **THEN** the system displays error status on the integration card
- **AND** shows error details with suggested resolution

#### Scenario: Manual sync trigger
- **WHEN** user clicks "Sync Now" on an integration
- **THEN** the system immediately fetches fresh data
- **AND** updates the last sync timestamp

### Requirement: Sync Error Handling
The system SHALL provide clear error messages with resolution suggestions when integrations fail.

#### Scenario: Authentication error
- **WHEN** API returns 401 Unauthorized
- **THEN** the system suggests checking API key or refreshing token

#### Scenario: Rate limit error
- **WHEN** API returns 429 Too Many Requests
- **THEN** the system suggests waiting and shows retry time if provided

#### Scenario: Network error
- **WHEN** connection to API fails
- **THEN** the system suggests checking URL and network connectivity
