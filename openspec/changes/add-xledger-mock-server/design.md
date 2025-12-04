# Design: Xledger Mock Server

## Context
We need to test the GraphQL integration adapter with realistic financial data that matches Xledger's API structure. Based on Xledger's public GraphQL samples, their API uses:
- Connection pattern with edges/nodes/pageInfo for pagination
- Bearer token authentication
- GraphQL endpoint at `/graphql`
- Financial entities: GLAccount, GLTransaction, Project, etc.

## Goals
- Provide drop-in replacement for Xledger GraphQL API during development
- Support queries needed for Rule of 40 KPI calculation
- Match Xledger's response structure for realistic testing
- Easy setup via Docker Compose

## Non-Goals
- Full Xledger API parity (only financial queries needed)
- Mutations or webhooks support
- Real authentication/authorization logic
- Persistent data storage

## Decisions

### Decision: Use Apollo Server Express
**Why**: Industry-standard GraphQL server, good developer experience, built-in playground for testing.
**Alternatives**: 
- graphql-yoga: Lighter weight but less documentation
- express-graphql: Deprecated in favor of graphql-http
- Custom implementation: More work, no benefits

### Decision: Simple JavaScript (no TypeScript)
**Why**: Matches existing `dummy-server/` pattern, faster development, simpler dependencies.
**Alternative**: TypeScript for type safety - overkill for a mock server with static data.

### Decision: Static mock data with period filtering
**Why**: Sufficient for testing KPI calculations, no database needed.
**Alternative**: In-memory data generation - adds complexity without benefits.

### Decision: Match Xledger connection pattern
**Why**: Ensures our GraphQL adapter handles real Xledger responses correctly.

```graphql
# Xledger pattern (from samples):
type Query {
  glAccounts(filter: GLAccountFilter): GLAccountConnection!
  financialSummary(year: Int!, accountType: String): FinancialSummary!
}

type GLAccountConnection {
  edges: [GLAccountEdge!]!
  pageInfo: PageInfo!
}
```

## Data Model

### Financial Data for Rule of 40

```
Rule of 40 = Growth Rate + EBITDA Margin

Growth Rate = (Revenue_2024 - Revenue_2023) / Revenue_2023 * 100
EBITDA Margin = EBITDA_2024 / Revenue_2024 * 100
```

**Mock Data Structure:**
```javascript
{
  years: {
    2023: { revenue: 10_000_000, ebitda: 1_200_000, costs: 8_800_000 },
    2024: { revenue: 12_500_000, ebitda: 1_875_000, costs: 10_625_000 },
    2025: { revenue: 15_000_000, ebitda: 2_550_000, costs: 12_450_000 }
  }
}
// Growth 2024: 25%
// EBITDA Margin 2024: 15%
// Rule of 40: 40 ✓
```

## API Design

### Endpoint
`POST /graphql`

### Authentication
`Authorization: Bearer xledger-test-token-2024`

### Key Queries

```graphql
# Get revenue for a specific year
query Revenue {
  financialSummary(year: 2024, accountType: "REVENUE") {
    total
    period
  }
}

# Get EBITDA for a specific year
query EBITDA {
  financialSummary(year: 2024, accountType: "EBITDA") {
    total
    period
  }
}

# Get all accounts for a period
query Accounts {
  glAccounts(filter: { year: 2024 }) {
    edges {
      node {
        dbId
        code
        description
        balance
        accountType
      }
    }
  }
}
```

## Risks / Trade-offs

- **Risk**: Mock data doesn't match real Xledger structure
  - **Mitigation**: Based on official Xledger GraphQL samples
  
- **Risk**: Changes to real Xledger API break compatibility
  - **Mitigation**: Mock server is for development only; document version it's based on

## Port Assignment
- Port 5001 (to avoid conflict with dummy-server on 5000)
