import {
  IntegrationAdapter,
  IntegrationConfig,
  ConnectionResult,
  DataResult,
  FieldSchema,
  DataRow,
} from '../adapter.interface'

/**
 * Adapter for REST API integrations.
 * Supports GET/POST requests with various authentication methods.
 */
export class ApiAdapter implements IntegrationAdapter {
  type = 'API' as const

  async testConnection(config: IntegrationConfig): Promise<ConnectionResult> {
    const startTime = Date.now()

    try {
      const response = await this.makeRequest(config)
      const responseTime = Date.now() - startTime

      if (response.ok) {
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
      const response = await this.makeRequest(config)

      if (!response.ok) {
        return {
          success: false,
          data: [],
          error: `API error: ${response.status} ${response.statusText}`,
          fetchedAt: new Date(),
        }
      }

      const json = await response.json()
      const data = this.normalizeData(json, limit)

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
      const result = await this.fetchData(config, undefined, 5)

      if (!result.success || result.data.length === 0) {
        return []
      }

      // Analyze first row to discover fields
      return this.extractFieldsFromObject(result.data[0], '')
    } catch {
      return []
    }
  }

  private async makeRequest(config: IntegrationConfig): Promise<Response> {
    const { url, method = 'GET', headers = {}, body, authType, apiKey, authHeader, username, password } = config

    if (!url) {
      throw new Error('URL is required')
    }

    // In Docker, replace localhost URLs with Docker network hostnames
    let resolvedUrl = url
    if (process.env.NODE_ENV !== 'production') {
      // Map localhost ports to Docker service names
      resolvedUrl = url
        .replace('localhost:5050', 'dummy-server:5050')
        .replace('127.0.0.1:5050', 'dummy-server:5050')
        .replace('localhost:5000', 'dummy-server:5050')
        .replace('127.0.0.1:5000', 'dummy-server:5050')
    }

    const requestHeaders: Record<string, string> = { ...headers }

    // Add User-Agent header (required by some APIs like met.no)
    if (!requestHeaders['User-Agent']) {
      requestHeaders['User-Agent'] = 'KPI-Dashboard/1.0'
    }

    // Apply authentication
    switch (authType) {
      case 'apiKey':
        if (apiKey) {
          requestHeaders[authHeader || 'X-API-Key'] = apiKey
        }
        break
      case 'bearer':
        if (apiKey) {
          requestHeaders['Authorization'] = `Bearer ${apiKey}`
        }
        break
      case 'basic':
        if (username && password) {
          const credentials = Buffer.from(`${username}:${password}`).toString('base64')
          requestHeaders['Authorization'] = `Basic ${credentials}`
        }
        break
    }

    const options: RequestInit = {
      method,
      headers: requestHeaders,
    }

    if (body && method !== 'GET') {
      options.body = body
      if (!requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/json'
      }
    }

    return fetch(resolvedUrl, options)
  }

  private normalizeData(json: unknown, limit: number): DataRow[] {
    // If it's an array, use it directly
    if (Array.isArray(json)) {
      return json.slice(0, limit) as DataRow[]
    }

    // If it's an object, try to find an array property
    if (json && typeof json === 'object') {
      const obj = json as Record<string, unknown>
      
      // Common patterns for API responses
      const arrayKeys = ['data', 'items', 'results', 'records', 'rows', 'entries']
      for (const key of arrayKeys) {
        if (Array.isArray(obj[key])) {
          return (obj[key] as DataRow[]).slice(0, limit)
        }
      }

      // If no array found, wrap the object
      return [obj as DataRow]
    }

    return []
  }

  private extractFieldsFromObject(obj: DataRow, prefix: string): FieldSchema[] {
    const fields: FieldSchema[] = []

    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key
      const dataType = this.inferDataType(value)

      fields.push({
        name: key,
        path,
        dataType,
        sample: value,
      })

      // Recursively extract nested objects (max depth 3)
      if (dataType === 'object' && value && typeof value === 'object' && path.split('.').length < 3) {
        fields.push(...this.extractFieldsFromObject(value as DataRow, path))
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
