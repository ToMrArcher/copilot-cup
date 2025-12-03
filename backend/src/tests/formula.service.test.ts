import { validateFormula, evaluateFormula, getFormulaExamples } from '../services/formula.service'

describe('Formula Service', () => {
  describe('validateFormula', () => {
    it('should validate a simple formula', () => {
      const result = validateFormula('a + b')
      expect(result.valid).toBe(true)
      expect(result.variables).toContain('a')
      expect(result.variables).toContain('b')
    })

    it('should validate a complex formula', () => {
      const result = validateFormula('(revenue - costs) / revenue * 100')
      expect(result.valid).toBe(true)
      expect(result.variables).toContain('revenue')
      expect(result.variables).toContain('costs')
    })

    it('should reject invalid syntax', () => {
      const result = validateFormula('a + * b')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject unknown variables when allowedVariables is provided', () => {
      const result = validateFormula('a + b + c', ['a', 'b'])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('c')
    })

    it('should accept known variables', () => {
      const result = validateFormula('a + b', ['a', 'b'])
      expect(result.valid).toBe(true)
    })

    it('should allow built-in functions', () => {
      const result = validateFormula('sum(values) / count(values)', ['values'])
      expect(result.valid).toBe(true)
    })
  })

  describe('evaluateFormula', () => {
    it('should evaluate a simple addition', () => {
      const result = evaluateFormula('a + b', { a: 10, b: 20 })
      expect(result.success).toBe(true)
      expect(result.value).toBe(30)
    })

    it('should evaluate a division', () => {
      const result = evaluateFormula('revenue / orders', { revenue: 1000, orders: 50 })
      expect(result.success).toBe(true)
      expect(result.value).toBe(20)
    })

    it('should evaluate a percentage formula', () => {
      const result = evaluateFormula('(revenue - costs) / revenue * 100', {
        revenue: 1000,
        costs: 600,
      })
      expect(result.success).toBe(true)
      expect(result.value).toBe(40)
    })

    it('should handle sum of an array', () => {
      const result = evaluateFormula('sum(sales)', { sales: [100, 200, 300] })
      expect(result.success).toBe(true)
      expect(result.value).toBe(600)
    })

    it('should handle avg of an array', () => {
      const result = evaluateFormula('avg(sales)', { sales: [100, 200, 300] })
      expect(result.success).toBe(true)
      expect(result.value).toBe(200)
    })

    it('should handle min of an array', () => {
      const result = evaluateFormula('min(sales)', { sales: [100, 200, 300] })
      expect(result.success).toBe(true)
      expect(result.value).toBe(100)
    })

    it('should handle max of an array', () => {
      const result = evaluateFormula('max(sales)', { sales: [100, 200, 300] })
      expect(result.success).toBe(true)
      expect(result.value).toBe(300)
    })

    it('should handle count of an array', () => {
      const result = evaluateFormula('count(sales)', { sales: [100, 200, 300] })
      expect(result.success).toBe(true)
      expect(result.value).toBe(3)
    })

    it('should handle combined formula with aggregation', () => {
      const result = evaluateFormula('sum(sales) / count(sales)', { sales: [100, 200, 300] })
      expect(result.success).toBe(true)
      expect(result.value).toBe(200)
    })

    it('should return error for division by zero', () => {
      const result = evaluateFormula('a / b', { a: 100, b: 0 })
      expect(result.success).toBe(false)
      expect(result.error).toContain('infinite')
    })

    it('should return error for missing variables', () => {
      const result = evaluateFormula('a + b + c', { a: 10, b: 20 })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unknown')
    })

    it('should handle negative numbers', () => {
      const result = evaluateFormula('revenue + loss', { revenue: 1000, loss: -300 })
      expect(result.success).toBe(true)
      expect(result.value).toBe(700)
    })

    it('should handle decimal numbers', () => {
      const result = evaluateFormula('a * b', { a: 10.5, b: 2 })
      expect(result.success).toBe(true)
      expect(result.value).toBe(21)
    })

    it('should handle power operations', () => {
      const result = evaluateFormula('a ^ 2', { a: 5 })
      expect(result.success).toBe(true)
      expect(result.value).toBe(25)
    })

    it('should treat single value as number in aggregation', () => {
      const result = evaluateFormula('sum(value)', { value: 100 })
      expect(result.success).toBe(true)
      expect(result.value).toBe(100)
    })
  })

  describe('getFormulaExamples', () => {
    it('should return an array of examples', () => {
      const examples = getFormulaExamples()
      expect(Array.isArray(examples)).toBe(true)
      expect(examples.length).toBeGreaterThan(0)
    })

    it('should have formula and description for each example', () => {
      const examples = getFormulaExamples()
      examples.forEach((example: { formula: string; description: string }) => {
        expect(example.formula).toBeDefined()
        expect(example.description).toBeDefined()
      })
    })
  })
})
