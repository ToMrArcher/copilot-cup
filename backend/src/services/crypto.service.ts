import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Get encryption key from environment.
 * Key must be 32 bytes (256 bits) for AES-256.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  // If key is hex-encoded (64 chars), decode it
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }

  // If key is base64-encoded, decode it
  if (key.length === 44) {
    return Buffer.from(key, 'base64')
  }

  // Otherwise, hash the key to get 32 bytes
  return crypto.createHash('sha256').update(key).digest()
}

/**
 * Encrypt sensitive data using AES-256-GCM.
 * Returns a base64-encoded string containing IV + AuthTag + Ciphertext.
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf8')
  encrypted = Buffer.concat([encrypted, cipher.final()])

  const authTag = cipher.getAuthTag()

  // Combine IV + AuthTag + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted])
  return combined.toString('base64')
}

/**
 * Decrypt data encrypted with encrypt().
 * Expects base64-encoded string containing IV + AuthTag + Ciphertext.
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey()
  const combined = Buffer.from(encryptedData, 'base64')

  // Extract IV, AuthTag, and Ciphertext
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}

/**
 * Encrypt a JSON object (e.g., integration config with credentials).
 */
export function encryptJson<T>(data: T): string {
  return encrypt(JSON.stringify(data))
}

/**
 * Decrypt a JSON object.
 */
export function decryptJson<T>(encryptedData: string): T {
  return JSON.parse(decrypt(encryptedData))
}

/**
 * Generate a new random encryption key (for setup).
 * Returns hex-encoded 32-byte key.
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Mask sensitive values for display (e.g., API keys).
 * Shows first 4 and last 4 characters.
 */
export function maskSensitiveValue(value: string): string {
  if (value.length <= 8) {
    return '***'
  }
  return `${value.slice(0, 4)}${'*'.repeat(Math.min(value.length - 8, 20))}${value.slice(-4)}`
}
