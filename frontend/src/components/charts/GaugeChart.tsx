/**
 * GaugeChart Component
 * Circular progress indicator for KPI progress
 */

import { Doughnut } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import { getChartColors, formatValue } from '../../lib/chartConfig'
import { useTheme } from '../../contexts/ThemeContext'

export interface GaugeChartProps {
  value: number
  target?: number
  min?: number
  max?: number
  label?: string
  format?: 'currency' | 'percent' | 'number'
  size?: number
  showValue?: boolean
  showTarget?: boolean
}

export function GaugeChart({
  value,
  target,
  min = 0,
  max = target || 100,
  label,
  format,
  size = 150,
  showValue = true,
  showTarget = true,
}: GaugeChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const themeColors = getChartColors(isDark)
  
  // Calculate percentage for gauge
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  const remaining = 100 - percentage

  // Determine color based on progress
  const getColor = () => {
    if (percentage >= 100) return themeColors.success
    if (percentage >= 75) return themeColors.primary
    if (percentage >= 50) return themeColors.warning
    return themeColors.danger
  }

  const gaugeColor = getColor()

  const chartData: ChartData<'doughnut'> = {
    datasets: [
      {
        data: [percentage, remaining],
        backgroundColor: [gaugeColor, themeColors.neutralLight],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      },
    ],
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  }

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 40 }}>
      <div style={{ height: size / 2 + 20 }}>
        <Doughnut data={chartData} options={options} />
      </div>
      
      {/* Center content */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-end pb-2"
        style={{ top: size / 4 }}
      >
        {showValue && (
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {format === 'percent' ? `${percentage.toFixed(1)}%` : formatValue(value, format)}
          </span>
        )}
        {label && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        )}
        {showTarget && target !== undefined && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Target: {formatValue(target, format)}
          </span>
        )}
      </div>
    </div>
  )
}
