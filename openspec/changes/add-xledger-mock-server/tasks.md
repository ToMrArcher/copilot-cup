# Tasks: Xledger Mock Server

## 1. Project Setup
- [ ] 1.1 Create `xledger-mock/` directory structure
- [ ] 1.2 Initialize package.json with dependencies (express, @apollo/server, graphql)
- [ ] 1.3 Create TypeScript configuration (optional, can use JS for simplicity)

## 2. GraphQL Schema
- [ ] 2.1 Define types matching Xledger patterns (Company, GLAccount, GLTransaction, Period)
- [ ] 2.2 Define query types for financial data
- [ ] 2.3 Include pagination support (edges, nodes, pageInfo pattern from Xledger samples)

## 3. Mock Data
- [ ] 3.1 Create realistic financial data for 2023-2025 periods
- [ ] 3.2 Include revenue accounts with transactions
- [ ] 3.3 Include EBITDA calculation data (operating income, depreciation, amortization)
- [ ] 3.4 Include cost accounts for margin calculations

## 4. Resolvers
- [ ] 4.1 Implement company query
- [ ] 4.2 Implement glAccounts query with filters (accountType, period)
- [ ] 4.3 Implement financialSummary query for aggregated data
- [ ] 4.4 Support period filtering (year, quarter, month)

## 5. Authentication
- [ ] 5.1 Implement bearer token validation middleware
- [ ] 5.2 Return appropriate errors for unauthorized requests
- [ ] 5.3 Document test token in README

## 6. Docker Integration
- [ ] 6.1 Create Dockerfile
- [ ] 6.2 Add service to docker-compose.yml
- [ ] 6.3 Configure networking with other services

## 7. Documentation
- [ ] 7.1 Create README with usage instructions
- [ ] 7.2 Document available queries and sample queries for Rule of 40
- [ ] 7.3 Include example integration configuration

## 8. Testing
- [ ] 8.1 Verify GraphQL endpoint responds correctly
- [ ] 8.2 Test integration with KPI dashboard GraphQL adapter
- [ ] 8.3 Confirm Rule of 40 calculation works end-to-end
