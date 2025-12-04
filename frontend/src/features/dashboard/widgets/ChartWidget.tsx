/**
 * ChartWidget Component
 * Line/bar/area chart with period selector
 */

import { useState } from 'react'
import { Widget } from './Widget'
import { LineChart, BarChart, AreaChart } from '../../../components/charts'

export interface ChartWidgetProps {
  title: string
  data: Array<{ timestamp: string | Date; value: number }> | null
  chartType?: 'line' | 'bar' | 'area'
  interval?: string
  format?: 'currency' | 'percent' | 'number'
  showTarget?: boolean
  targetValue?: number | null
  periods?: string[]
  defaultPeriod?: string
  onPeriodChange?: (period: string) => void
  isLoading?: boolean
  error?: string | null
  onEdit?: () => void
  onDelete?: () => void
}

const defaultPeriods = ['1h', '24h', '7d', '30d', '90d', '6m', '1y', 'all']

// Human-readable labels for period buttons
const periodLabels: Record<string, string> = {
  '1h': '1H',
  '6h': '6H',
  '24h': '24H',
  '7d': '7D',
  '30d': '30D',
  '90d': '90D',
  '6m': '6M',
  '1y': '1Y',
  'all': 'All',
}

export function ChartWidget({
  title,
  data,
  chartType = 'line',
  interval = 'daily',
  format,
  showTarget = false,
  targetValue,
  periods = defaultPeriods,
  defaultPeriod = '30d',
  onPeriodChange,
  isLoading = false,
  error = null,
  onEdit,
  onDelete,
}: ChartWidgetProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod)

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    onPeriodChange?.(period)
  }

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
          No data available
        </div>
      )
    }

    const chartProps = {
      data,
      interval,
      format,
      height: 180,
    }

    switch (chartType) {
      case 'bar':
        return <BarChart {...chartProps} />
      case 'area':
        return <AreaChart {...chartProps} />
      case 'line':
      default:
        return (
          <LineChart 
            {...chartProps} 
            showTarget={showTarget} 
            targetValue={targetValue ?? undefined}
          />
        )
    }
  }

  return (
    <Widget 
      title={title} 
      isLoading={isLoading} 
      error={error}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      <div className="w-full h-full flex flex-col">
        {/* Period selector */}
        {periods.length > 0 && (
          <div className="flex justify-end mb-2">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              {periods.map((period) => (
                <button
                  key={period}
                  onClick={() => handlePeriodChange(period)}
                  className={`px-2 py-1 text-xs font-medium border ${
                    selectedPeriod === period
                      ? 'bg-violet-500 text-white border-violet-500'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  } ${
                    period === periods[0] ? 'rounded-l-md' : ''
                  } ${
                    period === periods[periods.length - 1] ? 'rounded-r-md' : ''
                  } ${
                    period !== periods[0] ? '-ml-px' : ''
                  }`}
                >
                  {periodLabels[period] || period}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="flex-1 min-h-0">
          {renderChart()}
        </div>
      </div>
    </Widget>
  )
}
