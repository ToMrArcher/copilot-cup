/**
 * LineChart Component
 * Time-series visualization for KPI history
 */

import { Line } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import { chartColors, defaultChartOptions, formatChartDate, formatValue } from '../../lib/chartConfig'

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
  color = chartColors.primary,
  fill = true,
  showTarget = false,
  targetValue,
  format,
  height = 200,
}: LineChartProps) {
  const labels = data.map(d => formatChartDate(d.timestamp, interval))
  const values = data.map(d => d.value)

  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: color,
        backgroundColor: fill ? `${color}20` : 'transparent',
        borderWidth: 2,
        fill,
        tension: 0.3,
        pointRadius: data.length > 20 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: color,
      },
      ...(showTarget && targetValue
        ? [
            {
              label: 'Target',
              data: Array(data.length).fill(targetValue),
              borderColor: chartColors.success,
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

  const options: ChartOptions<'line'> = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      tooltip: {
        ...defaultChartOptions.plugins?.tooltip,
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
