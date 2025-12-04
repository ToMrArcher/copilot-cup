import { prisma } from '../db/client'
import {
  calculateNextSyncAt,
  getIntegrationsDueForSync,
  startSyncLog,
  completeSyncLog,
  updateIntegrationAfterSync,
  getSyncHistory,
  SyncResult,
} from './sync.service'
import { SyncStatus } from '@prisma/client'

// Mock the Prisma client
jest.mock('../db/client', () => ({
  prisma: {
    integration: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    syncLog: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

describe('Sync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-12-04T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('calculateNextSyncAt', () => {
    it('should return null for manual-only integrations (null interval)', () => {
      const result = calculateNextSyncAt(null)
      expect(result).toBeNull()
    })

    it('should calculate next sync based on interval in seconds', () => {
      const result = calculateNextSyncAt(3600) // 1 hour
      expect(result).toEqual(new Date('2025-12-04T13:00:00Z'))
    })

    it('should calculate next sync for 5 minute interval', () => {
      const result = calculateNextSyncAt(300) // 5 minutes
      expect(result).toEqual(new Date('2025-12-04T12:05:00Z'))
    })

    it('should calculate next sync for daily interval', () => {
      const result = calculateNextSyncAt(86400) // 24 hours
      expect(result).toEqual(new Date('2025-12-05T12:00:00Z'))
    })

    it('should apply exponential backoff for retry count 1', () => {
      const result = calculateNextSyncAt(3600, 1)
      // 1 minute backoff for first retry
      expect(result).toEqual(new Date('2025-12-04T12:01:00Z'))
    })

    it('should apply exponential backoff for retry count 2', () => {
      const result = calculateNextSyncAt(3600, 2)
      // 2 minutes backoff for second retry
      expect(result).toEqual(new Date('2025-12-04T12:02:00Z'))
    })

    it('should apply exponential backoff for retry count 3', () => {
      const result = calculateNextSyncAt(3600, 3)
      // 4 minutes backoff for third retry
      expect(result).toEqual(new Date('2025-12-04T12:04:00Z'))
    })

    it('should use normal interval for retry count beyond MAX_RETRIES', () => {
      const result = calculateNextSyncAt(3600, 4)
      // Beyond MAX_RETRIES (3), use normal interval
      expect(result).toEqual(new Date('2025-12-04T13:00:00Z'))
    })
  })

  describe('getIntegrationsDueForSync', () => {
    it('should return integrations due for sync', async () => {
      const mockIntegrations = [
        { id: '1', name: 'Test API', syncEnabled: true, syncInterval: 3600, nextSyncAt: new Date('2025-12-04T11:00:00Z') },
        { id: '2', name: 'Test API 2', syncEnabled: true, syncInterval: 3600, nextSyncAt: new Date('2025-12-04T11:30:00Z') },
      ];
      (prisma.integration.findMany as jest.Mock).mockResolvedValue(mockIntegrations)

      const result = await getIntegrationsDueForSync(10)

      expect(prisma.integration.findMany).toHaveBeenCalledWith({
        where: {
          syncEnabled: true,
          syncInterval: { not: null },
          OR: [
            { nextSyncAt: { lte: expect.any(Date) } },
            { nextSyncAt: null, lastSync: null },
          ],
          type: 'API',
        },
        orderBy: { nextSyncAt: 'asc' },
        take: 10,
      })
      expect(result).toEqual(mockIntegrations)
    })

    it('should respect the limit parameter', async () => {
      (prisma.integration.findMany as jest.Mock).mockResolvedValue([])

      await getIntegrationsDueForSync(5)

      expect(prisma.integration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      )
    })

    it('should use default limit of 10', async () => {
      (prisma.integration.findMany as jest.Mock).mockResolvedValue([])

      await getIntegrationsDueForSync()

      expect(prisma.integration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      )
    })
  })

  describe('startSyncLog', () => {
    it('should create a new sync log with RUNNING status', async () => {
      const mockLog = {
        id: 'log-1',
        integrationId: 'int-1',
        status: SyncStatus.RUNNING,
        startedAt: new Date('2025-12-04T12:00:00Z'),
      };
      (prisma.syncLog.create as jest.Mock).mockResolvedValue(mockLog)

      const result = await startSyncLog('int-1')

      expect(prisma.syncLog.create).toHaveBeenCalledWith({
        data: {
          integrationId: 'int-1',
          status: SyncStatus.RUNNING,
          startedAt: expect.any(Date),
        },
      })
      expect(result).toEqual(mockLog)
    })
  })

  describe('completeSyncLog', () => {
    it('should update log with SUCCESS status on successful sync', async () => {
      const mockUpdatedLog = { id: 'log-1', status: SyncStatus.SUCCESS };
      (prisma.syncLog.update as jest.Mock).mockResolvedValue(mockUpdatedLog)

      const result: SyncResult = {
        success: true,
        recordsCount: 5,
        duration: 1234,
      }

      await completeSyncLog('log-1', result)

      expect(prisma.syncLog.update).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: {
          status: SyncStatus.SUCCESS,
          completedAt: expect.any(Date),
          duration: 1234,
          recordsCount: 5,
          errorMessage: undefined,
        },
      })
    })

    it('should update log with FAILED status on failed sync', async () => {
      const mockUpdatedLog = { id: 'log-1', status: SyncStatus.FAILED };
      (prisma.syncLog.update as jest.Mock).mockResolvedValue(mockUpdatedLog)

      const result: SyncResult = {
        success: false,
        recordsCount: 0,
        duration: 500,
        error: 'Connection timeout',
      }

      await completeSyncLog('log-1', result)

      expect(prisma.syncLog.update).toHaveBeenCalledWith({
        where: { id: 'log-1' },
        data: {
          status: SyncStatus.FAILED,
          completedAt: expect.any(Date),
          duration: 500,
          recordsCount: 0,
          errorMessage: 'Connection timeout',
        },
      })
    })
  })

  describe('updateIntegrationAfterSync', () => {
    it('should reset retry count and update lastSync on success', async () => {
      const mockIntegration = {
        id: 'int-1',
        syncInterval: 3600,
        retryCount: 2,
        syncEnabled: true,
      };
      (prisma.integration.findUnique as jest.Mock).mockResolvedValue(mockIntegration);
      (prisma.integration.update as jest.Mock).mockResolvedValue({})

      const result: SyncResult = {
        success: true,
        recordsCount: 3,
        duration: 1000,
      }

      await updateIntegrationAfterSync('int-1', result)

      expect(prisma.integration.update).toHaveBeenCalledWith({
        where: { id: 'int-1' },
        data: {
          lastSync: expect.any(Date),
          status: 'synced',
          retryCount: 0,
          nextSyncAt: new Date('2025-12-04T13:00:00Z'),
        },
      })
    })

    it('should increment retry count on failure', async () => {
      const mockIntegration = {
        id: 'int-1',
        syncInterval: 3600,
        retryCount: 1,
        syncEnabled: true,
      };
      (prisma.integration.findUnique as jest.Mock).mockResolvedValue(mockIntegration);
      (prisma.integration.update as jest.Mock).mockResolvedValue({})

      const result: SyncResult = {
        success: false,
        recordsCount: 0,
        duration: 500,
        error: 'API error',
      }

      await updateIntegrationAfterSync('int-1', result)

      expect(prisma.integration.update).toHaveBeenCalledWith({
        where: { id: 'int-1' },
        data: {
          status: 'error',
          retryCount: 2,
          syncEnabled: true,
          nextSyncAt: new Date('2025-12-04T12:02:00Z'), // 2 minute backoff
        },
      })
    })

    it('should disable sync after MAX_RETRIES failures', async () => {
      const mockIntegration = {
        id: 'int-1',
        syncInterval: 3600,
        retryCount: 3, // Already at max
        syncEnabled: true,
      };
      (prisma.integration.findUnique as jest.Mock).mockResolvedValue(mockIntegration);
      (prisma.integration.update as jest.Mock).mockResolvedValue({})

      const result: SyncResult = {
        success: false,
        recordsCount: 0,
        duration: 500,
        error: 'Persistent error',
      }

      await updateIntegrationAfterSync('int-1', result)

      expect(prisma.integration.update).toHaveBeenCalledWith({
        where: { id: 'int-1' },
        data: {
          status: 'error',
          retryCount: 4,
          syncEnabled: false, // Disabled after exceeding MAX_RETRIES
          nextSyncAt: null,
        },
      })
    })

    it('should do nothing if integration not found', async () => {
      (prisma.integration.findUnique as jest.Mock).mockResolvedValue(null)

      const result: SyncResult = {
        success: true,
        recordsCount: 0,
        duration: 100,
      }

      await updateIntegrationAfterSync('non-existent', result)

      expect(prisma.integration.update).not.toHaveBeenCalled()
    })
  })

  describe('getSyncHistory', () => {
    it('should return paginated sync logs', async () => {
      const mockLogs = [
        { id: 'log-1', status: SyncStatus.SUCCESS },
        { id: 'log-2', status: SyncStatus.FAILED },
      ];
      (prisma.syncLog.findMany as jest.Mock).mockResolvedValue(mockLogs);
      (prisma.syncLog.count as jest.Mock).mockResolvedValue(15)

      const result = await getSyncHistory('int-1', { page: 1, pageSize: 10 })

      expect(prisma.syncLog.findMany).toHaveBeenCalledWith({
        where: { integrationId: 'int-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
      expect(result).toEqual({ logs: mockLogs, total: 15 })
    })

    it('should use default pagination values', async () => {
      (prisma.syncLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.syncLog.count as jest.Mock).mockResolvedValue(0)

      await getSyncHistory('int-1')

      expect(prisma.syncLog.findMany).toHaveBeenCalledWith({
        where: { integrationId: 'int-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('should calculate skip correctly for page 2', async () => {
      (prisma.syncLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.syncLog.count as jest.Mock).mockResolvedValue(25)

      await getSyncHistory('int-1', { page: 2, pageSize: 10 })

      expect(prisma.syncLog.findMany).toHaveBeenCalledWith({
        where: { integrationId: 'int-1' },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      })
    })
  })
})
