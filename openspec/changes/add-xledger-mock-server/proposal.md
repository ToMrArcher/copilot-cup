# Change: Add Xledger Mock Server

## Why
To test and develop the Rule of 40 KPI (Growth Rate + EBITDA Margin) integration, we need a mock server that mimics Xledger's GraphQL API. This enables development and testing without requiring access to a real Xledger account, and provides a realistic data source for KPI calculations.

## What Changes
- Add new `xledger-mock/` service directory alongside `dummy-server/`
- Implement GraphQL endpoint with Apollo Server
- Provide realistic financial data: revenue, EBITDA, costs, margins
- Support period-based queries (current year, previous year)
- Include authentication via bearer token
- Add to Docker Compose for easy deployment

## Impact
- Affected specs: `integrations` (demonstrates GraphQL integration capability)
- Affected code: 
  - New service: `xledger-mock/`
  - Modified: `docker-compose.yml`
- No breaking changes to existing functionality
