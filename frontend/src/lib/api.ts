import type { Integration, DataField, IntegrationType, FieldSchema, IntegrationConfig } from '../types/integration'
import type {
  Kpi,
  KpiListResponse,
  CreateKpiRequest,
  UpdateKpiRequest,
  AvailableFieldsResponse,
  FormulaValidationRequest,
  FormulaValidationResponse,
  RecalculateResponse,
} from '../types/kpi'
import type {
  Dashboard,
  DashboardListItem,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  Widget,
  CreateWidgetRequest,
  UpdateWidgetRequest,
  UpdateLayoutRequest,
  KpiHistoryResponse,
  AccessListResponse,
  AccessEntry,
  GrantAccessRequest,
  AccessPermission,
} from '../types/dashboard'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  GetMeResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ListUsersResponse,
  UpdateRoleRequest,
  UpdateRoleResponse,
} from '../types/auth'
import type {
  ShareLink,
  CreateShareLinkRequest,
  CreateShareLinkResponse,
  UpdateShareLinkRequest,
  UpdateShareLinkResponse,
  ListShareLinksResponse,
  SharedResourceResponse,
} from '../types/sharing'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Event for handling 401 unauthorized responses
type AuthEventHandler = () => void
let onUnauthorized: AuthEventHandler | null = null

export function setOnUnauthorized(handler: AuthEventHandler | null) {
  onUnauthorized = handler
}

// Generic fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Always include cookies for auth
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    // Handle 401 Unauthorized
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized()
    }
    
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`)
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

// ============ Authentication API ============

export const authApi = {
  // Login with email and password
  login: (data: LoginRequest) =>
    fetchApi<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Register a new user
  register: (data: RegisterRequest) =>
    fetchApi<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Logout current user
  logout: () =>
    fetchApi<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  // Get current authenticated user
  getMe: () => fetchApi<GetMeResponse>('/api/auth/me'),

  // Update current user profile
  updateProfile: (data: UpdateProfileRequest) =>
    fetchApi<UpdateProfileResponse>('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // List all users (admin only)
  listUsers: () => fetchApi<ListUsersResponse>('/api/auth/users'),

  // Update user role (admin only)
  updateUserRole: (userId: string, data: UpdateRoleRequest) =>
    fetchApi<UpdateRoleResponse>(`/api/auth/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}

// ============ Integrations API ============

export interface CreateIntegrationInput {
  name: string
  type: IntegrationType
  config: Record<string, unknown>
  syncInterval?: number | null
  syncEnabled?: boolean
}

export interface UpdateIntegrationInput {
  name?: string
  config?: Record<string, unknown>
  isActive?: boolean
  syncInterval?: number | null
  syncEnabled?: boolean
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
      method: 'PUT',
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

  // Discover fields from saved integration
  discoverFields: (id: string) =>
    fetchApi<FieldSchema[]>(`/api/integrations/${id}/discover-fields`),

  // Discover fields from config (without saving integration first)
  discoverFieldsFromConfig: (type: IntegrationType, config: IntegrationConfig) =>
    fetchApi<FieldSchema[]>(`/api/integrations/discover-fields`, {
      method: 'POST',
      body: JSON.stringify({ type, config }),
    }),

  // Get data values for an integration (latest values for each field)
  getData: (id: string) =>
    fetchApi<{
      integrationId: string
      integrationName: string
      fields: {
        id: string
        name: string
        dataType: string
        latestValue: unknown
        lastUpdated: string | null
      }[]
    }>(`/api/integrations/${id}/data`),

  // Submit manual data values
  submitData: (id: string, values: Record<string, unknown>) =>
    fetchApi<{ success: boolean; fieldsUpdated: number; syncedAt: string }>(
      `/api/integrations/${id}/data`,
      {
        method: 'POST',
        body: JSON.stringify({ values }),
      }
    ),

