/**
 * DashboardView Component
 * Renders widgets in a grid layout with KPI data
 */

import { useState, useCallback, useRef } from 'react'
import { useDashboard, useDeleteWidget, useUpdateLayout, useKpiHistory } from '../../hooks/useDashboards'
import { NumberWidget, StatWidget, GaugeWidget, ChartWidget } from './widgets'
import { CreateShareModal } from '../sharing/CreateShareModal'
import { AccessManagementDialog } from '../../components/AccessManagementDialog'
import { DraggableGrid } from './DraggableGrid'
import { AutoRefreshProvider } from '../../contexts/AutoRefreshContext'
import { RefreshControls } from './RefreshControls'
import type { Widget, WidgetType } from '../../types/dashboard'
import './dashboard.css'

interface DashboardViewProps {
  dashboardId: string
  onBack: () => void
  onAddWidget: () => void
}

export function DashboardView({ dashboardId, onBack, onAddWidget }: DashboardViewProps) {
  return (
    <AutoRefreshProvider dashboardId={dashboardId}>
      <DashboardViewContent dashboardId={dashboardId} onBack={onBack} onAddWidget={onAddWidget} />
    </AutoRefreshProvider>
  )
}

function DashboardViewContent({ dashboardId, onBack, onAddWidget }: DashboardViewProps) {
  const { data: dashboard, isLoading, error } = useDashboard(dashboardId)
  const deleteWidget = useDeleteWidget()
  const updateLayout = useUpdateLayout()
  const [showShareModal, setShowShareModal] = useState(false)
  const [showAccessModal, setShowAccessModal] = useState(false)
  
  // Debounce timer for layout saves
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm('Delete this widget?')) return
    
    try {
      await deleteWidget.mutateAsync({ dashboardId, widgetId })
    } catch (err) {
      console.error('Failed to delete widget:', err)
    }
  }

  // Handle layout changes with debounce
  const handleLayoutChange = useCallback((positions: Array<{ id: string; x: number; y: number; w: number; h: number }>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Debounce save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      const widgets = positions.map(pos => ({
        id: pos.id,
        position: { x: pos.x, y: pos.y, w: pos.w, h: pos.h }
      }))
      
      updateLayout.mutate({ 
        id: dashboardId, 
        data: { widgets } 
      })
    }, 500)
  }, [dashboardId, updateLayout])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 dark:text-red-400 mb-4">Failed to load dashboard</p>
        <button onClick={onBack} className="text-violet-600 dark:text-violet-400 hover:underline">
          ← Back to dashboards
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dashboard.name}</h1>
            {/* Access indicator - only show for non-owners who don't have full manage rights */}
            {!dashboard.isOwner && !dashboard.canManage && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Shared with you {dashboard.canEdit ? '(can edit)' : '(view only)'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh Controls */}
          <RefreshControls />
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          
          {/* Manage Access - only for owner/admin */}
          {dashboard.canManage && dashboard.owner && (
            <button
              onClick={() => setShowAccessModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              title="Manage access"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Access
            </button>
          )}

          {/* Public Share Link */}
          <button
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>

          {/* Add Widget - only for edit permission */}
          {dashboard.canEdit && (
            <button
              onClick={onAddWidget}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Widget
            </button>
          )}
        </div>
      </div>

      {/* Widgets Grid - Draggable */}
      {dashboard.widgets.length > 0 ? (
        <DraggableGrid
          widgets={dashboard.widgets}
          onLayoutChange={handleLayoutChange}
          isReadOnly={!dashboard.canEdit}
        >
          {dashboard.widgets.map((widget) => (
            <div key={widget.id} data-grid={{ 
              x: widget.position.x, 
              y: widget.position.y, 
              w: widget.position.w, 
              h: widget.position.h 
            }}>
              <WidgetRenderer
                widget={widget}
                onDelete={() => handleDeleteWidget(widget.id)}
                canEdit={dashboard.canEdit}
              />
            </div>
          ))}
        </DraggableGrid>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No widgets</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {dashboard.canEdit ? 'Add widgets to visualize your KPIs.' : 'No widgets have been added to this dashboard yet.'}
          </p>
          {dashboard.canEdit && (
            <div className="mt-6">
              <button
                onClick={onAddWidget}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Widget
              </button>
            </div>
          )}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <CreateShareModal
          isOpen={showShareModal}
          resourceType="dashboard"
          resourceId={dashboardId}
          resourceName={dashboard.name}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Access Management Modal */}
      {showAccessModal && dashboard.owner && (
        <AccessManagementDialog
          isOpen={showAccessModal}
          resourceType="dashboard"
          resourceId={dashboardId}
          resourceName={dashboard.name}
          owner={dashboard.owner}
          onClose={() => setShowAccessModal(false)}
        />
      )}
    </div>
  )
}

// Widget Renderer Component
interface WidgetRendererProps {
  widget: Widget
  onDelete: () => void
  canEdit?: boolean
}

function WidgetRenderer({ widget, onDelete, canEdit = true }: WidgetRendererProps) {
  const { type, kpi, kpiData, config } = widget

  const title = kpi?.name || 'Widget'
  const value = kpiData?.currentValue ?? null
  const targetValue = kpiData?.targetValue ?? kpi?.targetValue ?? null

  // Only allow delete if user can edit
  const handleDelete = canEdit ? onDelete : undefined

  // Render based on widget type
  const renderContent = () => {
    switch (type as WidgetType) {
      case 'number':
        return (
          <NumberWidget
            title={title}
            value={value}
            targetValue={targetValue}
            format={config?.format}
            onDelete={handleDelete}
          />
        )
      
      case 'stat':
        return (
          <StatWidgetWithHistory
            widget={widget}
            onDelete={handleDelete}
          />
        )
      
      case 'gauge':
        return (
          <GaugeWidget
            title={title}
            value={value}
            targetValue={targetValue}
            format={config?.format}
            onDelete={handleDelete}
          />
        )
      
      case 'line':
      case 'bar':
      case 'area':
        return (
          <ChartWidgetWithHistory
            widget={widget}
            onDelete={handleDelete}
          />
        )
      
      default:
        return (
          <NumberWidget
            title={title}
            value={value}
            targetValue={targetValue}
            format={config?.format}
            onDelete={handleDelete}
          />
        )
    }
  }

  return (
    <div className="dashboard-widget h-full relative group">
      {/* Drag Handle */}
      <div className="widget-drag-handle absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="9" cy="5" r="1.5" />
          <circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" />
          <circle cx="15" cy="19" r="1.5" />
        </svg>
      </div>
      {renderContent()}
    </div>
  )
}

// Stat Widget with History Data
function StatWidgetWithHistory({ widget, onDelete }: { widget: Widget; onDelete?: () => void }) {
  const { data: history, isLoading } = useKpiHistory(
    widget.kpiId || '',
    widget.config?.period || '30d'
  )

  return (
    <StatWidget
      title={widget.kpi?.name || 'Widget'}
      value={widget.kpiData?.currentValue ?? null}
      previousValue={history?.comparison.previousValue}
      change={history?.comparison.change}
      direction={history?.comparison.direction}
      format={widget.config?.format}
      isLoading={isLoading}
      onDelete={onDelete}
    />
  )
}

// Chart Widget with History Data
function ChartWidgetWithHistory({ widget, onDelete }: { widget: Widget; onDelete?: () => void }) {
  const [period, setPeriod] = useState(widget.config?.period || '30d')
  const { data: history, isLoading, error } = useKpiHistory(
    widget.kpiId || '',
    period
  )

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
  }

  return (
    <ChartWidget
      title={widget.kpi?.name || 'Widget'}
      data={history?.data || null}
      chartType={widget.type as 'line' | 'bar' | 'area'}
      interval={history?.interval}
      format={widget.config?.format}
      showTarget={widget.config?.showTarget}
      targetValue={widget.kpiData?.targetValue}
      defaultPeriod={period}
      onPeriodChange={handlePeriodChange}
      isLoading={isLoading}
      error={error?.message}
      onDelete={onDelete}
    />
  )
}
