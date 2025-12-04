## ADDED Requirements

### Requirement: Field Sample Preview
The system SHALL display example data values for each discovered field during integration mapping.

#### Scenario: Sample value displayed for discovered fields
- **WHEN** user views discovered fields in the MapFieldsStep
- **THEN** each field shows its sample value alongside name and type
- **AND** sample values are formatted appropriately for their data type

#### Scenario: Long sample values are truncated
- **WHEN** a sample value exceeds 50 characters
- **THEN** the display shows a truncated version with ellipsis
- **AND** the full value is available on hover/tooltip

#### Scenario: Missing sample value handled gracefully
- **WHEN** a field has no sample value (null/undefined)
- **THEN** the UI shows a placeholder like "—" or "No sample"
- **AND** the field remains selectable for mapping
