# Change: Display Example Data During Field Mapping

## Why
Per project.md requirement: "Når jeg mapper felter, vil jeg se live-eksempler på data, slik at jeg kan validere mappet umiddelbart."

Currently, the discover fields endpoint returns field schemas with sample data (already in `FieldSchema.sample`), but the MapFieldsStep UI only shows field names and types. Users cannot see actual data values to validate their mapping is correct before committing.

## What Changes
- Update MapFieldsStep UI to display sample values next to each discovered field
- Show sample value with appropriate formatting based on data type
- Add visual styling to distinguish sample data from field metadata
- Truncate long sample values with tooltip for full view

## Impact
- Affected specs: integrations
- Affected code:
  - `frontend/src/features/integrations/wizard/MapFieldsStep.tsx` - Display sample values
  - `frontend/src/types/integration.ts` - Already has `sample` in FieldSchema (no change needed)
  - Backend already returns sample data from `discoverFields()` (no change needed)
