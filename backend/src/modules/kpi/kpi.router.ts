import { Router, Request, Response } from 'express'
import { prisma } from '../../db/client'
import { calculateKpi, updateKpiValue } from '../../services/kpi-calculator.service'
import { validateFormula } from '../../services/formula.service'
import { getKpiHistory } from '../../services/kpi-history.service'
import { AggregationInterval } from '../../types/kpi-history.types'
import { 
  getAccessibleKpisFilter, 
  canAccessKpi,
} from '../../services/permission.service'
import { getPermissionContext } from '../../middleware/permission.middleware'

export const kpiRouter = Router()

// ============ Static routes (must be before /:id) ============

/**
 * POST /api/kpis/validate-formula
 * Validate a formula string
 */
kpiRouter.post('/validate-formula', async (req: Request, res: Response) => {
  try {
    const { formula, variables } = req.body as {
      formula: string
      variables?: string[]
    }

    if (!formula) {
      res.status(400).json({ error: 'Formula is required' })
      return
    }

    const result = validateFormula(formula, variables)
    res.json(result)
  } catch (error) {
    console.error('Error validating formula:', error)
    res.status(500).json({ error: 'Failed to validate formula' })
  }
})

/**
 * GET /api/kpis/available-fields
 * Get all data fields available for KPI creation
 */
kpiRouter.get('/available-fields', async (_req: Request, res: Response) => {
  try {
    const fields = await prisma.dataField.findMany({
      include: {
        integration: {
          select: { id: true, name: true, type: true },
        },
        values: {
          orderBy: { syncedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ integration: { name: 'asc' } }, { name: 'asc' }],
    })

    // Group by integration
    const grouped = fields.reduce(
      (acc, field) => {
        const integrationId = field.integration.id
        if (!acc[integrationId]) {
          acc[integrationId] = {
            integration: field.integration,
            fields: [],
          }
        }
        acc[integrationId].fields.push({
          id: field.id,
          name: field.name,
          path: field.path,
          dataType: field.dataType,
          hasData: field.values.length > 0,
          lastValue: field.values[0]?.value,
          lastSyncedAt: field.values[0]?.syncedAt,
        })
        return acc
      },
      {} as Record<string, { integration: { id: string; name: string; type: string }; fields: unknown[] }>
    )

    res.json({ integrations: Object.values(grouped) })
  } catch (error) {
    console.error('Error fetching available fields:', error)
    res.status(500).json({ error: 'Failed to fetch available fields' })
  }
})

/**
 * GET /api/kpis/:id/history
 * Get historical KPI values for time-series visualization
 * Query params:
 *   - period: Time period (e.g., '7d', '30d', '90d', '1y') - default: '30d'
 *   - interval: Aggregation interval ('hourly', 'daily', 'weekly', 'monthly') - auto if not specified
 */
kpiRouter.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const period = (req.query.period as string) || '30d'
    const interval = req.query.interval as AggregationInterval | undefined

    // Check access permission
    const ctx = getPermissionContext(req)
    if (!ctx) {
      res.status(404).json({ error: 'KPI not found' })
      return
    }
    
    const hasAccess = await canAccessKpi(ctx, id, 'VIEW')
    if (!hasAccess) {
      res.status(404).json({ error: 'KPI not found' })
      return
    }

    // Validate interval if provided
    if (interval && !['hourly', 'daily', 'weekly', 'monthly'].includes(interval)) {
      res.status(400).json({ 
        error: 'Invalid interval. Must be: hourly, daily, weekly, or monthly' 
      })
      return
    }

    const history = await getKpiHistory(id, period, interval)

    if (!history) {
      res.status(404).json({ error: 'KPI not found' })
      return
    }

    res.json(history)
  } catch (error) {
    console.error('Error fetching KPI history:', error)
    res.status(500).json({ error: 'Failed to fetch KPI history' })
  }
})

// ============ List and CRUD routes ============

/**
 * GET /api/kpis
 * List all KPIs the user can access with calculated current values
 */
