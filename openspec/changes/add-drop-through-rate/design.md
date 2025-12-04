# Design: Drop-Through Rate KPI

## Financial Data Extension

### New Fields per Year
```javascript
{
  2024: {
    revenue: 12500000,        // Existing
    ebitda: 1875000,          // Existing
    operatingIncome: 1375000, // Existing
    // NEW FIELDS:
    interestExpense: 100000,  // 100K NOK
    taxExpense: 318750,       // ~25% of pre-tax income
    netProfit: 956250,        // operatingIncome - interest - taxes
  }
}
```

### Drop-Through Calculation
```
Drop-Through Rate = (netProfit / revenue) × 100
                  = (956,250 / 12,500,000) × 100
                  = 7.65%
```

### Sample Data Progression
| Year | Revenue | Net Profit | Drop-Through |
|------|---------|------------|--------------|
| 2023 | 10.0M   | 525K       | 5.25%        |
| 2024 | 12.5M   | 956K       | 7.65%        |
| 2025 | 15.0M   | 1.4M       | 9.33%        |

## GraphQL Query Pattern
```graphql
query {
  revenue: financialSummary(year: 2024, accountType: "REVENUE") {
    total
  }
  netProfit: financialSummary(year: 2024, accountType: "NET_PROFIT") {
    total
  }
}
```

## KPI Setup
- **Integration**: Xledger (existing)
- **Fields**: `revenue_2024.total`, `net_profit_2024.total`
- **Formula**: `(net_profit_2024 / revenue_2024) * 100`
- **Target**: 10% (stretch goal)
