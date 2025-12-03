import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { integrationsApi } from '../../lib/api'
import type { Integration } from '../../types/integration'

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

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (formValues: Record<string, unknown>) => {
      return integrationsApi.submitData(integration.id, formValues)
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

      switch (field.dataType?.toLowerCase()) {
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

    submitMutation.mutate(typedValues)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Enter Data
              </h2>
              <p className="text-sm text-gray-500 mt-1">
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
            <div className="text-center py-8 text-gray-500">
              <p>No data fields defined for this integration.</p>
              <p className="text-sm mt-2">
                Please edit the integration to add fields first.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {integration.dataFields.map(field => (
                  <div key={field.id}>
                    <label
                      htmlFor={field.id}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {field.name}
                      <span className="ml-2 text-xs text-gray-400">
                        ({field.dataType})
                      </span>
                    </label>
                    {field.dataType?.toLowerCase() === 'boolean' ? (
                      <select
                        id={field.id}
                        value={values[field.id] || ''}
                        onChange={e => setValues({ ...values, [field.id]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                      >
                        <option value="">Select...</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <input
                        type={field.dataType?.toLowerCase() === 'number' ? 'number' : 'text'}
                        id={field.id}
                        value={values[field.id] || ''}
                        onChange={e => setValues({ ...values, [field.id]: e.target.value })}
                        step={field.dataType?.toLowerCase() === 'number' ? 'any' : undefined}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                      />
                    )}
                    {currentData?.fields.find(f => f.id === field.id)?.lastUpdated && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last updated: {new Date(currentData.fields.find(f => f.id === field.id)!.lastUpdated!).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
