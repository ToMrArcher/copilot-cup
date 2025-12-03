import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  hasMinimumRole,
  validatePassword,
  validateEmail,
  toSafeUser,
  type TokenPayload,
  type SafeUser,
} from './auth.service'

describe('Auth Service', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'SecurePass123'
      const hash = await hashPassword(password)

      expect(hash).not.toBe(password)
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/) // bcrypt format
      expect(hash.length).toBeGreaterThan(50)
    })

    it('should produce different hashes for same password (salt)', async () => {
      const password = 'SecurePass123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'SecurePass123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'SecurePass123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword('WrongPassword123', hash)
      expect(isValid).toBe(false)
    })

    it('should be case-sensitive', async () => {
      const password = 'SecurePass123'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword('securepass123', hash)
      expect(isValid).toBe(false)
    })
  })

  describe('generateToken', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'EDITOR' as const,
    }

    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser)

      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // header.payload.signature
    })

    it('should include user data in token payload', () => {
      const token = generateToken(mockUser)
      const payload = verifyToken(token)

      expect(payload).not.toBeNull()
      expect(payload!.userId).toBe(mockUser.id)
      expect(payload!.email).toBe(mockUser.email)
      expect(payload!.role).toBe(mockUser.role)
    })

    it('should include expiration in token', () => {
      const token = generateToken(mockUser)
      const payload = verifyToken(token)

      expect(payload).not.toBeNull()
      expect(payload!.exp).toBeDefined()
      expect(payload!.iat).toBeDefined()
      expect(payload!.exp).toBeGreaterThan(payload!.iat!)
    })
  })

  describe('verifyToken', () => {
    const mockUser = {
      id: 'user-456',
      email: 'verify@example.com',
      role: 'ADMIN' as const,
    }

    it('should verify and decode a valid token', () => {
      const token = generateToken(mockUser)
      const payload = verifyToken(token)

      expect(payload).not.toBeNull()
      expect(payload!.userId).toBe(mockUser.id)
      expect(payload!.email).toBe(mockUser.email)
      expect(payload!.role).toBe(mockUser.role)
    })

    it('should return null for an invalid token', () => {
      const payload = verifyToken('invalid.token.here')
      expect(payload).toBeNull()
    })

    it('should return null for a malformed token', () => {
      const payload = verifyToken('not-a-jwt')
      expect(payload).toBeNull()
    })

    it('should return null for an empty string', () => {
      const payload = verifyToken('')
      expect(payload).toBeNull()
    })

    it('should return null for a tampered token', () => {
      const token = generateToken(mockUser)
      // Tamper with the signature
      const tamperedToken = token.slice(0, -5) + 'XXXXX'
      const payload = verifyToken(tamperedToken)
      expect(payload).toBeNull()
    })
  })

  describe('hasMinimumRole', () => {
    it('should return true when user role equals required role', () => {
      expect(hasMinimumRole('VIEWER', 'VIEWER')).toBe(true)
      expect(hasMinimumRole('EDITOR', 'EDITOR')).toBe(true)
      expect(hasMinimumRole('ADMIN', 'ADMIN')).toBe(true)
    })

    it('should return true when user role exceeds required role', () => {
      expect(hasMinimumRole('EDITOR', 'VIEWER')).toBe(true)
      expect(hasMinimumRole('ADMIN', 'VIEWER')).toBe(true)
      expect(hasMinimumRole('ADMIN', 'EDITOR')).toBe(true)
    })

    it('should return false when user role is below required role', () => {
      expect(hasMinimumRole('VIEWER', 'EDITOR')).toBe(false)
      expect(hasMinimumRole('VIEWER', 'ADMIN')).toBe(false)
      expect(hasMinimumRole('EDITOR', 'ADMIN')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should accept a valid password', () => {
      const result = validatePassword('SecurePass123')
      expect(result).toBeNull()
    })

    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Abc123')
      expect(result).toBe('Password must be at least 8 characters long')
    })

    it('should reject password without uppercase letter', () => {
      const result = validatePassword('securepass123')
      expect(result).toBe('Password must contain at least one uppercase letter')
    })

    it('should reject password without lowercase letter', () => {
      const result = validatePassword('SECUREPASS123')
      expect(result).toBe('Password must contain at least one lowercase letter')
    })

    it('should reject password without number', () => {
      const result = validatePassword('SecurePassword')
      expect(result).toBe('Password must contain at least one number')
    })

    it('should accept password with special characters', () => {
      const result = validatePassword('Secure@Pass#123!')
      expect(result).toBeNull()
    })

    it('should accept password with unicode characters', () => {
      const result = validatePassword('Sécure1Pass')
      expect(result).toBeNull()
    })

    it('should accept exactly 8 character password', () => {
      const result = validatePassword('Abcd1234')
      expect(result).toBeNull()
    })
  })

  describe('validateEmail', () => {
    it('should accept valid email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('user.name@example.com')).toBe(true)
      expect(validateEmail('user+tag@example.com')).toBe(true)
      expect(validateEmail('user@subdomain.example.com')).toBe(true)
      expect(validateEmail('user@example.co.uk')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(validateEmail('notanemail')).toBe(false)
      expect(validateEmail('missing@domain')).toBe(false)
      expect(validateEmail('@nodomain.com')).toBe(false)
      expect(validateEmail('spaces in@email.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })

    it('should reject emails with multiple @ symbols', () => {
      expect(validateEmail('user@@example.com')).toBe(false)
      expect(validateEmail('user@exa@mple.com')).toBe(false)
    })
  })

  describe('toSafeUser', () => {
    it('should remove passwordHash from user object', () => {
      const user = {
        id: 'user-789',
        email: 'safe@example.com',
        name: 'Safe User',
        role: 'VIEWER' as const,
        passwordHash: '$2b$12$secrethashvalue',
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2023-12-02'),
      }

      const safeUser = toSafeUser(user)

      expect(safeUser).toEqual({
        id: 'user-789',
        email: 'safe@example.com',
        name: 'Safe User',
        role: 'VIEWER',
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2023-12-02'),
      })
      expect((safeUser as unknown as Record<string, unknown>).passwordHash).toBeUndefined()
    })

    it('should handle null name', () => {
      const user = {
        id: 'user-null',
        email: 'noname@example.com',
        name: null,
        role: 'ADMIN' as const,
        passwordHash: '$2b$12$anotherhash',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const safeUser = toSafeUser(user)

      expect(safeUser.name).toBeNull()
      expect((safeUser as unknown as Record<string, unknown>).passwordHash).toBeUndefined()
    })

    it('should preserve all non-sensitive fields', () => {
      const createdAt = new Date('2023-01-15T10:30:00Z')
      const updatedAt = new Date('2023-06-20T14:45:00Z')

      const user = {
        id: 'preserve-test',
        email: 'preserve@example.com',
        name: 'Preserved Name',
        role: 'EDITOR' as const,
        passwordHash: 'hash-to-remove',
        createdAt,
        updatedAt,
      }

      const safeUser = toSafeUser(user)

      expect(safeUser.id).toBe('preserve-test')
      expect(safeUser.email).toBe('preserve@example.com')
      expect(safeUser.name).toBe('Preserved Name')
      expect(safeUser.role).toBe('EDITOR')
      expect(safeUser.createdAt).toEqual(createdAt)
      expect(safeUser.updatedAt).toEqual(updatedAt)
    })
  })
})
