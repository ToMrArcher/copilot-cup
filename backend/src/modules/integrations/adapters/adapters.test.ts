import { AdapterRegistry } from '../adapter.registry'
import { ApiAdapter } from './api.adapter'
import { ManualAdapter } from './manual.adapter'

describe('AdapterRegistry', () => {
  it('should have API adapter registered', () => {
    expect(AdapterRegistry.has('API')).toBe(true)
    expect(AdapterRegistry.get('API')).toBeInstanceOf(ApiAdapter)
  })

  it('should have Manual adapter registered', () => {
    expect(AdapterRegistry.has('MANUAL')).toBe(true)
    expect(AdapterRegistry.get('MANUAL')).toBeInstanceOf(ManualAdapter)
  })

  it('should return all registered types', () => {
    const types = AdapterRegistry.getTypes()
    expect(types).toContain('API')
    expect(types).toContain('MANUAL')
  })

  it('should throw for unknown adapter type', () => {
    expect(() => AdapterRegistry.get('UNKNOWN' as any)).toThrow('No adapter registered for type: UNKNOWN')
  })
})

describe('ApiAdapter', () => {
  const adapter = new ApiAdapter()

  it('should have correct type', () => {
    expect(adapter.type).toBe('API')
  })

  it('should test connection to valid endpoint', async () => {
    const result = await adapter.testConnection({
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET',
    })

    expect(result.success).toBe(true)
    expect(result.responseTime).toBeGreaterThan(0)
  })

  it('should fail connection test for invalid URL', async () => {
    const result = await adapter.testConnection({
      url: 'https://invalid-url-that-does-not-exist.example.com',
      method: 'GET',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should fetch data from API', async () => {
    const result = await adapter.fetchData({
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'GET',
    }, undefined, 5)

    expect(result.success).toBe(true)
    expect(result.data.length).toBeLessThanOrEqual(5)
    expect(result.fetchedAt).toBeInstanceOf(Date)
  })

  it('should discover fields from API response', async () => {
    const fields = await adapter.discoverFields({
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'GET',
    })

    expect(fields.length).toBeGreaterThan(0)
    const fieldNames = fields.map(f => f.name)
    expect(fieldNames).toContain('id')
    expect(fieldNames).toContain('title')
  })
})

describe('ManualAdapter', () => {
  const adapter = new ManualAdapter()

  it('should have correct type', () => {
    expect(adapter.type).toBe('MANUAL')
  })

  it('should always succeed connection test', async () => {
    const result = await adapter.testConnection({})

    expect(result.success).toBe(true)
    expect(result.responseTime).toBe(0)
  })

  it('should return empty data (data stored in DB)', async () => {
    const result = await adapter.fetchData({})

    expect(result.success).toBe(true)
    expect(result.data).toEqual([])
  })

  it('should return configured fields', async () => {
    const fields = await adapter.discoverFields({
      fields: [
        { name: 'revenue', path: 'revenue', dataType: 'number' },
        { name: 'date', path: 'date', dataType: 'date' },
      ],
    })

    expect(fields).toHaveLength(2)
    expect(fields[0].name).toBe('revenue')
    expect(fields[1].name).toBe('date')
  })
})
