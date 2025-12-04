import { Router, Request, Response } from 'express'
import { prisma } from '../../db/client'
import { calculateKpi } from '../../services/kpi-calculator.service'
import { 
  getAccessibleDashboardsFilter, 
  canAccessDashboard,
  PermissionContext 
} from '../../services/permission.service'
import { getPermissionContext } from '../../middleware/permission.middleware'

export const dashboardRouter = Router()

// ============ Dashboard CRUD ============

/**
 * GET /api/dashboards
 * List all dashboards the user can access
 */
dashboardRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Get permission context from authenticated user
    const ctx = getPermissionContext(req)
    
    // Build filter based on user access
    const accessFilter = ctx ? getAccessibleDashboardsFilter(ctx) : {}
    
    const dashboards = await prisma.dashboard.findMany({
      where: accessFilter,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        widgets: {
          select: { id: true, type: true },
        },
        accessList: {
          select: { userId: true, permission: true },
        },
        _count: {
          select: { widgets: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Add access flags for each dashboard
    const dashboardsWithAccess = dashboards.map(d => {
      const isOwner = ctx ? d.ownerId === ctx.userId : false
      const isAdmin = ctx?.userRole === 'ADMIN'
      const hasEditAccess = d.accessList?.some(a => a.userId === ctx?.userId && a.permission === 'EDIT') || false
      
      return {
        ...d,
        isOwner,
        // Admins and owners can edit/manage, otherwise check access list
        canEdit: isOwner || isAdmin || hasEditAccess,
        // Owners and admins have full manage (delete, transfer ownership)
        canManage: isOwner || isAdmin,
        // Editors can also share (grant/revoke access)
        canShare: isOwner || isAdmin || hasEditAccess,
      }
    })

    res.json({ dashboards: dashboardsWithAccess })
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
    const ctx = getPermissionContext(req)
    
    // Check view permission
    if (ctx) {
      const hasAccess = await canAccessDashboard(ctx, req.params.id, 'VIEW')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' })
        return
      }
    }

    const dashboard = await prisma.dashboard.findUnique({
      where: { id: req.params.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
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

    // Determine user's permission level
    let canEdit = false
    let canManage = false
    let canShare = false
    if (ctx) {
      canEdit = await canAccessDashboard(ctx, req.params.id, 'EDIT')
      canManage = await canAccessDashboard(ctx, req.params.id, 'MANAGE')
      canShare = await canAccessDashboard(ctx, req.params.id, 'SHARE')
    }

    res.json({
      ...dashboard,
      widgets: widgetsWithKpiData,
      isOwner: ctx ? dashboard.ownerId === ctx.userId : false,
      canEdit,
      canManage,
      canShare,
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
    const { name } = req.body as {
      name: string
    }

    if (!name) {
      res.status(400).json({ error: 'Name is required' })
      return
    }

    // Get owner from authenticated user
    const ctx = getPermissionContext(req)
    let ownerId: string

    if (ctx) {
      ownerId = ctx.userId
    } else {
      // Fallback for unauthenticated requests (backwards compatibility)
      let defaultUser = await prisma.user.findFirst()
      if (!defaultUser) {
        defaultUser = await prisma.user.create({
          data: {
            email: 'default@example.com',
            passwordHash: '',
            name: 'Default User',
            role: 'ADMIN',
          },
        })
      }
      ownerId = defaultUser.id
    }

    const dashboard = await prisma.dashboard.create({
      data: {
        name,
        ownerId,
        layout: {},
      },
      include: {
        widgets: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    res.status(201).json({ ...dashboard, isOwner: true, canEdit: true, canManage: true })
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
    const ctx = getPermissionContext(req)
    
    // Check edit permission
    if (ctx) {
      const hasAccess = await canAccessDashboard(ctx, req.params.id, 'EDIT')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. You need edit permission.' })
        return
      }
    }

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
        owner: {
          select: { id: true, name: true, email: true },
        },
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
    const ctx = getPermissionContext(req)
    
    // Check delete permission (only owner or admin)
    if (ctx) {
      const hasAccess = await canAccessDashboard(ctx, req.params.id, 'DELETE')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. Only the owner can delete this dashboard.' })
        return
      }
    }

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
    const ctx = getPermissionContext(req)
    
    // Check edit permission
    if (ctx) {
      const hasAccess = await canAccessDashboard(ctx, dashboardId, 'EDIT')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. You need edit permission.' })
        return
      }
    }

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
    const ctx = getPermissionContext(req)
    
    // Check edit permission
    if (ctx) {
      const hasAccess = await canAccessDashboard(ctx, dashboardId, 'EDIT')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. You need edit permission.' })
        return
      }
    }

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
    const ctx = getPermissionContext(req)
    
    // Check edit permission
    if (ctx) {
      const hasAccess = await canAccessDashboard(ctx, dashboardId, 'EDIT')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. You need edit permission.' })
        return
      }
    }

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
    const ctx = getPermissionContext(req)
    
    // Check edit permission
    if (ctx) {
      const hasAccess = await canAccessDashboard(ctx, dashboardId, 'EDIT')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. You need edit permission.' })
        return
      }
    }

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

// ============ Access Control ============

/**
 * GET /api/dashboards/:id/access
 * List users with access to this dashboard
 */
dashboardRouter.get('/:id/access', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    
    // Check manage permission (only owner can see access list)
    if (ctx) {
      const hasAccess = await canAccessDashboard(ctx, req.params.id, 'MANAGE')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. Only the owner can manage access.' })
        return
      }
    }

    const dashboard = await prisma.dashboard.findUnique({
      where: { id: req.params.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        accessList: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { grantedAt: 'desc' },
        },
      },
    })

    if (!dashboard) {
      res.status(404).json({ error: 'Dashboard not found' })
      return
    }

    res.json({
      owner: dashboard.owner,
      accessList: dashboard.accessList.map(a => ({
        userId: a.user.id,
        userName: a.user.name,
        userEmail: a.user.email,
        permission: a.permission,
        grantedAt: a.grantedAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching access list:', error)
    res.status(500).json({ error: 'Failed to fetch access list' })
  }
})

/**
 * POST /api/dashboards/:id/access
 * Grant access to a user
 */
dashboardRouter.post('/:id/access', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    
    // Check share permission (owners, admins, and editors can share)
    if (ctx) {
      const hasAccess = await canAccessDashboard(ctx, req.params.id, 'SHARE')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. You need edit access to share this dashboard.' })
        return
      }
    }

    const { userId, email, permission } = req.body as {
      userId?: string
      email?: string
      permission: 'VIEW' | 'EDIT'
    }

    if (!permission || !['VIEW', 'EDIT'].includes(permission)) {
      res.status(400).json({ error: 'Permission must be VIEW or EDIT' })
      return
    }

    // Find user by ID or email
    let targetUserId = userId
    if (!targetUserId && email) {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }
      targetUserId = user.id
    }

    if (!targetUserId) {
      res.status(400).json({ error: 'userId or email is required' })
      return
    }

    // Check if granting to self (owner)
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: req.params.id },
    })

    if (dashboard?.ownerId === targetUserId) {
      res.status(400).json({ error: 'Cannot grant access to the owner' })
      return
    }

    // Upsert access entry
    const access = await prisma.dashboardAccess.upsert({
      where: {
        dashboardId_userId: {
          dashboardId: req.params.id,
          userId: targetUserId,
        },
      },
      update: {
        permission,
        grantedById: ctx?.userId,
      },
      create: {
        dashboardId: req.params.id,
        userId: targetUserId,
        permission,
        grantedById: ctx?.userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    res.status(201).json({
      userId: access.user.id,
      userName: access.user.name,
      userEmail: access.user.email,
      permission: access.permission,
      grantedAt: access.grantedAt,
    })
  } catch (error) {
    console.error('Error granting access:', error)
    res.status(500).json({ error: 'Failed to grant access' })
  }
})

/**
 * PATCH /api/dashboards/:id/access/:userId
 * Update a user's permission level
 */
dashboardRouter.patch('/:id/access/:userId', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    
    // Check share permission (owners, admins, and editors can update access)
    if (ctx) {
      const hasAccess = await canAccessDashboard(ctx, req.params.id, 'SHARE')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. You need edit access to update permissions.' })
        return
      }
    }

    const { permission } = req.body as { permission: 'VIEW' | 'EDIT' }

    if (!permission || !['VIEW', 'EDIT'].includes(permission)) {
      res.status(400).json({ error: 'Permission must be VIEW or EDIT' })
      return
    }

    const access = await prisma.dashboardAccess.update({
      where: {
        dashboardId_userId: {
          dashboardId: req.params.id,
          userId: req.params.userId,
        },
      },
      data: { permission },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    res.json({
      userId: access.user.id,
      userName: access.user.name,
      userEmail: access.user.email,
      permission: access.permission,
      grantedAt: access.grantedAt,
    })
  } catch (error) {
    console.error('Error updating access:', error)
    res.status(500).json({ error: 'Failed to update access' })
  }
})

/**
 * DELETE /api/dashboards/:id/access/:userId
 * Revoke a user's access
 */
dashboardRouter.delete('/:id/access/:userId', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    
    // Check share permission (owners, admins, and editors can revoke access)
    if (ctx) {
      const hasAccess = await canAccessDashboard(ctx, req.params.id, 'SHARE')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. You need edit access to revoke permissions.' })
        return
      }
    }

    // Get dashboard to check ownership
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: req.params.id },
      select: { ownerId: true },
    })

    // Check if trying to remove owner's access (not allowed)
    if (dashboard?.ownerId === req.params.userId) {
      res.status(403).json({ error: 'Cannot revoke owner access' })
      return
    }

    // Check if target user is an admin (non-admins cannot revoke admin access)
    const targetUser = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { role: true },
    })

    if (targetUser?.role === 'ADMIN' && ctx?.userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Only admins can revoke admin access' })
      return
    }

    await prisma.dashboardAccess.delete({
      where: {
        dashboardId_userId: {
          dashboardId: req.params.id,
          userId: req.params.userId,
        },
      },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error revoking access:', error)
    res.status(500).json({ error: 'Failed to revoke access' })
  }
})
