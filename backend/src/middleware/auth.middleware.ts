import { Request, Response, NextFunction } from 'express'
import type { Role } from '@prisma/client'
import { verifyToken, hasMinimumRole, TokenPayload } from '../services/auth.service'
import { prisma } from '../db/client'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string | null
        role: Role
      }
      token?: TokenPayload
    }
  }
}

/**
 * Middleware to require authentication
 * Checks for JWT in cookies or Authorization header
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.auth_token

    if (!token) {
      const authHeader = req.headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    // Fetch user from database to ensure they still exist and get latest data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    // Attach user and token to request
    req.user = user
    req.token = payload

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Authentication error' })
  }
}

/**
 * Middleware factory to require a minimum role level
 * Must be used after requireAuth
 */
export function requireRole(minimumRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    if (!hasMinimumRole(req.user.role, minimumRole)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: minimumRole,
        current: req.user.role,
      })
      return
    }

    next()
  }
}

/**
 * Optional auth middleware - attaches user if token is valid, but doesn't require it
 * Useful for routes that work differently for authenticated vs anonymous users
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.auth_token

    if (!token) {
      const authHeader = req.headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        })

        if (user) {
          req.user = user
          req.token = payload
        }
      }
    }

    next()
  } catch (error) {
    // Silently continue without auth for optional auth
    next()
  }
}
