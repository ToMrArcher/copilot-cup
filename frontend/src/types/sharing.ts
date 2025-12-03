// Share link types

export interface ShareLink {
  id: string
  token: string
  url: string
  name: string | null
  resourceType: 'dashboard' | 'kpi'
  resourceId: string
  resourceName: string
  showTarget: boolean
  expiresAt: string | null
  active: boolean
  accessCount: number
  lastAccessedAt: string | null
  createdAt: string
}

export interface CreateShareLinkRequest {
  resourceType: 'dashboard' | 'kpi'
  resourceId: string
  name?: string
  expiresIn?: '1h' | '24h' | '7d' | '30d' | 'never'
  showTarget?: boolean
}

export interface CreateShareLinkResponse {
  id: string
  token: string
  url: string
  name: string | null
  resourceType: 'dashboard' | 'kpi'
  resourceId: string
  resourceName: string
  showTarget: boolean
  expiresAt: string | null
  active: boolean
  createdAt: string
}

export interface UpdateShareLinkRequest {
  name?: string
  active?: boolean
  expiresAt?: string | null
  showTarget?: boolean
}

export interface UpdateShareLinkResponse {
  id: string
  name: string | null
  active: boolean
  expiresAt: string | null
  showTarget: boolean
}

export interface ListShareLinksResponse {
  links: ShareLink[]
}

// Shared resource types (what the public API returns)

export interface SharedWidget {
  id: string
  type: string
  position: { x: number; y: number; w: number; h: number }
  config: Record<string, unknown> | null
  kpi: {
    id: string
    name: string
    currentValue: number | null
    targetValue?: number | null
    targetDirection?: string | null
  } | null
}

export interface SharedDashboard {
  id: string
  name: string
  layout: Record<string, unknown> | null
  widgets: SharedWidget[]
}

export interface SharedKpi {
  id: string
  name: string
  description: string | null
  currentValue: number | null
  targetValue?: number | null
  targetDirection?: string | null
  targetPeriod?: string | null
  history: Array<{ timestamp: string; value: number }>
}

export interface SharedDashboardResponse {
  type: 'dashboard'
  dashboard: SharedDashboard
  showTarget: boolean
  expiresAt: string | null
}

export interface SharedKpiResponse {
  type: 'kpi'
  kpi: SharedKpi
  showTarget: boolean
  expiresAt: string | null
}

export type SharedResourceResponse = SharedDashboardResponse | SharedKpiResponse

export interface ShareLinkError {
  error: 'not_found' | 'expired' | 'inactive' | 'server_error'
  message: string
}

// Expiration presets
export const EXPIRATION_PRESETS = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'never', label: 'Never expires' },
] as const

export type ExpirationPreset = typeof EXPIRATION_PRESETS[number]['value']
