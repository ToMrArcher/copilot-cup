# Tasks: Xledger Mock Server

## 1. Project Setup
- [x] 1.1 Create `xledger-mock/` directory structure
- [x] 1.2 Initialize package.json with dependencies (express, @apollo/server, graphql)
- [x] 1.3 Create TypeScript configuration (optional, can use JS for simplicity)

## 2. GraphQL Schema
- [x] 2.1 Define types matching Xledger patterns (Company, GLAccount, GLTransaction, Period)
- [x] 2.2 Define query types for financial data
- [x] 2.3 Include pagination support (edges, nodes, pageInfo pattern from Xledger samples)

## 3. Mock Data
- [x] 3.1 Create realistic financial data for 2023-2025 periods
- [x] 3.2 Include revenue accounts with transactions
- [x] 3.3 Include EBITDA calculation data (operating income, depreciation, amortization)
- [x] 3.4 Include cost accounts for margin calculations

## 4. Resolvers
- [x] 4.1 Implement company query
- [x] 4.2 Implement glAccounts query with filters (accountType, period)
- [x] 4.3 Implement financialSummary query for aggregated data
- [x] 4.4 Support period filtering (year, quarter, month)

## 5. Authentication
- [x] 5.1 Implement bearer token validation middleware
- [x] 5.2 Return appropriate errors for unauthorized requests
- [x] 5.3 Document test token in README

## 6. Docker Integration
- [x] 6.1 Create Dockerfile
- [x] 6.2 Add service to docker-compose.yml
- [x] 6.3 Configure networking with other services

## 7. Documentation
- [x] 7.1 Create README with usage instructions
- [x] 7.2 Document available queries and sample queries for Rule of 40
- [x] 7.3 Include example integration configuration

## 8. Testing
- [x] 8.1 Verify GraphQL endpoint responds correctly
- [x] 8.2 Test integration with KPI dashboard GraphQL adapter
- [x] 8.3 Confirm Rule of 40 calculation works end-to-end
