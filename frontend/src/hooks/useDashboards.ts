/**
 * Dashboard React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardsApi, kpisApi } from '../lib/api'
import type {
  CreateDashboardRequest,
  UpdateDashboardRequest,
  CreateWidgetRequest,
  UpdateWidgetRequest,
  UpdateLayoutRequest,
} from '../types/dashboard'

// Query keys
export const dashboardKeys = {
  all: ['dashboards'] as const,
  lists: () => [...dashboardKeys.all, 'list'] as const,
  list: () => [...dashboardKeys.lists()] as const,
  details: () => [...dashboardKeys.all, 'detail'] as const,
  detail: (id: string) => [...dashboardKeys.details(), id] as const,
}

export const kpiHistoryKeys = {
  all: ['kpiHistory'] as const,
  byKpi: (kpiId: string) => [...kpiHistoryKeys.all, kpiId] as const,
  history: (kpiId: string, period?: string, interval?: string) =>
    [...kpiHistoryKeys.byKpi(kpiId), period, interval] as const,
}

// ============ Dashboard Hooks ============

// Get all dashboards
export function useDashboards() {
  return useQuery({
    queryKey: dashboardKeys.list(),
    queryFn: async () => {
      const response = await dashboardsApi.getAll()
      return response.dashboards
    },
  })
}

// Get single dashboard with widgets
export function useDashboard(id: string) {
  return useQuery({
    queryKey: dashboardKeys.detail(id),
    queryFn: () => dashboardsApi.getById(id),
    enabled: !!id,
  })
}

// Create dashboard
export function useCreateDashboard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDashboardRequest) => dashboardsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() })
    },
  })
}

// Update dashboard
export function useUpdateDashboard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDashboardRequest }) =>
      dashboardsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(id) })
    },
  })
}

// Delete dashboard
export function useDeleteDashboard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => dashboardsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() })
    },
  })
}

// Update layout
export function useUpdateLayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLayoutRequest }) =>
      dashboardsApi.updateLayout(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(id) })
    },
  })
}

// ============ Widget Hooks ============

// Add widget
export function useAddWidget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ dashboardId, data }: { dashboardId: string; data: CreateWidgetRequest }) =>
      dashboardsApi.addWidget(dashboardId, data),
    onSuccess: (_, { dashboardId }) => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(dashboardId) })
    },
  })
}

// Update widget
export function useUpdateWidget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      dashboardId,
      widgetId,
      data,
    }: {
      dashboardId: string
      widgetId: string
      data: UpdateWidgetRequest
    }) => dashboardsApi.updateWidget(dashboardId, widgetId, data),
    onSuccess: (_, { dashboardId }) => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(dashboardId) })
    },
  })
}

// Delete widget
export function useDeleteWidget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ dashboardId, widgetId }: { dashboardId: string; widgetId: string }) =>
      dashboardsApi.deleteWidget(dashboardId, widgetId),
    onSuccess: (_, { dashboardId }) => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(dashboardId) })
    },
  })
}

// ============ KPI History Hooks ============

// Get KPI history for charts
export function useKpiHistory(kpiId: string, period?: string, interval?: string) {
  return useQuery({
    queryKey: kpiHistoryKeys.history(kpiId, period, interval),
    queryFn: () => kpisApi.getHistory(kpiId, period, interval),
    enabled: !!kpiId,
    staleTime: 60 * 1000, // 1 minute
  })
}

// ============ Default Dashboard Hook ============

// Initialize default dashboard with all KPIs when no dashboards exist
export function useInitializeDefaultDashboard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      // Fetch KPIs
      const kpisResponse = await kpisApi.getAll()
      const kpis = kpisResponse.kpis
      
      // Create default dashboard
      const dashboard = await dashboardsApi.create({ name: 'Overview' })
      
      // Create widgets for each KPI
      const widgetTypes: Array<'stat' | 'line' | 'gauge'> = ['stat', 'line', 'gauge']
      let widgetIndex = 0
      
      for (const kpi of kpis) {
        // Cycle through widget types for variety
        const widgetType = widgetTypes[widgetIndex % widgetTypes.length]
        
        // Calculate grid position (3 columns layout)
        const col = widgetIndex % 3
        const row = Math.floor(widgetIndex / 3)
        
        await dashboardsApi.addWidget(dashboard.id, {
          type: widgetType,
          kpiId: kpi.id,
          position: {
            x: col * 4, // 4 units per column (12 total grid)
            y: row * 4, // 4 units per row
            w: 4,       // Width: 1/3 of grid
            h: widgetType === 'line' ? 4 : 2, // Charts are taller
          },
          config: {
            period: '7d',
            interval: 'daily',
            showTarget: true,
          },
        })
        
        widgetIndex++
      }
      
      return dashboard
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.lists() })
    },
  })
}
