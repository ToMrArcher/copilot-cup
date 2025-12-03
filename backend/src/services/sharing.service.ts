import crypto from 'crypto'

const SHARE_LINK_SECRET = process.env.SHARE_LINK_SECRET || 'dev-share-secret-change-in-production'

/**
 * Generate a cryptographically secure share token.
 * Format: <random-32-bytes-base64url>.<hmac-signature>
 */
export function generateShareToken(): string {
  const random = crypto.randomBytes(32).toString('base64url')
  const signature = crypto
    .createHmac('sha256', SHARE_LINK_SECRET)
    .update(random)
    .digest('base64url')
    .slice(0, 16) // First 16 chars of signature for brevity
  return `${random}.${signature}`
}

/**
 * Verify a share token's HMAC signature.
 * Returns true if valid, false if tampered or invalid format.
 */
export function verifyShareToken(token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [random, signature] = parts
  if (!random || !signature) return false

  const expectedSignature = crypto
    .createHmac('sha256', SHARE_LINK_SECRET)
    .update(random)
    .digest('base64url')
    .slice(0, 16)

  // Timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    // Buffers are different lengths
    return false
  }
}

/**
 * Calculate expiration date from preset duration.
 */
export function calculateExpiration(duration: string): Date | null {
  const now = new Date()

  switch (duration) {
    case '1h':
      return new Date(now.getTime() + 60 * 60 * 1000)
    case '24h':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case '7d':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    case 'never':
    default:
      return null
  }
}

/**
 * Check if a share link is currently valid (active and not expired).
 */
export function isShareLinkValid(link: { active: boolean; expiresAt: Date | null }): {
  valid: boolean
  reason?: 'inactive' | 'expired'
} {
  if (!link.active) {
    return { valid: false, reason: 'inactive' }
  }

  if (link.expiresAt && new Date() > link.expiresAt) {
    return { valid: false, reason: 'expired' }
  }

  return { valid: true }
}

/**
 * Get the full share URL for a token.
 */
export function getShareUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.SHARE_LINK_BASE_URL || 'http://localhost:3000'
  return `${base}/share/${token}`
}

/**
 * Expiration presets for the UI.
 */
export const EXPIRATION_PRESETS = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'never', label: 'Never expires' },
] as const

export type ExpirationPreset = typeof EXPIRATION_PRESETS[number]['value']
