import { AdapterRegistry } from '../adapter.registry'
import { ApiAdapter } from './api.adapter'
import { ManualAdapter } from './manual.adapter'
import { GraphqlAdapter } from './graphql.adapter'

describe('AdapterRegistry', () => {
  it('should have API adapter registered', () => {
    expect(AdapterRegistry.has('API')).toBe(true)
    expect(AdapterRegistry.get('API')).toBeInstanceOf(ApiAdapter)
  })

  it('should have Manual adapter registered', () => {
    expect(AdapterRegistry.has('MANUAL')).toBe(true)
    expect(AdapterRegistry.get('MANUAL')).toBeInstanceOf(ManualAdapter)
  })

  it('should have GraphQL adapter registered', () => {
    expect(AdapterRegistry.has('GRAPHQL')).toBe(true)
    expect(AdapterRegistry.get('GRAPHQL')).toBeInstanceOf(GraphqlAdapter)
  })

  it('should return all registered types', () => {
    const types = AdapterRegistry.getTypes()
    expect(types).toContain('API')
    expect(types).toContain('MANUAL')
    expect(types).toContain('GRAPHQL')
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

describe('GraphqlAdapter', () => {
  const adapter = new GraphqlAdapter()

  it('should have correct type', () => {
    expect(adapter.type).toBe('GRAPHQL')
  })

  it('should fail connection test without URL', async () => {
    const result = await adapter.testConnection({
      query: '{ __typename }',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('URL is required')
  })

  it('should fail connection test without query', async () => {
    const result = await adapter.testConnection({
      url: 'https://example.com/graphql',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('query is required')
  })

  it('should test connection to public GraphQL endpoint', async () => {
    // Using countries.trevorblades.com - a public GraphQL API
    const result = await adapter.testConnection({
      url: 'https://countries.trevorblades.com/graphql',
      query: '{ __typename }',
    })

    expect(result.success).toBe(true)
    expect(result.responseTime).toBeGreaterThan(0)
  })

  it('should fetch data from GraphQL endpoint', async () => {
    const result = await adapter.fetchData({
      url: 'https://countries.trevorblades.com/graphql',
      query: `{
        countries {
          code
          name
          emoji
        }
      }`,
    }, undefined, 5)

    expect(result.success).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.fetchedAt).toBeInstanceOf(Date)
  })

  it('should discover fields from GraphQL response', async () => {
    const fields = await adapter.discoverFields({
      url: 'https://countries.trevorblades.com/graphql',
      query: `{
        countries {
          code
          name
          emoji
        }
      }`,
    })

    expect(fields.length).toBeGreaterThan(0)
    const fieldNames = fields.map(f => f.name)
    expect(fieldNames).toContain('code')
    expect(fieldNames).toContain('name')
  })

  it('should handle GraphQL errors in response', async () => {
    const result = await adapter.testConnection({
      url: 'https://countries.trevorblades.com/graphql',
      query: '{ invalidField }',
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('GraphQL error')
  })

  it('should support query variables', async () => {
    const result = await adapter.fetchData({
      url: 'https://countries.trevorblades.com/graphql',
      query: `
        query GetCountry($code: ID!) {
          country(code: $code) {
            name
            capital
          }
        }
      `,
      variables: { code: 'US' },
    })

    expect(result.success).toBe(true)
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('should extract nested array values for aggregation', async () => {
    // Simulate a response similar to the user's allEvents query
    const mockResponse = {
      allEvents: {
        data: [
          {
            id: 21878,
            tickets: [
              { price: [{ price: '2100.00' }] }
            ]
          },
          {
            id: 21970,
            tickets: [
              { price: [{ price: '2500.00' }] }
            ]
          }
        ]
      }
    }

    // Test the internal normalizeData and flattenObject methods
    // by creating a simple adapter instance and testing manually
    const normalizedData = (adapter as any).normalizeData(mockResponse, 100)
    
    expect(normalizedData.length).toBe(2) // Should find the data array
    expect(normalizedData[0].id).toBe(21878)
    expect(normalizedData[1].id).toBe(21970)
  })
})
