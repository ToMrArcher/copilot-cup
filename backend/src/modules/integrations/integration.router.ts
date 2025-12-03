import { Router, Request, Response } from 'express'
import { prisma } from '../../db/client'
import { AdapterRegistry } from './adapter.registry'
import { encryptJson, decryptJson, maskSensitiveValue } from '../../services/crypto.service'
import { IntegrationConfig, IntegrationType } from './adapter.interface'
import { dataFieldRouter } from './datafield.router'

export const integrationRouter = Router()

// Mount data field routes under /:id/fields
integrationRouter.use('/:integrationId/fields', dataFieldRouter)

// Sensitive fields that should be masked in responses
const SENSITIVE_FIELDS = ['apiKey', 'password', 'webhookSecret', 'authHeader']

/**
 * Mask sensitive values in config for API responses
 */
function maskConfig(config: IntegrationConfig): IntegrationConfig {
  const masked = { ...config }
  for (const field of SENSITIVE_FIELDS) {
    if (masked[field as keyof IntegrationConfig]) {
      (masked as Record<string, unknown>)[field] = maskSensitiveValue(
        String(masked[field as keyof IntegrationConfig])
      )
    }
  }
  // Mask header values
  if (masked.headers) {
    masked.headers = Object.fromEntries(
      Object.entries(masked.headers).map(([key, value]) => [
        key,
        key.toLowerCase().includes('auth') || key.toLowerCase().includes('key')
          ? maskSensitiveValue(value)
          : value,
      ])
    )
  }
  return masked
}

/**
 * GET /api/integrations
 * List all integrations
 */
integrationRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const integrations = await prisma.integration.findMany({
      include: {
        dataFields: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Mask sensitive data in response
    const result = integrations.map(integration => ({
      ...integration,
      config: maskConfig(decryptJson<IntegrationConfig>(integration.config as string)),
    }))

    res.json(result)
  } catch (error) {
    console.error('Error fetching integrations:', error)
    res.status(500).json({ error: 'Failed to fetch integrations' })
  }
})

/**
 * GET /api/integrations/:id
 * Get a single integration
 */
integrationRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: req.params.id },
      include: {
        dataFields: true,
      },
    })

    if (!integration) {
      res.status(404).json({ error: 'Integration not found' })
      return
    }

    res.json({
      ...integration,
      config: maskConfig(decryptJson<IntegrationConfig>(integration.config as string)),
    })
  } catch (error) {
    console.error('Error fetching integration:', error)
    res.status(500).json({ error: 'Failed to fetch integration' })
  }
})

/**
 * POST /api/integrations
 * Create a new integration
 */
integrationRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, config } = req.body as {
      name: string
      type: IntegrationType
      config: IntegrationConfig
    }

    if (!name || !type) {
      res.status(400).json({ error: 'Name and type are required' })
      return
    }

    if (!AdapterRegistry.has(type)) {
      res.status(400).json({ error: `Invalid integration type: ${type}` })
      return
    }

    // Encrypt the config before storing
    const encryptedConfig = encryptJson(config || {})

    const integration = await prisma.integration.create({
      data: {
        name,
        type,
        config: encryptedConfig,
        status: 'pending',
      },
    })

    res.status(201).json({
      ...integration,
      config: maskConfig(config || {}),
    })
  } catch (error) {
    console.error('Error creating integration:', error)
    res.status(500).json({ error: 'Failed to create integration' })
  }
})

/**
 * PUT /api/integrations/:id
 * Update an integration
 */
integrationRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, config } = req.body as {
      name?: string
      config?: IntegrationConfig
    }

    const existing = await prisma.integration.findUnique({
      where: { id: req.params.id },
    })

    if (!existing) {
      res.status(404).json({ error: 'Integration not found' })
      return
    }

    // If config is provided, merge with existing (to allow partial updates)
    let newConfig = config
    if (config) {
      const existingConfig = decryptJson<IntegrationConfig>(existing.config as string)
      // Don't overwrite sensitive fields if they're masked
      for (const field of SENSITIVE_FIELDS) {
        if (config[field as keyof IntegrationConfig]?.toString().includes('***')) {
          (config as Record<string, unknown>)[field] = existingConfig[field as keyof IntegrationConfig]
        }
      }
      newConfig = { ...existingConfig, ...config }
    }

    const updateData: { name?: string; config?: string } = {}
    if (name) updateData.name = name
    if (newConfig) updateData.config = encryptJson(newConfig)

    const integration = await prisma.integration.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        dataFields: true,
      },
    })

    res.json({
      ...integration,
      config: maskConfig(newConfig || decryptJson<IntegrationConfig>(integration.config as string)),
    })
  } catch (error) {
    console.error('Error updating integration:', error)
    res.status(500).json({ error: 'Failed to update integration' })
  }
})