  // Get sync history
  getSyncHistory: (id: string, page = 1, pageSize = 20) =>
    fetchApi<{
      logs: {
        id: string
        integrationId: string
        status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
        startedAt: string
        completedAt: string | null
        duration: number | null
        recordsCount: number | null
        errorMessage: string | null
        createdAt: string
      }[]
      total: number
      page: number
      pageSize: number
    }>(`/api/integrations/${id}/sync-history?page=${page}&pageSize=${pageSize}`),
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

// ============ KPIs API ============

export const kpisApi = {
  // Get all KPIs with calculated values
  getAll: () => fetchApi<KpiListResponse>('/api/kpis'),

  // Get single KPI
  getById: (id: string) => fetchApi<Kpi>(`/api/kpis/${id}`),

  // Create new KPI
  create: (data: CreateKpiRequest) =>
    fetchApi<Kpi>('/api/kpis', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update KPI
  update: (id: string, data: UpdateKpiRequest) =>
    fetchApi<Kpi>(`/api/kpis/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete KPI
  delete: (id: string) =>
    fetchApi<void>(`/api/kpis/${id}`, {
      method: 'DELETE',
    }),

  // Force recalculate KPI value
  recalculate: (id: string) =>
    fetchApi<RecalculateResponse>(`/api/kpis/${id}/recalculate`, {
      method: 'POST',
    }),

  // Validate a formula
  validateFormula: (data: FormulaValidationRequest) =>
    fetchApi<FormulaValidationResponse>('/api/kpis/validate-formula', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get available fields for KPI creation
  getAvailableFields: () =>
    fetchApi<AvailableFieldsResponse>('/api/kpis/available-fields'),

  // Get KPI history for charts
  getHistory: (id: string, period?: string, interval?: string) => {
    const params = new URLSearchParams()
    if (period) params.set('period', period)
    if (interval) params.set('interval', interval)
    const query = params.toString()
    return fetchApi<KpiHistoryResponse>(`/api/kpis/${id}/history${query ? `?${query}` : ''}`)
  },

  // ============ Access Control ============

  // Get access list for a KPI
  getAccess: (kpiId: string) =>
    fetchApi<AccessListResponse>(`/api/kpis/${kpiId}/access`),

  // Grant access to a user
  grantAccess: (kpiId: string, data: GrantAccessRequest) =>
    fetchApi<AccessEntry>(`/api/kpis/${kpiId}/access`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update a user's permission level
  updateAccess: (kpiId: string, userId: string, permission: AccessPermission) =>
    fetchApi<AccessEntry>(`/api/kpis/${kpiId}/access/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ permission }),
    }),

  // Revoke a user's access
  revokeAccess: (kpiId: string, userId: string) =>
    fetchApi<void>(`/api/kpis/${kpiId}/access/${userId}`, {
      method: 'DELETE',
    }),
}

// ============ Dashboards API ============

export const dashboardsApi = {
  // Get all dashboards
  getAll: () => fetchApi<{ dashboards: DashboardListItem[] }>('/api/dashboards'),

  // Get single dashboard with widgets
  getById: (id: string) => fetchApi<Dashboard>(`/api/dashboards/${id}`),

  // Create new dashboard
  create: (data: CreateDashboardRequest) =>
    fetchApi<Dashboard>('/api/dashboards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update dashboard
  update: (id: string, data: UpdateDashboardRequest) =>
    fetchApi<Dashboard>(`/api/dashboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete dashboard
  delete: (id: string) =>
    fetchApi<void>(`/api/dashboards/${id}`, {
      method: 'DELETE',
    }),

  // Update layout (batch widget positions)
  updateLayout: (id: string, data: UpdateLayoutRequest) =>
    fetchApi<Dashboard>(`/api/dashboards/${id}/layout`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Add widget
  addWidget: (dashboardId: string, data: CreateWidgetRequest) =>
    fetchApi<Widget>(`/api/dashboards/${dashboardId}/widgets`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update widget
  updateWidget: (dashboardId: string, widgetId: string, data: UpdateWidgetRequest) =>
    fetchApi<Widget>(`/api/dashboards/${dashboardId}/widgets/${widgetId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete widget
  deleteWidget: (dashboardId: string, widgetId: string) =>
    fetchApi<void>(`/api/dashboards/${dashboardId}/widgets/${widgetId}`, {
      method: 'DELETE',
    }),

  // ============ Access Control ============

  // Get access list for a dashboard
  getAccess: (dashboardId: string) =>
    fetchApi<AccessListResponse>(`/api/dashboards/${dashboardId}/access`),

  // Grant access to a user
  grantAccess: (dashboardId: string, data: GrantAccessRequest) =>
    fetchApi<AccessEntry>(`/api/dashboards/${dashboardId}/access`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update a user's permission level
  updateAccess: (dashboardId: string, userId: string, permission: AccessPermission) =>
    fetchApi<AccessEntry>(`/api/dashboards/${dashboardId}/access/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ permission }),
    }),

  // Revoke a user's access
  revokeAccess: (dashboardId: string, userId: string) =>
    fetchApi<void>(`/api/dashboards/${dashboardId}/access/${userId}`, {
      method: 'DELETE',
    }),
}

// ==========================================
// Sharing API
// ==========================================

export const sharingApi = {
  // Create share link
  create: (data: CreateShareLinkRequest) =>
    fetchApi<CreateShareLinkResponse>('/api/sharing', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // List share links
  list: (resourceType?: 'dashboard' | 'kpi', resourceId?: string) => {
    const params = new URLSearchParams()
    if (resourceType) params.set('resourceType', resourceType)
    if (resourceId) params.set('resourceId', resourceId)
    const query = params.toString()
    return fetchApi<ListShareLinksResponse>(`/api/sharing${query ? `?${query}` : ''}`)
  },

  // Get share link details
  get: (id: string) =>
    fetchApi<ShareLink>(`/api/sharing/${id}`),

  // Update share link
  update: (id: string, data: UpdateShareLinkRequest) =>
    fetchApi<UpdateShareLinkResponse>(`/api/sharing/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Delete share link
  delete: (id: string) =>
    fetchApi<void>(`/api/sharing/${id}`, {
      method: 'DELETE',
    }),

  // Access shared resource (public, no auth required)
  accessShared: (token: string) =>
    fetchApi<SharedResourceResponse>(`/api/share/${token}`),
}
