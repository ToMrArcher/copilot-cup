import { useState } from 'react'
import type { Kpi } from '../../types/kpi'
import { useDeleteKpi, useRecalculateKpi } from '../../hooks/useKpis'
import { CreateShareModal } from '../sharing/CreateShareModal'

interface KpiCardProps {
  kpi: Kpi
  onClick?: () => void
}

export function KpiCard({ kpi, onClick }: KpiCardProps) {
  const deleteKpi = useDeleteKpi()
  const recalculate = useRecalculateKpi()
  const [showShareModal, setShowShareModal] = useState(false)

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowShareModal(true)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Delete "${kpi.name}"?`)) {
      deleteKpi.mutate(kpi.id)
    }
  }

  const handleRecalculate = (e: React.MouseEvent) => {
    e.stopPropagation()
    recalculate.mutate(kpi.id)
  }

  // Format the current value
  const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '—'
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toFixed(value % 1 === 0 ? 0 : 2)
  }

  // Determine status color
  const getStatusColor = (): string => {
    if (kpi.calculationError) return 'text-red-600 dark:text-red-400'
    if (kpi.onTrack === true) return 'text-green-600 dark:text-green-400'
    if (kpi.onTrack === false) return 'text-amber-600 dark:text-amber-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  // Get progress bar color
  const getProgressColor = (): string => {
    if (kpi.onTrack === true) return 'bg-green-500'
    if (kpi.onTrack === false) return 'bg-amber-500'
    return 'bg-violet-500'
  }

  // Get direction arrow
  const getDirectionArrow = (): string => {
    if (kpi.targetDirection === 'increase') return '↑'
    if (kpi.targetDirection === 'decrease') return '↓'
    return ''
  }

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-lg">{kpi.name}</h3>
          {kpi.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{kpi.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
            title="Share"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button
            onClick={handleRecalculate}
            disabled={recalculate.isPending}
            className="p-1.5 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded"
            title="Recalculate"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteKpi.isPending}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Current Value */}
      <div className="mb-4">
        <div className={`text-3xl font-bold ${getStatusColor()}`}>
          {formatValue(kpi.currentValue)}
          {kpi.targetDirection && (
            <span className="text-lg ml-1 opacity-75">{getDirectionArrow()}</span>
          )}
        </div>
        {kpi.calculationError && (
          <p className="text-sm text-red-500 mt-1">{kpi.calculationError}</p>
        )}
      </div>

      {/* Progress Bar */}
      {kpi.targetValue && kpi.progress !== null && kpi.progress !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Progress</span>
            <span className={`font-medium ${getStatusColor()}`}>
              {kpi.progress.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(100, Math.max(0, kpi.progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Target Info */}
      {kpi.targetValue && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Target: {formatValue(kpi.targetValue)}</span>
          {kpi.targetPeriod && (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              {kpi.targetPeriod}
            </span>
          )}
        </div>
      )}

      {/* Formula */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <code className="text-xs text-gray-400 dark:text-gray-500 font-mono">{kpi.formula}</code>
      </div>

      {/* Sources */}
      {kpi.sources.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {kpi.sources.map(source => (
            <span
              key={source.id}
              className="px-2 py-0.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded text-xs"
            >
              {source.alias || source.dataField.name}
            </span>
          ))}
        </div>
      )}

      {/* Updated timestamp */}
      {kpi.calculatedAt && (
        <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Updated: {new Date(kpi.calculatedAt).toLocaleString()}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <CreateShareModal
          isOpen={showShareModal}
          resourceType="kpi"
          resourceId={kpi.id}
          resourceName={kpi.name}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
