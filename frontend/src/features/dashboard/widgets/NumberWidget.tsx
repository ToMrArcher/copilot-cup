/**
 * NumberWidget Component
 * Large value display with label and optional target
 */

import { Widget } from './Widget'
import { formatValue } from '../../../lib/chartConfig'

export interface NumberWidgetProps {
  title: string
  value: number | null
  targetValue?: number | null
  format?: 'currency' | 'percent' | 'number'
  prefix?: string
  suffix?: string
  isLoading?: boolean
  error?: string | null
  onEdit?: () => void
  onDelete?: () => void
}

export function NumberWidget({
  title,
  value,
  targetValue,
  format,
  prefix = '',
  suffix = '',
  isLoading = false,
  error = null,
  onEdit,
  onDelete,
}: NumberWidgetProps) {
  const formattedValue = value !== null ? formatValue(value, format) : '--'
  
  // Calculate progress if target exists
  const progress = value !== null && targetValue 
    ? Math.min(100, (value / targetValue) * 100) 
    : null

  return (
    <Widget 
      title={title} 
      isLoading={isLoading} 
      error={error}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {prefix}{formattedValue}{suffix}
        </div>
        
        {targetValue !== undefined && targetValue !== null && (
          <div className="mt-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Target: {prefix}{formatValue(targetValue, format)}{suffix}
            </div>
            {progress !== null && (
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    progress >= 100 
                      ? 'bg-green-500' 
                      : progress >= 75 
                        ? 'bg-violet-500' 
                        : progress >= 50 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Widget>
  )
}
