import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { integrationsApi } from '../../lib/api'
import type { Integration, DataField, LegacyDataField } from '../../types/integration'

// Type guard to check if a field is a LegacyDataField
function isLegacyDataField(field: DataField | LegacyDataField): field is LegacyDataField {
  return 'name' in field && 'dataType' in field
}

// Helper to get field display name
function getFieldName(field: DataField | LegacyDataField): string {
  return isLegacyDataField(field) ? field.name : field.sourceField
}

// Helper to get field data type
function getFieldType(field: DataField | LegacyDataField): string {
  return isLegacyDataField(field) ? field.dataType : field.fieldType
}

interface ManualDataEntryModalProps {
  integration: Integration
  isOpen: boolean
  onClose: () => void
}

export function ManualDataEntryModal({
  integration,
  isOpen,
  onClose,
}: ManualDataEntryModalProps) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [useCustomDate, setUseCustomDate] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')

  // Fetch current data values
  const { data: currentData, isLoading: isLoadingData } = useQuery({
    queryKey: ['integration-data', integration.id],
    queryFn: () => integrationsApi.getData(integration.id),
    enabled: isOpen,
  })

  // Initialize form values with current data
  useEffect(() => {
    if (currentData?.fields) {
      const initialValues: Record<string, string> = {}
      for (const field of currentData.fields) {
        initialValues[field.id] = field.latestValue !== null
          ? String(field.latestValue)
          : ''
      }
      setValues(initialValues)
    }
  }, [currentData])

  // Reset custom date fields when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setUseCustomDate(false)
      setCustomDate('')
      setCustomTime('')
      setError(null)
    }
  }, [isOpen])

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (formValues: Record<string, unknown>) => {
      // Build timestamp if custom date is set
      let timestamp: string | undefined
      if (useCustomDate && customDate) {
        const dateStr = customTime 
          ? `${customDate}T${customTime}:00`
          : `${customDate}T12:00:00`
        timestamp = new Date(dateStr).toISOString()
      }
      return integrationsApi.submitData(integration.id, formValues, timestamp)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      queryClient.invalidateQueries({ queryKey: ['integration-data', integration.id] })
      queryClient.invalidateQueries({ queryKey: ['kpis'] })
      onClose()
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to submit data')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Convert string values to appropriate types based on dataType
    const typedValues: Record<string, unknown> = {}
    for (const field of integration.dataFields || []) {
      const value = values[field.id]
      if (value === undefined || value === '') continue

      const fieldType = getFieldType(field)
      switch (fieldType?.toLowerCase()) {
        case 'number':
          typedValues[field.id] = parseFloat(value)
          break
        case 'boolean':
          typedValues[field.id] = value.toLowerCase() === 'true'
          break
        default:
          typedValues[field.id] = value
      }
    }

    if (Object.keys(typedValues).length === 0) {
      setError('Please enter at least one value')
      return
    }

    // Validate custom date if enabled
    if (useCustomDate && !customDate) {
      setError('Please select a date for historical data entry')
      return
    }

    submitMutation.mutate(typedValues)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Enter Data
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {integration.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          {isLoadingData ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
            </div>
          ) : !integration.dataFields || integration.dataFields.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No data fields defined for this integration.</p>
              <p className="text-sm mt-2">
                Please edit the integration to add fields first.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {integration.dataFields.map(field => {
                  const fieldName = getFieldName(field)
                  const fieldType = getFieldType(field)
                  return (
                  <div key={field.id}>
                    <label
                      htmlFor={field.id}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      {fieldName}
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                        ({fieldType})
                      </span>
                    </label>
                    {fieldType?.toLowerCase() === 'boolean' ? (
                      <select
                        id={field.id}
                        value={values[field.id] || ''}
                        onChange={e => setValues({ ...values, [field.id]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-violet-500 focus:border-violet-500"
                      >
                        <option value="">Select...</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <input
                        type={fieldType?.toLowerCase() === 'number' ? 'number' : 'text'}
                        id={field.id}
                        value={values[field.id] || ''}
                        onChange={e => setValues({ ...values, [field.id]: e.target.value })}
                        step={fieldType?.toLowerCase() === 'number' ? 'any' : undefined}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-violet-500 focus:border-violet-500"
                        placeholder={`Enter ${fieldName.toLowerCase()}`}
                      />
                    )}
                    {currentData?.fields.find(f => f.id === field.id)?.lastUpdated && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Last updated: {new Date(currentData.fields.find(f => f.id === field.id)!.lastUpdated!).toLocaleString()}
                      </p>
                    )}
                  </div>
                )})}
              </div>

              {/* Custom Date/Time Picker */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="useCustomDate"
                    checked={useCustomDate}
                    onChange={e => setUseCustomDate(e.target.checked)}
                    className="h-4 w-4 text-violet-600 rounded border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor="useCustomDate" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Use custom date/time (for historical data)
                  </label>
                </div>
                
                {useCustomDate && (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={e => setCustomDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-violet-500 focus:border-violet-500 text-sm"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Time (optional)
                      </label>
                      <input
                        type="time"
                        value={customTime}
                        onChange={e => setCustomTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-violet-500 focus:border-violet-500 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-50"
                >
                  {submitMutation.isPending ? 'Saving...' : 'Save Values'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
