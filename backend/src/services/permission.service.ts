import { prisma } from '../db/client'
import { Role, AccessPermission } from '@prisma/client'

/**
 * Permission context extracted from authenticated request
 */
export interface PermissionContext {
  userId: string
  userRole: Role
}

/**
 * Permission levels for resources
 * - VIEW: Can view the resource
 * - EDIT: Can edit the resource
 * - DELETE: Can delete the resource (owner/admin only)
 * - MANAGE: Full control including ownership transfer (owner/admin only)
 * - SHARE: Can grant/revoke access to others (owner/admin/editors)
 */
export type RequiredPermission = 'VIEW' | 'EDIT' | 'DELETE' | 'MANAGE' | 'SHARE'

/**
 * Check if user can access a dashboard with the required permission level
 */
export async function canAccessDashboard(
  ctx: PermissionContext,
  dashboardId: string,
  requiredPermission: RequiredPermission
): Promise<boolean> {
  // Admins can do everything
  if (ctx.userRole === 'ADMIN') return true

  const dashboard = await prisma.dashboard.findUnique({
    where: { id: dashboardId },
    include: {
      accessList: {
        where: { userId: ctx.userId },
        select: { permission: true },
      },
    },
  })

  if (!dashboard) return false

  // Owner has full access
  if (dashboard.ownerId === ctx.userId) return true

  // Check granted permissions
  const access = dashboard.accessList[0]
  if (!access) return false

  switch (requiredPermission) {
    case 'VIEW':
      // Any access grants view permission
      return true
    case 'EDIT':
      // Only EDIT permission grants edit access
      return access.permission === 'EDIT'
    case 'SHARE':
      // Users with EDIT access can share (grant access to others)
      return access.permission === 'EDIT'
    case 'DELETE':
    case 'MANAGE':
      // Only owners can delete or manage access
      return false
    default:
      return false
  }
}

/**
 * Check if user can access a KPI with the required permission level
 */
export async function canAccessKpi(
  ctx: PermissionContext,
  kpiId: string,
  requiredPermission: RequiredPermission
): Promise<boolean> {
  // Admins can do everything
  if (ctx.userRole === 'ADMIN') return true

  const kpi = await prisma.kpi.findUnique({
    where: { id: kpiId },
    include: {
      accessList: {
        where: { userId: ctx.userId },
        select: { permission: true },
      },
    },
  })

  if (!kpi) return false

  // Owner has full access
  if (kpi.ownerId === ctx.userId) return true

  // Check granted permissions
  const access = kpi.accessList[0]
  if (!access) return false

  switch (requiredPermission) {
    case 'VIEW':
      return true
    case 'EDIT':
      return access.permission === 'EDIT'
    case 'SHARE':
      // Users with EDIT access can share (grant access to others)
      return access.permission === 'EDIT'
    case 'DELETE':
    case 'MANAGE':
      return false
    default:
      return false
  }
}

/**
 * Get all dashboard IDs that the user can access
 */
export async function getAccessibleDashboardIds(
  ctx: PermissionContext
): Promise<string[]> {
  // Admins can access all dashboards
  if (ctx.userRole === 'ADMIN') {
    const dashboards = await prisma.dashboard.findMany({
      select: { id: true },
    })
    return dashboards.map(d => d.id)
  }

  // Get dashboards user owns or has access to
  const dashboards = await prisma.dashboard.findMany({
    where: {
      OR: [
        { ownerId: ctx.userId },
        { accessList: { some: { userId: ctx.userId } } },
      ],
    },
    select: { id: true },
  })

  return dashboards.map(d => d.id)
}

/**
 * Get all KPI IDs that the user can access
 */
export async function getAccessibleKpiIds(
  ctx: PermissionContext
): Promise<string[]> {
  // Admins can access all KPIs
  if (ctx.userRole === 'ADMIN') {
    const kpis = await prisma.kpi.findMany({
      select: { id: true },
    })
    return kpis.map(k => k.id)
  }

  // Get KPIs user owns or has access to
  const kpis = await prisma.kpi.findMany({
    where: {
      OR: [
        { ownerId: ctx.userId },
        { accessList: { some: { userId: ctx.userId } } },
      ],
    },
    select: { id: true },
  })

  return kpis.map(k => k.id)
}

/**
 * Build Prisma where clause for accessible dashboards
 */
export function getAccessibleDashboardsFilter(ctx: PermissionContext) {
  if (ctx.userRole === 'ADMIN') {
    return {} // No filter for admins
  }

  return {
    OR: [
      { ownerId: ctx.userId },
      { accessList: { some: { userId: ctx.userId } } },
    ],
  }
}

/**
 * Build Prisma where clause for accessible KPIs
 */
export function getAccessibleKpisFilter(ctx: PermissionContext) {
  if (ctx.userRole === 'ADMIN') {
    return {} // No filter for admins
  }

  return {
    OR: [
      { ownerId: ctx.userId },
      { accessList: { some: { userId: ctx.userId } } },
    ],
  }
}

/**
 * Check if user is the owner of a dashboard
 */
export async function isDashboardOwner(
  userId: string,
  dashboardId: string
): Promise<boolean> {
  const dashboard = await prisma.dashboard.findUnique({
    where: { id: dashboardId },
    select: { ownerId: true },
  })
  return dashboard?.ownerId === userId
}

/**
 * Check if user is the owner of a KPI
 */
export async function isKpiOwner(
  userId: string,
  kpiId: string
): Promise<boolean> {
  const kpi = await prisma.kpi.findUnique({
    where: { id: kpiId },
    select: { ownerId: true },
  })
  return kpi?.ownerId === userId
}
