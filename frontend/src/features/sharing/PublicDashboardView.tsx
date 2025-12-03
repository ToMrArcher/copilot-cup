/**
 * PublicDashboardView Component
 * Displays a shared dashboard in read-only mode
 */

import { useParams } from 'react-router-dom'
import { useSharedResource } from '../../hooks/useSharing'
import { NumberWidget, StatWidget, GaugeWidget } from '../dashboard/widgets'
import { DraggableGrid } from '../dashboard/DraggableGrid'
import type { WidgetType, Widget } from '../../types/dashboard'
import type { SharedWidget, SharedDashboard } from '../../types/sharing'
import '../dashboard/dashboard.css'

export function PublicDashboardView() {
  const { token } = useParams<{ token: string }>()
  const { data: sharedResource, isLoading, error } = useSharedResource(token || '')

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Invalid Link</h1>
          <p className="text-gray-500 dark:text-gray-400">This share link is not valid.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
      </div>
    )
  }

  if (error || !sharedResource) {
    const errorMessage = error?.message || 'Unable to load shared content'
    const isExpired = errorMessage.includes('expired')
    const isInactive = errorMessage.includes('inactive')

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {isExpired ? 'Link Expired' : isInactive ? 'Link Inactive' : 'Link Not Found'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
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

  if (sharedResource.type !== 'dashboard' || !sharedResource.dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Invalid Content</h1>
          <p className="text-gray-500 dark:text-gray-400">Expected a dashboard but received different content.</p>
        </div>
      </div>
    )
  }

  const dashboard = sharedResource.dashboard as SharedDashboard
  const showTarget = sharedResource.showTarget

  // Convert SharedWidget[] to Widget[] for DraggableGrid
  const convertToWidgets = (widgets: SharedWidget[]): Widget[] => {
    return widgets.map(w => ({
      id: w.id,
      dashboardId: '',
      kpiId: w.kpi?.id || null,
      type: w.type as WidgetType,
      position: w.position,
      config: (w.config || {}) as Widget['config'],
      createdAt: '',
      updatedAt: '',
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dashboard.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Shared Dashboard</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>View Only</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dashboard.widgets.length > 0 ? (
          <DraggableGrid
            widgets={convertToWidgets(dashboard.widgets)}
            onLayoutChange={() => {}} // No-op for read-only
            isReadOnly={true}
          >
            {dashboard.widgets.map((widget) => (
              <div key={widget.id} className="dashboard-widget readonly">
                <PublicWidgetRenderer
                  widget={widget}
                  showTarget={showTarget}
                />
              </div>
            ))}
          </DraggableGrid>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No widgets</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This dashboard doesn't have any widgets yet.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Powered by KPI Dashboard
        </div>
      </footer>
    </div>
  )
}

// Read-only Widget Renderer
interface PublicWidgetRendererProps {
  widget: SharedWidget
  showTarget: boolean
}

function PublicWidgetRenderer({ widget, showTarget }: PublicWidgetRendererProps) {
  const { type, kpi, config } = widget

  const title = kpi?.name || 'Widget'
  const value = kpi?.currentValue ?? null
  const targetValue = showTarget ? (kpi?.targetValue ?? null) : null

  // No-op delete function for read-only view
  const noopDelete = () => {}

  // Get format from config
  const format = (config as { format?: 'currency' | 'percent' | 'number' } | null)?.format

  // Render based on widget type
  switch (type as WidgetType) {
    case 'number':
      return (
        <NumberWidget
          title={title}
          value={value}
          targetValue={targetValue}
          format={format}
          onDelete={noopDelete}
        />
      )
    
    case 'stat':
      return (
        <StatWidget
          title={title}
          value={value}
          previousValue={null}
          change={null}
          direction={null}
          format={format}
          isLoading={false}
          onDelete={noopDelete}
        />
      )
    
    case 'gauge':
      return (
        <GaugeWidget
          title={title}
          value={value}
          targetValue={targetValue}
          format={format}
          onDelete={noopDelete}
        />
      )
    
    case 'line':
    case 'bar':
    case 'area':
      // For charts in public view, we show a simple number widget as charts require history data
      return (
        <NumberWidget
          title={title}
          value={value}
          targetValue={targetValue}
          format={format}
          onDelete={noopDelete}
        />
      )
    
    default:
      return (
        <NumberWidget
          title={title}
          value={value}
          targetValue={targetValue}
          format={format}
          onDelete={noopDelete}
        />
      )
  }
}
