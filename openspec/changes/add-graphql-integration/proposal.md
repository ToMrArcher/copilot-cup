# Change: Add GraphQL Integration Support

## Why

Many modern enterprise systems (such as Xledger, Shopify, GitHub, etc.) expose their data through GraphQL APIs rather than REST. Currently, our integration system only supports REST API endpoints, limiting users from connecting to these GraphQL-based data sources.

**Use Case Example - Rule of 40:**
To calculate "Rule of 40" (Growth Rate + EBITDA Margin), a company might need:
- Revenue growth from Xledger (GraphQL API)
- EBITDA margin from Xledger (GraphQL API)

Without GraphQL support, users cannot connect to systems like Xledger that only expose GraphQL endpoints.

## What Changes

### Backend
- Add new `GRAPHQL` integration type alongside existing `API`, `MANUAL`, `WEBHOOK` types
- Create `GraphqlAdapter` implementing the `IntegrationAdapter` interface
- Extend `IntegrationConfig` to support GraphQL-specific fields:
  - `query`: The GraphQL query string
  - `variables`: Optional query variables (JSON object)
  - `operationName`: Optional operation name for multi-operation documents
- Update schema to include `GRAPHQL` in `IntegrationType` enum
- Support same authentication methods as REST (bearer, apiKey, basic)

### Frontend
- Add GraphQL option to integration type selector
- Create GraphQL query editor in the integration wizard
- Add query variable input fields
- Show discovered fields from GraphQL response for field mapping

### Integration Flow
1. User selects "GraphQL" as integration type
2. User enters endpoint URL
3. User writes/pastes their GraphQL query
4. User optionally adds query variables
5. System executes query and discovers fields from response
6. User maps discovered fields to data fields

## Impact

- **Affected specs**: Modifies `integrations` capability (adds new adapter type)
- **Affected code**:
  - `backend/prisma/schema.prisma` - Add GRAPHQL to IntegrationType enum
  - `backend/src/modules/integrations/adapter.interface.ts` - Extend IntegrationConfig
  - `backend/src/modules/integrations/adapters/graphql.adapter.ts` - New adapter
  - `backend/src/modules/integrations/adapter.registry.ts` - Register new adapter
  - `frontend/src/features/integrations/` - Update wizard UI
  - `frontend/src/types/integration.ts` - Update types
- **Database migration**: Required (enum change)
- **Breaking changes**: None (additive only)

## Example: Xledger GraphQL Query

```graphql
query GetFinancials($year: Int!) {
  company {
    financials(year: $year) {
      revenue
      revenueGrowthPct
      ebitda
      ebitdaMarginPct
    }
  }
}
```

Variables:
```json
{
  "year": 2024
}
```

This would expose fields like:
- `company.financials.revenue` (number)
- `company.financials.revenueGrowthPct` (number)
- `company.financials.ebitdaMarginPct` (number)

Which can then be used in a KPI formula:
```
revenueGrowth + ebitdaMargin
```
