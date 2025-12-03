import { evaluate, parse } from 'mathjs'

/**
 * Formula Engine for KPI calculations.
 * Uses mathjs for safe, sandboxed formula evaluation.
 */

export interface FormulaResult {
  success: boolean
  value?: number
  error?: string
}

export interface FormulaVariable {
  name: string
  value: number | number[]
}

/**
 * Validates a formula string for syntax errors.
 * @param formula The formula expression to validate
 * @param allowedVariables Optional list of allowed variable names
 */
export function validateFormula(
  formula: string,
  allowedVariables?: string[]
): { valid: boolean; error?: string; variables?: string[] } {
  try {
    const node = parse(formula)
    const variables = extractVariables(node)

    // Check if all variables are in allowed list
    if (allowedVariables) {
      const unknownVars = variables.filter(v => !allowedVariables.includes(v))
      if (unknownVars.length > 0) {
        return {
          valid: false,
          error: `Unknown variables: ${unknownVars.join(', ')}`,
          variables,
        }
      }
    }

    return { valid: true, variables }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid formula syntax',
    }
  }
}

/**
 * Evaluates a formula with the given variables.
 * @param formula The formula expression to evaluate
 * @param variables Map of variable names to their values
 */
export function evaluateFormula(
  formula: string,
  variables: Record<string, number | number[]>
): FormulaResult {
  try {
    // Validate formula first
    const validation = validateFormula(formula, Object.keys(variables))
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Create scope with variables and custom functions
    const scope = {
      ...variables,
      // Add aggregation functions for arrays
      sum: (arr: number | number[]) => {
        if (Array.isArray(arr)) {
          return arr.reduce((a, b) => a + b, 0)
        }
        return arr
      },
      avg: (arr: number | number[]) => {
        if (Array.isArray(arr)) {
          return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
        }
        return arr
      },
      min: (arr: number | number[]) => {
        if (Array.isArray(arr)) {
          return Math.min(...arr)
        }
        return arr
      },
      max: (arr: number | number[]) => {
        if (Array.isArray(arr)) {
          return Math.max(...arr)
        }
        return arr
      },
      count: (arr: number | number[]) => {
        if (Array.isArray(arr)) {
          return arr.length
        }
        return 1
      },
    }

    const result = evaluate(formula, scope)

    // Ensure result is a number
    if (typeof result !== 'number') {
      return { success: false, error: 'Formula did not return a number' }
    }

    // Check for special values
    if (isNaN(result)) {
      return { success: false, error: 'Result is NaN (not a number)' }
    }

    if (!isFinite(result)) {
      return { success: false, error: 'Result is infinite (division by zero?)' }
    }

    return { success: true, value: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Formula evaluation failed',
    }
  }
}

/**
 * Extract variable names from a parsed formula.
 */
function extractVariables(node: unknown): string[] {
  const variables: string[] = []

  function traverse(n: unknown): void {
    if (!n || typeof n !== 'object') return

    const nodeObj = n as { type?: string; name?: string; args?: unknown[]; content?: unknown }

    // SymbolNode represents a variable
    if (nodeObj.type === 'SymbolNode') {
      const name = nodeObj.name as string
      // Skip built-in functions
      const builtins = ['sum', 'avg', 'min', 'max', 'count', 'sqrt', 'abs', 'round', 'floor', 'ceil']
      if (!builtins.includes(name) && !variables.includes(name)) {
        variables.push(name)
      }
    }

    // Traverse child nodes
    if (nodeObj.args && Array.isArray(nodeObj.args)) {
      nodeObj.args.forEach(traverse)
    }
    if (nodeObj.content) {
      traverse(nodeObj.content)
    }
  }

  traverse(node)
  return variables
}

/**
 * Get a list of example formulas for the UI.
 */
export function getFormulaExamples(): Array<{ formula: string; description: string }> {
  return [
    { formula: 'revenue / orders', description: 'Average order value' },
    { formula: 'revenue / employees', description: 'Revenue per employee' },
    { formula: '(revenue - costs) / revenue * 100', description: 'Profit margin (%)' },
    { formula: 'sum(sales) / count(sales)', description: 'Average of sales array' },
    { formula: 'revenue - costs', description: 'Net profit' },
    { formula: 'orders * avgOrderValue', description: 'Projected revenue' },
  ]
}
