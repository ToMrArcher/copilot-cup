/**
 * WidgetPicker Component
 * Modal to add a new widget with KPI and type selection
 */

import { useState } from 'react'
import { useKpis } from '../../hooks/useKpis'
import { useAddWidget } from '../../hooks/useDashboards'
import type { WidgetType, WidgetPosition, WidgetConfig } from '../../types/dashboard'

interface WidgetPickerProps {
  dashboardId: string
  isOpen: boolean
  onClose: () => void
}

const widgetTypes: Array<{ type: WidgetType; label: string; description: string; icon: string }> = [
  { type: 'number', label: 'Number', description: 'Large value display', icon: '123' },
  { type: 'stat', label: 'Stat', description: 'Value with trend comparison', icon: '📈' },
  { type: 'gauge', label: 'Gauge', description: 'Circular progress indicator', icon: '⏱️' },
  { type: 'line', label: 'Line Chart', description: 'Time-series line graph', icon: '📉' },
  { type: 'bar', label: 'Bar Chart', description: 'Categorical bar graph', icon: '📊' },
  { type: 'area', label: 'Area Chart', description: 'Filled area graph', icon: '📈' },
  { type: 'image', label: 'Image', description: 'Display a picture or logo', icon: '🖼️' },
]

const defaultPositions: Record<WidgetType, WidgetPosition> = {
  number: { x: 0, y: 0, w: 3, h: 2 },
  stat: { x: 0, y: 0, w: 3, h: 2 },
  gauge: { x: 0, y: 0, w: 3, h: 3 },
  line: { x: 0, y: 0, w: 6, h: 3 },
  bar: { x: 0, y: 0, w: 6, h: 3 },
  area: { x: 0, y: 0, w: 6, h: 3 },
  image: { x: 0, y: 0, w: 4, h: 3 },
}

