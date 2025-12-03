/**
 * AreaChart Component
 * Filled line chart for cumulative/trend data
 */

import { Line } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import { chartColors, defaultChartOptions, formatChartDate, formatValue } from '../../lib/chartConfig'

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
  color = chartColors.primary,
  format,
  height = 200,
}: AreaChartProps) {
  const labels = data.map(d => formatChartDate(d.timestamp, interval))
  const values = data.map(d => d.value)

  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: color,
        backgroundColor: `${color}40`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: color,
      },
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
    scales: {
      ...defaultChartOptions.scales,
      y: {
        ...defaultChartOptions.scales?.y,
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
