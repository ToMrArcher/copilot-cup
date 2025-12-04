# Integration Wizard - Field Search

## ADDED Requirements

### Requirement: REQ-FIELD-SEARCH-001: Search Discovered Fields
The integration wizard field mapping step MUST provide a search input to filter discovered fields by name or path.

#### Scenario: User searches for a specific field
- GIVEN the user is on the field mapping step with discovered fields
- WHEN the user types "price" in the search input
- THEN only fields with "price" in their name or path are displayed
- AND the field count updates to show matching results

#### Scenario: User clears search
- GIVEN the user has entered a search query
- WHEN the user clicks the clear button or presses Escape
- THEN all discovered fields are displayed again
- AND the search input is cleared

#### Scenario: No fields match search
- GIVEN the user is on the field mapping step with discovered fields
- WHEN the user types a query that matches no fields
- THEN a message "No fields match your search" is displayed
