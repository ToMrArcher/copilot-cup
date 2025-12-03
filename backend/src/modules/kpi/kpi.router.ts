import { Router, Request, Response } from 'express'
import { prisma } from '../../db/client'
import { calculateKpi, updateKpiValue } from '../../services/kpi-calculator.service'
import { validateFormula } from '../../services/formula.service'

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

// ============ List and CRUD routes ============

/**
 * GET /api/kpis
 * List all KPIs with calculated current values
 */
kpiRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const kpis = await prisma.kpi.findMany({
      include: {
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

        return {
          ...kpi,
          currentValue: calculation.currentValue,
          progress: calculation.progress,
          onTrack: calculation.onTrack,
          calculationError: calculation.error,
          calculatedAt: calculation.calculatedAt,
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
    const kpi = await prisma.kpi.findUnique({
      where: { id: req.params.id },
      include: {
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

    res.json({
      ...kpi,
      currentValue: calculation.currentValue,
      progress: calculation.progress,
      onTrack: calculation.onTrack,
      calculationError: calculation.error,
      calculatedAt: calculation.calculatedAt,
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

    // Create KPI with sources
    const kpi = await prisma.kpi.create({
      data: {
        name,
        description,
        formula,
        integrationId,
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
