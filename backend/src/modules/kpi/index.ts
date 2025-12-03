// Placeholder for KPI module
// This module will handle KPI definitions and calculations

export interface Kpi {
  id: string
  name: string
  formula: string
  targetValue?: number
  targetDirection?: 'increase' | 'decrease'
  createdAt: Date
  updatedAt: Date
}
