/**
 * BarChart Component
 * Categorical or time-series bar visualization
 */

import { Bar } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import { getChartOptions, getChartColors, formatChartDate, formatValue } from '../../lib/chartConfig'
import { useTheme } from '../../contexts/ThemeContext'

export interface BarChartProps {
  data: Array<{ timestamp: string | Date; value: number }>
  interval?: string
  label?: string
  color?: string
  format?: 'currency' | 'percent' | 'number'
  height?: number
  horizontal?: boolean
}

export function BarChart({
  data,
  interval = 'daily',
  label = 'Value',
  color,
  format,
  height = 200,
  horizontal = false,
}: BarChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const themeColors = getChartColors(isDark)
  const chartColor = color || themeColors.primary
  
  const labels = data.map(d => formatChartDate(d.timestamp, interval))
  const values = data.map(d => d.value)

  const chartData: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: `${chartColor}CC`,
        borderColor: chartColor,
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: chartColor,
      },
    ],
  }

  const baseOptions = getChartOptions(isDark)
  const options: ChartOptions<'bar'> = {
    ...baseOptions,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      ...baseOptions.plugins,
      tooltip: {
        ...baseOptions.plugins?.tooltip,
        callbacks: {
          label: (context) => {
            const value = context.parsed[horizontal ? 'x' : 'y']
            return `${context.dataset.label}: ${formatValue(value, format)}`
          },
        },
      },
    },
  } as ChartOptions<'bar'>

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
