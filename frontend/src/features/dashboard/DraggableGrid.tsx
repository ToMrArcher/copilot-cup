/**
 * DraggableGrid Component
 * Wraps react-grid-layout for dashboard widget drag-and-drop
 */

import { useMemo, useCallback, useRef } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import type { Layout } from 'react-grid-layout'
import type { Widget } from '../../types/dashboard'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

// Breakpoint configuration matching our CSS
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480 }
const COLS = { lg: 12, md: 10, sm: 6, xs: 4 }
const ROW_HEIGHT = 100
const MARGIN: [number, number] = [16, 16]

// Min/max constraints per widget type
const WIDGET_CONSTRAINTS: Record<string, { minW: number; minH: number; maxW?: number; maxH?: number }> = {
  number: { minW: 2, minH: 1, maxW: 6, maxH: 2 },
  stat: { minW: 2, minH: 1, maxW: 6, maxH: 2 },
  gauge: { minW: 2, minH: 2, maxW: 6, maxH: 4 },
  line: { minW: 3, minH: 2, maxW: 12, maxH: 6 },
  bar: { minW: 3, minH: 2, maxW: 12, maxH: 6 },
  area: { minW: 3, minH: 2, maxW: 12, maxH: 6 },
  image: { minW: 2, minH: 2, maxW: 12, maxH: 8 },
}

interface DraggableGridProps {
  widgets: Widget[]
  onLayoutChange: (layouts: Array<{ id: string; x: number; y: number; w: number; h: number }>) => void
  isReadOnly?: boolean
  children: React.ReactNode
}

/**
 * Convert widgets to react-grid-layout format
 */
function widgetsToLayout(widgets: Widget[]): Layout[] {
  return widgets.map((widget) => {
    const constraints = WIDGET_CONSTRAINTS[widget.type] || { minW: 2, minH: 1 }
    return {
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: constraints.minW,
      minH: constraints.minH,
      maxW: constraints.maxW,
      maxH: constraints.maxH,
    }
  })
}

/**
 * Convert react-grid-layout format back to our format
 */
function layoutToPositions(layout: Layout[]): Array<{ id: string; x: number; y: number; w: number; h: number }> {
  return layout.map((item) => ({
    id: item.i,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
  }))
}

export function DraggableGrid({ 
  widgets, 
  onLayoutChange, 
  isReadOnly = false,
  children 
}: DraggableGridProps) {
  // Track if layout has actually changed to avoid unnecessary saves
  const lastLayoutRef = useRef<string>('')

  // Memoize initial layout
  const layouts = useMemo(() => {
    const layout = widgetsToLayout(widgets)
    return { lg: layout, md: layout, sm: layout, xs: layout }
  }, [widgets])

  // Handle layout changes
  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    // Use the 'lg' layout as the source of truth
    const lgLayout = allLayouts.lg || currentLayout
    const layoutStr = JSON.stringify(lgLayout.map(l => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })))
    
    // Only trigger if layout actually changed
    if (layoutStr !== lastLayoutRef.current) {
      lastLayoutRef.current = layoutStr
      onLayoutChange(layoutToPositions(lgLayout))
    }
  }, [onLayoutChange])

  return (
    <ResponsiveGridLayout
      className="dashboard-grid-layout"
      layouts={layouts}
      breakpoints={BREAKPOINTS}
      cols={COLS}
      rowHeight={ROW_HEIGHT}
      margin={MARGIN}
      containerPadding={[0, 0]}
      onLayoutChange={handleLayoutChange}
      isDraggable={!isReadOnly}
      isResizable={!isReadOnly}
      draggableHandle=".widget-drag-handle"
      useCSSTransforms={true}
      compactType="vertical"
      preventCollision={false}
    >
      {children}
    </ResponsiveGridLayout>
  )
}
