import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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

interface BulkEntryModalProps {
  integration: Integration
  isOpen: boolean
  onClose: () => void
}

interface DataRow {
  id: string
  date: string
  time: string
  values: Record<string, string>
}

// Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function BulkEntryModal({
  integration,
  isOpen,
  onClose,
}: BulkEntryModalProps) {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<DataRow[]>([
    { id: generateId(), date: getTodayDate(), time: '', values: {} }
  ])
  const [error, setError] = useState<string | null>(null)

  const fields = integration.dataFields || []

  // Add a new row
  const addRow = () => {
    // Copy date from last row for convenience
    const lastRow = rows[rows.length - 1]
    setRows([
      ...rows,
      { 
        id: generateId(), 
        date: lastRow?.date || getTodayDate(), 
        time: '',
        values: {} 
      }
    ])
  }

  // Remove a row
  const removeRow = (id: string) => {
    if (rows.length === 1) return // Keep at least one row
    setRows(rows.filter(r => r.id !== id))
  }

  // Update a row's date
  const updateDate = (id: string, date: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, date } : r))
  }

  // Update a row's time
  const updateTime = (id: string, time: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, time } : r))
  }

  // Update a row's field value
  const updateValue = (id: string, fieldId: string, value: string) => {
    setRows(rows.map(r => 
      r.id === id 
        ? { ...r, values: { ...r.values, [fieldId]: value } }
        : r
    ))
  }

  // Duplicate a row
  const duplicateRow = (id: string) => {
    const row = rows.find(r => r.id === id)
    if (!row) return
    const idx = rows.findIndex(r => r.id === id)
    const newRow = { ...row, id: generateId() }
    const newRows = [...rows]
    newRows.splice(idx + 1, 0, newRow)
    setRows(newRows)
  }

  // Import mutation (reuses the bulk import endpoint)
  const importMutation = useMutation({
    mutationFn: async () => {
      // Convert rows to the bulk import format
      const importRows = rows
        .filter(row => row.date && Object.values(row.values).some(v => v !== ''))
        .map(row => {
          const dateStr = row.time 
            ? `${row.date}T${row.time}:00`
            : `${row.date}T12:00:00`
          
          const values: Record<string, unknown> = {}
          for (const field of fields) {
            const value = row.values[field.id]
            if (value !== undefined && value !== '') {
              const fieldType = getFieldType(field)
              if (fieldType?.toLowerCase() === 'number') {
                values[field.id] = parseFloat(value)
              } else if (fieldType?.toLowerCase() === 'boolean') {
                values[field.id] = value.toLowerCase() === 'true'
              } else {
                values[field.id] = value
              }
            }
          }
          
          return {
            timestamp: new Date(dateStr).toISOString(),
            values,
          }
        })

      if (importRows.length === 0) {
        throw new Error('No valid data to import')
      }

      return integrationsApi.importBulkData(integration.id, importRows)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      queryClient.invalidateQueries({ queryKey: ['integration-data', integration.id] })
      queryClient.invalidateQueries({ queryKey: ['kpis'] })
      alert(`Successfully imported ${result.imported} data points!`)
      handleClose()
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to import data')
    },
  })

  const handleSubmit = () => {
    setError(null)
    
    // Validate rows
    const validRows = rows.filter(row => 
      row.date && Object.values(row.values).some(v => v !== '')
    )
    
    if (validRows.length === 0) {
      setError('Please enter at least one row with a date and value')
      return
    }

    // Validate dates
    for (const row of validRows) {
      const dateStr = row.time 
        ? `${row.date}T${row.time}:00`
        : `${row.date}T12:00:00`
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        setError(`Invalid date: ${row.date}`)
        return
      }
    }

    importMutation.mutate()
  }

  const handleClose = () => {
    setRows([{ id: generateId(), date: getTodayDate(), time: '', values: {} }])
    setError(null)
    onClose()
  }

  // Count valid rows
  const validRowCount = rows.filter(row => 
    row.date && Object.values(row.values).some(v => v !== '')
  ).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Bulk Data Entry
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {integration.name} • Enter multiple data points at once
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Table container with scroll */}
          <div className="flex-1 overflow-auto mb-4">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 w-24">
                    Time
                  </th>
                  {fields.map(field => (
                    <th 
                      key={field.id}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600"
                    >
                      {getFieldName(field)}
                      <span className="ml-1 text-gray-400 dark:text-gray-500 normal-case">
                        ({getFieldType(field)})
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateDate(row.id, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-sm focus:ring-violet-500 focus:border-violet-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="time"
                        value={row.time}
                        onChange={(e) => updateTime(row.id, e.target.value)}
                        placeholder="12:00"
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-sm focus:ring-violet-500 focus:border-violet-500"
                      />
                    </td>
                    {fields.map(field => {
                      const fieldType = getFieldType(field)
                      return (
                        <td key={field.id} className="px-3 py-2">
                          {fieldType?.toLowerCase() === 'boolean' ? (
                            <select
                              value={row.values[field.id] || ''}
                              onChange={(e) => updateValue(row.id, field.id, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-sm focus:ring-violet-500 focus:border-violet-500"
                            >
                              <option value="">-</option>
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          ) : (
                            <input
                              type={fieldType?.toLowerCase() === 'number' ? 'number' : 'text'}
                              value={row.values[field.id] || ''}
                              onChange={(e) => updateValue(row.id, field.id, e.target.value)}
                              step={fieldType?.toLowerCase() === 'number' ? 'any' : undefined}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-sm focus:ring-violet-500 focus:border-violet-500"
                              placeholder={fieldType?.toLowerCase() === 'number' ? '0' : ''}
                            />
                          )}
                        </td>
                      )
                    })}
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => duplicateRow(row.id)}
                        className="text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 p-1"
                        title="Duplicate row"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Remove row"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Row Button */}
          <div className="mb-4">
            <button
              onClick={addRow}
              className="inline-flex items-center px-3 py-1.5 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-md transition-colors"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Row
            </button>
            <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
              {validRowCount} valid {validRowCount === 1 ? 'row' : 'rows'} ready to import
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={validRowCount === 0 || importMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-50"
            >
              {importMutation.isPending ? 'Importing...' : `Import ${validRowCount} Rows`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
