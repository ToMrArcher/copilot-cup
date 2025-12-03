/**
 * Chart.js Configuration
 * Global defaults and theme settings for all charts
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import type { ChartOptions } from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Color palette - Checkin brand colors
export const chartColors = {
  primary: '#7C3AED',     // Violet-600
  primaryLight: '#C4B5FD', // Violet-300
  success: '#10B981',     // Emerald-500
  warning: '#F59E0B',     // Amber-500
  danger: '#EF4444',      // Red-500
  neutral: '#6B7280',     // Gray-500
  neutralLight: '#E5E7EB', // Gray-200
  background: '#F9FAFB',  // Gray-50
}

// Dark mode color palette
export const chartColorsDark = {
  primary: '#A78BFA',     // Violet-400
  primaryLight: '#7C3AED', // Violet-600
  success: '#34D399',     // Emerald-400
  warning: '#FBBF24',     // Amber-400
  danger: '#F87171',      // Red-400
  neutral: '#9CA3AF',     // Gray-400
  neutralLight: '#374151', // Gray-700
  background: '#111827',  // Gray-900
}

// Get theme-aware colors
export function getChartColors(isDark: boolean) {
  return isDark ? chartColorsDark : chartColors
}

// Default chart options
export const defaultChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: { size: 12 },
      bodyFont: { size: 12 },
      padding: 10,
      cornerRadius: 4,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: { size: 11 },
        color: chartColors.neutral,
      },
    },
    y: {
      beginAtZero: false,
      grid: {
        color: chartColors.neutralLight,
      },
      ticks: {
        font: { size: 11 },
        color: chartColors.neutral,
      },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
}

// Get theme-aware chart options
export function getChartOptions(isDark: boolean): ChartOptions<'line'> {
  const colors = getChartColors(isDark)
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: isDark ? '#F9FAFB' : '#FFFFFF',
        bodyColor: isDark ? '#E5E7EB' : '#FFFFFF',
        borderColor: isDark ? '#374151' : 'transparent',
        borderWidth: isDark ? 1 : 0,
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 4,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
          color: colors.neutral,
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: colors.neutralLight,
        },
        ticks: {
          font: { size: 11 },
          color: colors.neutral,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  }
}

// Format date for chart labels
export function formatChartDate(date: Date | string, interval: string): string {
  const d = new Date(date)
  
  switch (interval) {
    case 'hourly':
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    case 'daily':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    case 'weekly':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    case 'monthly':
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    default:
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

// Format value for display
export function formatValue(value: number, format?: string): string {
  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  
  if (format === 'percent') {
    return `${value.toFixed(1)}%`
  }
  
  // Default: compact number format
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  
  return value.toLocaleString()
}
