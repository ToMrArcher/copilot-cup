import { Router, Request, Response } from 'express'
import { prisma } from '../../db/client'
import { verifyShareToken, isShareLinkValid } from '../../services/sharing.service'

export const shareRouter = Router()

/**
 * GET /api/share/:token
 * Access a shared resource (no authentication required)
 */
shareRouter.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params

    // Verify token signature
    if (!verifyShareToken(token)) {
      res.status(404).json({
        error: 'not_found',
        message: 'Share link not found',
      })
      return
    }

    // Find share link
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        dashboard: {
          include: {
            widgets: {
              include: {
                kpi: {
                  include: {
                    sources: {
                      include: {
                        dataField: {
                          include: {
                            values: {
                              orderBy: { syncedAt: 'desc' },
                              take: 1,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        kpi: {
          include: {
            sources: {
              include: {
                dataField: {
                  include: {
                    values: {
                      orderBy: { syncedAt: 'desc' },
                      take: 30, // Last 30 values for history
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!shareLink) {
      res.status(404).json({
        error: 'not_found',
        message: 'Share link not found',
      })
      return
    }

    // Check if link is valid
    const validity = isShareLinkValid({
      active: shareLink.active,
      expiresAt: shareLink.expiresAt,
    })

    if (!validity.valid) {
      res.status(410).json({
        error: validity.reason,
        message: validity.reason === 'expired'
          ? 'This share link has expired'
          : 'This share link has been deactivated',
      })
      return
    }

    // Update access statistics
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    })

    // Build response based on resource type
    if (shareLink.resourceType === 'dashboard' && shareLink.dashboard) {
      const dashboard = shareLink.dashboard

      const widgets = dashboard.widgets.map(widget => {
        let kpiData = null

        if (widget.kpi) {
          kpiData = {
            id: widget.kpi.id,
            name: widget.kpi.name,
            currentValue: widget.kpi.currentValue,
            // Only include target info if showTarget is true
            ...(shareLink.showTarget && {
              targetValue: widget.kpi.targetValue,
              targetDirection: widget.kpi.targetDirection,
            }),
          }
        }

        return {
          id: widget.id,
          type: widget.type,
          position: widget.position,
          config: widget.config,
          kpi: kpiData,
        }
      })

      res.json({
        type: 'dashboard',
        dashboard: {
          id: dashboard.id,
          name: dashboard.name,
          layout: dashboard.layout,
          widgets,
        },
        showTarget: shareLink.showTarget,
        expiresAt: shareLink.expiresAt?.toISOString() || null,
      })
    } else if (shareLink.resourceType === 'kpi' && shareLink.kpi) {
      const kpi = shareLink.kpi

      // Build history from data values
      const history: Array<{ timestamp: string; value: number }> = []
      for (const source of kpi.sources) {
        for (const value of source.dataField.values) {
          history.push({
            timestamp: value.syncedAt.toISOString(),
            value: typeof value.value === 'number' ? value.value : parseFloat(String(value.value)) || 0,
          })
        }
      }

      // Sort by timestamp
      history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      res.json({
        type: 'kpi',
        kpi: {
          id: kpi.id,
          name: kpi.name,
          description: kpi.description,
          currentValue: kpi.currentValue,
          // Only include target info if showTarget is true
          ...(shareLink.showTarget && {
            targetValue: kpi.targetValue,
            targetDirection: kpi.targetDirection,
            targetPeriod: kpi.targetPeriod,
          }),
          history,
        },
        showTarget: shareLink.showTarget,
        expiresAt: shareLink.expiresAt?.toISOString() || null,
      })
    } else {
      res.status(404).json({
        error: 'not_found',
        message: 'Shared resource not found',
      })
    }
  } catch (error) {
    console.error('Access shared resource error:', error)
    res.status(500).json({
      error: 'server_error',
      message: 'Failed to access shared resource',
    })
  }
})
