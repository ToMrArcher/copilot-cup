# Design: GraphQL Integration Support

## Context

The integration system currently supports REST APIs, manual data entry, and webhooks. Many enterprise systems (Xledger, Shopify, GitHub, Contentful) now expose data primarily through GraphQL APIs. Users need to connect to these systems to build KPIs.

## Goals / Non-Goals

**Goals:**
- Enable users to connect to any GraphQL endpoint
- Allow users to specify custom queries for maximum flexibility
- Reuse existing authentication mechanisms (bearer, apiKey, basic)
- Integrate seamlessly with existing field discovery and mapping

**Non-Goals:**
- GraphQL schema introspection UI (users provide their own queries)
- GraphQL query builder/designer
- Subscriptions support (polling/scheduled sync only)
- Mutations (read-only data fetching)

## Architecture

### Adapter Pattern

The system uses a pluggable adapter pattern. The `GraphqlAdapter` follows the same interface:

```
┌─────────────────────────────────────────────────────────────┐
│                    IntegrationAdapter                        │
├─────────────────────────────────────────────────────────────┤
│  testConnection(config): ConnectionResult                    │
│  fetchData(config, fieldPaths?, limit?): DataResult          │
│  discoverFields(config): FieldSchema[]                       │
└─────────────────────────────────────────────────────────────┘
          ▲              ▲              ▲              ▲
          │              │              │              │
    ┌─────┴────┐  ┌─────┴────┐  ┌─────┴────┐  ┌─────┴────┐
    │ApiAdapter│  │ManualAdp │  │WebhookAdp│  │GraphqlAdp│
    └──────────┘  └──────────┘  └──────────┘  └──────────┘
                                                   NEW
```

### Configuration Schema

Extend `IntegrationConfig` to include GraphQL fields:

```typescript
interface IntegrationConfig {
  // ... existing fields (url, headers, authType, etc.)
  
  // GraphQL-specific
  query?: string           // The GraphQL query string
  variables?: Record<string, unknown>  // Query variables
  operationName?: string   // For documents with multiple operations
}
```

### Request Flow

```
User Query                Backend                     External GraphQL
───────────────────────────────────────────────────────────────────────
     │                       │                              │
     │  [Save Integration]   │                              │
     ├──────────────────────>│                              │
     │                       │                              │
     │                       │  POST /graphql               │
     │                       │  { query, variables }        │
     │                       ├─────────────────────────────>│
     │                       │                              │
     │                       │  { data: { ... } }           │
     │                       │<─────────────────────────────┤
     │                       │                              │
     │  [Discovered Fields]  │                              │
     │<──────────────────────┤                              │
```

## Decisions

### Decision 1: User-Provided Queries (Not Schema Introspection)

**Rationale:** 
- Many GraphQL APIs disable or restrict introspection
- Users know exactly what data they need
- Simpler implementation without parsing GraphQL schemas
- Avoids needing a query builder UI

**Trade-off:** Users must know GraphQL syntax. This is acceptable because:
- Target users (finance, ops) often have technical support
- Queries can be copied from API documentation
- We can provide example templates

### Decision 2: Standard POST to /graphql Endpoint

**Rationale:**
- 95%+ of GraphQL APIs follow the standard convention
- POST with JSON body containing `query`, `variables`, `operationName`
- Some APIs accept GET with query params, but POST is universal

### Decision 3: Flatten Nested Response for Field Discovery

**Rationale:**
- GraphQL responses are nested objects
- Existing field mapping uses dot-notation paths
- Flatten to paths like `data.company.financials.revenue`

Example response:
```json
{
  "data": {
    "company": {
      "financials": {
        "revenue": 1000000,
        "ebitdaMarginPct": 25.5
      }
    }
  }
}
```

Discovered fields:
- `data.company.financials.revenue` (number)
- `data.company.financials.ebitdaMarginPct` (number)

### Decision 4: Reuse Existing Auth Methods

**Rationale:**
- Most GraphQL APIs use Bearer tokens or API keys
- Our existing `authType`, `apiKey`, `authHeader` fields work perfectly
- No GraphQL-specific auth needed

## Error Handling

| Error | Handling |
|-------|----------|
| Invalid GraphQL syntax | Return error from API, display in UI |
| Authentication failure | Same as REST (401/403 handling) |
| Network timeout | Same as REST (configurable timeout) |
| GraphQL errors array | Extract first error message, display |

## UI Considerations

### Integration Wizard - GraphQL Step

```
┌─────────────────────────────────────────────────────────┐
│  GraphQL Configuration                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Endpoint URL:                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ https://api.xledger.no/graphql                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  GraphQL Query:                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ query GetFinancials($year: Int!) {               │  │
│  │   company {                                       │  │
│  │     financials(year: $year) {                    │  │
│  │       revenue                                     │  │
│  │       revenueGrowthPct                           │  │
│  │       ebitdaMarginPct                            │  │
│  │     }                                             │  │
│  │   }                                               │  │
│  │ }                                                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Variables (JSON, optional):                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │ { "year": 2024 }                                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                           [Test Connection] [Discover]  │
└─────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Users unfamiliar with GraphQL | Provide query examples, link to docs |
| Complex nested responses | Flatten with dot-notation, max depth 5 |
| Large query responses | Apply same limit as REST (100 rows default) |
| Query errors hard to debug | Show full GraphQL error messages |

## Open Questions

1. Should we support GraphQL fragments? (Probably not for MVP)
2. Should we add a "query templates" feature for common systems? (Future enhancement)
3. Should we validate query syntax client-side? (Nice to have, not critical)
