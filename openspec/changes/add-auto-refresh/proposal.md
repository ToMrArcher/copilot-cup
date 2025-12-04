# Change: Add Auto-Refresh for Dashboard Data

## Why
Users need dashboards to show fresh data without manual intervention. Currently, users must manually refresh the page to see updated KPI values. Per project.md requirement 6: "Når jeg trenger oppdaterte tall, vil jeg trigge refresh manuelt eller tidsstyre den, slik at dashboardet alltid viser ferske data."

## What Changes
- Add auto-refresh toggle and interval selector to dashboard header
- Create RefreshContext to manage refresh state globally
- Support configurable refresh intervals: Off, 30s, 1m, 5m, 15m
- Add manual refresh button with last-updated timestamp
- Persist refresh settings per dashboard in localStorage
- Show visual indicator when auto-refresh is active

## Impact
- Affected specs: dashboard
- Affected code: 
  - `frontend/src/contexts/` - New AutoRefreshContext
  - `frontend/src/features/dashboard/` - Dashboard header controls
  - `frontend/src/hooks/` - Integration with existing data hooks
