import { Router, Request, Response } from 'express'
import { prisma } from '../../db/client'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import {
  generateShareToken,
  calculateExpiration,
  getShareUrl,
  type ExpirationPreset,
} from '../../services/sharing.service'

export const sharingRouter = Router()

// All routes require authentication
sharingRouter.use(requireAuth)

/**
 * POST /api/sharing
 * Create a new share link
 */
sharingRouter.post('/', requireRole('EDITOR'), async (req: Request, res: Response) => {
  try {
    const { resourceType, resourceId, name, expiresIn, showTarget } = req.body as {
      resourceType: 'dashboard' | 'kpi'
      resourceId: string
      name?: string
      expiresIn?: ExpirationPreset
      showTarget?: boolean
    }

    // Validate input
    if (!resourceType || !resourceId) {
      res.status(400).json({ error: 'resourceType and resourceId are required' })
      return
    }

    if (!['dashboard', 'kpi'].includes(resourceType)) {
      res.status(400).json({ error: 'resourceType must be "dashboard" or "kpi"' })
      return
    }

    // Verify resource exists and user has access
    let resourceName: string
    if (resourceType === 'dashboard') {
      const dashboard = await prisma.dashboard.findUnique({
        where: { id: resourceId },
        select: { id: true, name: true, ownerId: true },
      })

      if (!dashboard) {
        res.status(404).json({ error: 'Dashboard not found' })
        return
      }

      // Check ownership (or admin)
      if (dashboard.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
        res.status(403).json({ error: 'You do not have permission to share this dashboard' })
        return
      }

      resourceName = dashboard.name
    } else {
      const kpi = await prisma.kpi.findUnique({
        where: { id: resourceId },
        select: { id: true, name: true },
      })

      if (!kpi) {
        res.status(404).json({ error: 'KPI not found' })
        return
      }

      resourceName = kpi.name
    }

    // Generate token and calculate expiration
    const token = generateShareToken()
    const expiresAt = expiresIn ? calculateExpiration(expiresIn) : null

    // Create share link
    const shareLink = await prisma.shareLink.create({
      data: {
        token,
        name: name || null,
        resourceType,
        dashboardId: resourceType === 'dashboard' ? resourceId : null,
        kpiId: resourceType === 'kpi' ? resourceId : null,
        createdById: req.user!.id,
        showTarget: showTarget !== undefined ? showTarget : true,
        expiresAt,
      },
    })

    res.status(201).json({
      id: shareLink.id,
      token: shareLink.token,
      url: getShareUrl(shareLink.token),
      name: shareLink.name,
      resourceType: shareLink.resourceType,
      resourceId,
      resourceName,
      showTarget: shareLink.showTarget,
      expiresAt: shareLink.expiresAt?.toISOString() || null,
      active: shareLink.active,
      createdAt: shareLink.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Create share link error:', error)
    res.status(500).json({ error: 'Failed to create share link' })
  }
})

/**
 * GET /api/sharing
 * List user's share links
 */
sharingRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { resourceType, resourceId } = req.query as {
      resourceType?: string
      resourceId?: string
    }

    // Build where clause
    const where: {
      createdById: string
      resourceType?: string
      dashboardId?: string
      kpiId?: string
    } = {
      createdById: req.user!.id,
    }

    if (resourceType) {
      where.resourceType = resourceType
    }

    if (resourceId && resourceType === 'dashboard') {
      where.dashboardId = resourceId
    } else if (resourceId && resourceType === 'kpi') {
      where.kpiId = resourceId
    }

    const shareLinks = await prisma.shareLink.findMany({
      where,
      include: {
        dashboard: { select: { id: true, name: true } },
        kpi: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const links = shareLinks.map(link => ({
      id: link.id,
      token: link.token,
      url: getShareUrl(link.token),
      name: link.name,
      resourceType: link.resourceType,
      resourceId: link.dashboardId || link.kpiId,
      resourceName: link.dashboard?.name || link.kpi?.name || 'Unknown',
      showTarget: link.showTarget,
      expiresAt: link.expiresAt?.toISOString() || null,
      active: link.active,
      accessCount: link.accessCount,
      lastAccessedAt: link.lastAccessedAt?.toISOString() || null,
      createdAt: link.createdAt.toISOString(),
    }))

    res.json({ links })
  } catch (error) {
    console.error('List share links error:', error)
    res.status(500).json({ error: 'Failed to list share links' })
  }
})

/**
 * GET /api/sharing/:id
 * Get share link details
 */
sharingRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const shareLink = await prisma.shareLink.findUnique({
      where: { id },
      include: {
        dashboard: { select: { id: true, name: true } },
        kpi: { select: { id: true, name: true } },
      },
    })

    if (!shareLink) {
      res.status(404).json({ error: 'Share link not found' })
      return
    }

    // Check ownership
    if (shareLink.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'You do not have permission to view this share link' })
      return
    }

    res.json({
      id: shareLink.id,
      token: shareLink.token,
      url: getShareUrl(shareLink.token),
      name: shareLink.name,
      resourceType: shareLink.resourceType,
      resourceId: shareLink.dashboardId || shareLink.kpiId,
      resourceName: shareLink.dashboard?.name || shareLink.kpi?.name || 'Unknown',
      showTarget: shareLink.showTarget,
      expiresAt: shareLink.expiresAt?.toISOString() || null,
      active: shareLink.active,
      accessCount: shareLink.accessCount,
      lastAccessedAt: shareLink.lastAccessedAt?.toISOString() || null,
      createdAt: shareLink.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Get share link error:', error)
    res.status(500).json({ error: 'Failed to get share link' })
  }
})

/**
 * PATCH /api/sharing/:id
 * Update share link (name, active, expiresAt, showTarget)
 */
sharingRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, active, expiresAt, showTarget } = req.body as {
      name?: string
      active?: boolean
      expiresAt?: string | null
      showTarget?: boolean
    }

    // Find existing link
    const shareLink = await prisma.shareLink.findUnique({
      where: { id },
    })

    if (!shareLink) {
      res.status(404).json({ error: 'Share link not found' })
      return
    }

    // Check ownership
    if (shareLink.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'You do not have permission to update this share link' })
      return
    }

    // Build update data
    const updateData: {
      name?: string | null
      active?: boolean
      expiresAt?: Date | null
      showTarget?: boolean
    } = {}

    if (name !== undefined) {
      updateData.name = name || null
    }

    if (active !== undefined) {
      updateData.active = active
    }

    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
    }

    if (showTarget !== undefined) {
      updateData.showTarget = showTarget
    }

    const updated = await prisma.shareLink.update({
      where: { id },
      data: updateData,
    })

    res.json({
      id: updated.id,
      name: updated.name,
      active: updated.active,
      expiresAt: updated.expiresAt?.toISOString() || null,
      showTarget: updated.showTarget,
    })
  } catch (error) {
    console.error('Update share link error:', error)
    res.status(500).json({ error: 'Failed to update share link' })
  }
})

/**
 * DELETE /api/sharing/:id
 * Permanently delete share link
 */
sharingRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Find existing link
    const shareLink = await prisma.shareLink.findUnique({
      where: { id },
    })

    if (!shareLink) {
      res.status(404).json({ error: 'Share link not found' })
      return
    }

    // Check ownership
    if (shareLink.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'You do not have permission to delete this share link' })
      return
    }

    await prisma.shareLink.delete({
      where: { id },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete share link error:', error)
    res.status(500).json({ error: 'Failed to delete share link' })
  }
})