/**
 * DELETE /api/integrations/:id
 * Delete an integration
 */
integrationRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    // Check if integration exists first
    const existing = await prisma.integration.findUnique({
      where: { id },
    })

    if (!existing) {
      res.status(404).json({ error: 'Integration not found' })
      return
    }

    await prisma.integration.delete({
      where: { id },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting integration:', error)
    res.status(500).json({ error: 'Failed to delete integration' })
  }
})

/**
 * POST /api/integrations/:id/test
 * Test the connection for an integration
 */
integrationRouter.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: req.params.id },
    })

    if (!integration) {
      res.status(404).json({ error: 'Integration not found' })
      return
    }

    const adapter = AdapterRegistry.get(integration.type as IntegrationType)
    const config = decryptJson<IntegrationConfig>(integration.config as string)
    const result = await adapter.testConnection(config)

    // Update status based on test result
    await prisma.integration.update({
      where: { id: req.params.id },
      data: {
        status: result.success ? 'connected' : 'error',
      },
    })

    res.json(result)
  } catch (error) {
    console.error('Error testing connection:', error)
    res.status(500).json({ error: 'Failed to test connection' })
  }
})

/**
 * POST /api/integrations/:id/sync
 * Trigger a manual sync for an integration
 */
integrationRouter.post('/:id/sync', async (req: Request, res: Response) => {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: req.params.id },
      include: { dataFields: true },
    })

    if (!integration) {
      res.status(404).json({ error: 'Integration not found' })
      return
    }

    const adapter = AdapterRegistry.get(integration.type as IntegrationType)
    const config = decryptJson<IntegrationConfig>(integration.config as string)
    const fieldPaths = integration.dataFields.map(f => f.path)

    const result = await adapter.fetchData(config, fieldPaths)

    if (result.success && result.data.length > 0) {
      // Store synced values for each data field
      const syncedAt = new Date()
      const dataValuesToCreate: { dataFieldId: string; value: unknown; syncedAt: Date }[] = []

      for (const field of integration.dataFields) {
        // Extract the value for this field from each row
        // Aggregate all values for the field path
        const values = result.data.map(row => {
          // Navigate the field path (e.g., "revenue" or "data.total")
          return getNestedValue(row, field.path)
        }).filter(v => v !== undefined && v !== null)

        if (values.length > 0) {
          // Store as single value (first) or array depending on data
          const valueToStore = values.length === 1 ? values[0] : values
          dataValuesToCreate.push({
            dataFieldId: field.id,
            value: valueToStore,
            syncedAt,
          })
        }
      }

      // Bulk create data values
      if (dataValuesToCreate.length > 0) {
        await prisma.dataValue.createMany({
          data: dataValuesToCreate.map(dv => ({
            dataFieldId: dv.dataFieldId,
            value: dv.value as object,
            syncedAt: dv.syncedAt,
          })),
        })
      }
    }

    // Update last sync time and status
    await prisma.integration.update({
      where: { id: req.params.id },
      data: {
        lastSync: new Date(),
        status: result.success ? 'synced' : 'error',
      },
    })

    res.json({
      success: result.success,
      rowCount: result.data.length,
      fieldsUpdated: integration.dataFields.length,
      syncedAt: result.fetchedAt,
      error: result.error,
    })
  } catch (error) {
    console.error('Error syncing integration:', error)
    res.status(500).json({ error: 'Failed to sync integration' })
  }
})

/**
 * POST /api/integrations/:id/data
 * Submit manual data values for a MANUAL type integration
 */
