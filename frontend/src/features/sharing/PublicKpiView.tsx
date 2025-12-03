/**
 * PublicKpiView Component
 * Displays a shared KPI in read-only mode
 */

import { useParams } from 'react-router-dom'
import { useSharedResource } from '../../hooks/useSharing'
import type { SharedKpi } from '../../types/sharing'

export function PublicKpiView() {
  const { token } = useParams<{ token: string }>()
  const { data: sharedResource, isLoading, error } = useSharedResource(token || '')

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-500">This share link is not valid.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
      </div>
    )
  }

  if (error || !sharedResource) {
    const errorMessage = error?.message || 'Unable to load shared content'
    const isExpired = errorMessage.includes('expired')
    const isInactive = errorMessage.includes('inactive')

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
            {isExpired ? (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isExpired ? 'Link Expired' : isInactive ? 'Link Inactive' : 'Link Not Found'}
          </h1>
          <p className="text-gray-500">
            {isExpired 
              ? 'This share link has expired. Please request a new link from the owner.'
              : isInactive
              ? 'This share link has been deactivated.'
              : 'This share link is invalid or has been removed.'}
          </p>
        </div>
      </div>
    )
  }

  if (sharedResource.type !== 'kpi' || !sharedResource.kpi) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Content</h1>
          <p className="text-gray-500">Expected a KPI but received different content.</p>
        </div>
      </div>
    )
  }

  const kpi = sharedResource.kpi as SharedKpi
  const showTarget = sharedResource.showTarget

  // Format value based on type
  const formatValue = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(value)
  }

  // Calculate progress if we have target (for SharedKpi)
  const calculateProgress = () => {
    if (!showTarget || !kpi.targetValue || kpi.currentValue === null) return null
    return (kpi.currentValue / kpi.targetValue) * 100
  }

  const progress = calculateProgress()
  const onTrack = progress !== null ? progress >= 100 : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{kpi.name}</h1>
              <p className="text-sm text-gray-500 mt-1">Shared KPI</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>View Only</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Main Value */}
          <div className="p-8 text-center border-b border-gray-100">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {formatValue(kpi.currentValue)}
            </div>
            <div className="text-gray-500">Current Value</div>
          </div>

          {/* Target & Progress (if showTarget is enabled) */}
          {showTarget && kpi.targetValue !== null && kpi.targetValue !== undefined && (
            <div className="p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Target</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatValue(kpi.targetValue)}
                </span>
              </div>
              
              {progress !== null && (
                <>
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                        onTrack ? 'bg-green-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">Progress</span>
                    <span className={`text-sm font-medium ${onTrack ? 'text-green-600' : 'text-amber-600'}`}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Details */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {kpi.description && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-gray-900">{kpi.description}</p>
              </div>
            )}

            {showTarget && kpi.targetDirection && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Target Direction</h3>
                <div className="flex items-center gap-2">
                  {kpi.targetDirection === 'increase' ? (
                    <>
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-gray-900">Increase</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                      <span className="text-gray-900">Decrease</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {showTarget && kpi.targetPeriod && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Target Period</h3>
                <span className="text-gray-900">{kpi.targetPeriod}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-500">
          Powered by KPI Dashboard
        </div>
      </footer>
    </div>
  )
}
