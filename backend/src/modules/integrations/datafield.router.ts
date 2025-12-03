import { Router, Request, Response } from 'express'
import { prisma } from '../../db/client'

export const dataFieldRouter = Router({ mergeParams: true })

/**
 * GET /api/integrations/:integrationId/fields/mapped
 * Get all mapped fields for an integration
 */
dataFieldRouter.get('/mapped', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params

    const fields = await prisma.dataField.findMany({
      where: { integrationId },
      orderBy: { createdAt: 'asc' },
    })

    res.json(fields)
  } catch (error) {
    console.error('Error fetching fields:', error)
    res.status(500).json({ error: 'Failed to fetch fields' })
  }
})

/**
 * POST /api/integrations/:integrationId/fields
 * Add a new field mapping
 */
dataFieldRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params
    const { name, path, dataType } = req.body as {
      name: string
      path: string
      dataType: string
    }

    if (!name || !path || !dataType) {
      res.status(400).json({ error: 'Name, path, and dataType are required' })
      return
    }

    // Verify integration exists
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    })

    if (!integration) {
      res.status(404).json({ error: 'Integration not found' })
      return
    }

    // Check for duplicate path
    const existing = await prisma.dataField.findFirst({
      where: { integrationId, path },
    })

    if (existing) {
      res.status(400).json({ error: 'A field with this path already exists' })
      return
    }

    const field = await prisma.dataField.create({
      data: {
        integrationId,
        name,
        path,
        dataType,
      },
    })

    res.status(201).json(field)
  } catch (error) {
    console.error('Error creating field:', error)
    res.status(500).json({ error: 'Failed to create field' })
  }
})

/**
 * PUT /api/integrations/:integrationId/fields/:fieldId
 * Update a field mapping
 */
dataFieldRouter.put('/:fieldId', async (req: Request, res: Response) => {
  try {
    const { integrationId, fieldId } = req.params
    const { name, path, dataType } = req.body as {
      name?: string
      path?: string
      dataType?: string
    }

    // Verify field exists and belongs to integration
    const existing = await prisma.dataField.findFirst({
      where: { id: fieldId, integrationId },
    })

    if (!existing) {
      res.status(404).json({ error: 'Field not found' })
      return
    }

    const field = await prisma.dataField.update({
      where: { id: fieldId },
      data: {
        ...(name && { name }),
        ...(path && { path }),
        ...(dataType && { dataType }),
      },
    })

    res.json(field)
  } catch (error) {
    console.error('Error updating field:', error)
    res.status(500).json({ error: 'Failed to update field' })
  }
})

/**
 * DELETE /api/integrations/:integrationId/fields/:fieldId
 * Remove a field mapping
 */
dataFieldRouter.delete('/:fieldId', async (req: Request, res: Response) => {
  try {
    const { integrationId, fieldId } = req.params

    // Verify field exists and belongs to integration
    const existing = await prisma.dataField.findFirst({
      where: { id: fieldId, integrationId },
    })

    if (!existing) {
      res.status(404).json({ error: 'Field not found' })
      return
    }

    await prisma.dataField.delete({
      where: { id: fieldId },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting field:', error)
    res.status(500).json({ error: 'Failed to delete field' })
  }
})

/**
 * POST /api/integrations/:integrationId/fields/bulk
 * Add multiple field mappings at once
 */
dataFieldRouter.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { integrationId } = req.params
    const { fields } = req.body as {
      fields: Array<{ name: string; path: string; dataType: string }>
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      res.status(400).json({ error: 'Fields array is required' })
      return
    }

    // Verify integration exists
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    })

    if (!integration) {
      res.status(404).json({ error: 'Integration not found' })
      return
    }

    // Create all fields
    const created = await prisma.dataField.createMany({
      data: fields.map(f => ({
        integrationId,
        name: f.name,
        path: f.path,
        dataType: f.dataType,
      })),
      skipDuplicates: true,
    })

    // Fetch the created fields
    const allFields = await prisma.dataField.findMany({
      where: { integrationId },
      orderBy: { createdAt: 'asc' },
    })

    res.status(201).json({
      created: created.count,
      fields: allFields,
    })
  } catch (error) {
    console.error('Error creating fields:', error)
    res.status(500).json({ error: 'Failed to create fields' })
  }
})
