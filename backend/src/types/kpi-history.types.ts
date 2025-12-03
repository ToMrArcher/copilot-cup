/**
 * KPI History Types
 * Types for time-series KPI data visualization
 */

// Aggregation intervals for time-series data
export type AggregationInterval = 'hourly' | 'daily' | 'weekly' | 'monthly'

// A single data point in a time-series
export interface KpiHistoryPoint {
  timestamp: Date
  value: number
}

// Query parameters for history endpoint
export interface KpiHistoryQuery {
  period?: string    // e.g., '7d', '30d', '90d', '1y'
  interval?: AggregationInterval
  startDate?: Date
  endDate?: Date
}

// Comparison with previous period
export interface KpiHistoryComparison {
  previousValue: number | null
  currentValue: number | null
  change: number | null       // Percentage change
  direction: 'up' | 'down' | 'unchanged' | null
}

// Full history response
export interface KpiHistoryResponse {
  kpiId: string
  name: string
  period: string
  interval: AggregationInterval
  data: KpiHistoryPoint[]
  comparison: KpiHistoryComparison
  calculatedAt: Date
}

// Parsed period helper type
export interface ParsedPeriod {
  startDate: Date
  endDate: Date
  days: number
}
