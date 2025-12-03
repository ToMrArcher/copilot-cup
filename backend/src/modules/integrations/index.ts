// Placeholder for integration module
// This module will handle data source adapters

export interface Integration {
  id: string
  name: string
  type: string
  config: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}
