import { Router, Request, Response } from 'express'
import { prisma } from '../../db/client'
import { calculateKpi } from '../../services/kpi-calculator.service'

export const dashboardRouter = Router()

// ============ Dashboard CRUD ============

/**
 * GET /api/dashboards
 * List all dashboards
 */
dashboardRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const dashboards = await prisma.dashboard.findMany({
      include: {
        widgets: {
          select: { id: true, type: true },
        },
        _count: {
          select: { widgets: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    res.json({ dashboards })
  } catch (error) {
    console.error('Error listing dashboards:', error)
    res.status(500).json({ error: 'Failed to list dashboards' })
  }
})

/**
 * GET /api/dashboards/:id
 * Get a single dashboard with all widgets and KPI data
 */
dashboardRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: req.params.id },
      include: {
        widgets: {
          include: {
            kpi: {
              include: {
                sources: {
                  include: {
                    dataField: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!dashboard) {
      res.status(404).json({ error: 'Dashboard not found' })
      return
    }

    // Calculate current values for all KPIs in widgets
    const widgetsWithKpiData = await Promise.all(
      dashboard.widgets.map(async widget => {
        if (!widget.kpi) {
          return { ...widget, kpiData: null }
        }

        const calculation = await calculateKpi({
          id: widget.kpi.id,
          name: widget.kpi.name,
          formula: widget.kpi.formula,
          targetValue: widget.kpi.targetValue,
          targetDirection: widget.kpi.targetDirection,
          sources: widget.kpi.sources,
        })

        return {
          ...widget,
          kpiData: {
            currentValue: calculation.currentValue,
            targetValue: widget.kpi.targetValue,
            progress: calculation.progress,
            onTrack: calculation.onTrack,
            error: calculation.error,
          },
        }
      })
    )

    res.json({
      ...dashboard,
      widgets: widgetsWithKpiData,
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard' })
  }
})

/**
 * POST /api/dashboards
 * Create a new dashboard
 */
dashboardRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, ownerId } = req.body as {
      name: string
      ownerId?: string
    }

    if (!name) {
      res.status(400).json({ error: 'Name is required' })
      return
    }

    // For now, use a default owner ID or create one
    // In production, this would come from auth
    let effectiveOwnerId = ownerId

    if (!effectiveOwnerId) {
      // Get or create a default user
      let defaultUser = await prisma.user.findFirst()
      if (!defaultUser) {
        defaultUser = await prisma.user.create({
          data: {
            email: 'default@example.com',
            name: 'Default User',
            role: 'ADMIN',
          },
        })
      }
      effectiveOwnerId = defaultUser.id
    }

    const dashboard = await prisma.dashboard.create({
      data: {
        name,
        ownerId: effectiveOwnerId,
        layout: {},
      },
      include: {
        widgets: true,
      },
    })

    res.status(201).json(dashboard)
  } catch (error) {
    console.error('Error creating dashboard:', error)
    res.status(500).json({ error: 'Failed to create dashboard' })
  }
})

/**
 * PUT /api/dashboards/:id
 * Update dashboard name and/or layout
 */
dashboardRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, layout } = req.body as {
      name?: string
      layout?: Record<string, unknown>
    }

    const existing = await prisma.dashboard.findUnique({
      where: { id: req.params.id },
    })

    if (!existing) {
      res.status(404).json({ error: 'Dashboard not found' })
      return
    }

    const dashboard = await prisma.dashboard.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(layout && { layout }),
      },
      include: {
        widgets: true,
      },
    })

    res.json(dashboard)
  } catch (error) {
    console.error('Error updating dashboard:', error)
    res.status(500).json({ error: 'Failed to update dashboard' })
  }
})

/**
 * DELETE /api/dashboards/:id
 * Delete a dashboard and all its widgets
 */
dashboardRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.dashboard.findUnique({
      where: { id: req.params.id },
    })

    if (!existing) {
      res.status(404).json({ error: 'Dashboard not found' })
      return
    }

    await prisma.dashboard.delete({
      where: { id: req.params.id },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting dashboard:', error)
    res.status(500).json({ error: 'Failed to delete dashboard' })
  }
})

// ============ Widget CRUD ============

/**
 * POST /api/dashboards/:id/widgets
 * Add a widget to a dashboard
 */
