## ADDED Requirements

### Requirement: GraphQL Integration Type
The system SHALL support GraphQL APIs as a data source type, allowing users to connect to any GraphQL endpoint with custom queries.

#### Scenario: Select GraphQL integration type
- **WHEN** user selects "GraphQL" as integration type in the wizard
- **THEN** the system displays GraphQL-specific configuration fields
- **AND** prompts for endpoint URL and GraphQL query

#### Scenario: Configure GraphQL endpoint
- **WHEN** user configures a GraphQL integration
- **THEN** the system accepts the GraphQL endpoint URL
- **AND** uses standard POST with JSON body to execute queries

#### Scenario: Enter custom GraphQL query
- **WHEN** user enters a GraphQL query
- **THEN** the system stores the query string for execution
- **AND** uses this query when fetching data

#### Scenario: Provide query variables
- **WHEN** user provides optional query variables as JSON
- **THEN** the system includes variables in GraphQL request body
- **AND** validates JSON format before saving

#### Scenario: Specify operation name
- **WHEN** GraphQL document contains multiple operations
- **THEN** user can specify which operation to execute via operationName field
- **AND** the system sends operationName with the request

### Requirement: GraphQL Authentication
The system SHALL support the same authentication methods for GraphQL as for REST APIs.

#### Scenario: Bearer token authentication
- **WHEN** user configures GraphQL integration with Bearer auth
- **THEN** the system includes Authorization header with Bearer token
- **AND** encrypts the token in storage

#### Scenario: API key authentication
- **WHEN** user configures GraphQL integration with API key auth
- **THEN** the system includes the API key in specified header
- **AND** encrypts the key in storage

#### Scenario: Custom headers
- **WHEN** user adds custom headers to GraphQL integration
- **THEN** the system includes all headers in GraphQL requests
- **AND** masks sensitive header values in UI

### Requirement: GraphQL Field Discovery
The system SHALL discover available fields from GraphQL query responses and present them for mapping.

#### Scenario: Discover fields from response
- **WHEN** user clicks "Discover Fields" after entering a valid query
- **THEN** the system executes the query and analyzes the response
- **AND** extracts field names, paths, and data types

#### Scenario: Flatten nested GraphQL response
- **WHEN** GraphQL response contains nested objects
- **THEN** the system flattens fields using dot-notation paths
- **AND** displays paths like `data.company.financials.revenue`

#### Scenario: Sample values in discovery
- **WHEN** discovering fields from GraphQL response
- **THEN** the system shows sample values for each field
- **AND** limits fetch to minimal data needed for discovery

### Requirement: GraphQL Connection Testing
The system SHALL allow users to test GraphQL endpoint connectivity and query validity.

#### Scenario: Test successful GraphQL connection
- **WHEN** user clicks "Test Connection" with valid GraphQL config
- **THEN** the system executes the query against the endpoint
- **AND** displays success with response time

#### Scenario: Test with invalid query
- **WHEN** user clicks "Test Connection" with invalid GraphQL query
- **THEN** the system displays the GraphQL error message
- **AND** suggests checking query syntax

#### Scenario: Test with authentication failure
- **WHEN** GraphQL endpoint returns authentication error
- **THEN** the system displays clear auth error message
- **AND** suggests checking credentials

### Requirement: GraphQL Error Handling
The system SHALL handle GraphQL-specific errors and display meaningful messages to users.

#### Scenario: Handle GraphQL errors array
- **WHEN** GraphQL response contains errors array
- **THEN** the system extracts and displays the first error message
- **AND** logs full error details for debugging

#### Scenario: Handle partial data response
- **WHEN** GraphQL returns both data and errors
- **THEN** the system uses the partial data if available
- **AND** warns user about errors that occurred

#### Scenario: Handle query timeout
- **WHEN** GraphQL query takes too long
- **THEN** the system applies standard timeout handling
- **AND** suggests simplifying the query
