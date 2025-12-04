import { useState } from 'react'
import { useKpis } from '../../hooks/useKpis'
import { KpiCard } from './KpiCard'
import { KpiWizard } from './KpiWizard'

export function KpiList() {
  const { data: kpis, isLoading, error } = useKpis()
  const [showWizard, setShowWizard] = useState(false)
  const [editingKpiId, setEditingKpiId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
        <p className="font-medium">Failed to load KPIs</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">KPIs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your key performance indicators
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create KPI
        </button>
      </div>

      {/* Stats Summary */}
      {kpis && kpis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total KPIs</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{kpis.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">On Track</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {kpis.filter(k => k.onTrack === true).length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Needs Attention</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {kpis.filter(k => k.onTrack === false).length}
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      {kpis && kpis.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map(kpi => (
            <KpiCard key={kpi.id} kpi={kpi} onEdit={(id) => setEditingKpiId(id)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No KPIs yet</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Create your first KPI to start tracking performance
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Create KPI
          </button>
        </div>
      )}

      {/* Wizard Modal */}
      {(showWizard || editingKpiId) && (
        <KpiWizard 
          kpiId={editingKpiId || undefined}
          onClose={() => { 
            setShowWizard(false)
            setEditingKpiId(null)
          }} 
        />
      )}
    </div>
  )
}
