import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kpisApi } from '../lib/api'
import type { CreateKpiRequest, UpdateKpiRequest } from '../types/kpi'

// Query keys
export const kpiKeys = {
  all: ['kpis'] as const,
  lists: () => [...kpiKeys.all, 'list'] as const,
  list: () => [...kpiKeys.lists()] as const,
  details: () => [...kpiKeys.all, 'detail'] as const,
  detail: (id: string) => [...kpiKeys.details(), id] as const,
  availableFields: () => [...kpiKeys.all, 'availableFields'] as const,
}

// Get all KPIs
export function useKpis() {
  return useQuery({
    queryKey: kpiKeys.list(),
    queryFn: async () => {
      const response = await kpisApi.getAll()
      return response.kpis
    },
  })
}

// Get single KPI
export function useKpi(id: string) {
  return useQuery({
    queryKey: kpiKeys.detail(id),
    queryFn: () => kpisApi.getById(id),
    enabled: !!id,
  })
}

// Get available fields for KPI creation
export function useAvailableFields() {
  return useQuery({
    queryKey: kpiKeys.availableFields(),
    queryFn: () => kpisApi.getAvailableFields(),
  })
}

// Create KPI
export function useCreateKpi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateKpiRequest) => kpisApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.lists() })
    },
  })
}

// Update KPI
export function useUpdateKpi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateKpiRequest }) =>
      kpisApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.lists() })
      queryClient.invalidateQueries({ queryKey: kpiKeys.detail(id) })
    },
  })
}

// Delete KPI
export function useDeleteKpi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => kpisApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.lists() })
    },
  })
}

// Recalculate KPI
export function useRecalculateKpi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => kpisApi.recalculate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.lists() })
      queryClient.invalidateQueries({ queryKey: kpiKeys.detail(id) })
    },
  })
}

// Validate formula
export function useValidateFormula() {
  return useMutation({
    mutationFn: ({ formula, variables }: { formula: string; variables?: string[] }) =>
      kpisApi.validateFormula({ formula, variables }),
  })
}
