/**
 * BarChart Component
 * Categorical or time-series bar visualization
 */

import { Bar } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import { chartColors, defaultChartOptions, formatChartDate, formatValue } from '../../lib/chartConfig'

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
  color = chartColors.primary,
  format,
  height = 200,
  horizontal = false,
}: BarChartProps) {
  const labels = data.map(d => formatChartDate(d.timestamp, interval))
  const values = data.map(d => d.value)

  const chartData: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: `${color}CC`,
        borderColor: color,
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: color,
      },
    ],
  }

  const options: ChartOptions<'bar'> = {
    ...defaultChartOptions,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      ...defaultChartOptions.plugins,
      tooltip: {
        ...defaultChartOptions.plugins?.tooltip,
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
