## Context
The dashboard currently requires manual page refresh to see updated data. Users need automatic refresh capabilities to monitor KPIs in real-time scenarios (e.g., displaying on a TV screen, monitoring during events).

## Goals / Non-Goals
### Goals
- Provide configurable auto-refresh intervals (30s, 1m, 5m, 15m)
- Allow manual refresh with single click
- Show last refresh timestamp for transparency
- Persist settings per dashboard
- Minimal UI footprint in dashboard header

### Non-Goals
- Real-time WebSocket updates (future enhancement)
- Per-widget refresh intervals (keep it simple)
- Server-side push notifications

## Decisions
### Decision: Use React Context for refresh state
- Centralized refresh state accessible by all data-fetching hooks
- Allows `useDashboards()`, `useKpis()` hooks to react to refresh triggers
- Alternative: Prop drilling - rejected due to deep component hierarchy

### Decision: Client-side interval management
- Use `setInterval` in context provider
- Increment a `refreshKey` counter to trigger refetches
- Alternative: Server-sent events - too complex for MVP

### Decision: localStorage for persistence
- Store refresh settings keyed by dashboard ID
- Simple, no backend changes required
- Alternative: Database storage - unnecessary complexity

## Component Architecture

```
AutoRefreshProvider
├── refreshKey: number (increment triggers refetch)
├── interval: 'off' | '30s' | '1m' | '5m' | '15m'
├── lastRefresh: Date
├── setInterval(): void
├── triggerRefresh(): void (manual)
└── isActive: boolean

DashboardHeader
├── RefreshControls
│   ├── IntervalSelector (dropdown)
│   ├── ManualRefreshButton
│   └── LastUpdatedTimestamp
```

## Data Hooks Integration
Existing hooks like `useDashboards()` and `useKpis()` will consume `refreshKey` from context as a query key dependency, causing automatic refetch when incremented.

## Risks / Trade-offs
- **Risk**: Frequent refreshes could overload backend → Mitigation: Minimum 30s interval
- **Risk**: Stale UI during refresh → Mitigation: Show loading indicator
- **Trade-off**: Global refresh vs per-widget → Simplicity wins for MVP

## Open Questions
- None at this time
