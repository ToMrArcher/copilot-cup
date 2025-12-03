## Context
This feature enables users to connect data sources to the KPI platform without coding. It must support multiple integration types (API, Manual input, Webhooks) and be extensible for future sources.

Key user stories from requirements:
- "Når jeg kobler på en ny datakilde, vil jeg konfigurere tilgang og felter i et visuelt grensesnitt"
- "Når jeg legger inn API-nøkler eller OAuth-tokens, vil jeg at systemet håndterer dem sikkert"
- "Når jeg mapper felter, vil jeg se live-eksempler på data"

## Goals / Non-Goals

### Goals
- Wizard-style UI for adding integrations step-by-step
- Pluggable adapter pattern for different source types
- Encrypted storage for API keys and OAuth tokens
- Live data preview when configuring field mappings
- Sync status and error logging
- Rate limiting awareness

### Non-Goals
- OAuth flow implementation (defer to auth proposal)
- Specific third-party API integrations (users configure at runtime)
- Webhook endpoint creation (Phase 2)
- Scheduling/cron for automatic sync (Phase 2)

## Decisions

### Adapter Pattern
**Decision**: Use an Adapter interface that all integration types implement
**Rationale**: Allows adding new source types without changing core logic
```typescript
interface IntegrationAdapter {
  type: IntegrationType
  testConnection(config: EncryptedConfig): Promise<ConnectionResult>
  fetchData(config: EncryptedConfig, fields: DataField[]): Promise<DataResult>
  discoverFields(config: EncryptedConfig): Promise<FieldSchema[]>
}
```

### Credential Encryption
**Decision**: Use AES-256-GCM encryption for credentials stored in database
**Rationale**: Industry standard, built into Node.js crypto module
**Implementation**: Encrypt before save, decrypt only when needed for API calls

### UI Wizard Flow
**Decision**: 4-step wizard: Type → Connection → Fields → Review
**Rationale**: Breaks complex setup into manageable steps, matches "visual interface" requirement

### Live Preview
**Decision**: Fetch sample data (limit 5 rows) when user maps fields
**Rationale**: Immediate feedback validates mapping without full sync

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Integration │  │ Field Mapper │  │  Data Preview  │ │
│  │   Wizard    │  │  Component   │  │   Component    │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────┐
│                    Backend                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │           Integration Service                        ││
│  │  ┌─────────┐  ┌─────────┐  ┌──────────────────────┐ ││
│  │  │ Crypto  │  │ Adapter │  │   Sync Manager       │ ││
│  │  │ Service │  │ Registry│  │ (status, logging)    │ ││
│  │  └─────────┘  └─────────┘  └──────────────────────┘ ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │              Adapters                                ││
│  │  ┌─────────┐  ┌──────────┐  ┌──────────────────┐   ││
│  │  │   API   │  │  Manual  │  │    Webhook       │   ││
│  │  │ Adapter │  │  Adapter │  │    Adapter       │   ││
│  │  └─────────┘  └──────────┘  └──────────────────┘   ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Credential exposure in logs | Never log decrypted values, use placeholder `***` |
| API rate limits | Implement caching layer, respect rate limit headers |
| Field mapping complexity | Start with simple JSON path, add visual builder later |

## Open Questions
- [x] Should we support OAuth in Phase 1? **Decision: No, defer to auth module**
- [x] How to handle nested JSON responses? **Decision: Use JSON path notation (e.g., `$.data.items[0].value`)**
