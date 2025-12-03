/**
 * DashboardView Component
 * Renders widgets in a grid layout with KPI data
 */

import { useDashboard, useDeleteWidget, useUpdateLayout, useKpiHistory } from '../../hooks/useDashboards'
import { NumberWidget, StatWidget, GaugeWidget, ChartWidget } from './widgets'
import type { Widget, WidgetType } from '../../types/dashboard'
import './dashboard.css'

interface DashboardViewProps {
  dashboardId: string
  onBack: () => void
  onAddWidget: () => void
}

export function DashboardView({ dashboardId, onBack, onAddWidget }: DashboardViewProps) {
  const { data: dashboard, isLoading, error } = useDashboard(dashboardId)
  const deleteWidget = useDeleteWidget()

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm('Delete this widget?')) return
    
    try {
      await deleteWidget.mutateAsync({ dashboardId, widgetId })
    } catch (err) {
      console.error('Failed to delete widget:', err)
    }
  }

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
        <p className="text-red-500 mb-4">Failed to load dashboard</p>
        <button onClick={onBack} className="text-violet-600 hover:underline">
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
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{dashboard.name}</h1>
        </div>
        <button
          onClick={onAddWidget}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Widget
        </button>
      </div>

      {/* Widgets Grid - Responsive */}
      {dashboard.widgets.length > 0 ? (
        <div className="dashboard-grid">
          {dashboard.widgets.map((widget) => (
            <WidgetRenderer
              key={widget.id}
              widget={widget}
              onDelete={() => handleDeleteWidget(widget.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No widgets</h3>
          <p className="mt-1 text-sm text-gray-500">Add widgets to visualize your KPIs.</p>
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
        </div>
      )}
    </div>
  )
}

// Widget Renderer Component
interface WidgetRendererProps {
  widget: Widget
  onDelete: () => void
}

function WidgetRenderer({ widget, onDelete }: WidgetRendererProps) {
  const { position, type, kpi, kpiData, config } = widget

  const title = kpi?.name || 'Widget'
  const value = kpiData?.currentValue ?? null
  const targetValue = kpiData?.targetValue ?? kpi?.targetValue ?? null

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
            onDelete={onDelete}
          />
        )
      
      case 'stat':
        return (
          <StatWidgetWithHistory
            widget={widget}
            onDelete={onDelete}
          />
        )
      
      case 'gauge':
        return (
          <GaugeWidget
            title={title}
            value={value}
            targetValue={targetValue}
            format={config?.format}
            onDelete={onDelete}
          />
        )
      
      case 'line':
      case 'bar':
      case 'area':
        return (
          <ChartWidgetWithHistory
            widget={widget}
            onDelete={onDelete}
          />
        )
      
      default:
        return (
          <NumberWidget
            title={title}
            value={value}
            targetValue={targetValue}
            format={config?.format}
            onDelete={onDelete}
          />
        )
    }
  }

  return (
    <div 
      className="dashboard-widget"
      style={{
        gridColumn: `span ${position.w}`,
        gridRow: `span ${position.h}`,
      }}
    >
      {renderContent()}
    </div>
  )
}

// Stat Widget with History Data
function StatWidgetWithHistory({ widget, onDelete }: { widget: Widget; onDelete: () => void }) {
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
function ChartWidgetWithHistory({ widget, onDelete }: { widget: Widget; onDelete: () => void }) {
  const period = widget.config?.period || '30d'
  const { data: history, isLoading, error } = useKpiHistory(
    widget.kpiId || '',
    period
  )

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
      isLoading={isLoading}
      error={error?.message}
      onDelete={onDelete}
    />
  )
}
