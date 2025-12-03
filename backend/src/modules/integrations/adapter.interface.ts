/**
 * Integration Adapter Types and Interfaces
 * 
 * This module defines the pluggable adapter architecture for data source integrations.
 */

export type IntegrationType = 'API' | 'MANUAL' | 'WEBHOOK'

export interface ConnectionResult {
  success: boolean
  message: string
  responseTime?: number
  error?: string
}

export interface FieldSchema {
  name: string
  path: string // JSON path for nested fields
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  sample?: unknown
}

export interface DataRow {
  [key: string]: unknown
}

export interface DataResult {
  success: boolean
  data: DataRow[]
  totalRows?: number
  error?: string
  fetchedAt: Date
}

export interface IntegrationConfig {
  // Common fields
  name?: string
  
  // API-specific
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string
  apiKey?: string
  authType?: 'none' | 'apiKey' | 'bearer' | 'basic'
  authHeader?: string
  username?: string
  password?: string
  
  // Manual-specific
  fields?: FieldSchema[]
  
  // Webhook-specific
  webhookSecret?: string
}

/**
 * Interface that all integration adapters must implement.
 * This enables a pluggable architecture where new data source types
 * can be added without modifying core integration logic.
 */
export interface IntegrationAdapter {
  /** The type of integration this adapter handles */
  type: IntegrationType

  /**
   * Test the connection to the data source.
   * Should verify credentials and basic connectivity.
   */
  testConnection(config: IntegrationConfig): Promise<ConnectionResult>

  /**
   * Fetch data from the data source.
   * @param config - The integration configuration
   * @param fieldPaths - Optional list of field paths to fetch
   * @param limit - Maximum number of rows to fetch
   */
  fetchData(
    config: IntegrationConfig,
    fieldPaths?: string[],
    limit?: number
  ): Promise<DataResult>

  /**
   * Discover available fields from the data source.
   * Returns schema information for field mapping.
   */
  discoverFields(config: IntegrationConfig): Promise<FieldSchema[]>
}
