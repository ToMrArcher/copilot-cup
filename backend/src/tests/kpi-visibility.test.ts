import { getAccessibleKpisFilter, canAccessKpi, type PermissionContext } from '../services/permission.service'

/**
 * Tests for KPI visibility permissions
 * 
 * These tests verify that:
 * - Admins can see all KPIs
 * - Editors/Viewers can only see KPIs they own or have access to
 * - The filter correctly handles different role scenarios
 */
describe('KPI Visibility Permissions', () => {
  describe('getAccessibleKpisFilter', () => {
    it('should return empty filter for ADMIN (sees all KPIs)', () => {
      const ctx: PermissionContext = { userId: 'admin-1', userRole: 'ADMIN' }
      
      const result = getAccessibleKpisFilter(ctx)
      
      // Empty filter means no restrictions - admin sees everything
      expect(result).toEqual({})
    })

    it('should return ownership OR access filter for VIEWER', () => {
      const ctx: PermissionContext = { userId: 'viewer-1', userRole: 'VIEWER' }
      
      const result = getAccessibleKpisFilter(ctx)
      
      // Viewer should only see KPIs they own OR have been granted access to
      expect(result).toEqual({
        OR: [
          { ownerId: 'viewer-1' },
          { accessList: { some: { userId: 'viewer-1' } } },
        ],
      })
    })

    it('should return ownership OR access filter for EDITOR', () => {
      const ctx: PermissionContext = { userId: 'editor-1', userRole: 'EDITOR' }
      
      const result = getAccessibleKpisFilter(ctx)
      
      // Editor should only see KPIs they own OR have been granted access to
      expect(result).toEqual({
        OR: [
          { ownerId: 'editor-1' },
          { accessList: { some: { userId: 'editor-1' } } },
        ],
      })
    })
  })

  describe('Access control scenarios', () => {
    it('should filter correctly when viewer has no access to any KPIs', () => {
      // A new viewer with no KPI ownership and no KpiAccess entries
      // should see an empty list when the filter is applied
      const ctx: PermissionContext = { userId: 'new-viewer', userRole: 'VIEWER' }
      
      const filter = getAccessibleKpisFilter(ctx)
      
      // The filter requires either ownership OR access entry
      // A user with neither will match zero KPIs
      expect(filter).toEqual({
        OR: [
          { ownerId: 'new-viewer' },
          { accessList: { some: { userId: 'new-viewer' } } },
        ],
      })
    })

    it('should include KPIs where user has VIEW access', () => {
      const ctx: PermissionContext = { userId: 'shared-user', userRole: 'VIEWER' }
      
      const filter = getAccessibleKpisFilter(ctx)
      
      // The accessList check includes any access permission (VIEW or EDIT)
      expect(filter.OR).toContainEqual({
        accessList: { some: { userId: 'shared-user' } },
      })
    })

    it('should include KPIs owned by the user', () => {
      const ctx: PermissionContext = { userId: 'kpi-owner', userRole: 'EDITOR' }
      
      const filter = getAccessibleKpisFilter(ctx)
      
      // Owner check is included in the filter
      expect(filter.OR).toContainEqual({
        ownerId: 'kpi-owner',
      })
    })
  })
})
