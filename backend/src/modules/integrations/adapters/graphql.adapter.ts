import {
  IntegrationAdapter,
  IntegrationConfig,
  ConnectionResult,
  DataResult,
  FieldSchema,
  DataRow,
} from '../adapter.interface'

/**
 * GraphQL response type
 */
interface GraphQLResponse {
  data?: unknown
  errors?: Array<{ message: string; [key: string]: unknown }>
}

/**
 * Adapter for GraphQL API integrations.
 * Supports custom queries with variables and various authentication methods.
 */
export class GraphqlAdapter implements IntegrationAdapter {
  type = 'GRAPHQL' as const

  async testConnection(config: IntegrationConfig): Promise<ConnectionResult> {
    const startTime = Date.now()

    try {
      const response = await this.executeQuery(config)
      const responseTime = Date.now() - startTime

      if (response.ok) {
        const json = await response.json() as GraphQLResponse
        
        // Check for GraphQL errors in the response
        if (json.errors && json.errors.length > 0) {
          return {
            success: false,
            message: `GraphQL error: ${json.errors[0].message}`,
            responseTime,
            error: JSON.stringify(json.errors),
          }
        }

        return {
          success: true,
          message: `Connection successful (${response.status} ${response.statusText})`,
          responseTime,
        }
      } else {
        return {
          success: false,
          message: `API returned error: ${response.status} ${response.statusText}`,
          responseTime,
          error: await response.text(),
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Connection failed',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async fetchData(
    config: IntegrationConfig,
    _fieldPaths?: string[],
    limit: number = 100
  ): Promise<DataResult> {
    try {
      const response = await this.executeQuery(config)

      if (!response.ok) {
        return {
          success: false,
          data: [],
          error: `API error: ${response.status} ${response.statusText}`,
          fetchedAt: new Date(),
        }
      }

      const json = await response.json() as GraphQLResponse

      // Check for GraphQL errors
      if (json.errors && json.errors.length > 0) {
        // If we have partial data, use it but note the error
        if (!json.data) {
          return {
            success: false,
            data: [],
            error: `GraphQL error: ${json.errors[0].message}`,
            fetchedAt: new Date(),
          }
        }
      }

      const data = this.normalizeData(json.data, limit)

      return {
        success: true,
        data,
        totalRows: data.length,
        fetchedAt: new Date(),
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        fetchedAt: new Date(),
      }
    }
  }

  async discoverFields(config: IntegrationConfig): Promise<FieldSchema[]> {
    try {
      console.log('[GraphQL] discoverFields called with config:', { 
        url: config.url, 
        query: config.query?.substring(0, 100),
        hasVariables: !!config.variables 
      })
      
      const result = await this.fetchData(config, undefined, 5)

      console.log('[GraphQL] fetchData result:', { 
        success: result.success, 
        dataLength: result.data.length,
        error: result.error,
        firstRow: result.data[0] ? JSON.stringify(result.data[0]).substring(0, 200) : 'none'
      })

      if (!result.success || result.data.length === 0) {
        console.log('[GraphQL] No data to discover fields from')
        return []
      }

      // Analyze first row to discover fields, with deep array traversal
      const fields = this.discoverFieldsDeep(result.data[0], '')
      
      console.log('[GraphQL] Discovered fields:', fields.map(f => ({ path: f.path, type: f.dataType })))
      
      // Remove duplicates by path
      const uniqueFields = new Map<string, FieldSchema>()
      for (const field of fields) {
        if (!uniqueFields.has(field.path)) {
          uniqueFields.set(field.path, field)
        }
      }
      
      return Array.from(uniqueFields.values())
    } catch {
      return []
    }
  }

  /**
   * Recursively discover all fields including those nested inside arrays
   */
  private discoverFieldsDeep(obj: unknown, prefix: string, depth: number = 0): FieldSchema[] {
    if (depth > 10 || obj === null || obj === undefined) {
      return []
    }

    const fields: FieldSchema[] = []

    if (Array.isArray(obj)) {
      // For arrays, look at the first element to discover structure
      if (obj.length > 0) {
        const arrayPath = prefix ? `${prefix}[]` : '[]'
        
        // If array contains primitives, add the array itself as a field
        if (typeof obj[0] === 'number' || typeof obj[0] === 'string') {
          fields.push({
            name: prefix.split('.').pop() || 'values',
            path: prefix,
            dataType: 'array',
            sample: obj.slice(0, 3),
          })
        } else if (typeof obj[0] === 'object') {
          // Recurse into the first element to discover nested fields
          fields.push(...this.discoverFieldsDeep(obj[0], arrayPath, depth + 1))
        }
      }
    } else if (typeof obj === 'object') {
      const record = obj as Record<string, unknown>
      
      for (const [key, value] of Object.entries(record)) {
        const path = prefix ? `${prefix}.${key}` : key
        const cleanPath = path.replace(/\[\]\./g, '.').replace(/^\[\]\./, '')
        
        if (value === null || value === undefined) {
          fields.push({
            name: key,
            path: cleanPath,
            dataType: 'string',
            sample: null,
          })
        } else if (Array.isArray(value)) {
          // Add the array field and also discover nested fields
          if (value.length > 0) {
            if (typeof value[0] === 'object') {
              // Recurse into array of objects
              fields.push(...this.discoverFieldsDeep(value, path, depth + 1))
            } else {
              // Array of primitives
              fields.push({
                name: key,
                path: cleanPath,
                dataType: 'array',
                sample: value.slice(0, 3),
              })
            }
          }
        } else if (typeof value === 'object') {
          // Recurse into nested object
          fields.push(...this.discoverFieldsDeep(value, path, depth + 1))
        } else {
          // Primitive value
          fields.push({
            name: key,
            path: cleanPath,
            dataType: this.inferDataType(value),
            sample: value,
          })
        }
      }
    }

    return fields
  }

  private async executeQuery(config: IntegrationConfig): Promise<Response> {
    const { url, headers = {}, authType, apiKey, authValue, authHeader, username, password, query, variables, operationName } = config
    
    // Support both apiKey and authValue (frontend uses authValue)
    const token = apiKey || authValue

    if (!url) {
      throw new Error('GraphQL endpoint URL is required')
    }

    if (!query) {
      throw new Error('GraphQL query is required')
    }

    // In Docker, replace localhost URLs with Docker network hostnames
    let resolvedUrl = url
    if (process.env.NODE_ENV !== 'production') {
      resolvedUrl = url
        .replace('localhost:5050', 'dummy-server:5050')
        .replace('127.0.0.1:5050', 'dummy-server:5050')
        .replace('localhost:5000', 'dummy-server:5050')
        .replace('127.0.0.1:5000', 'dummy-server:5050')
    }

    // Parse headers if it's a string (from frontend)
    let parsedHeaders: Record<string, string> = {}
    if (typeof headers === 'string') {
      try {
        parsedHeaders = JSON.parse(headers)
      } catch {
        // Ignore parse errors
      }
    } else if (headers && typeof headers === 'object') {
      parsedHeaders = headers as Record<string, string>
    }

    const requestHeaders: Record<string, string> = { 
      'Content-Type': 'application/json',
      ...parsedHeaders 
    }

    // Add User-Agent header
    if (!requestHeaders['User-Agent']) {
      requestHeaders['User-Agent'] = 'KPI-Dashboard/1.0'
    }

    // Apply authentication
    switch (authType) {
      case 'apiKey':
        if (token) {
          requestHeaders[authHeader || 'X-API-Key'] = token
        }
        break
      case 'bearer':
        if (token) {
          requestHeaders['Authorization'] = `Bearer ${token}`
        }
        break
      case 'basic':
        if (username && password) {
          const credentials = Buffer.from(`${username}:${password}`).toString('base64')
          requestHeaders['Authorization'] = `Basic ${credentials}`
        }
        break
    }

    // Build GraphQL request body
    const body: Record<string, unknown> = { query }
    if (variables && Object.keys(variables).length > 0) {
      body.variables = variables
    }
    if (operationName) {
      body.operationName = operationName
    }

    return fetch(resolvedUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(body),
    })
  }

  private normalizeData(data: unknown, limit: number): DataRow[] {
    if (!data) {
      return []
    }

    // If data is already an array, use it directly
    if (Array.isArray(data)) {
      return data.slice(0, limit) as DataRow[]
    }

    // If it's an object, try to find an array in the response (including nested)
    if (typeof data === 'object') {
      const obj = data as Record<string, unknown>
      
      // Recursively find the first array in the structure
      const foundArray = this.findFirstArray(obj)
      if (foundArray) {
        return foundArray.slice(0, limit) as DataRow[]
      }

      // If no array found, wrap the object itself as a single row
      // This flattens the nested structure for field discovery
      return [this.flattenObject(obj)]
    }

    return []
  }

  /**
   * Recursively find the first array in a nested object structure
   */
  private findFirstArray(obj: Record<string, unknown>, depth: number = 0): unknown[] | null {
    if (depth > 5) return null

    for (const value of Object.values(obj)) {
      if (Array.isArray(value) && value.length > 0) {
        return value
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const found = this.findFirstArray(value as Record<string, unknown>, depth + 1)
        if (found) return found
      }
    }
    return null
  }

  private flattenObject(obj: Record<string, unknown>, prefix: string = ''): DataRow {
    const result: DataRow = {}

    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key

      if (Array.isArray(value)) {
        // For arrays, extract values and store as array for aggregation functions
        const extractedValues = this.extractValuesFromArray(value)
        if (extractedValues.length > 0) {
          result[path] = extractedValues
        }
        // Also recursively discover fields inside the array
        if (value.length > 0 && typeof value[0] === 'object') {
          const nestedFlat = this.flattenObject(value[0] as Record<string, unknown>, path + '[]')
          Object.assign(result, nestedFlat)
        }
      } else if (value && typeof value === 'object') {
        // Recursively flatten nested objects (max depth handled by path length)
        if (path.split('.').length < 7) {
          Object.assign(result, this.flattenObject(value as Record<string, unknown>, path))
        }
      } else {
        result[path] = value
      }
    }

    return result
  }

  /**
   * Extract all primitive values from a nested array structure
   * This is useful for arrays like tickets[].price[].price
   */
  private extractValuesFromArray(arr: unknown[]): (number | string)[] {
    const values: (number | string)[] = []

    for (const item of arr) {
      if (typeof item === 'number' || typeof item === 'string') {
        values.push(item)
      } else if (Array.isArray(item)) {
        values.push(...this.extractValuesFromArray(item))
      } else if (item && typeof item === 'object') {
        // Look for common value fields in objects
        const obj = item as Record<string, unknown>
        for (const [key, val] of Object.entries(obj)) {
          if (key === 'price' || key === 'value' || key === 'amount') {
            if (typeof val === 'number') {
              values.push(val)
            } else if (typeof val === 'string' && !isNaN(parseFloat(val))) {
              values.push(parseFloat(val))
            }
          } else if (Array.isArray(val)) {
            values.push(...this.extractValuesFromArray(val))
          }
        }
      }
    }

    return values
  }

  private extractFieldsFromObject(obj: DataRow, prefix: string): FieldSchema[] {
    const fields: FieldSchema[] = []

    for (const [key, value] of Object.entries(obj)) {
      // For flattened objects, the key already contains the full path
      const path = prefix ? `${prefix}.${key}` : key
      // Get a clean display name from the path
      const name = key.includes('[]') 
        ? key.replace(/\[\]/g, '') // Remove [] for display name
        : (key.split('.').pop() || key)
      const dataType = this.inferDataType(value)

      // For arrays of numbers, mark as 'array' type - these can be used with aggregation functions
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'number') {
        fields.push({
          name,
          path,
          dataType: 'array',
          sample: value.slice(0, 3), // Show first 3 values as sample
        })
      } else if (dataType !== 'object' || !key.includes('.')) {
        // Only add non-object fields, or object fields that aren't nested paths
        fields.push({
          name,
          path,
          dataType,
          sample: Array.isArray(value) ? value.slice(0, 3) : value,
        })
      }

      // Recursively extract nested objects (if not already flattened)
      if (dataType === 'object' && value && typeof value === 'object' && !Array.isArray(value) && !key.includes('.')) {
        if (path.split('.').length < 7) {
          fields.push(...this.extractFieldsFromObject(value as DataRow, path))
        }
      }
    }

    return fields
  }

  private inferDataType(value: unknown): FieldSchema['dataType'] {
    if (value === null || value === undefined) {
      return 'string'
    }
    if (Array.isArray(value)) {
      return 'array'
    }
    if (typeof value === 'number') {
      return 'number'
    }
    if (typeof value === 'boolean') {
      return 'boolean'
    }
    if (typeof value === 'object') {
      return 'object'
    }
    // Check if string is a date
    if (typeof value === 'string') {
      const date = Date.parse(value)
      if (!isNaN(date) && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        return 'date'
      }
    }
    return 'string'
  }
}
