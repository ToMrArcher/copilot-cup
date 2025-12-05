# Tasks: Add Image Widget to Dashboards

## Phase 1: Type Definitions

- [x] **1.1** Add `image` to WidgetType enum in `frontend/src/types/dashboard.ts`
- [x] **1.2** Add image-specific config fields to WidgetConfig interface

## Phase 2: Widget Picker

- [x] **2.1** Add "Image" option to widget types array in `WidgetPicker.tsx`
- [x] **2.2** Add default position/size for image widget
- [x] **2.3** Create image URL input step (skip KPI selection for images)
- [x] **2.4** Add live image preview in configuration step
- [x] **2.5** Add alt text and object-fit options

## Phase 3: Widget Rendering

- [x] **3.1** Create `ImageWidget.tsx` component
  - Display image with proper sizing
  - Handle loading and error states
  - Show optional caption
  - Include delete button on hover

- [x] **3.2** Add image case to widget render switch in `DashboardView.tsx`

- [x] **3.3** Add image widget constraints to `DraggableGrid.tsx`

## Phase 4: Testing & Polish

- [ ] **4.1** Test adding image widget via widget picker
- [ ] **4.2** Test drag-and-drop repositioning
- [ ] **4.3** Test resizing behavior
- [ ] **4.4** Test with various image URLs (valid, invalid, slow-loading)
- [ ] **4.5** Test in dark mode