export function WidgetPicker({ dashboardId, isOpen, onClose }: WidgetPickerProps) {
  const { data: kpis, isLoading: kpisLoading } = useKpis()
  const addWidget = useAddWidget()
  
  const [step, setStep] = useState<'type' | 'kpi' | 'config'>('type')
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null)
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null)
  const [config, setConfig] = useState<WidgetConfig>({
    format: 'number',
    showTarget: true,
    period: '30d',
  })

  const handleTypeSelect = (type: WidgetType) => {
    setSelectedType(type)
    // Image widgets don't need a KPI, skip to config
    if (type === 'image') {
      setStep('config')
    } else {
      setStep('kpi')
    }
  }

  const handleKpiSelect = (kpiId: string) => {
    setSelectedKpiId(kpiId)
    setStep('config')
  }

  const handleCreate = async () => {
    if (!selectedType) return
    // Image widgets don't require a KPI, but other widgets do
    if (selectedType !== 'image' && !selectedKpiId) return
    // Image widgets require a URL
    if (selectedType === 'image' && !config.imageUrl) return

    try {
      await addWidget.mutateAsync({
        dashboardId,
        data: {
          type: selectedType,
          kpiId: selectedType === 'image' ? null : selectedKpiId,
          config,
          position: defaultPositions[selectedType],
        },
      })
      handleClose()
    } catch (err) {
      console.error('Failed to add widget:', err)
    }
  }

  const handleClose = () => {
    setStep('type')
    setSelectedType(null)
    setSelectedKpiId(null)
    setConfig({ format: 'number', showTarget: true, period: '30d' })
    onClose()
  }

  const handleBack = () => {
    if (step === 'config') {
      // Image widgets skip the KPI step
      if (selectedType === 'image') {
        setStep('type')
      } else {
        setStep('kpi')
      }
    } else if (step === 'kpi') {
      setStep('type')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80" onClick={handleClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step !== 'type' && (
                <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {step === 'type' && 'Select Widget Type'}
                {step === 'kpi' && 'Select KPI'}
                {step === 'config' && 'Configure Widget'}
              </h3>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Select Type */}
            {step === 'type' && (
              <div className="grid grid-cols-2 gap-3">
                {widgetTypes.map(({ type, label, description, icon }) => (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className="p-4 border dark:border-gray-600 rounded-lg text-left hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                  >
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{label}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Select KPI */}
            {step === 'kpi' && (
              <div>
                {kpisLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
                  </div>
                ) : kpis && kpis.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {kpis.map((kpi) => (
                      <button
                        key={kpi.id}
                        onClick={() => handleKpiSelect(kpi.id)}
                        className={`w-full p-4 border rounded-lg text-left hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors ${
                          selectedKpiId === kpi.id ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30' : 'dark:border-gray-600'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100">{kpi.name}</div>
                        {kpi.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{kpi.description}</div>
                        )}
                        <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          Formula: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{kpi.formula}</code>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No KPIs available. Create a KPI first.
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Configure */}
            {step === 'config' && (
              <div className="space-y-4">
                {/* Image Widget Configuration */}
                {selectedType === 'image' ? (
                  <>
                    {/* Image URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={config.imageUrl || ''}
                        onChange={(e) => setConfig({ ...config, imageUrl: e.target.value })}
                        placeholder="https://example.com/image.png"
                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md px-3 py-2"
                      />
                    </div>

                    {/* Image Preview */}
                    {config.imageUrl && (
                      <div className="border dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-900">
                        <img
                          src={config.imageUrl}
                          alt="Preview"
                          className="max-h-40 mx-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}

                    {/* Alt Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Alt Text (for accessibility)
                      </label>
                      <input
                        type="text"
                        value={config.altText || ''}
                        onChange={(e) => setConfig({ ...config, altText: e.target.value })}
                        placeholder="Describe the image"
                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md px-3 py-2"
                      />
                    </div>

                    {/* Object Fit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Image Sizing
                      </label>
                      <select
                        value={config.objectFit || 'contain'}
                        onChange={(e) => setConfig({ ...config, objectFit: e.target.value as WidgetConfig['objectFit'] })}
                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md px-3 py-2"
                      >
                        <option value="contain">Contain (show whole image)</option>
                        <option value="cover">Cover (fill space, may crop)</option>
                        <option value="fill">Fill (stretch to fit)</option>
                      </select>
                    </div>

                    {/* Caption */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Caption (optional)
                      </label>
                      <input
                        type="text"
                        value={config.caption || ''}
                        onChange={(e) => setConfig({ ...config, caption: e.target.value })}
                        placeholder="Optional caption below image"
                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md px-3 py-2"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* KPI Widget Configuration */}
                    {/* Format */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Value Format
                      </label>
                      <select
                        value={config.format || 'number'}
                        onChange={(e) => setConfig({ ...config, format: e.target.value as WidgetConfig['format'] })}
                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md px-3 py-2"
                      >
                        <option value="number">Number</option>
                        <option value="currency">Currency ($)</option>
                        <option value="percent">Percentage (%)</option>
                      </select>
                    </div>

                    {/* Show Target */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showTarget"
                        checked={config.showTarget ?? true}
                        onChange={(e) => setConfig({ ...config, showTarget: e.target.checked })}
                        className="h-4 w-4 text-violet-600 rounded"
                      />
                      <label htmlFor="showTarget" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Show target value
                      </label>
                    </div>

                    {/* Period (for charts) */}
                    {['line', 'bar', 'area', 'stat'].includes(selectedType || '') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Time Period
                        </label>
                        <select
                          value={config.period || '30d'}
                          onChange={(e) => setConfig({ ...config, period: e.target.value })}
                          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md px-3 py-2"
                        >
                          <option value="1h">Last hour</option>
                          <option value="6h">Last 6 hours</option>
                          <option value="24h">Last 24 hours</option>
                          <option value="7d">Last 7 days</option>
                          <option value="30d">Last 30 days</option>
                          <option value="90d">Last 90 days</option>
                          <option value="6m">Last 6 months</option>
                          <option value="1y">Last year</option>
                          <option value="all">All time</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {step === 'config' && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={
                  !selectedType || 
                  addWidget.isPending ||
                  (selectedType === 'image' ? !config.imageUrl : !selectedKpiId)
                }
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md disabled:opacity-50"
              >
                {addWidget.isPending ? 'Adding...' : 'Add Widget'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