kpiRouter.get('/', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    
    // If not authenticated, return empty list (KPIs require auth to view)
    if (!ctx) {
      return res.json({ kpis: [] })
    }
    
    const accessFilter = getAccessibleKpisFilter(ctx)

    const kpis = await prisma.kpi.findMany({
      where: accessFilter,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        sources: {
          include: {
            dataField: {
              include: {
                integration: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        integration: {
          select: { id: true, name: true },
        },
        accessList: {
          select: { userId: true, permission: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate current values for all KPIs
    const result = await Promise.all(
      kpis.map(async kpi => {
        const calculation = await calculateKpi({
          id: kpi.id,
          name: kpi.name,
          formula: kpi.formula,
          targetValue: kpi.targetValue,
          targetDirection: kpi.targetDirection,
          sources: kpi.sources,
        })

        const isOwner = ctx ? kpi.ownerId === ctx.userId : false
        const isAdmin = ctx?.userRole === 'ADMIN'
        const hasEditAccess = kpi.accessList?.some(a => a.userId === ctx?.userId && a.permission === 'EDIT') || false

        return {
          ...kpi,
          currentValue: calculation.currentValue,
          progress: calculation.progress,
          onTrack: calculation.onTrack,
          calculationError: calculation.error,
          calculatedAt: calculation.calculatedAt,
          isOwner,
          canEdit: isOwner || isAdmin || hasEditAccess,
          canManage: isOwner || isAdmin,
          canShare: isOwner || isAdmin || hasEditAccess,
        }
      })
    )

    res.json({ kpis: result })
  } catch (error) {
    console.error('Error listing KPIs:', error)
    res.status(500).json({ error: 'Failed to list KPIs' })
  }
})

/**
 * GET /api/kpis/:id
 * Get a single KPI with its calculated value
 */
kpiRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    
    // Require authentication and check view permission
    // Return 404 instead of 403 to prevent information leakage
    if (!ctx) {
      res.status(404).json({ error: 'KPI not found' })
      return
    }
    
    const hasAccess = await canAccessKpi(ctx, req.params.id, 'VIEW')
    if (!hasAccess) {
      res.status(404).json({ error: 'KPI not found' })
      return
    }

    const kpi = await prisma.kpi.findUnique({
      where: { id: req.params.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        sources: {
          include: {
            dataField: {
              include: {
                integration: {
                  select: { id: true, name: true },
                },
                values: {
                  orderBy: { syncedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        integration: {
          select: { id: true, name: true },
        },
      },
    })

    if (!kpi) {
      res.status(404).json({ error: 'KPI not found' })
      return
    }

    // Calculate current value
    const calculation = await calculateKpi({
      id: kpi.id,
      name: kpi.name,
      formula: kpi.formula,
      targetValue: kpi.targetValue,
      targetDirection: kpi.targetDirection,
      sources: kpi.sources,
    })

    // Determine permissions
    let canEdit = false
    let canManage = false
    let canShare = false
    if (ctx) {
      canEdit = await canAccessKpi(ctx, req.params.id, 'EDIT')
      canManage = await canAccessKpi(ctx, req.params.id, 'MANAGE')
      canShare = await canAccessKpi(ctx, req.params.id, 'SHARE')
    }

    res.json({
      ...kpi,
      currentValue: calculation.currentValue,
      progress: calculation.progress,
      onTrack: calculation.onTrack,
      calculationError: calculation.error,
      calculatedAt: calculation.calculatedAt,
      isOwner: ctx ? kpi.ownerId === ctx.userId : false,
      canEdit,
      canManage,
      canShare,
    })
  } catch (error) {
    console.error('Error fetching KPI:', error)
    res.status(500).json({ error: 'Failed to fetch KPI' })
  }
})

/**
 * POST /api/kpis
 * Create a new KPI
 */
kpiRouter.post('/', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)

    const {
      name,
      description,
      formula,
      integrationId,
      targetValue,
      targetDirection,
      targetPeriod,
      sources,
    } = req.body as {
      name: string
      description?: string
      formula: string
      integrationId?: string
      targetValue?: number
      targetDirection?: 'increase' | 'decrease'
      targetPeriod?: string
      sources: Array<{ dataFieldId: string; alias?: string }>
    }

    // Validate required fields
    if (!name || !formula) {
      res.status(400).json({ error: 'Name and formula are required' })
      return
    }

    if (!sources || sources.length === 0) {
      res.status(400).json({ error: 'At least one data source is required' })
      return
    }

    // Validate formula syntax
    const aliases = sources.map(s => s.alias).filter(Boolean) as string[]
    const validation = validateFormula(formula, aliases.length > 0 ? aliases : undefined)
    if (!validation.valid) {
      res.status(400).json({ error: `Invalid formula: ${validation.error}` })
      return
    }

    // Determine owner
    let ownerId: string | undefined
    if (ctx) {
      ownerId = ctx.userId
    }

    // Create KPI with sources
    const kpi = await prisma.kpi.create({
      data: {
        name,
        description,
        formula,
        integrationId,
        ownerId,
        targetValue,
        targetDirection,
        targetPeriod,
        sources: {
          create: sources.map(s => ({
            dataFieldId: s.dataFieldId,
            alias: s.alias,
          })),
        },
      },
      include: {
        sources: {
          include: {
            dataField: true,
          },
        },
      },
    })

    // Calculate initial value
    const calculation = await calculateKpi({
      id: kpi.id,
      name: kpi.name,
      formula: kpi.formula,
      targetValue: kpi.targetValue,
      targetDirection: kpi.targetDirection,
      sources: kpi.sources,
    })

    // Store the calculated value
    if (calculation.currentValue !== null) {
      await updateKpiValue(kpi.id, calculation.currentValue)
    }

    res.status(201).json({
      ...kpi,
      currentValue: calculation.currentValue,
      progress: calculation.progress,
      onTrack: calculation.onTrack,
      calculationError: calculation.error,
    })
  } catch (error) {
    console.error('Error creating KPI:', error)
    res.status(500).json({ error: 'Failed to create KPI' })
  }
})

/**
 * PUT /api/kpis/:id
 * Update a KPI
 */
kpiRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    
    // Check edit permission
    if (ctx) {
      const hasAccess = await canAccessKpi(ctx, req.params.id, 'EDIT')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. You need edit permission.' })
        return
      }
    }

    const { name, description, formula, targetValue, targetDirection, targetPeriod, sources } =
      req.body as {
        name?: string
        description?: string
        formula?: string
        targetValue?: number | null
        targetDirection?: 'increase' | 'decrease' | null
        targetPeriod?: string | null
        sources?: Array<{ dataFieldId: string; alias?: string }>
      }

    const existing = await prisma.kpi.findUnique({
      where: { id: req.params.id },
    })

    if (!existing) {
      res.status(404).json({ error: 'KPI not found' })
      return
    }

    // Validate formula if provided
    if (formula) {
      const aliases = sources?.map(s => s.alias).filter(Boolean) as string[]
      const validation = validateFormula(formula, aliases?.length > 0 ? aliases : undefined)
      if (!validation.valid) {
        res.status(400).json({ error: `Invalid formula: ${validation.error}` })
        return
      }
    }

    // Update KPI
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (formula !== undefined) updateData.formula = formula
    if (targetValue !== undefined) updateData.targetValue = targetValue
    if (targetDirection !== undefined) updateData.targetDirection = targetDirection
    if (targetPeriod !== undefined) updateData.targetPeriod = targetPeriod

    // If sources are provided, replace them
    if (sources) {
      // Delete existing sources
      await prisma.kpiSource.deleteMany({
        where: { kpiId: req.params.id },
      })

      // Create new sources
      await prisma.kpiSource.createMany({
        data: sources.map(s => ({
          kpiId: req.params.id,
          dataFieldId: s.dataFieldId,
          alias: s.alias,
        })),
      })
    }

    const kpi = await prisma.kpi.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        sources: {
          include: {
            dataField: true,
          },
        },
      },
    })

    // Recalculate value
    const calculation = await calculateKpi({
      id: kpi.id,
      name: kpi.name,
      formula: kpi.formula,
      targetValue: kpi.targetValue,
      targetDirection: kpi.targetDirection,
      sources: kpi.sources,
    })

    // Store the calculated value
    if (calculation.currentValue !== null) {
      await updateKpiValue(kpi.id, calculation.currentValue)
    }

    res.json({
      ...kpi,
      currentValue: calculation.currentValue,
      progress: calculation.progress,
      onTrack: calculation.onTrack,
      calculationError: calculation.error,
    })
  } catch (error) {
    console.error('Error updating KPI:', error)
    res.status(500).json({ error: 'Failed to update KPI' })
  }
})

