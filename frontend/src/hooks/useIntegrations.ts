import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  integrationsApi,
  dataFieldsApi,
} from '../lib/api'
import type {
  CreateIntegrationInput,
  UpdateIntegrationInput,
  CreateFieldInput,
  UpdateFieldInput,
} from '../lib/api'

// Query keys for cache management
export const queryKeys = {
  integrations: ['integrations'] as const,
  integration: (id: string) => ['integrations', id] as const,
  integrationFields: (id: string) => ['integrations', id, 'fields'] as const,
}

// ============ Integration Hooks ============

export function useIntegrations() {
  return useQuery({
    queryKey: queryKeys.integrations,
    queryFn: integrationsApi.getAll,
  })
}

export function useIntegration(id: string) {
  return useQuery({
    queryKey: queryKeys.integration(id),
    queryFn: () => integrationsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateIntegration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateIntegrationInput) => integrationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations })
    },
  })
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIntegrationInput }) =>
      integrationsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integration(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations })
    },
  })
}

export function useDeleteIntegration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => integrationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations })
    },
  })
}

export function useTestConnection(integrationId: string) {
  return useMutation({
    mutationFn: () => integrationsApi.testConnection(integrationId),
  })
}

export function useSyncIntegration(integrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => integrationsApi.sync(integrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integration(integrationId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations })
    },
  })
}

export function usePreviewData(integrationId: string) {
  return useQuery({
    queryKey: [...queryKeys.integration(integrationId), 'preview'],
    queryFn: () => integrationsApi.preview(integrationId),
    enabled: !!integrationId,
  })
}

export function useDiscoverFields(integrationId: string) {
  return useMutation({
    mutationFn: () => integrationsApi.discoverFields(integrationId),
  })
}

// ============ Data Field Hooks ============

export function useDataFields(integrationId: string) {
  return useQuery({
    queryKey: queryKeys.integrationFields(integrationId),
    queryFn: () => dataFieldsApi.getAll(integrationId),
    enabled: !!integrationId,
  })
}

export function useCreateDataField(integrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateFieldInput) => dataFieldsApi.create(integrationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrationFields(integrationId),
      })
    },
  })
}

export function useUpdateDataField(integrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fieldId, data }: { fieldId: string; data: UpdateFieldInput }) =>
      dataFieldsApi.update(integrationId, fieldId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrationFields(integrationId),
      })
    },
  })
}

export function useDeleteDataField(integrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fieldId: string) => dataFieldsApi.delete(integrationId, fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrationFields(integrationId),
      })
    },
  })
}

export function useBulkCreateDataFields(integrationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fields: CreateFieldInput[]) =>
      dataFieldsApi.bulkCreate(integrationId, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrationFields(integrationId),
      })
    },
  })
}
