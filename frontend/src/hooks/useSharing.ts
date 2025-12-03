import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sharingApi } from '../lib/api'
import type {
  ShareLink,
  CreateShareLinkRequest,
  UpdateShareLinkRequest,
  SharedResourceResponse,
} from '../types/sharing'

// Query keys
const SHARING_KEYS = {
  all: ['sharing'] as const,
  lists: () => [...SHARING_KEYS.all, 'list'] as const,
  list: (resourceType?: string, resourceId?: string) =>
    [...SHARING_KEYS.lists(), { resourceType, resourceId }] as const,
  detail: (id: string) => [...SHARING_KEYS.all, 'detail', id] as const,
  shared: (token: string) => ['shared', token] as const,
}

/**
 * Hook to list share links
 */
export function useShareLinks(resourceType?: 'dashboard' | 'kpi', resourceId?: string) {
  return useQuery({
    queryKey: SHARING_KEYS.list(resourceType, resourceId),
    queryFn: async () => {
      const response = await sharingApi.list(resourceType, resourceId)
      return response.links
    },
  })
}

/**
 * Hook to get a single share link
 */
export function useShareLink(id: string) {
  return useQuery({
    queryKey: SHARING_KEYS.detail(id),
    queryFn: () => sharingApi.get(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a share link
 */
export function useCreateShareLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateShareLinkRequest) => sharingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARING_KEYS.lists() })
    },
  })
}

/**
 * Hook to update a share link
 */
export function useUpdateShareLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateShareLinkRequest }) =>
      sharingApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: SHARING_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: SHARING_KEYS.lists() })
    },
  })
}

/**
 * Hook to delete a share link
 */
export function useDeleteShareLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => sharingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARING_KEYS.lists() })
    },
  })
}

/**
 * Hook to access a shared resource (public, no auth)
 */
export function useSharedResource(token: string) {
  return useQuery({
    queryKey: SHARING_KEYS.shared(token),
    queryFn: () => sharingApi.accessShared(token),
    enabled: !!token,
    retry: false, // Don't retry on error (expired, inactive, etc.)
  })
}

// Re-export types
export type { ShareLink, CreateShareLinkRequest, UpdateShareLinkRequest, SharedResourceResponse }
