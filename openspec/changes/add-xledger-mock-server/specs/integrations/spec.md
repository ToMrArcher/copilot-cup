# Integrations Spec Delta: Xledger Mock Server

## ADDED Requirements

### Requirement: Xledger Mock Server
The system SHALL provide a mock server that mimics Xledger's GraphQL API for development and testing purposes.

#### Scenario: Mock server serves GraphQL endpoint
- **GIVEN** the xledger-mock service is running
- **WHEN** a client sends a POST request to `/graphql`
- **THEN** the server SHALL respond with valid GraphQL responses

#### Scenario: Mock server requires authentication
- **GIVEN** a request is made without a valid bearer token
- **WHEN** the request is processed
- **THEN** the server SHALL return a 401 Unauthorized error

#### Scenario: Mock server accepts valid token
- **GIVEN** a request includes `Authorization: Bearer xledger-test-token-2024`
- **WHEN** the request is processed
- **THEN** the server SHALL process the GraphQL query normally

### Requirement: Financial Summary Query
The mock server SHALL support a `financialSummary` query that returns aggregated financial data by account type and period.

#### Scenario: Query revenue by year
- **GIVEN** a valid GraphQL query for revenue
- **WHEN** `financialSummary(year: 2024, accountType: "REVENUE")` is executed
- **THEN** the server SHALL return the total revenue for that year

#### Scenario: Query EBITDA by year
- **GIVEN** a valid GraphQL query for EBITDA
- **WHEN** `financialSummary(year: 2024, accountType: "EBITDA")` is executed
- **THEN** the server SHALL return the EBITDA total for that year

#### Scenario: Query multiple periods for comparison
- **GIVEN** sequential queries for 2023 and 2024
- **WHEN** both queries are executed
- **THEN** the server SHALL return distinct values enabling growth rate calculation

### Requirement: GL Accounts Query
The mock server SHALL support a `glAccounts` query that returns individual account data with filtering.

#### Scenario: List all accounts for a period
- **GIVEN** a valid GraphQL query for accounts
- **WHEN** `glAccounts(filter: { year: 2024 })` is executed
- **THEN** the server SHALL return a connection with account edges

#### Scenario: Filter accounts by type
- **GIVEN** a valid GraphQL query with account type filter
- **WHEN** `glAccounts(filter: { year: 2024, accountType: "REVENUE" })` is executed
- **THEN** the server SHALL return only revenue accounts

### Requirement: Xledger Connection Pattern
The mock server SHALL return data using Xledger's connection pattern (edges/nodes/pageInfo).

#### Scenario: Response includes connection structure
- **GIVEN** a query that returns multiple records
- **WHEN** the query is executed
- **THEN** the response SHALL include `edges` array with `node` objects and `pageInfo`

### Requirement: Docker Compose Integration
The mock server SHALL be deployable via Docker Compose alongside other services.

#### Scenario: Service starts with docker-compose
- **GIVEN** the docker-compose.yml includes xledger-mock service
- **WHEN** `docker-compose up xledger-mock` is executed
- **THEN** the service SHALL start and be accessible on port 5001

#### Scenario: Service is accessible from backend
- **GIVEN** both backend and xledger-mock services are running
- **WHEN** backend makes a request to `http://xledger-mock:5001/graphql`
- **THEN** the request SHALL be routed correctly within the Docker network
