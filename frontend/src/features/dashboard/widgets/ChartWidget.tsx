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

const defaultPeriods = ['7d', '30d', '90d']

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
        <div className="text-gray-400 text-sm text-center py-8">
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
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } ${
                    period === periods[0] ? 'rounded-l-md' : ''
                  } ${
                    period === periods[periods.length - 1] ? 'rounded-r-md' : ''
                  } ${
                    period !== periods[0] ? '-ml-px' : ''
                  }`}
                >
                  {period}
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
