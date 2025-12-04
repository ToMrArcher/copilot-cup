/**
 * Dashboard Types
 */

export type WidgetType = 'number' | 'stat' | 'gauge' | 'line' | 'bar' | 'area'

export type AccessPermission = 'VIEW' | 'EDIT'

export interface UserSummary {
  id: string
  name: string | null
  email: string
}

export interface AccessEntry {
  userId: string
  userName: string | null
  userEmail: string
  permission: AccessPermission
  grantedAt: string
}

export interface AccessListResponse {
  owner: UserSummary
  accessList: AccessEntry[]
}

export interface GrantAccessRequest {
  userId?: string
  email?: string
  permission: AccessPermission
}

export interface WidgetPosition {
  x: number
  y: number
  w: number
  h: number
}

export interface WidgetConfig {
  format?: 'currency' | 'percent' | 'number'
  prefix?: string
  suffix?: string
  showTarget?: boolean
  period?: string
  interval?: string
}

export interface Widget {
  id: string
  dashboardId: string
  kpiId?: string | null
  type: WidgetType
  config: WidgetConfig
  position: WidgetPosition
  createdAt: string
  updatedAt: string
  kpi?: {
    id: string
    name: string
    description?: string | null
    formula: string
    targetValue?: number | null
    targetDirection?: 'increase' | 'decrease' | null
  } | null
  kpiData?: {
    currentValue: number | null
    targetValue: number | null
    progress: number | null
    onTrack: boolean | null
    error?: string
  } | null
}

export interface Dashboard {
  id: string
  name: string
  ownerId: string
  owner?: UserSummary
  layout?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  widgets: Widget[]
  // Access control flags
  isOwner?: boolean
  canEdit?: boolean
  canManage?: boolean
  canShare?: boolean
}

export interface DashboardListItem {
  id: string
  name: string
  ownerId: string
  owner?: UserSummary
  layout?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  widgets: Array<{ id: string; type: string }>
  _count: {
    widgets: number
  }
  // Access control flags
  isOwner?: boolean
  canEdit?: boolean
  canManage?: boolean
  canShare?: boolean
}

// API Request/Response types
export interface CreateDashboardRequest {
  name: string
  ownerId?: string
}

export interface UpdateDashboardRequest {
  name?: string
  layout?: Record<string, unknown>
}

export interface CreateWidgetRequest {
  type: WidgetType
  kpiId?: string
  config?: WidgetConfig
  position: WidgetPosition
}

export interface UpdateWidgetRequest {
  type?: WidgetType
  kpiId?: string | null
  config?: WidgetConfig
  position?: WidgetPosition
}

export interface UpdateLayoutRequest {
  layout?: Record<string, unknown>
  widgets?: Array<{
    id: string
    position: WidgetPosition
  }>
}

// KPI History for charts
export interface KpiHistoryPoint {
  timestamp: string
  value: number
}

export interface KpiHistoryResponse {
  kpiId: string
  name: string
  period: string
  interval: string
  data: KpiHistoryPoint[]
  comparison: {
    previousValue: number | null
    currentValue: number | null
    change: number | null
    direction: 'up' | 'down' | 'unchanged' | null
  }
  calculatedAt: string
}
