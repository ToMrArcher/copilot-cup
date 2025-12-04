## 1. Database Schema
- [x] 1.1 Add `GRAPHQL` to `IntegrationType` enum in `schema.prisma`
- [x] 1.2 Create and run database migration

## 2. Backend Adapter
- [x] 2.1 Extend `IntegrationConfig` interface with GraphQL-specific fields
  - `query`: string (the GraphQL query)
  - `variables`: Record<string, unknown> (optional query variables)
  - `operationName`: string (optional operation name)
- [x] 2.2 Create `GraphqlAdapter` class implementing `IntegrationAdapter`
  - Implement `testConnection()` - send introspection or simple query
  - Implement `fetchData()` - execute GraphQL query and return results
  - Implement `discoverFields()` - extract field schema from query response
- [x] 2.3 Register `GraphqlAdapter` in `AdapterRegistry`
- [x] 2.4 Add unit tests for `GraphqlAdapter`

## 3. Frontend Integration Wizard
- [x] 3.1 Add "GraphQL" option to integration type selector
- [x] 3.2 Create GraphQL configuration step in wizard:
  - Endpoint URL input
  - GraphQL query textarea (with syntax highlighting if feasible)
  - Variables JSON input (optional)
  - Operation name input (optional)
- [x] 3.3 Update integration type definitions in `types/integration.ts`
- [x] 3.4 Add validation for GraphQL query format

## 4. Field Discovery & Mapping
- [x] 4.1 Implement field extraction from GraphQL response JSON
- [x] 4.2 Support nested field paths (e.g., `company.financials.revenue`)
- [x] 4.3 Show discovered fields in field mapping UI

## 5. Testing & Documentation
- [x] 5.1 Test with sample GraphQL endpoint (e.g., public GraphQL API)
- [x] 5.2 Test authentication flows (bearer token, API key)
- [ ] 5.3 Update README or docs with GraphQL integration instructions
