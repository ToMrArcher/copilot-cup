import {
  encrypt,
  decrypt,
  encryptJson,
  decryptJson,
  generateEncryptionKey,
  maskSensitiveValue,
} from '../services/crypto.service'

describe('Crypto Service', () => {
  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a simple string', () => {
      const plaintext = 'my-secret-api-key-12345'
      const encrypted = encrypt(plaintext)

      expect(encrypted).not.toBe(plaintext)
      expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/) // base64

      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe(plaintext)
    })

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'same-secret'
      const encrypted1 = encrypt(plaintext)
      const encrypted2 = encrypt(plaintext)

      expect(encrypted1).not.toBe(encrypted2)

      // But both should decrypt to the same value
      expect(decrypt(encrypted1)).toBe(plaintext)
      expect(decrypt(encrypted2)).toBe(plaintext)
    })

    it('should handle empty string', () => {
      const plaintext = ''
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe(plaintext)
    })

    it('should handle unicode characters', () => {
      const plaintext = 'Hëllö Wörld 🔐 日本語'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe(plaintext)
    })

    it('should handle long strings', () => {
      const plaintext = 'a'.repeat(10000)
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe(plaintext)
    })
  })

  describe('encryptJson/decryptJson', () => {
    it('should encrypt and decrypt a JSON object', () => {
      const config = {
        apiKey: 'sk-1234567890',
        baseUrl: 'https://api.example.com',
        headers: {
          Authorization: 'Bearer token123',
        },
      }

      const encrypted = encryptJson(config)
      expect(typeof encrypted).toBe('string')

      const decrypted = decryptJson<typeof config>(encrypted)
      expect(decrypted).toEqual(config)
    })

    it('should handle arrays', () => {
      const data = [1, 2, 3, 'four', { five: 5 }]
      const encrypted = encryptJson(data)
      const decrypted = decryptJson<typeof data>(encrypted)
      expect(decrypted).toEqual(data)
    })
  })

  describe('generateEncryptionKey', () => {
    it('should generate a 64-character hex string (32 bytes)', () => {
      const key = generateEncryptionKey()
      expect(key).toHaveLength(64)
      expect(key).toMatch(/^[0-9a-f]+$/)
    })

    it('should generate unique keys', () => {
      const key1 = generateEncryptionKey()
      const key2 = generateEncryptionKey()
      expect(key1).not.toBe(key2)
    })
  })

  describe('maskSensitiveValue', () => {
    it('should mask middle of long strings', () => {
      const value = 'sk-1234567890abcdef'
      const masked = maskSensitiveValue(value)
      expect(masked.startsWith('sk-1')).toBe(true)
      expect(masked.endsWith('cdef')).toBe(true)
      expect(masked).toContain('*')
    })

    it('should return *** for short strings', () => {
      expect(maskSensitiveValue('short')).toBe('***')
      expect(maskSensitiveValue('12345678')).toBe('***')
    })

    it('should handle exactly 9 characters', () => {
      const value = '123456789'
      const masked = maskSensitiveValue(value)
      expect(masked).toBe('1234*6789')
    })
  })
})
