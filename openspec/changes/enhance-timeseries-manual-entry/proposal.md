# Change: Enhanced Time Series and Manual Data Entry

## Why
Users need more flexibility in viewing KPI history and entering historical data:
1. **Limited time ranges** - Only 7d/30d/90d available, can't see minute-by-minute changes for debugging or real-time monitoring
2. **No custom date entry** - Manual data always uses "now" as timestamp, can't enter historical survey results with their actual dates
3. **No bulk import** - Can't upload CSV with historical data points

## What Changes

### Time Range Enhancements
- Add shorter time ranges: 1h, 6h, 24h for real-time/debugging views
- Add longer time ranges: 6m, 1y, All time for trend analysis
- Add custom date range picker
- Support hourly/minute aggregation for short periods

### Manual Data Entry Enhancements
- Add optional date picker to specify when data was measured
- Support CSV upload for bulk historical data import
- Allow batch entry of multiple data points with different dates

## Impact
- Affected specs: `integrations`, `dashboard`
- Affected code:
  - Frontend: `ChartWidget.tsx`, `WidgetPicker.tsx`, `ManualDataEntryModal.tsx`
  - Backend: `kpi-history.service.ts`, `integration.router.ts`
- No breaking changes - extends existing functionality
