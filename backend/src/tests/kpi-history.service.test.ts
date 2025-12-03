import {
  parsePeriod,
  getDefaultInterval,
} from '../services/kpi-history.service'

describe('KPI History Service', () => {
  describe('parsePeriod', () => {
    it('should parse days correctly', () => {
      const result = parsePeriod('7d')
      expect(result.days).toBe(7)
      
      // Start should be 7 days before end
      const diffMs = result.endDate.getTime() - result.startDate.getTime()
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(7)
    })

    it('should parse weeks correctly', () => {
      const result = parsePeriod('2w')
      expect(result.days).toBe(14)
    })

    it('should parse months correctly', () => {
      const result = parsePeriod('3m')
      expect(result.days).toBe(90)
    })

    it('should parse years correctly', () => {
      const result = parsePeriod('1y')
      expect(result.days).toBe(365)
    })

    it('should parse hours correctly', () => {
      const result = parsePeriod('24h')
      expect(result.days).toBe(1)
    })

    it('should default to 30 days for invalid period', () => {
      const result = parsePeriod('invalid')
      expect(result.days).toBe(30)
    })

    it('should default to 30 days for empty string', () => {
      const result = parsePeriod('')
      expect(result.days).toBe(30)
    })
  })

  describe('getDefaultInterval', () => {
    it('should return hourly for periods <= 2 days', () => {
      expect(getDefaultInterval(1)).toBe('hourly')
      expect(getDefaultInterval(2)).toBe('hourly')
    })

    it('should return daily for periods <= 60 days', () => {
      expect(getDefaultInterval(7)).toBe('daily')
      expect(getDefaultInterval(30)).toBe('daily')
      expect(getDefaultInterval(60)).toBe('daily')
    })

    it('should return weekly for periods <= 180 days', () => {
      expect(getDefaultInterval(90)).toBe('weekly')
      expect(getDefaultInterval(180)).toBe('weekly')
    })

    it('should return monthly for periods > 180 days', () => {
      expect(getDefaultInterval(365)).toBe('monthly')
      expect(getDefaultInterval(730)).toBe('monthly')
    })
  })
})
