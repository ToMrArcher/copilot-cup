/**
 * AreaChart Component
 * Filled line chart for cumulative/trend data
 */

import { Line } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import { getChartOptions, getChartColors, formatChartDate, formatValue } from '../../lib/chartConfig'
import { useTheme } from '../../contexts/ThemeContext'

export interface AreaChartProps {
  data: Array<{ timestamp: string | Date; value: number }>
  interval?: string
  label?: string
  color?: string
  format?: 'currency' | 'percent' | 'number'
  height?: number
  gradient?: boolean
}

export function AreaChart({
  data,
  interval = 'daily',
  label = 'Value',
  color,
  format,
  height = 200,
}: AreaChartProps) {
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
        backgroundColor: `${chartColor}40`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: chartColor,
      },
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
    scales: {
      ...baseOptions.scales,
      y: {
        ...baseOptions.scales?.y,
        beginAtZero: true,
      },
    },
  }

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  )
}