dashboardRouter.post('/:id/widgets', async (req: Request, res: Response) => {
  try {
    const dashboardId = req.params.id
    const { type, kpiId, config, position } = req.body as {
      type: string
      kpiId?: string
      config?: Record<string, unknown>
      position: { x: number; y: number; w: number; h: number }
    }

    // Validate dashboard exists
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
    })

    if (!dashboard) {
      res.status(404).json({ error: 'Dashboard not found' })
      return
    }

    // Validate required fields
    if (!type) {
      res.status(400).json({ error: 'Widget type is required' })
      return
    }

    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
      res.status(400).json({ error: 'Widget position is required with x, y, w, h' })
      return
    }

    // Validate KPI if provided
    if (kpiId) {
      const kpi = await prisma.kpi.findUnique({ where: { id: kpiId } })
      if (!kpi) {
        res.status(400).json({ error: 'KPI not found' })
        return
      }
    }

    const widget = await prisma.widget.create({
      data: {
        dashboardId,
        type,
        kpiId: kpiId || null,
        config: config || {},
        position: {
          x: position.x,
          y: position.y,
          w: position.w || 3,
          h: position.h || 2,
        },
      },
      include: {
        kpi: true,
      },
    })

    res.status(201).json(widget)
  } catch (error) {
    console.error('Error creating widget:', error)
    res.status(500).json({ error: 'Failed to create widget' })
  }
})

/**
 * PUT /api/dashboards/:id/widgets/:widgetId
 * Update a widget's config or position
 */
dashboardRouter.put('/:id/widgets/:widgetId', async (req: Request, res: Response) => {
  try {
    const { id: dashboardId, widgetId } = req.params
    const { type, kpiId, config, position } = req.body as {
      type?: string
      kpiId?: string | null
      config?: Record<string, unknown>
      position?: { x: number; y: number; w: number; h: number }
    }

    // Validate widget exists and belongs to dashboard
    const existing = await prisma.widget.findUnique({
      where: { id: widgetId },
    })

    if (!existing || existing.dashboardId !== dashboardId) {
      res.status(404).json({ error: 'Widget not found' })
      return
    }

    // Validate KPI if being changed
    if (kpiId !== undefined && kpiId !== null) {
      const kpi = await prisma.kpi.findUnique({ where: { id: kpiId } })
      if (!kpi) {
        res.status(400).json({ error: 'KPI not found' })
        return
      }
    }

    const widget = await prisma.widget.update({
      where: { id: widgetId },
      data: {
        ...(type && { type }),
        ...(kpiId !== undefined && { kpiId }),
        ...(config && { config }),
        ...(position && { position }),
      },
      include: {
        kpi: true,
      },
    })

    res.json(widget)
  } catch (error) {
    console.error('Error updating widget:', error)
    res.status(500).json({ error: 'Failed to update widget' })
  }
})

/**
 * DELETE /api/dashboards/:id/widgets/:widgetId
 * Remove a widget from a dashboard
 */
dashboardRouter.delete('/:id/widgets/:widgetId', async (req: Request, res: Response) => {
  try {
    const { id: dashboardId, widgetId } = req.params

    // Validate widget exists and belongs to dashboard
    const existing = await prisma.widget.findUnique({
      where: { id: widgetId },
    })

    if (!existing || existing.dashboardId !== dashboardId) {
      res.status(404).json({ error: 'Widget not found' })
      return
    }

    await prisma.widget.delete({
      where: { id: widgetId },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting widget:', error)
    res.status(500).json({ error: 'Failed to delete widget' })
  }
})

/**
 * PUT /api/dashboards/:id/layout
 * Batch update widget positions (for drag-and-drop)
 */
dashboardRouter.put('/:id/layout', async (req: Request, res: Response) => {
  try {
    const dashboardId = req.params.id
    const { layout, widgets } = req.body as {
      layout?: Record<string, unknown>
      widgets?: Array<{ id: string; position: { x: number; y: number; w: number; h: number } }>
    }

    // Validate dashboard exists
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
    })

    if (!dashboard) {
      res.status(404).json({ error: 'Dashboard not found' })
      return
    }

    // Update dashboard layout
    if (layout) {
      await prisma.dashboard.update({
        where: { id: dashboardId },
        data: { layout },
      })
    }

    // Batch update widget positions
    if (widgets && widgets.length > 0) {
      await Promise.all(
        widgets.map(w =>
          prisma.widget.update({
            where: { id: w.id },
            data: { position: w.position },
          })
        )
      )
    }

    // Return updated dashboard
    const updated = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
      include: {
        widgets: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    res.json(updated)
  } catch (error) {
    console.error('Error updating layout:', error)
    res.status(500).json({ error: 'Failed to update layout' })
  }
})
