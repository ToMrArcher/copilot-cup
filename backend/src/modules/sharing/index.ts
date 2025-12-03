// Placeholder for sharing module
// This module will handle external share links

export interface ShareLink {
  id: string
  resourceType: 'dashboard' | 'kpi'
  resourceId: string
  token: string
  expiresAt?: Date
  active: boolean
  createdAt: Date
}
