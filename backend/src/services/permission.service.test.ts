import { prisma } from '../db/client'
import {
  canAccessDashboard,
  canAccessKpi,
  getAccessibleDashboardIds,
  getAccessibleKpiIds,
  getAccessibleDashboardsFilter,
  getAccessibleKpisFilter,
  type PermissionContext,
} from './permission.service'

// Mock Prisma client
jest.mock('../db/client', () => ({
  prisma: {
    dashboard: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    kpi: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

describe('Permission Service', () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('canAccessDashboard', () => {
    const dashboardId = 'dashboard-123'

    it('should allow ADMIN to access any dashboard', async () => {
      const ctx: PermissionContext = { userId: 'admin-1', userRole: 'ADMIN' }

      const result = await canAccessDashboard(ctx, dashboardId, 'VIEW')
      
      expect(result).toBe(true)
      // Should not query database for admins
      expect(mockPrisma.dashboard.findUnique).not.toHaveBeenCalled()
    })

    it('should allow owner to VIEW their dashboard', async () => {
      const ctx: PermissionContext = { userId: 'user-1', userRole: 'EDITOR' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue({
        id: dashboardId,
        ownerId: 'user-1',
        accessList: [],
      })

      const result = await canAccessDashboard(ctx, dashboardId, 'VIEW')
      
      expect(result).toBe(true)
    })

    it('should allow owner to EDIT their dashboard', async () => {
      const ctx: PermissionContext = { userId: 'user-1', userRole: 'EDITOR' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue({
        id: dashboardId,
        ownerId: 'user-1',
        accessList: [],
      })

      const result = await canAccessDashboard(ctx, dashboardId, 'EDIT')
      
      expect(result).toBe(true)
    })

    it('should allow owner to DELETE their dashboard', async () => {
      const ctx: PermissionContext = { userId: 'user-1', userRole: 'EDITOR' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue({
        id: dashboardId,
        ownerId: 'user-1',
        accessList: [],
      })

      const result = await canAccessDashboard(ctx, dashboardId, 'DELETE')
      
      expect(result).toBe(true)
    })

    it('should allow owner to MANAGE their dashboard', async () => {
      const ctx: PermissionContext = { userId: 'user-1', userRole: 'EDITOR' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue({
        id: dashboardId,
        ownerId: 'user-1',
        accessList: [],
      })

      const result = await canAccessDashboard(ctx, dashboardId, 'MANAGE')
      
      expect(result).toBe(true)
    })

    it('should allow user with VIEW access to VIEW', async () => {
      const ctx: PermissionContext = { userId: 'user-2', userRole: 'VIEWER' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue({
        id: dashboardId,
        ownerId: 'user-1',
        accessList: [{ permission: 'VIEW' }],
      })

      const result = await canAccessDashboard(ctx, dashboardId, 'VIEW')
      
      expect(result).toBe(true)
    })

    it('should deny user with VIEW access to EDIT', async () => {
      const ctx: PermissionContext = { userId: 'user-2', userRole: 'VIEWER' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue({
        id: dashboardId,
        ownerId: 'user-1',
        accessList: [{ permission: 'VIEW' }],
      })

      const result = await canAccessDashboard(ctx, dashboardId, 'EDIT')
      
      expect(result).toBe(false)
    })

    it('should allow user with EDIT access to VIEW', async () => {
      const ctx: PermissionContext = { userId: 'user-2', userRole: 'EDITOR' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue({
        id: dashboardId,
        ownerId: 'user-1',
        accessList: [{ permission: 'EDIT' }],
      })

      const result = await canAccessDashboard(ctx, dashboardId, 'VIEW')
      
      expect(result).toBe(true)
    })

    it('should allow user with EDIT access to EDIT', async () => {
      const ctx: PermissionContext = { userId: 'user-2', userRole: 'EDITOR' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue({
        id: dashboardId,
        ownerId: 'user-1',
        accessList: [{ permission: 'EDIT' }],
      })

      const result = await canAccessDashboard(ctx, dashboardId, 'EDIT')
      
      expect(result).toBe(true)
    })

    it('should deny user with EDIT access to DELETE', async () => {
      const ctx: PermissionContext = { userId: 'user-2', userRole: 'EDITOR' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue({
        id: dashboardId,
        ownerId: 'user-1',
        accessList: [{ permission: 'EDIT' }],
      })

      const result = await canAccessDashboard(ctx, dashboardId, 'DELETE')
      
      expect(result).toBe(false)
    })

    it('should deny user with EDIT access to MANAGE', async () => {
      const ctx: PermissionContext = { userId: 'user-2', userRole: 'EDITOR' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue({
        id: dashboardId,
        ownerId: 'user-1',
        accessList: [{ permission: 'EDIT' }],
      })

      const result = await canAccessDashboard(ctx, dashboardId, 'MANAGE')
      
      expect(result).toBe(false)
    })

    it('should allow user with EDIT access to SHARE', async () => {
      const ctx: PermissionContext = { userId: 'user-2', userRole: 'EDITOR' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue({
        id: dashboardId,
        ownerId: 'user-1',
        accessList: [{ permission: 'EDIT' }],
      })

      const result = await canAccessDashboard(ctx, dashboardId, 'SHARE')
      
      expect(result).toBe(true)
    })

    it('should deny user with VIEW access to SHARE', async () => {
      const ctx: PermissionContext = { userId: 'user-2', userRole: 'VIEWER' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue({
        id: dashboardId,
        ownerId: 'user-1',
        accessList: [{ permission: 'VIEW' }],
      })

      const result = await canAccessDashboard(ctx, dashboardId, 'SHARE')
      
      expect(result).toBe(false)
    })

    it('should allow owner to SHARE their dashboard', async () => {
      const ctx: PermissionContext = { userId: 'user-1', userRole: 'EDITOR' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue({
        id: dashboardId,
        ownerId: 'user-1',
        accessList: [],
      })

      const result = await canAccessDashboard(ctx, dashboardId, 'SHARE')
      
      expect(result).toBe(true)
    })

    it('should deny user without access', async () => {
      const ctx: PermissionContext = { userId: 'user-3', userRole: 'VIEWER' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue({
        id: dashboardId,
        ownerId: 'user-1',
        accessList: [],
      })

      const result = await canAccessDashboard(ctx, dashboardId, 'VIEW')
      
      expect(result).toBe(false)
    })

    it('should return false for non-existent dashboard', async () => {
      const ctx: PermissionContext = { userId: 'user-1', userRole: 'EDITOR' }
      ;(mockPrisma.dashboard.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await canAccessDashboard(ctx, 'non-existent', 'VIEW')
      
      expect(result).toBe(false)
    })
  })

  describe('canAccessKpi', () => {
    const kpiId = 'kpi-123'

    it('should allow ADMIN to access any KPI', async () => {
      const ctx: PermissionContext = { userId: 'admin-1', userRole: 'ADMIN' }

      const result = await canAccessKpi(ctx, kpiId, 'VIEW')
      
      expect(result).toBe(true)
      expect(mockPrisma.kpi.findUnique).not.toHaveBeenCalled()
    })

    it('should allow owner to access their KPI with any permission', async () => {
      const ctx: PermissionContext = { userId: 'user-1', userRole: 'EDITOR' }
      ;(mockPrisma.kpi.findUnique as jest.Mock).mockResolvedValue({
        id: kpiId,
        ownerId: 'user-1',
        accessList: [],
      })

      expect(await canAccessKpi(ctx, kpiId, 'VIEW')).toBe(true)
      expect(await canAccessKpi(ctx, kpiId, 'EDIT')).toBe(true)
      expect(await canAccessKpi(ctx, kpiId, 'DELETE')).toBe(true)
      expect(await canAccessKpi(ctx, kpiId, 'MANAGE')).toBe(true)
    })

    it('should deny user with VIEW access to EDIT KPI', async () => {
      const ctx: PermissionContext = { userId: 'user-2', userRole: 'VIEWER' }
      ;(mockPrisma.kpi.findUnique as jest.Mock).mockResolvedValue({
        id: kpiId,
        ownerId: 'user-1',
        accessList: [{ permission: 'VIEW' }],
      })

      const result = await canAccessKpi(ctx, kpiId, 'EDIT')
      
      expect(result).toBe(false)
    })

    it('should allow user with EDIT access to EDIT KPI', async () => {
      const ctx: PermissionContext = { userId: 'user-2', userRole: 'EDITOR' }
      ;(mockPrisma.kpi.findUnique as jest.Mock).mockResolvedValue({
        id: kpiId,
        ownerId: 'user-1',
        accessList: [{ permission: 'EDIT' }],
      })

      const result = await canAccessKpi(ctx, kpiId, 'EDIT')
      
      expect(result).toBe(true)
    })

    it('should allow user with EDIT access to SHARE KPI', async () => {
      const ctx: PermissionContext = { userId: 'user-2', userRole: 'EDITOR' }
      ;(mockPrisma.kpi.findUnique as jest.Mock).mockResolvedValue({
        id: kpiId,
        ownerId: 'user-1',
        accessList: [{ permission: 'EDIT' }],
      })

      const result = await canAccessKpi(ctx, kpiId, 'SHARE')
      
      expect(result).toBe(true)
    })

    it('should deny user with VIEW access to SHARE KPI', async () => {
      const ctx: PermissionContext = { userId: 'user-2', userRole: 'VIEWER' }
      ;(mockPrisma.kpi.findUnique as jest.Mock).mockResolvedValue({
        id: kpiId,
        ownerId: 'user-1',
        accessList: [{ permission: 'VIEW' }],
      })

      const result = await canAccessKpi(ctx, kpiId, 'SHARE')
      
      expect(result).toBe(false)
    })
  })

  describe('getAccessibleDashboardIds', () => {
    it('should return all dashboards for ADMIN', async () => {
      const ctx: PermissionContext = { userId: 'admin-1', userRole: 'ADMIN' }
      ;(mockPrisma.dashboard.findMany as jest.Mock).mockResolvedValue([
        { id: 'dash-1' },
        { id: 'dash-2' },
        { id: 'dash-3' },
      ])

      const result = await getAccessibleDashboardIds(ctx)
      
      expect(result).toEqual(['dash-1', 'dash-2', 'dash-3'])
    })

    it('should return owned and shared dashboards for non-admin', async () => {
      const ctx: PermissionContext = { userId: 'user-1', userRole: 'EDITOR' }
      ;(mockPrisma.dashboard.findMany as jest.Mock).mockResolvedValue([
        { id: 'dash-1' }, // owned
        { id: 'dash-2' }, // shared
      ])

      const result = await getAccessibleDashboardIds(ctx)
      
      expect(result).toEqual(['dash-1', 'dash-2'])
      expect(mockPrisma.dashboard.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { ownerId: 'user-1' },
            { accessList: { some: { userId: 'user-1' } } },
          ],
        },
        select: { id: true },
      })
    })
  })

  describe('getAccessibleKpiIds', () => {
    it('should return all KPIs for ADMIN', async () => {
      const ctx: PermissionContext = { userId: 'admin-1', userRole: 'ADMIN' }
      ;(mockPrisma.kpi.findMany as jest.Mock).mockResolvedValue([
        { id: 'kpi-1' },
        { id: 'kpi-2' },
      ])

      const result = await getAccessibleKpiIds(ctx)
      
      expect(result).toEqual(['kpi-1', 'kpi-2'])
    })

    it('should return owned and shared KPIs for non-admin', async () => {
      const ctx: PermissionContext = { userId: 'user-1', userRole: 'VIEWER' }
      ;(mockPrisma.kpi.findMany as jest.Mock).mockResolvedValue([
        { id: 'kpi-1' },
      ])

      const result = await getAccessibleKpiIds(ctx)
      
      expect(result).toEqual(['kpi-1'])
      expect(mockPrisma.kpi.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { ownerId: 'user-1' },
            { accessList: { some: { userId: 'user-1' } } },
          ],
        },
        select: { id: true },
      })
    })
  })

  describe('getAccessibleDashboardsFilter', () => {
    it('should return empty filter for ADMIN', () => {
      const ctx: PermissionContext = { userId: 'admin-1', userRole: 'ADMIN' }
      
      const result = getAccessibleDashboardsFilter(ctx)
      
      expect(result).toEqual({})
    })

    it('should return OR filter for non-admin', () => {
      const ctx: PermissionContext = { userId: 'user-1', userRole: 'EDITOR' }
      
      const result = getAccessibleDashboardsFilter(ctx)
      
      expect(result).toEqual({
        OR: [
          { ownerId: 'user-1' },
          { accessList: { some: { userId: 'user-1' } } },
        ],
      })
    })
  })

  describe('getAccessibleKpisFilter', () => {
    it('should return empty filter for ADMIN', () => {
      const ctx: PermissionContext = { userId: 'admin-1', userRole: 'ADMIN' }
      
      const result = getAccessibleKpisFilter(ctx)
      
      expect(result).toEqual({})
    })

    it('should return OR filter for non-admin', () => {
      const ctx: PermissionContext = { userId: 'user-1', userRole: 'VIEWER' }
      
      const result = getAccessibleKpisFilter(ctx)
      
      expect(result).toEqual({
        OR: [
          { ownerId: 'user-1' },
          { accessList: { some: { userId: 'user-1' } } },
        ],
      })
    })
  })
})
