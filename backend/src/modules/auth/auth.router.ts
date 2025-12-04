import { Router, Request, Response } from 'express'
import { prisma } from '../../db/client'
import {
  hashPassword,
  verifyPassword,
  generateToken,
  validatePassword,
  validateEmail,
  toSafeUser,
} from '../../services/auth.service'
import { requireAuth } from '../../middleware/auth.middleware'
import type { Role } from '@prisma/client'

export const authRouter = Router()

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
}

/**
 * POST /api/auth/register
 * Register a new user
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body as {
      email: string
      password: string
      name?: string
    }

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' })
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      res.status(400).json({ error: passwordError })
      return
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists' })
      return
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: name || null,
        role: 'VIEWER', // Default role for new users
      },
    })

    // Generate token
    const token = generateToken(user)

    // Set cookie
    res.cookie('auth_token', token, COOKIE_OPTIONS)

    res.status(201).json({
      message: 'Account created successfully',
      user: toSafeUser(user),
      token, // Also return token for clients that prefer headers over cookies
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Failed to create account' })
  }
})

/**
 * POST /api/auth/login
 * Login with email and password
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email: string
      password: string
    }

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // Use generic message to prevent user enumeration
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)

    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    // Generate token
    const token = generateToken(user)

    // Set cookie
    res.cookie('auth_token', token, COOKIE_OPTIONS)

    res.json({
      message: 'Login successful',
      user: toSafeUser(user),
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

/**
 * POST /api/auth/logout
 * Logout and clear session
 */
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('auth_token', { path: '/' })
  res.json({ message: 'Logged out successfully' })
})

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({
      user: toSafeUser(user),
    })
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

/**
 * PATCH /api/auth/me
 * Update current user profile
 */
authRouter.patch('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, currentPassword, newPassword } = req.body as {
      name?: string
      currentPassword?: string
      newPassword?: string
    }

    const updateData: { name?: string; passwordHash?: string } = {}

    // Update name if provided
    if (name !== undefined) {
      updateData.name = name || null
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ error: 'Current password is required to change password' })
        return
      }

      // Verify current password
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      })

      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      const isValid = await verifyPassword(currentPassword, user.passwordHash)
      if (!isValid) {
        res.status(401).json({ error: 'Current password is incorrect' })
        return
      }

      // Validate new password
      const passwordError = validatePassword(newPassword)
      if (passwordError) {
        res.status(400).json({ error: passwordError })
        return
      }

      updateData.passwordHash = await hashPassword(newPassword)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
    })

    res.json({
      message: 'Profile updated successfully',
      user: toSafeUser(updatedUser),
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

/**
 * GET /api/auth/users
 * List all users (admin only)
 */
authRouter.get('/users', requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' })
      return
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ users })
  } catch (error) {
    console.error('List users error:', error)
    res.status(500).json({ error: 'Failed to list users' })
  }
})

/**
 * PATCH /api/auth/users/:id/role
 * Update user role (admin only)
 */
authRouter.patch('/users/:id/role', requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' })
      return
    }

    const { role } = req.body as { role: Role }

    if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' })
      return
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user!.id) {
      res.status(400).json({ error: 'Cannot change your own role' })
      return
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json({
      message: 'Role updated successfully',
      user,
    })
  } catch (error) {
    console.error('Update role error:', error)
    res.status(500).json({ error: 'Failed to update role' })
  }
})

/**
 * DELETE /api/auth/users/:id
 * Delete a user (admin only)
 */
authRouter.delete('/users/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Admin access required' })
      return
    }

    const userId = req.params.id

    // Prevent admin from deleting themselves
    if (userId === req.user!.id) {
      res.status(400).json({ error: 'Cannot delete your own account' })
      return
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userToDelete) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Delete user (cascade will handle related records based on schema)
    await prisma.user.delete({
      where: { id: userId },
    })

    res.json({
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})
