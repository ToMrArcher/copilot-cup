/**
 * LineChart Component
 * Time-series visualization for KPI history
 */

import { Line } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import { chartColors, getChartOptions, getChartColors, formatChartDate, formatValue } from '../../lib/chartConfig'
import { useTheme } from '../../contexts/ThemeContext'

export interface LineChartProps {
  data: Array<{ timestamp: string | Date; value: number }>
  interval?: string
  label?: string
  color?: string
  fill?: boolean
  showTarget?: boolean
  targetValue?: number
  format?: 'currency' | 'percent' | 'number'
  height?: number
}

export function LineChart({
  data,
  interval = 'daily',
  label = 'Value',
  color,
  fill = true,
  showTarget = false,
  targetValue,
  format,
  height = 200,
}: LineChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const themeColors = getChartColors(isDark)
  const chartColor = color || themeColors.primary
  
  const labels = data.map(d => formatChartDate(d.timestamp, interval))
  const values = data.map(d => d.value)

  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: chartColor,
        backgroundColor: fill ? `${chartColor}20` : 'transparent',
        borderWidth: 2,
        fill,
        tension: 0.3,
        pointRadius: data.length > 20 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: chartColor,
      },
      ...(showTarget && targetValue
        ? [
            {
              label: 'Target',
              data: Array(data.length).fill(targetValue),
              borderColor: themeColors.success,
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              pointRadius: 0,
              pointHoverRadius: 0,
            },
          ]
        : []),
    ],
  }

  const baseOptions = getChartOptions(isDark)
  const options: ChartOptions<'line'> = {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      tooltip: {
        ...baseOptions.plugins?.tooltip,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            return `${context.dataset.label}: ${formatValue(value, format)}`
          },
        },
      },
    },
  }

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  )
}
