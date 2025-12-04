# Tasks: Add Field Search to Integration Wizard

## Implementation Checklist

### Phase 1: Add Search Input
- [x] Add `searchQuery` state to `MapFieldsStep` component
- [x] Add search input above the discovered fields list
- [x] Style input with dark mode support
- [x] Add clear button (X) inside input
- [x] Add search icon on left side of input

### Phase 2: Implement Filtering
- [x] Create `filteredFields` computed value from `discoveredFields`
- [x] Filter by field name (case-insensitive)
- [x] Filter by field path (case-insensitive)
- [x] Update the fields list to use `filteredFields`
- [x] Show count of matching fields in header

### Phase 3: UX Enhancements
- [x] Show "No fields match your search" when filter returns empty
- [x] Add keyboard shortcut (Escape) to clear search
- [x] Ensure selected fields remain checked after filtering

## Dependencies
- MapFieldsStep.tsx component

## Notes
- This is a frontend-only change
- No API changes required
- Search should be instant (no debounce needed for small lists)
