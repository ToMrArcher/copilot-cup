# Proposal: Add Field Search to Integration Wizard

## Summary
Add a search/filter input to the discovered fields list in the Integration Wizard (MapFieldsStep) to allow users to quickly find and select specific fields from potentially large API responses.

## Problem Statement
When an API returns many fields (e.g., CoinGecko returns 30+ cryptocurrency fields), users must scroll through the entire list to find the fields they want to select. This is time-consuming and error-prone, especially when looking for specific field names.

## Proposed Solution
Add a search input above the discovered fields list that filters fields by name in real-time. The search should:
- Filter fields as the user types (case-insensitive)
- Match against field name and path
- Show a count of matching fields
- Clear search easily with a button or by pressing Escape
- Preserve search state while selecting fields

## Scope
- **In Scope:**
  - Search input for filtering discovered fields
  - Real-time filtering as user types
  - Match on field name and path
  - Clear search functionality
  - Visual feedback for filtered results

- **Out of Scope:**
  - Search in selected fields section (already small)
  - Advanced filtering by type
  - Fuzzy matching
  - Search history

## User Stories
1. As a user configuring an integration, I want to search for specific fields so that I can quickly find and select them without scrolling through a long list.

## Dependencies
- None - this is a self-contained frontend enhancement

## Risks
- None identified - minimal change with no backend impact

## Success Criteria
- [ ] Search input is visible above discovered fields list
- [ ] Typing filters the list in real-time
- [ ] Search matches field name and path (case-insensitive)
- [ ] Clear button resets the search
- [ ] Selected fields remain selected after filtering
- [ ] Empty state shown when no fields match search
