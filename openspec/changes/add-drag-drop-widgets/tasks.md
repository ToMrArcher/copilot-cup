# Tasks: Drag-and-Drop Widget Layout

## Status: 🚧 IN PROGRESS

---

## Phase 1: Setup & Dependencies ✅

### 1.1 Install Dependencies
- [x] Add `react-grid-layout` to frontend package.json
- [x] Add `@types/react-grid-layout` for TypeScript support
- [x] Run npm install and verify no conflicts
- [x] Import react-grid-layout CSS in main styles

---

## Phase 2: Core Implementation ✅

### 2.1 Create DraggableGrid Component
- [x] Create `DraggableGrid.tsx` wrapper component
- [x] Configure ResponsiveGridLayout with breakpoints
- [x] Set up layout state from widget positions
- [x] Implement onLayoutChange handler
- [x] Add grid configuration (cols, rowHeight, margin)

### 2.2 Update DashboardView
- [x] Replace static grid with DraggableGrid
- [x] Convert widgets to grid layout format
- [x] Pass layout change handler to grid
- [x] Handle layout state transformation

### 2.3 Widget Wrapper
- [x] Create widget wrapper with drag handle
- [x] Add data-grid attribute for positioning
- [x] Ensure widgets fill grid cell properly
- [x] Handle widget-specific min/max sizes

---

## Phase 3: Persistence ✅

### 3.1 Save Layout Changes
- [x] Implement debounced save (500ms delay)
- [x] Transform grid layout to API format
- [x] Call updateLayout mutation on change
- [x] Handle save errors gracefully
- [ ] Show save indicator (optional)

### 3.2 Load Layout
- [x] Convert stored positions to grid format
- [x] Handle missing/invalid positions gracefully
- [x] Default positions for new widgets

---

## Phase 4: Visual Polish ✅

### 4.1 Drag Handle Styling
- [x] Add visible drag handle icon
- [x] Show handle on widget hover
- [x] Style cursor states (grab/grabbing)
- [x] Position handle appropriately

### 4.2 Drag Feedback
- [x] Style dragging widget (shadow, opacity)
- [x] Style placeholder (dashed border, brand color)
- [x] Animate widget repositioning
- [x] Ensure smooth transitions

### 4.3 Resize Handle
- [x] Enable resize functionality
- [x] Style resize handle
- [x] Set min/max constraints per widget type
- [x] Update widget on resize end

### 4.4 React-Grid-Layout CSS
- [x] Import base RGL styles
- [x] Override styles to match app theme
- [x] Ensure responsive behavior

---

## Phase 5: Read-Only Mode

### 5.1 Public/Shared Dashboards
- [ ] Pass `isReadOnly` prop to DraggableGrid
- [ ] Disable drag when read-only
- [ ] Disable resize when read-only
- [ ] Hide drag/resize handles in read-only mode

---

## Phase 6: Testing & Refinement

### 6.1 Manual Testing
- [ ] Test drag-and-drop on desktop
- [ ] Test resize on desktop
- [ ] Verify layout persists after refresh
- [ ] Test responsive breakpoints (resize browser)
- [ ] Test on tablet viewport
- [ ] Test on mobile viewport
- [ ] Verify shared dashboards are read-only

### 6.2 Edge Cases
- [ ] Test with single widget
- [ ] Test with many widgets (10+)
- [ ] Test rapid drag operations
- [ ] Test network failure during save
- [ ] Test with various widget types

---

## Definition of Done

- [ ] Widgets can be dragged to new positions
- [ ] Widgets can be resized
- [ ] Layout changes persist to database
- [ ] Visual feedback during drag operations
- [ ] Responsive layout works on all breakpoints
- [ ] Shared dashboards are read-only
- [ ] No console errors or warnings
- [ ] Existing widget functionality unaffected