/**
 * DELETE /api/kpis/:id
 * Delete a KPI
 */
kpiRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    
    // Check delete permission (owner or admin only)
    if (ctx) {
      const hasAccess = await canAccessKpi(ctx, req.params.id, 'DELETE')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. Only the owner can delete this KPI.' })
        return
      }
    }

    const existing = await prisma.kpi.findUnique({
      where: { id: req.params.id },
    })

    if (!existing) {
      res.status(404).json({ error: 'KPI not found' })
      return
    }

    await prisma.kpi.delete({
      where: { id: req.params.id },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting KPI:', error)
    res.status(500).json({ error: 'Failed to delete KPI' })
  }
})

/**
 * POST /api/kpis/:id/recalculate
 * Force recalculation of a KPI's value
 */
kpiRouter.post('/:id/recalculate', async (req: Request, res: Response) => {
  try {
    const kpi = await prisma.kpi.findUnique({
      where: { id: req.params.id },
      include: {
        sources: {
          include: {
            dataField: true,
          },
        },
      },
    })

    if (!kpi) {
      res.status(404).json({ error: 'KPI not found' })
      return
    }

    // Calculate current value
    const calculation = await calculateKpi({
      id: kpi.id,
      name: kpi.name,
      formula: kpi.formula,
      targetValue: kpi.targetValue,
      targetDirection: kpi.targetDirection,
      sources: kpi.sources,
    })

    // Store the calculated value
    if (calculation.currentValue !== null) {
      await updateKpiValue(kpi.id, calculation.currentValue)
    }

    res.json({
      kpiId: kpi.id,
      name: kpi.name,
      currentValue: calculation.currentValue,
      previousValue: kpi.currentValue,
      progress: calculation.progress,
      onTrack: calculation.onTrack,
      error: calculation.error,
      calculatedAt: calculation.calculatedAt,
    })
  } catch (error) {
    console.error('Error recalculating KPI:', error)
    res.status(500).json({ error: 'Failed to recalculate KPI' })
  }
})

