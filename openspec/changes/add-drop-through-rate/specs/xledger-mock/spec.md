# Xledger Mock Spec

## ADDED Requirements

### Requirement: NET_PROFIT_QUERY
The Xledger mock server MUST support querying net profit data via the financialSummary GraphQL query.

#### Scenario: Query net profit for a specific year
Given the Xledger mock server is running
When a client sends a GraphQL query for financialSummary with year 2024 and accountType "NET_PROFIT"
Then the response should include the net profit total for that year
And the response should include a breakdown showing operating income minus interest and taxes

#### Scenario: Net profit data is available for all years
Given the Xledger mock server is running
When a client queries net profit for years 2023, 2024, and 2025
Then each year should return a valid net profit amount
And the net profit should equal operatingIncome minus interestExpense minus taxExpense
