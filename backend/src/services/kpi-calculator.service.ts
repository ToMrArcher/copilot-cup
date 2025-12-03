import { prisma } from '../db/client'
import { evaluateFormula, FormulaResult } from './formula.service'

export interface KpiCalculationResult {
  kpiId: string
  currentValue: number | null
  progress: number | null
  onTrack: boolean | null
  error?: string
  calculatedAt: Date
}

export interface KpiWithSources {
  id: string
  name: string
  formula: string
  targetValue: number | null
  targetDirection: string | null
  sources: Array<{
    alias: string | null
    dataField: {
      id: string
      name: string
      dataType: string
    }
  }>
}

/**
 * Calculate the current value of a KPI using its formula and data sources.
 */
export async function calculateKpi(kpi: KpiWithSources): Promise<KpiCalculationResult> {
  const calculatedAt = new Date()

  try {
    // Fetch the latest DataValue for each source
    const variables: Record<string, number | number[]> = {}
    const missingVariables: string[] = []

    for (const source of kpi.sources) {
      const alias = source.alias || source.dataField.name
      
      // Get the most recent value for this data field
      const latestValue = await prisma.dataValue.findFirst({
        where: { dataFieldId: source.dataField.id },
        orderBy: { syncedAt: 'desc' },
      })

      if (!latestValue) {
        missingVariables.push(alias)
        continue
      }

      // Extract numeric value from JSON
      const numericValue = extractNumericValue(latestValue.value)
      if (numericValue === null) {
        missingVariables.push(alias)
        continue
      }

      variables[alias] = numericValue
    }

    // Check for missing variables
    if (missingVariables.length > 0) {
      return {
        kpiId: kpi.id,
        currentValue: null,
        progress: null,
        onTrack: null,
        error: `Missing data for: ${missingVariables.join(', ')}`,
        calculatedAt,
      }
    }

    // Evaluate the formula
    const result: FormulaResult = evaluateFormula(kpi.formula, variables)

    if (!result.success || result.value === undefined) {
      return {
        kpiId: kpi.id,
        currentValue: null,
        progress: null,
        onTrack: null,
        error: result.error,
        calculatedAt,
      }
    }

    // Calculate progress toward target
    const { progress, onTrack } = calculateProgress(
      result.value,
      kpi.targetValue,
      kpi.targetDirection
    )

    return {
      kpiId: kpi.id,
      currentValue: result.value,
      progress,
      onTrack,
      calculatedAt,
    }
  } catch (error) {
    return {
      kpiId: kpi.id,
      currentValue: null,
      progress: null,
      onTrack: null,
      error: error instanceof Error ? error.message : 'Calculation failed',
      calculatedAt,
    }
  }
}

/**
 * Calculate all KPIs and return their current values.
 */
export async function calculateAllKpis(): Promise<KpiCalculationResult[]> {
  const kpis = await prisma.kpi.findMany({
    include: {
      sources: {
        include: {
          dataField: true,
        },
      },
    },
  })

  const results: KpiCalculationResult[] = []

  for (const kpi of kpis) {
    const result = await calculateKpi({
      id: kpi.id,
      name: kpi.name,
      formula: kpi.formula,
      targetValue: kpi.targetValue,
      targetDirection: kpi.targetDirection,
      sources: kpi.sources,
    })
    results.push(result)
  }

  return results
}

/**
 * Extract a numeric value from a JSON value.
 * Handles: number, array of numbers, object with value property
 */
function extractNumericValue(value: unknown): number | number[] | null {
  // Direct number
  if (typeof value === 'number') {
    return value
  }

  // String that can be parsed as number
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    if (!isNaN(parsed)) {
      return parsed
    }
  }

  // Array of values
  if (Array.isArray(value)) {
    const numbers = value
      .map(v => (typeof v === 'number' ? v : parseFloat(String(v))))
      .filter(v => !isNaN(v))
    
    if (numbers.length > 0) {
      return numbers
    }
  }

  // Object with numeric properties
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    // Try common property names
    for (const key of ['value', 'amount', 'total', 'count', 'sum']) {
      if (typeof obj[key] === 'number') {
        return obj[key] as number
      }
    }
  }

  return null
}

/**
 * Calculate progress percentage and on-track status.
 */
function calculateProgress(
  currentValue: number,
  targetValue: number | null,
  targetDirection: string | null
): { progress: number | null; onTrack: boolean | null } {
  if (targetValue === null || targetValue === 0) {
    return { progress: null, onTrack: null }
  }

  // Calculate progress as percentage of target
  const progress = (currentValue / targetValue) * 100

  // Determine if on track based on direction
  let onTrack: boolean | null = null
  if (targetDirection === 'increase') {
    onTrack = currentValue >= targetValue
  } else if (targetDirection === 'decrease') {
    onTrack = currentValue <= targetValue
  }

  return { progress: Math.round(progress * 10) / 10, onTrack }
}

/**
 * Update the stored currentValue for a KPI after calculation.
 */
export async function updateKpiValue(kpiId: string, value: number | null): Promise<void> {
  await prisma.kpi.update({
    where: { id: kpiId },
    data: { currentValue: value },
  })
}
