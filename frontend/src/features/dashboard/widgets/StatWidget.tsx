/**
 * StatWidget Component
 * Value with comparison to previous period and trend arrow
 */

import { Widget } from './Widget'
import { formatValue } from '../../../lib/chartConfig'

export interface StatWidgetProps {
  title: string
  value: number | null
  previousValue?: number | null
  change?: number | null
  direction?: 'up' | 'down' | 'unchanged' | null
  format?: 'currency' | 'percent' | 'number'
  prefix?: string
  suffix?: string
  isLoading?: boolean
  error?: string | null
  onEdit?: () => void
  onDelete?: () => void
}

export function StatWidget({
  title,
  value,
  previousValue,
  change,
  direction,
  format,
  prefix = '',
  suffix = '',
  isLoading = false,
  error = null,
  onEdit,
  onDelete,
}: StatWidgetProps) {
  const formattedValue = value !== null ? formatValue(value, format) : '--'
  
  // Calculate change if not provided
  const calculatedChange = change ?? (
    value !== null && previousValue !== null && previousValue !== 0
      ? ((value - previousValue) / Math.abs(previousValue)) * 100
      : null
  )
  
  const calculatedDirection = direction ?? (
    calculatedChange !== null
      ? calculatedChange > 0.1 ? 'up' : calculatedChange < -0.1 ? 'down' : 'unchanged'
      : null
  )

  const getTrendColor = () => {
    if (calculatedDirection === 'up') return 'text-green-600'
    if (calculatedDirection === 'down') return 'text-red-600'
    return 'text-gray-500'
  }

  const getTrendIcon = () => {
    if (calculatedDirection === 'up') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )
    }
    if (calculatedDirection === 'down') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    )
  }

  return (
    <Widget 
      title={title} 
      isLoading={isLoading} 
      error={error}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900">
          {prefix}{formattedValue}{suffix}
        </div>
        
        {calculatedChange !== null && (
          <div className={`mt-2 flex items-center justify-center gap-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {calculatedChange > 0 ? '+' : ''}{calculatedChange.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400 ml-1">vs previous</span>
          </div>
        )}
      </div>
    </Widget>
  )
}
