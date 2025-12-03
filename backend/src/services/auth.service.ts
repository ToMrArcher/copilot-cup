import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Role } from '@prisma/client'

// Configuration
const SALT_ROUNDS = 12
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

// Token payload type
export interface TokenPayload {
  userId: string
  email: string
  role: Role
  iat?: number
  exp?: number
}

// User type for responses (without password)
export interface SafeUser {
  id: string
  email: string
  name: string | null
  role: Role
  createdAt: Date
  updatedAt: Date
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: { id: string; email: string; role: Role }): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    // Token is invalid or expired
    return null
  }
}

/**
 * Role hierarchy for permission checks
 * Higher number = more permissions
 */
const ROLE_LEVELS: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
}

/**
 * Check if a user's role meets the minimum required role
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole]
}

/**
 * Validate password strength
 * Returns null if valid, or an error message if invalid
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long'
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter'
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter'
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number'
  }

  return null
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Strip sensitive data from user object
 */
export function toSafeUser(user: {
  id: string
  email: string
  name: string | null
  role: Role
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}): SafeUser {
  const { passwordHash: _, ...safeUser } = user
  return safeUser
}
