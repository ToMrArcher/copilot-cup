// KPI Types

import type { AccessPermission, UserSummary, AccessEntry, AccessListResponse, GrantAccessRequest } from './dashboard'

// Re-export access types for convenience
export type { AccessPermission, UserSummary, AccessEntry, AccessListResponse, GrantAccessRequest }

export interface Kpi {
  id: string
  name: string
  description?: string | null
  formula: string
  integrationId?: string | null
  ownerId?: string | null
  owner?: UserSummary | null
  currentValue?: number | null
  targetValue?: number | null
  targetDirection?: 'increase' | 'decrease' | null
  targetPeriod?: string | null
  progress?: number | null
  onTrack?: boolean | null
  calculationError?: string
  calculatedAt?: string
  createdAt: string
  updatedAt: string
  sources: KpiSource[]
  integration?: {
    id: string
    name: string
  } | null
  // Access control flags
  isOwner?: boolean
  canEdit?: boolean
  canManage?: boolean
  canShare?: boolean
}

export interface KpiSource {
  id: string
  alias?: string | null
  dataField: {
    id: string
    name: string
    path: string
    dataType: string
    integration?: {
      id: string
      name: string
    }
  }
}

export interface CreateKpiRequest {
  name: string
  description?: string
  formula: string
  integrationId?: string
  targetValue?: number
  targetDirection?: 'increase' | 'decrease'
  targetPeriod?: string
  sources: Array<{
    dataFieldId: string
    alias?: string
  }>
}

export interface UpdateKpiRequest {
  name?: string
  description?: string
  formula?: string
  targetValue?: number | null
  targetDirection?: 'increase' | 'decrease' | null
  targetPeriod?: string | null
  sources?: Array<{
    dataFieldId: string
    alias?: string
  }>
}

export interface KpiListResponse {
  kpis: Kpi[]
}

export interface AvailableField {
  id: string
  name: string
  path: string
  dataType: string
  hasData: boolean
  lastValue?: unknown
  lastSyncedAt?: string
}

export interface IntegrationWithFields {
  integration: {
    id: string
    name: string
    type: string
  }
  fields: AvailableField[]
}

export interface AvailableFieldsResponse {
  integrations: IntegrationWithFields[]
}

export interface FormulaValidationRequest {
  formula: string
  variables?: string[]
}

export interface FormulaValidationResponse {
  valid: boolean
  error?: string
  variables?: string[]
}

export interface RecalculateResponse {
  kpiId: string
  name: string
  currentValue: number | null
  previousValue: number | null
  progress: number | null
  onTrack: boolean | null
  error?: string
  calculatedAt: string
}
