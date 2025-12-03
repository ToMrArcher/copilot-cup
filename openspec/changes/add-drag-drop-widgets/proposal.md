# Change: Add Drag-and-Drop Widget Layout

## Status: 🚧 IN PROGRESS

## Why

The project requirements explicitly state "drag-and-drop layout" under Brukervennlighet (Usability) in project.md. Currently, widgets are displayed in a static grid with no ability to reorder or resize them. Users need to be able to customize their dashboard layout by dragging widgets to new positions and optionally resizing them.

## What Changes

- Add `react-grid-layout` library for drag-and-drop functionality
- Update `DashboardView` component to use grid layout with drag handles
- Enable widget repositioning via drag-and-drop
- Enable widget resizing via resize handles
- Persist layout changes to backend via existing `updateLayout` API
- Add visual feedback during drag operations (placeholder, drop zones)
- Maintain responsive behavior across breakpoints

## Impact

- **Affected specs**: dashboards
- **Affected code**: 
  - `frontend/src/features/dashboard/DashboardView.tsx`
  - `frontend/src/features/dashboard/dashboard.css`
  - `frontend/package.json` (new dependency)
- **Dependencies**: `react-grid-layout` (new npm package)

## Out of Scope

- Widget templates/presets
- Dashboard duplication
- Undo/redo for layout changes
- Keyboard-only drag-and-drop accessibility (future enhancement)

## Technical Approach

Use `react-grid-layout` because:
1. Purpose-built for dashboard layouts with resize + drag
2. Supports 12-column grid system (matches existing CSS)
3. Handles collision detection automatically
4. Built-in responsive breakpoints
5. Maintained, well-documented library

## Acceptance Criteria

1. User can drag any widget to a new position on the dashboard
2. User can resize widgets by dragging corner/edge handles
3. Layout changes persist after page refresh
4. Dragging shows visual placeholder of drop target
5. Widgets cannot overlap (collision detection)
6. Layout remains responsive on tablet/mobile views
7. Read-only shared dashboards do not show drag handles
