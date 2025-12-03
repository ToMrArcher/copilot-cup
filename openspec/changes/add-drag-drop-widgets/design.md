# Design: Drag-and-Drop Widget Layout

## Technical Decision: Library Choice

### Selected: `react-grid-layout`

**Rationale:**
- Purpose-built for dashboard widget layouts
- Native support for drag, drop, and resize
- 12-column grid system matches existing implementation
- Automatic collision detection and repositioning
- Built-in responsive breakpoints (`lg`, `md`, `sm`, `xs`)
- TypeScript definitions available (`@types/react-grid-layout`)
- Active maintenance, 18k+ GitHub stars

**Alternatives Considered:**

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| `@dnd-kit` | Modern, lightweight, accessible | No built-in grid/resize, more work | Rejected |
| `react-beautiful-dnd` | Great for lists | Poor grid support, archived | Rejected |
| `react-dnd` | Flexible | Low-level, much boilerplate | Rejected |

## Architecture

### Component Structure

```
DashboardView
├── ReactGridLayout (or ResponsiveGridLayout)
│   ├── WidgetWrapper (key=widget.id)
│   │   ├── DragHandle
│   │   └── WidgetRenderer
│   │       └── NumberWidget | StatWidget | GaugeWidget | ChartWidget
│   └── ... more widgets
```

### Data Flow

```
User drags widget
    ↓
react-grid-layout emits onLayoutChange(newLayout)
    ↓
Transform layout to UpdateLayoutRequest format
    ↓
Call updateLayout mutation (debounced 500ms)
    ↓
Backend persists widget positions
    ↓
React Query cache updated
```

## Layout Format

### react-grid-layout format:
```typescript
interface LayoutItem {
  i: string      // widget ID
  x: number      // grid column (0-11)
  y: number      // grid row
  w: number      // width in columns
  h: number      // height in rows
  minW?: number  // min width
  minH?: number  // min height
  maxW?: number  // max width
  maxH?: number  // max height
  static?: boolean // prevent drag/resize
}
```

### Existing WidgetPosition format:
```typescript
interface WidgetPosition {
  x: number
  y: number
  w: number
  h: number
}
```

**Compatibility:** Direct mapping - both use same x, y, w, h properties.

## Responsive Breakpoints

| Breakpoint | Columns | Row Height | Notes |
|------------|---------|------------|-------|
| lg (≥1200px) | 12 | 100px | Full desktop |
| md (≥996px) | 10 | 90px | Small desktop |
| sm (≥768px) | 6 | 80px | Tablet |
| xs (<768px) | 4 | 70px | Mobile |

## Visual Design

### Drag Handle
- Visible on widget hover (top-left or top-center)
- Icon: 6-dot grip pattern (⠿)
- Cursor: `grab` / `grabbing`

### During Drag
- Dragged widget: slight opacity reduction, shadow lift
- Placeholder: dashed border, semi-transparent background
- Other widgets: subtle animation when repositioning

### Resize Handle
- Visible on widget hover (bottom-right corner)
- Icon: diagonal resize arrows or corner grip
- Cursor: `nwse-resize`

### Read-Only Mode (Shared Dashboards)
- No drag handles visible
- No resize handles visible
- CSS class: `.dashboard-widget.readonly`

## Performance Considerations

1. **Debounce save**: Wait 500ms after drag ends before API call
2. **Optimistic updates**: Update local state immediately
3. **Batch updates**: Send all widget positions in single request
4. **Memoization**: Memoize WidgetRenderer to prevent re-renders during drag

## CSS Changes

```css
/* New styles for drag-drop */
.react-grid-layout {
  /* Override default RGL styles */
}

.react-grid-item.react-draggable-dragging {
  opacity: 0.8;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  z-index: 100;
}

.react-grid-placeholder {
  background: rgba(139, 92, 246, 0.2);
  border: 2px dashed rgb(139, 92, 246);
  border-radius: 0.5rem;
}

.widget-drag-handle {
  cursor: grab;
  /* positioning styles */
}

.widget-drag-handle:active {
  cursor: grabbing;
}
```

## API Integration

Uses existing endpoint:
```
PATCH /api/dashboards/:id/layout
Body: {
  widgets: [
    { id: "widget-1", position: { x: 0, y: 0, w: 4, h: 2 } },
    { id: "widget-2", position: { x: 4, y: 0, w: 4, h: 2 } },
    ...
  ]
}
```

No backend changes required.
