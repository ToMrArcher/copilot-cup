export type IntegrationType = 'API' | 'MANUAL' | 'WEBHOOK'

export type IntegrationStatus = 'pending' | 'active' | 'connected' | 'synced' | 'error'

export interface DataField {
  id: string
  integrationId: string
  sourceField: string
  targetField: string
  fieldType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'JSON'
  transform?: string
  createdAt: string
  updatedAt?: string
}

// Legacy DataField structure for backwards compatibility
export interface LegacyDataField {
  id: string
  integrationId: string
  name: string
  path: string
  dataType: string
  createdAt: string
}

export interface IntegrationConfig {
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: string // JSON string of headers
  body?: string
  apiKey?: string
  authType?: 'none' | 'apiKey' | 'bearer' | 'basic'
  authValue?: string
  authHeader?: string
  username?: string
  password?: string
  fields?: FieldSchema[]
  description?: string
  updateFrequency?: string
}

export interface FieldSchema {
  name: string
  type?: string
  dataType?: string // Backend returns dataType
  required?: boolean
  path?: string
  sample?: unknown
}

// Helper to get field type from FieldSchema (handles both type and dataType)
export function getFieldType(field: FieldSchema): string {
  return field.type || field.dataType || 'string'
}

export interface Integration {
  id: string
  name: string
  type: IntegrationType
  config: IntegrationConfig
  status: IntegrationStatus
  lastSync: string | null
  createdAt: string
  updatedAt: string
  dataFields: DataField[] | LegacyDataField[]
}

export interface IntegrationTypeInfo {
  type: IntegrationType
  name: string
  description: string
}

export interface ConnectionResult {
  success: boolean
  message: string
  responseTime?: number
  error?: string
}

export interface DataResult {
  success: boolean
  data: Record<string, unknown>[]
  totalRows?: number
  error?: string
  fetchedAt: string
}
