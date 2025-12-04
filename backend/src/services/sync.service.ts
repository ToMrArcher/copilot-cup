/**
 * Sync Service
 * Handles integration synchronization logic, scheduling, and history tracking.
 */

import { prisma } from '../db/client'
import { AdapterRegistry } from '../modules/integrations/adapter.registry'
import { decryptJson } from './crypto.service'
import { IntegrationConfig, IntegrationType } from '../modules/integrations/adapter.interface'
import { SyncStatus, Integration, SyncLog } from '@prisma/client'

// Configuration
const MAX_RETRIES = 3
const BASE_BACKOFF_MS = 60_000 // 1 minute

export interface SyncResult {
  success: boolean
  recordsCount: number
  duration: number
  error?: string
}

/**
 * Get nested value from an object using dot notation path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Calculate when the next sync should occur based on interval and retry count
 */
export function calculateNextSyncAt(
  syncInterval: number | null,
  retryCount: number = 0
): Date | null {
  if (syncInterval === null) {
    return null // Manual-only integration
  }

  const now = new Date()
  
  if (retryCount > 0 && retryCount <= MAX_RETRIES) {
    // Exponential backoff for retries: 1min, 2min, 4min
    const backoffMs = BASE_BACKOFF_MS * Math.pow(2, retryCount - 1)
    return new Date(now.getTime() + backoffMs)
  }

  // Normal scheduled sync
  return new Date(now.getTime() + syncInterval * 1000)
}

/**
 * Get integrations that are due for sync
 */
export async function getIntegrationsDueForSync(limit: number = 10): Promise<Integration[]> {
  const now = new Date()
  
  return prisma.integration.findMany({
    where: {
      syncEnabled: true,
      syncInterval: { not: null },
      OR: [
        { nextSyncAt: { lte: now } },
        { nextSyncAt: null, lastSync: null }, // Never synced
      ],
      // Only sync API and GRAPHQL integrations (MANUAL doesn't need auto-sync)
      type: { in: ['API', 'GRAPHQL'] },
    },
    orderBy: { nextSyncAt: 'asc' },
    take: limit,
  })
}

/**
 * Start a sync log entry
 */
export async function startSyncLog(integrationId: string): Promise<SyncLog> {
  return prisma.syncLog.create({
    data: {
      integrationId,
      status: SyncStatus.RUNNING,
      startedAt: new Date(),
    },
  })
}

/**
 * Complete a sync log entry with results
 */
export async function completeSyncLog(
  logId: string,
  result: SyncResult
): Promise<SyncLog> {
  return prisma.syncLog.update({
    where: { id: logId },
    data: {
      status: result.success ? SyncStatus.SUCCESS : SyncStatus.FAILED,
      completedAt: new Date(),
      duration: result.duration,
      recordsCount: result.recordsCount,
      errorMessage: result.error,
    },
  })
}

/**
 * Update integration after sync (success or failure)
 */
export async function updateIntegrationAfterSync(
  integrationId: string,
  result: SyncResult
): Promise<void> {
  const integration = await prisma.integration.findUnique({
    where: { id: integrationId },
  })

  if (!integration) return

  if (result.success) {
    // Success: reset retry count, calculate next sync
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        lastSync: new Date(),
        status: 'synced',
        retryCount: 0,
        nextSyncAt: calculateNextSyncAt(integration.syncInterval),
      },
    })
  } else {
    // Failure: increment retry count
    const newRetryCount = integration.retryCount + 1
    const shouldDisable = newRetryCount > MAX_RETRIES

    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: 'error',
        retryCount: newRetryCount,
        syncEnabled: shouldDisable ? false : integration.syncEnabled,
        nextSyncAt: shouldDisable
          ? null
          : calculateNextSyncAt(integration.syncInterval, newRetryCount),
      },
    })

    if (shouldDisable) {
      console.warn(
        `Integration ${integrationId} disabled after ${MAX_RETRIES} consecutive failures`
      )
    }
  }
}

/**
 * Execute sync for a single integration
 * This contains the core sync logic extracted from the router
 */
export async function syncIntegration(integrationId: string): Promise<SyncResult> {
  const startTime = Date.now()

  try {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: { dataFields: true },
    })

    if (!integration) {
      return {
        success: false,
        recordsCount: 0,
        duration: Date.now() - startTime,
        error: 'Integration not found',
      }
    }

    // Manual integrations don't need API sync
    if (integration.type === 'MANUAL') {
      return {
        success: true,
        recordsCount: 0,
        duration: Date.now() - startTime,
      }
    }

    const adapter = AdapterRegistry.get(integration.type as IntegrationType)
    const config = decryptJson<IntegrationConfig>(integration.config as string)
    const fieldPaths = integration.dataFields.map(f => f.path)

    const result = await adapter.fetchData(config, fieldPaths)

    if (!result.success) {
      return {
        success: false,
        recordsCount: 0,
        duration: Date.now() - startTime,
        error: result.error || 'Fetch failed',
      }
    }

    let recordsCount = 0

    if (result.data.length > 0) {
      // Store synced values for each data field
      const syncedAt = new Date()
      const dataValuesToCreate: { dataFieldId: string; value: unknown; syncedAt: Date }[] = []

      for (const field of integration.dataFields) {
        // Extract the value for this field from each row
        const values = result.data
          .map(row => getNestedValue(row, field.path))
          .filter(v => v !== undefined && v !== null)

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
        recordsCount = dataValuesToCreate.length
      }
    }

    return {
      success: true,
      recordsCount,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Sync failed for integration ${integrationId}:`, errorMessage)
    
    return {
      success: false,
      recordsCount: 0,
      duration: Date.now() - startTime,
      error: errorMessage,
    }
  }
}

/**
 * Execute a full sync cycle for an integration with logging
 */
export async function executeSyncWithLogging(integrationId: string): Promise<SyncResult> {
  const log = await startSyncLog(integrationId)
  
  try {
    const result = await syncIntegration(integrationId)
    await completeSyncLog(log.id, result)
    await updateIntegrationAfterSync(integrationId, result)
    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const result: SyncResult = {
      success: false,
      recordsCount: 0,
      duration: Date.now() - log.startedAt.getTime(),
      error: errorMessage,
    }
    await completeSyncLog(log.id, result)
    await updateIntegrationAfterSync(integrationId, result)
    return result
  }
}

/**
 * Get sync history for an integration
 */
export async function getSyncHistory(
  integrationId: string,
  options: { page?: number; pageSize?: number } = {}
): Promise<{ logs: SyncLog[]; total: number }> {
  const { page = 1, pageSize = 20 } = options
  const skip = (page - 1) * pageSize

  const [logs, total] = await Promise.all([
    prisma.syncLog.findMany({
      where: { integrationId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.syncLog.count({
      where: { integrationId },
    }),
  ])

  return { logs, total }
}
