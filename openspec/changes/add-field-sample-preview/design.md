## Context
When setting up integrations, users select which fields to import from a data source. Currently they only see field names and inferred types (e.g., "revenue (number)"). Without seeing actual example values, users may:
- Map the wrong field
- Miss data format issues
- Not understand what a cryptically-named field contains

The backend already includes sample data in the `discoverFields` response - it just isn't displayed.

## Goals / Non-Goals
### Goals
- Display sample/example values for each discovered field
- Format sample values appropriately (truncate, format numbers, etc.)
- Keep the UI clean and scannable
- Support all data types (string, number, boolean, date, object, array)

### Non-Goals
- Real-time data preview (use existing FieldPreview for that)
- Edit sample values
- Show multiple sample values per field

## Decisions
### Decision: Inline sample display
- Show sample value directly in the discovered field list row
- Use muted styling to distinguish from field name
- Alternative: Tooltip only - rejected for discoverability

### Decision: Smart truncation
- Truncate strings > 50 characters with ellipsis
- Show full value in tooltip on hover
- Format objects/arrays as JSON preview

### Decision: Type-aware formatting
- Numbers: Use `toLocaleString()` for readability
- Booleans: Show "true"/"false"
- Dates: Format as locale date string
- Objects/Arrays: Show `{...}` or `[...]` preview with length

## UI Layout
```
┌─────────────────────────────────────────────────┐
│ ☑ revenue                                        │
│   number • Example: 12,345.67                   │
├─────────────────────────────────────────────────┤
│ ☑ customer_name                                  │
│   string • Example: "Acme Corporation"          │
├─────────────────────────────────────────────────┤
│ ☐ metadata                                       │
│   object • Example: { id: 123, tags: [...] }    │
└─────────────────────────────────────────────────┘
```

## Risks / Trade-offs
- **Risk**: Sensitive data in samples → Mitigation: Backend should sanitize if needed
- **Trade-off**: More visual density → Samples help validation outweigh clutter
