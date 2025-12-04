# Integrations Spec Delta: Enhanced Manual Data Entry

## ADDED Requirements

### Requirement: Custom Date for Manual Entry
The system SHALL allow users to specify a custom date when entering manual data, enabling historical data entry.

#### Scenario: Enter data with custom date
- **GIVEN** a manual integration with data fields
- **WHEN** user opens the data entry modal
- **THEN** the system SHALL display an optional date picker for "Date recorded"

#### Scenario: Submit data with custom date
- **GIVEN** user has entered values and selected a past date
- **WHEN** user submits the data
- **THEN** the DataValue records SHALL be created with the specified date as `syncedAt`

#### Scenario: Default to current date
- **GIVEN** user has entered values without selecting a date
- **WHEN** user submits the data
- **THEN** the DataValue records SHALL be created with the current timestamp

#### Scenario: Prevent future dates
- **GIVEN** user attempts to enter a date in the future
- **WHEN** user tries to submit
- **THEN** the system SHALL display a validation error

### Requirement: CSV Import for Manual Integrations
The system SHALL allow users to import historical data from CSV files for manual integrations.

#### Scenario: Upload CSV file
- **GIVEN** a manual integration
- **WHEN** user clicks "Upload CSV" in the data entry modal
- **THEN** the system SHALL display a file upload interface

#### Scenario: Preview CSV data
- **GIVEN** user has uploaded a CSV file
- **WHEN** the file is parsed
- **THEN** the system SHALL display a preview of the first few rows

#### Scenario: Map CSV columns to fields
- **GIVEN** CSV preview is displayed
- **WHEN** user views the mapping interface
- **THEN** the system SHALL allow mapping CSV columns to integration data fields

#### Scenario: Specify date column
- **GIVEN** CSV preview is displayed
- **WHEN** user configures import
- **THEN** the system SHALL allow specifying which column contains the date

#### Scenario: Import CSV data
- **GIVEN** user has configured column mappings
- **WHEN** user clicks "Import"
- **THEN** the system SHALL create DataValue records for each row with the specified dates

#### Scenario: Import error handling
- **GIVEN** CSV contains invalid data (bad dates, non-numeric values)
- **WHEN** import is attempted
- **THEN** the system SHALL report which rows failed and why

### Requirement: Bulk Manual Entry
The system SHALL allow users to enter multiple data points with different dates in a single session.

#### Scenario: Add another data point
- **GIVEN** user is in the data entry modal
- **WHEN** user clicks "Add another entry"
- **THEN** the system SHALL display additional input fields with a new date picker

#### Scenario: Submit multiple entries
- **GIVEN** user has entered multiple data points with different dates
- **WHEN** user submits
- **THEN** the system SHALL create DataValue records for each entry with their respective dates
