/**
 * GaugeWidget Component
 * Circular progress indicator using GaugeChart
 */

import { Widget } from './Widget'
import { GaugeChart } from '../../../components/charts'

export interface GaugeWidgetProps {
  title: string
  value: number | null
  targetValue?: number | null
  format?: 'currency' | 'percent' | 'number'
  isLoading?: boolean
  error?: string | null
  onEdit?: () => void
  onDelete?: () => void
}

export function GaugeWidget({
  title,
  value,
  targetValue,
  format,
  isLoading = false,
  error = null,
  onEdit,
  onDelete,
}: GaugeWidgetProps) {
  return (
    <Widget 
      title={title} 
      isLoading={isLoading} 
      error={error}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      <div className="flex items-center justify-center">
        {value !== null ? (
          <GaugeChart
            value={value}
            target={targetValue ?? undefined}
            format={format}
            size={160}
            showValue={true}
            showTarget={!!targetValue}
          />
        ) : (
          <div className="text-gray-400 dark:text-gray-500 text-sm">No data</div>
        )}
      </div>
    </Widget>
  )
}
