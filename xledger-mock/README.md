# Xledger Mock Server

A mock GraphQL server that mimics Xledger's API for development and testing of financial KPIs, including **Rule of 40** calculations.

## Quick Start

### Using Docker Compose (Recommended)

```bash
docker-compose up xledger-mock
```

The server will be available at `http://localhost:5001`

### Running Locally

```bash
cd xledger-mock
npm install
npm start
```

## Authentication

All GraphQL queries require a bearer token:

```
Authorization: Bearer xledger-test-token-2024
```

## GraphQL Endpoint

**URL:** `http://localhost:5001/graphql`

## Available Queries

### Financial Summary

Get aggregated financial data by year and account type:

```graphql
query Revenue2024 {
  financialSummary(year: 2024, accountType: "REVENUE") {
    total
    period
    currency
    breakdown {
      category
      amount
    }
  }
}
```

**Account Types:**
- `REVENUE` - Total revenue
- `EBITDA` - Earnings Before Interest, Taxes, Depreciation, and Amortization
- `COSTS` / `OPEX` - Operating expenses
- `GROSS_PROFIT` - Gross profit
- `OPERATING_INCOME` - Operating income

### GL Accounts

List general ledger accounts:

```graphql
query Accounts {
  glAccounts(filter: { year: 2024, accountType: "REVENUE" }) {
    edges {
      node {
        dbId
        code
        description
        accountType
        balance
      }
    }
    totalCount
  }
}
```

### GL Transactions

Get transactions for a period:

```graphql
query Transactions {
  glTransactions(filter: { year: 2024, accountType: "REVENUE" }) {
    edges {
      node {
        dbId
        accountCode
        amount
        period
        description
      }
    }
  }
}
```

### Company Info

```graphql
query Company {
  company {
    dbId
    name
    orgNumber
    currency
  }
}
```

## Rule of 40 Calculation

The mock data is designed to demonstrate Rule of 40:

```
Rule of 40 = Growth Rate (%) + EBITDA Margin (%)
```

### Available Data

| Year | Revenue | EBITDA | Growth Rate | EBITDA Margin | Rule of 40 |
|------|---------|--------|-------------|---------------|------------|
| 2023 | 10,000,000 | 1,200,000 | - | 12% | - |
| 2024 | 12,500,000 | 1,875,000 | 25% | 15% | **40** ✓ |
| 2025 | 15,000,000 | 2,550,000 | 20% | 17% | **37** |

### Query for Rule of 40 Data

```graphql
# Get all data needed for Rule of 40
query RuleOf40Data {
  revenue2024: financialSummary(year: 2024, accountType: "REVENUE") { total }
  revenue2023: financialSummary(year: 2023, accountType: "REVENUE") { total }
  ebitda2024: financialSummary(year: 2024, accountType: "EBITDA") { total }
}
```

**Result:**
```json
{
  "data": {
    "revenue2024": { "total": 12500000 },
    "revenue2023": { "total": 10000000 },
    "ebitda2024": { "total": 1875000 }
  }
}
```

**Calculation:**
```
Growth Rate = (12,500,000 - 10,000,000) / 10,000,000 × 100 = 25%
EBITDA Margin = 1,875,000 / 12,500,000 × 100 = 15%
Rule of 40 = 25% + 15% = 40 ✓
```

## Integration with KPI Dashboard

### Create Integration

1. Go to Integrations → Add New
2. Select **GraphQL** type
3. Configure:
   - **URL:** `http://xledger-mock:5001/graphql` (Docker) or `http://localhost:5001/graphql`
   - **Auth Type:** Bearer
   - **Token:** `xledger-test-token-2024`
   - **Query:**
     ```graphql
     query { financialSummary(year: 2024, accountType: "REVENUE") { total } }
     ```

### Map Fields

After discovering fields, map:
- `total` → `revenue_2024`

Repeat for other metrics (revenue_2023, ebitda_2024).

### Create KPI

Formula for Rule of 40:
```
((revenue_2024 - revenue_2023) / revenue_2023 * 100) + (ebitda_2024 / revenue_2024 * 100)
```

## cURL Examples

```bash
# Health check
curl http://localhost:5001/health

# Query revenue
curl -X POST http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer xledger-test-token-2024" \
  -d '{"query": "{ financialSummary(year: 2024, accountType: \"REVENUE\") { total } }"}'

# Query EBITDA
curl -X POST http://localhost:5001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer xledger-test-token-2024" \
  -d '{"query": "{ financialSummary(year: 2024, accountType: \"EBITDA\") { total } }"}'
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5001 | Server port |

## Endpoints

| Path | Method | Description |
|------|--------|-------------|
| `/` | GET | API info and sample queries |
| `/health` | GET | Health check |
| `/graphql` | POST | GraphQL endpoint (requires auth) |