// ============ Access Control ============

/**
 * GET /api/kpis/:id/access
 * List users with access to this KPI
 */
kpiRouter.get('/:id/access', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    
    // Check manage permission
    if (ctx) {
      const hasAccess = await canAccessKpi(ctx, req.params.id, 'MANAGE')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. Only the owner can manage access.' })
        return
      }
    }

    const kpi = await prisma.kpi.findUnique({
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

    if (!kpi) {
      res.status(404).json({ error: 'KPI not found' })
      return
    }

    res.json({
      owner: kpi.owner,
      accessList: kpi.accessList.map(a => ({
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
 * POST /api/kpis/:id/access
 * Grant access to a user
 */
kpiRouter.post('/:id/access', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    
    // Check share permission (owners, admins, and editors can share)
    if (ctx) {
      const hasAccess = await canAccessKpi(ctx, req.params.id, 'SHARE')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. You need edit access to share this KPI.' })
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
    const kpi = await prisma.kpi.findUnique({
      where: { id: req.params.id },
    })

    if (kpi?.ownerId === targetUserId) {
      res.status(400).json({ error: 'Cannot grant access to the owner' })
      return
    }

    // Upsert access entry
    const access = await prisma.kpiAccess.upsert({
      where: {
        kpiId_userId: {
          kpiId: req.params.id,
          userId: targetUserId,
        },
      },
      update: {
        permission,
        grantedById: ctx?.userId,
      },
      create: {
        kpiId: req.params.id,
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
 * PATCH /api/kpis/:id/access/:userId
 * Update a user's permission level
 */
kpiRouter.patch('/:id/access/:userId', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    
    // Check share permission (owners, admins, and editors can update access)
    if (ctx) {
      const hasAccess = await canAccessKpi(ctx, req.params.id, 'SHARE')
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

    const access = await prisma.kpiAccess.update({
      where: {
        kpiId_userId: {
          kpiId: req.params.id,
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
 * DELETE /api/kpis/:id/access/:userId
 * Revoke a user's access
 */
kpiRouter.delete('/:id/access/:userId', async (req: Request, res: Response) => {
  try {
    const ctx = getPermissionContext(req)
    
    // Check share permission (owners, admins, and editors can revoke access)
    if (ctx) {
      const hasAccess = await canAccessKpi(ctx, req.params.id, 'SHARE')
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied. You need edit access to revoke permissions.' })
        return
      }
    }

    // Get KPI to check ownership
    const kpi = await prisma.kpi.findUnique({
      where: { id: req.params.id },
      select: { ownerId: true },
    })

    // Check if trying to remove owner's access (not allowed)
    if (kpi?.ownerId === req.params.userId) {
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

    await prisma.kpiAccess.delete({
      where: {
        kpiId_userId: {
          kpiId: req.params.id,
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
