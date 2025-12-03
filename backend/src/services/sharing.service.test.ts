import {
  generateShareToken,
  verifyShareToken,
  calculateExpiration,
  isShareLinkValid,
  getShareUrl,
} from './sharing.service'

describe('Sharing Service', () => {
  describe('generateShareToken', () => {
    it('should generate a token with correct format', () => {
      const token = generateShareToken()
      const parts = token.split('.')

      expect(parts).toHaveLength(2)
      expect(parts[0].length).toBeGreaterThan(30) // base64url of 32 bytes
      expect(parts[1].length).toBe(16) // truncated signature
    })

    it('should generate unique tokens', () => {
      const token1 = generateShareToken()
      const token2 = generateShareToken()

      expect(token1).not.toBe(token2)
    })

    it('should generate URL-safe tokens', () => {
      const token = generateShareToken()
      // URL-safe base64 doesn't contain +, /, or =
      expect(token).not.toMatch(/[+/=]/)
    })
  })

  describe('verifyShareToken', () => {
    it('should verify a valid token', () => {
      const token = generateShareToken()
      expect(verifyShareToken(token)).toBe(true)
    })

    it('should reject a tampered token (modified random)', () => {
      const token = generateShareToken()
      const [random, signature] = token.split('.')
      const tamperedToken = `X${random.slice(1)}.${signature}`

      expect(verifyShareToken(tamperedToken)).toBe(false)
    })

    it('should reject a tampered token (modified signature)', () => {
      const token = generateShareToken()
      const [random] = token.split('.')
      const tamperedToken = `${random}.XXXXXXXXXXXXXXXX`

      expect(verifyShareToken(tamperedToken)).toBe(false)
    })

    it('should reject an invalid format (no dot)', () => {
      expect(verifyShareToken('invalidtoken')).toBe(false)
    })

    it('should reject an invalid format (multiple dots)', () => {
      expect(verifyShareToken('a.b.c')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(verifyShareToken('')).toBe(false)
    })

    it('should reject token with empty parts', () => {
      expect(verifyShareToken('.signature')).toBe(false)
      expect(verifyShareToken('random.')).toBe(false)
    })
  })

  describe('calculateExpiration', () => {
    it('should calculate 1 hour expiration', () => {
      const before = Date.now()
      const expiration = calculateExpiration('1h')
      const after = Date.now()

      expect(expiration).not.toBeNull()
      const expirationTime = expiration!.getTime()
      expect(expirationTime).toBeGreaterThanOrEqual(before + 60 * 60 * 1000)
      expect(expirationTime).toBeLessThanOrEqual(after + 60 * 60 * 1000)
    })

    it('should calculate 24 hour expiration', () => {
      const before = Date.now()
      const expiration = calculateExpiration('24h')

      expect(expiration).not.toBeNull()
      const diff = expiration!.getTime() - before
      expect(diff).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 100)
      expect(diff).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 100)
    })

    it('should calculate 7 day expiration', () => {
      const before = Date.now()
      const expiration = calculateExpiration('7d')

      expect(expiration).not.toBeNull()
      const diff = expiration!.getTime() - before
      expect(diff).toBeGreaterThanOrEqual(7 * 24 * 60 * 60 * 1000 - 100)
    })

    it('should calculate 30 day expiration', () => {
      const before = Date.now()
      const expiration = calculateExpiration('30d')

      expect(expiration).not.toBeNull()
      const diff = expiration!.getTime() - before
      expect(diff).toBeGreaterThanOrEqual(30 * 24 * 60 * 60 * 1000 - 100)
    })

    it('should return null for never', () => {
      const expiration = calculateExpiration('never')
      expect(expiration).toBeNull()
    })

    it('should return null for unknown duration', () => {
      const expiration = calculateExpiration('unknown')
      expect(expiration).toBeNull()
    })
  })

  describe('isShareLinkValid', () => {
    it('should return valid for active non-expired link', () => {
      const result = isShareLinkValid({
        active: true,
        expiresAt: new Date(Date.now() + 60000), // 1 minute in future
      })

      expect(result.valid).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should return valid for active link with no expiration', () => {
      const result = isShareLinkValid({
        active: true,
        expiresAt: null,
      })

      expect(result.valid).toBe(true)
    })

    it('should return invalid for inactive link', () => {
      const result = isShareLinkValid({
        active: false,
        expiresAt: new Date(Date.now() + 60000),
      })

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('inactive')
    })

    it('should return invalid for expired link', () => {
      const result = isShareLinkValid({
        active: true,
        expiresAt: new Date(Date.now() - 60000), // 1 minute in past
      })

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('expired')
    })

    it('should check inactive before expired', () => {
      const result = isShareLinkValid({
        active: false,
        expiresAt: new Date(Date.now() - 60000),
      })

      // Inactive takes precedence
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('inactive')
    })
  })

  describe('getShareUrl', () => {
    it('should generate URL with token', () => {
      const token = 'abc123.signature'
      const url = getShareUrl(token)

      expect(url).toContain('/share/abc123.signature')
    })

    it('should use provided base URL', () => {
      const token = 'abc123.signature'
      const url = getShareUrl(token, 'https://example.com')

      expect(url).toBe('https://example.com/share/abc123.signature')
    })

    it('should use default base URL when not provided', () => {
      const token = 'test.token'
      const url = getShareUrl(token)

      expect(url).toMatch(/^https?:\/\//)
      expect(url).toContain('/share/test.token')
    })
  })
})
