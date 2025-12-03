import { prisma } from '../db/client'
import { evaluateFormula } from './formula.service'
import {
  AggregationInterval,
  KpiHistoryPoint,
  KpiHistoryResponse,
  KpiHistoryComparison,
  ParsedPeriod,
} from '../types/kpi-history.types'

/**
 * KPI History Service
 * Provides time-series data for KPIs by aggregating DataValues over time periods.
 */

/**
 * Parse a period string (e.g., '7d', '30d', '1y') into start/end dates
 */
export function parsePeriod(period: string): ParsedPeriod {
  const now = new Date()
  const endDate = new Date(now)
  
  // Parse period string
  const match = period.match(/^(\d+)([hdwmy])$/i)
  if (!match) {
    // Default to 30 days
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - 30)
    return { startDate, endDate, days: 30 }
  }

  const value = parseInt(match[1], 10)
  const unit = match[2].toLowerCase()
  
  const startDate = new Date(now)
  let days = 0
  
  switch (unit) {
    case 'h': // hours
      startDate.setHours(startDate.getHours() - value)
      days = Math.ceil(value / 24)
      break
    case 'd': // days
      startDate.setDate(startDate.getDate() - value)
      days = value
      break
    case 'w': // weeks
      startDate.setDate(startDate.getDate() - value * 7)
      days = value * 7
      break
    case 'm': // months
      startDate.setMonth(startDate.getMonth() - value)
      days = value * 30
      break
    case 'y': // years
      startDate.setFullYear(startDate.getFullYear() - value)
      days = value * 365
      break
    default:
      startDate.setDate(startDate.getDate() - 30)
      days = 30
  }

  return { startDate, endDate, days }
}

/**
 * Determine the best aggregation interval based on period length
 */
export function getDefaultInterval(days: number): AggregationInterval {
  if (days <= 2) return 'hourly'
  if (days <= 60) return 'daily'
  if (days <= 180) return 'weekly'
  return 'monthly'
}

/**
 * Get bucket start date for a given timestamp and interval
 */
function getBucketStart(date: Date, interval: AggregationInterval): Date {
  const result = new Date(date)
  
  switch (interval) {
    case 'hourly':
      result.setMinutes(0, 0, 0)
      break
    case 'daily':
      result.setHours(0, 0, 0, 0)
      break
    case 'weekly':
      // Start of week (Monday)
      const day = result.getDay()
      const diff = result.getDate() - day + (day === 0 ? -6 : 1)
      result.setDate(diff)
      result.setHours(0, 0, 0, 0)
      break
    case 'monthly':
      result.setDate(1)
      result.setHours(0, 0, 0, 0)
      break
  }
  
  return result
}

/**
 * Generate all bucket timestamps between start and end dates
 */
function generateBuckets(
  startDate: Date,
  endDate: Date,
  interval: AggregationInterval
): Date[] {
  const buckets: Date[] = []
  const current = getBucketStart(new Date(startDate), interval)
  const end = new Date(endDate)
  
  while (current <= end) {
    buckets.push(new Date(current))
    
    switch (interval) {
      case 'hourly':
        current.setHours(current.getHours() + 1)
        break
      case 'daily':
        current.setDate(current.getDate() + 1)
        break
      case 'weekly':
        current.setDate(current.getDate() + 7)
        break
      case 'monthly':
        current.setMonth(current.getMonth() + 1)
        break
    }
  }
  
  return buckets
}

interface KpiSourceData {
  alias: string
  dataFieldId: string
}

/**
 * Extract a value from JSON data (can be number or array)
 */
function extractValue(value: unknown): number | number[] | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? null : parsed
  }
  if (Array.isArray(value)) {
    // Convert array elements to numbers
    const nums = value.map(v => {
      if (typeof v === 'number') return v
      if (typeof v === 'string') {
        const parsed = parseFloat(v)
        return isNaN(parsed) ? null : parsed
      }
      return null
    }).filter((v): v is number => v !== null)
    return nums.length > 0 ? nums : null
  }
  if (value && typeof value === 'object') {
    // Try common patterns
    const obj = value as Record<string, unknown>
    if ('value' in obj) return extractValue(obj.value)
    if ('amount' in obj) return extractValue(obj.amount)
    if ('total' in obj) return extractValue(obj.total)
  }
  return null
}

/**
 * Fetch and aggregate DataValues for a data field
 */
