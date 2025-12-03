// Placeholder for dashboard module
// This module will handle dashboard layouts and widgets

export interface Dashboard {
  id: string
  name: string
  layout: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Widget {
  id: string
  dashboardId: string
  type: string
  config: Record<string, unknown>
  position: { x: number; y: number; w: number; h: number }
}