integrationRouter.post('/:id/data', async (req: Request, res: Response) => {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: req.params.id },
      include: { dataFields: true },
    })

    if (!integration) {
      res.status(404).json({ error: 'Integration not found' })
      return
    }

    if (integration.type !== 'MANUAL') {
      res.status(400).json({ error: 'This endpoint is only for manual integrations' })
      return
    }

    // Expecting { values: { fieldId: value, ... } }
    const { values } = req.body as { values: Record<string, unknown> }

    if (!values || typeof values !== 'object') {
      res.status(400).json({ error: 'Values object is required' })
      return
    }

    const syncedAt = new Date()
    const dataValuesToCreate: { dataFieldId: string; value: unknown; syncedAt: Date }[] = []

    for (const field of integration.dataFields) {
      if (values[field.id] !== undefined) {
        dataValuesToCreate.push({
          dataFieldId: field.id,
          value: values[field.id],
          syncedAt,
        })
      }
    }

    if (dataValuesToCreate.length === 0) {
      res.status(400).json({ error: 'No valid values provided for existing fields' })
      return
    }

    // Bulk create data values
    await prisma.dataValue.createMany({
      data: dataValuesToCreate.map(dv => ({
        dataFieldId: dv.dataFieldId,
        value: dv.value as object,
        syncedAt: dv.syncedAt,
      })),
    })

    // Update last sync time
    await prisma.integration.update({
      where: { id: req.params.id },
      data: {
        lastSync: syncedAt,
        status: 'synced',
      },
    })

    res.json({
      success: true,
      fieldsUpdated: dataValuesToCreate.length,
      syncedAt,
    })
  } catch (error) {
    console.error('Error submitting manual data:', error)
    res.status(500).json({ error: 'Failed to submit manual data' })
  }
})

/**
 * GET /api/integrations/:id/data
 * Get the latest data values for an integration
 */
integrationRouter.get('/:id/data', async (req: Request, res: Response) => {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: req.params.id },
      include: { dataFields: true },
    })

    if (!integration) {
      res.status(404).json({ error: 'Integration not found' })
      return
    }

    // Get the latest value for each data field
    const latestValues: Record<string, { value: unknown; syncedAt: Date }> = {}

    for (const field of integration.dataFields) {
      const latestValue = await prisma.dataValue.findFirst({
        where: { dataFieldId: field.id },
        orderBy: { syncedAt: 'desc' },
      })

      if (latestValue) {
        latestValues[field.id] = {
          value: latestValue.value,
          syncedAt: latestValue.syncedAt,
        }
      }
    }

    res.json({
      integrationId: integration.id,
      integrationName: integration.name,
      fields: integration.dataFields.map(f => ({
        id: f.id,
        name: f.name,
        dataType: f.dataType,
        latestValue: latestValues[f.id]?.value ?? null,
        lastUpdated: latestValues[f.id]?.syncedAt ?? null,
      })),
    })
  } catch (error) {
    console.error('Error fetching integration data:', error)
    res.status(500).json({ error: 'Failed to fetch integration data' })
  }
})

/**
 * Helper to get nested value from an object using dot notation
 * e.g., getNestedValue({ data: { total: 100 } }, "data.total") => 100
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  
  return current
}

/**
 * GET /api/integrations/:id/preview
 * Get sample data for preview (limited to 5 rows)
 */
integrationRouter.get('/:id/preview', async (req: Request, res: Response) => {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: req.params.id },
    })

    if (!integration) {
      res.status(404).json({ error: 'Integration not found' })
      return
    }

    const adapter = AdapterRegistry.get(integration.type as IntegrationType)
    const config = decryptJson<IntegrationConfig>(integration.config as string)
    const result = await adapter.fetchData(config, undefined, 5)

    res.json(result)
  } catch (error) {
    console.error('Error fetching preview:', error)
    res.status(500).json({ error: 'Failed to fetch preview' })
  }
})

/**
 * GET /api/integrations/:id/fields
 * Discover available fields from the data source
 */
integrationRouter.get('/:id/fields', async (req: Request, res: Response) => {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: req.params.id },
    })

    if (!integration) {
      res.status(404).json({ error: 'Integration not found' })
      return
    }

    const adapter = AdapterRegistry.get(integration.type as IntegrationType)
    const config = decryptJson<IntegrationConfig>(integration.config as string)
    const fields = await adapter.discoverFields(config)

    res.json(fields)
  } catch (error) {
    console.error('Error discovering fields:', error)
    res.status(500).json({ error: 'Failed to discover fields' })
  }
})

/**
 * GET /api/integrations/types
 * Get available integration types
 */
integrationRouter.get('/types/available', async (_req: Request, res: Response) => {
  try {
    const types = AdapterRegistry.getTypes().map(type => ({
      type,
      name: type === 'API' ? 'REST API' : type === 'MANUAL' ? 'Manual Input' : type,
      description:
        type === 'API'
          ? 'Connect to any REST API endpoint'
          : type === 'MANUAL'
          ? 'Enter data manually'
          : type === 'WEBHOOK'
          ? 'Receive data via webhooks'
          : '',
    }))

    res.json(types)
  } catch (error) {
    console.error('Error fetching types:', error)
    res.status(500).json({ error: 'Failed to fetch integration types' })
  }
})