async function getFieldValuesByBucket(
  dataFieldId: string,
  startDate: Date,
  endDate: Date,
  interval: AggregationInterval
): Promise<Map<string, number | number[]>> {
  const values = await prisma.dataValue.findMany({
    where: {
      dataFieldId,
      syncedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { syncedAt: 'asc' },
  })

  // Group values by bucket and take the latest value in each bucket
  const bucketMap = new Map<string, number | number[]>()
  
  for (const value of values) {
    const bucketStart = getBucketStart(value.syncedAt, interval)
    const bucketKey = bucketStart.toISOString()
    
    // Extract value (can be number or array)
    const extractedValue = extractValue(value.value)
    if (extractedValue !== null) {
      bucketMap.set(bucketKey, extractedValue) // Latest value wins
    }
  }
  
  return bucketMap
}

/**
 * Calculate KPI values for each bucket using the formula
 */
async function calculateHistoricalValues(
  formula: string,
  sources: KpiSourceData[],
  buckets: Date[],
  startDate: Date,
  endDate: Date,
  interval: AggregationInterval
): Promise<KpiHistoryPoint[]> {
  // Fetch all field values at once
  const fieldValueMaps = new Map<string, Map<string, number | number[]>>()
  
  for (const source of sources) {
    const valueMap = await getFieldValuesByBucket(
      source.dataFieldId,
      startDate,
      endDate,
      interval
    )
    fieldValueMaps.set(source.alias, valueMap)
  }
  
  // Calculate KPI value for each bucket
  const historyPoints: KpiHistoryPoint[] = []
  let lastKnownValues: Record<string, number | number[]> = {}
  
  for (const bucketDate of buckets) {
    const bucketKey = bucketDate.toISOString()
    const variables: Record<string, number | number[]> = {}
    let hasAllValues = true
    
    // Collect values for each source
    for (const source of sources) {
      const valueMap = fieldValueMaps.get(source.alias)
      const value = valueMap?.get(bucketKey)
      
      if (value !== undefined) {
        variables[source.alias] = value
        lastKnownValues[source.alias] = value
      } else if (lastKnownValues[source.alias] !== undefined) {
        // Use last known value (carry forward)
        variables[source.alias] = lastKnownValues[source.alias]
      } else {
        hasAllValues = false
      }
    }
    
    // Skip buckets where we don't have all required values
    if (!hasAllValues || sources.length === 0) {
      continue
    }
    
    // Evaluate formula
    const result = evaluateFormula(formula, variables)
    
    if (result.success && result.value !== undefined) {
      historyPoints.push({
        timestamp: bucketDate,
        value: result.value,
      })
    }
  }
  
  return historyPoints
}

/**
 * Calculate comparison with previous period
 */
function calculateComparison(
  data: KpiHistoryPoint[],
  periodDays: number
): KpiHistoryComparison {
  if (data.length < 2) {
    return {
      previousValue: null,
      currentValue: data.length > 0 ? data[data.length - 1].value : null,
      change: null,
      direction: null,
    }
  }
  
  const currentValue = data[data.length - 1].value
  
  // Find value from approximately half the period ago
  const midIndex = Math.floor(data.length / 2)
  const previousValue = data[midIndex].value
  
  if (previousValue === 0) {
    return {
      previousValue,
      currentValue,
      change: null,
      direction: currentValue > 0 ? 'up' : 'unchanged',
    }
  }
  
  const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100
  const direction: 'up' | 'down' | 'unchanged' = 
    Math.abs(change) < 0.01 ? 'unchanged' : change > 0 ? 'up' : 'down'
  
  return {
    previousValue,
    currentValue,
    change: Math.round(change * 10) / 10, // Round to 1 decimal
    direction,
  }
}

/**
 * Get historical KPI data for visualization
 */
export async function getKpiHistory(
  kpiId: string,
  period: string = '30d',
  interval?: AggregationInterval
): Promise<KpiHistoryResponse | null> {
  // Fetch KPI with sources
  const kpi = await prisma.kpi.findUnique({
    where: { id: kpiId },
    include: {
      sources: {
        include: {
          dataField: true,
        },
      },
    },
  })

  if (!kpi) {
    return null
  }

  // Parse period and determine interval
  const { startDate, endDate, days } = parsePeriod(period)
  const effectiveInterval = interval || getDefaultInterval(days)
  
  // Generate bucket timestamps
  const buckets = generateBuckets(startDate, endDate, effectiveInterval)
  
  // Prepare source data
  const sourceData: KpiSourceData[] = kpi.sources.map(s => ({
    alias: s.alias || s.dataField.name,
    dataFieldId: s.dataFieldId,
  }))
  
  // Calculate historical values
  const data = await calculateHistoricalValues(
    kpi.formula,
    sourceData,
    buckets,
    startDate,
    endDate,
    effectiveInterval
  )
  
  // Calculate comparison
  const comparison = calculateComparison(data, days)
  
  return {
    kpiId: kpi.id,
    name: kpi.name,
    period,
    interval: effectiveInterval,
    data,
    comparison,
    calculatedAt: new Date(),
  }
}
