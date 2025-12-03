import type { Integration, DataField, IntegrationType, FieldSchema } from '../types/integration'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Generic fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`)
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

// ============ Integrations API ============

export interface CreateIntegrationInput {
  name: string
  type: IntegrationType
  config: Record<string, unknown>
}

export interface UpdateIntegrationInput {
  name?: string
  config?: Record<string, unknown>
  isActive?: boolean
}

export const integrationsApi = {
  // Get all integrations
  getAll: () => fetchApi<Integration[]>('/api/integrations'),

  // Get single integration
  getById: (id: string) => fetchApi<Integration>(`/api/integrations/${id}`),

  // Create new integration
  create: (data: CreateIntegrationInput) =>
    fetchApi<Integration>('/api/integrations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update integration
  update: (id: string, data: UpdateIntegrationInput) =>
    fetchApi<Integration>(`/api/integrations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Delete integration
  delete: (id: string) =>
    fetchApi<void>(`/api/integrations/${id}`, {
      method: 'DELETE',
    }),

  // Test connection
  testConnection: (id: string) =>
    fetchApi<{ success: boolean; message?: string; error?: string }>(
      `/api/integrations/${id}/test`
    ),

  // Sync data
  sync: (id: string) =>
    fetchApi<{ success: boolean; recordsCount?: number; error?: string }>(
      `/api/integrations/${id}/sync`,
      { method: 'POST' }
    ),

  // Preview data
  preview: (id: string) =>
    fetchApi<{ data: Record<string, unknown>[]; total: number }>(
      `/api/integrations/${id}/preview`
    ),

  // Discover fields from API
  discoverFields: (id: string) =>
    fetchApi<FieldSchema[]>(`/api/integrations/${id}/discover-fields`),
}

// ============ Data Fields API ============

export interface CreateFieldInput {
  name: string
  path: string
  dataType: string
}

export interface UpdateFieldInput {
  targetField?: string
  fieldType?: DataField['fieldType']
  transform?: string
}

export const dataFieldsApi = {
  // Get all fields for an integration
  getAll: (integrationId: string) =>
    fetchApi<DataField[]>(`/api/integrations/${integrationId}/fields`),

  // Get single field
  getById: (integrationId: string, fieldId: string) =>
    fetchApi<DataField>(`/api/integrations/${integrationId}/fields/${fieldId}`),

  // Create new field mapping
  create: (integrationId: string, data: CreateFieldInput) =>
    fetchApi<DataField>(`/api/integrations/${integrationId}/fields`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update field mapping
  update: (integrationId: string, fieldId: string, data: UpdateFieldInput) =>
    fetchApi<DataField>(`/api/integrations/${integrationId}/fields/${fieldId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Delete field mapping
  delete: (integrationId: string, fieldId: string) =>
    fetchApi<void>(`/api/integrations/${integrationId}/fields/${fieldId}`, {
      method: 'DELETE',
    }),

  // Bulk create fields
  bulkCreate: (integrationId: string, fields: CreateFieldInput[]) =>
    fetchApi<DataField[]>(`/api/integrations/${integrationId}/fields/bulk`, {
      method: 'POST',
      body: JSON.stringify({ fields }),
    }),
}
