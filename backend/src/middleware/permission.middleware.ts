import { Request, Response, NextFunction } from 'express'
import {
  canAccessDashboard,
  canAccessKpi,
  RequiredPermission,
  PermissionContext,
} from '../services/permission.service'
// Import to ensure Express Request type is extended
import '../middleware/auth.middleware'

/**
 * Extract permission context from authenticated request
 */
export function getPermissionContext(req: Request): PermissionContext | null {
  if (!req.user) return null
  return {
    userId: req.user.id,
    userRole: req.user.role,
  }
}

/**
 * Middleware factory to check dashboard access
 * Expects :id or :dashboardId param in route
 * Must be used after requireAuth
 */
export function requireDashboardAccess(permission: RequiredPermission) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ctx = getPermissionContext(req)
    if (!ctx) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const dashboardId = req.params.id || req.params.dashboardId
    if (!dashboardId) {
      res.status(400).json({ error: 'Dashboard ID required' })
      return
    }

    try {
      const hasAccess = await canAccessDashboard(ctx, dashboardId, permission)
      if (!hasAccess) {
        res.status(403).json({
          error: 'Access denied',
          message: `You do not have ${permission} permission for this dashboard`,
        })
        return
      }

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      res.status(500).json({ error: 'Permission check failed' })
    }
  }
}

/**
 * Middleware factory to check KPI access
 * Expects :id or :kpiId param in route
 * Must be used after requireAuth
 */
export function requireKpiAccess(permission: RequiredPermission) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ctx = getPermissionContext(req)
    if (!ctx) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const kpiId = req.params.id || req.params.kpiId
    if (!kpiId) {
      res.status(400).json({ error: 'KPI ID required' })
      return
    }

    try {
      const hasAccess = await canAccessKpi(ctx, kpiId, permission)
      if (!hasAccess) {
        res.status(403).json({
          error: 'Access denied',
          message: `You do not have ${permission} permission for this KPI`,
        })
        return
      }

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      res.status(500).json({ error: 'Permission check failed' })
    }
  }
}

/**
 * Middleware to require dashboard ownership (for managing access)
 * Must be used after requireAuth
 */
export function requireDashboardOwnership() {
  return requireDashboardAccess('MANAGE')
}

/**
 * Middleware to require KPI ownership (for managing access)
 * Must be used after requireAuth
 */
export function requireKpiOwnership() {
  return requireKpiAccess('MANAGE')
}
