# Tasks: Enhanced Time Series and Manual Data Entry

## 1. Time Range Options (Frontend)
- [ ] 1.1 Add new time range options to ChartWidget: 1h, 6h, 24h, 6m, 1y, all
- [ ] 1.2 Add same options to WidgetPicker period selector
- [ ] 1.3 Add custom date range picker component
- [ ] 1.4 Update period selector styling for more options

## 2. Time Range Support (Backend)
- [ ] 2.1 Update `parsePeriod()` to handle new periods (1h, 6h, 6m, 1y, all)
- [ ] 2.2 Update `getDefaultInterval()` for appropriate aggregation (minute for <1h, hourly for <24h)
- [ ] 2.3 Add custom date range endpoint parameter support
- [ ] 2.4 Ensure minute-level data is preserved in DataValue

## 3. Custom Date for Manual Entry (Frontend)
- [ ] 3.1 Add date picker to ManualDataEntryModal
- [ ] 3.2 Make date picker optional (defaults to "now")
- [ ] 3.3 Add time picker for more precision if needed
- [ ] 3.4 Update UI to show "Date recorded" field

## 4. Custom Date for Manual Entry (Backend)
- [ ] 4.1 Accept optional `recordedAt` timestamp in POST /integrations/:id/data
- [ ] 4.2 Use `recordedAt` instead of `new Date()` when provided
- [ ] 4.3 Validate date is not in the future
- [ ] 4.4 Update API documentation

## 5. CSV Import (Frontend)
- [ ] 5.1 Add CSV upload button to ManualDataEntryModal
- [ ] 5.2 Create CSV preview/mapping interface
- [ ] 5.3 Allow mapping columns to fields + date column
- [ ] 5.4 Show import progress and results

## 6. CSV Import (Backend)
- [ ] 6.1 Create POST /integrations/:id/import endpoint
- [ ] 6.2 Parse CSV with configurable column mapping
- [ ] 6.3 Validate and bulk insert DataValues
- [ ] 6.4 Return import summary (rows imported, errors)

## 7. Testing
- [ ] 7.1 Test new time ranges display correctly
- [ ] 7.2 Test minute-level aggregation
- [ ] 7.3 Test custom date entry saves with correct timestamp
- [ ] 7.4 Test CSV import with various formats
