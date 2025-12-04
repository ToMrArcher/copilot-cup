import { useState, useRef } from 'react'
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

interface CSVImportModalProps {
  integration: Integration
  isOpen: boolean
  onClose: () => void
}

interface ParsedRow {
  timestamp: string
  values: Record<string, unknown>
}

interface ParseResult {
  rows: ParsedRow[]
  errors: string[]
}

export function CSVImportModal({
  integration,
  isOpen,
  onClose,
}: CSVImportModalProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [csvContent, setCsvContent] = useState('')
  const [parsedData, setParsedData] = useState<ParseResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null)

  // Get field names for display
  const fieldNames = integration.dataFields?.map(f => getFieldName(f)) || []

  // Parse CSV content
  const parseCSV = (content: string): ParseResult => {
    const lines = content.trim().split('\n')
    const errors: string[] = []
    const rows: ParsedRow[] = []

    if (lines.length < 2) {
      return { rows: [], errors: ['CSV must have a header row and at least one data row'] }
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    // Check for required timestamp column
    const timestampIndex = headers.findIndex(h => 
      h === 'timestamp' || h === 'date' || h === 'datetime' || h === 'time'
    )
    
    if (timestampIndex === -1) {
      return { rows: [], errors: ['CSV must have a "timestamp" or "date" column'] }
    }

    // Map field names to their indices
    const fieldIndices: Record<string, number> = {}
    for (const field of integration.dataFields || []) {
      const fieldName = getFieldName(field).toLowerCase()
      const idx = headers.findIndex(h => h === fieldName)
      if (idx !== -1) {
        fieldIndices[field.id] = idx
      }
    }

    if (Object.keys(fieldIndices).length === 0) {
      return { 
        rows: [], 
        errors: [`No matching fields found. Expected columns: ${fieldNames.join(', ')}`] 
      }
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(',').map(v => v.trim())
      
      // Parse timestamp
      const timestampStr = values[timestampIndex]
      const timestamp = new Date(timestampStr)
      
      if (isNaN(timestamp.getTime())) {
        errors.push(`Row ${i + 1}: Invalid date "${timestampStr}"`)
        continue
      }

      // Extract field values
      const rowValues: Record<string, unknown> = {}
      for (const [fieldId, colIndex] of Object.entries(fieldIndices)) {
        const value = values[colIndex]
        if (value !== undefined && value !== '') {
          // Try to parse as number
          const num = parseFloat(value)
          rowValues[fieldId] = isNaN(num) ? value : num
        }
      }

      if (Object.keys(rowValues).length > 0) {
        rows.push({
          timestamp: timestamp.toISOString(),
          values: rowValues,
        })
      }
    }

    return { rows, errors }
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCsvContent(content)
      const result = parseCSV(content)
      setParsedData(result)
      setError(null)
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsText(file)
  }

  // Handle text area input
  const handleTextChange = (content: string) => {
    setCsvContent(content)
    if (content.trim()) {
      const result = parseCSV(content)
      setParsedData(result)
    } else {
      setParsedData(null)
    }
    setError(null)
  }

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (rows: ParsedRow[]) => {
      setImportProgress({ current: 0, total: rows.length })
      
      // Import rows in batches
      const batchSize = 50
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)
        await integrationsApi.importBulkData(integration.id, batch)
        setImportProgress({ current: Math.min(i + batchSize, rows.length), total: rows.length })
      }
      
      return { imported: rows.length }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      queryClient.invalidateQueries({ queryKey: ['integration-data', integration.id] })
      queryClient.invalidateQueries({ queryKey: ['kpis'] })
      setImportProgress(null)
      alert(`Successfully imported ${result.imported} data points!`)
      onClose()
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to import data')
      setImportProgress(null)
    },
  })

  const handleImport = () => {
    if (!parsedData || parsedData.rows.length === 0) {
      setError('No valid data to import')
      return
    }
    importMutation.mutate(parsedData.rows)
  }

  const handleClose = () => {
    setCsvContent('')
    setParsedData(null)
    setError(null)
    setImportProgress(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

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
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Import CSV Data
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {integration.name}
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

          {/* Instructions */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>CSV Format:</strong> First row should be headers. Must include a "timestamp" or "date" column.
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Expected columns: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">timestamp</code>
              {fieldNames.map(name => (
                <span key={name}>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{name}</code></span>
              ))}
            </p>
          </div>

          {/* File Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload CSV File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-violet-50 file:text-violet-700
                dark:file:bg-violet-900/30 dark:file:text-violet-300
                hover:file:bg-violet-100 dark:hover:file:bg-violet-900/50"
            />
          </div>

          {/* Or paste CSV */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Or Paste CSV Content
            </label>
            <textarea
              value={csvContent}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={6}
              placeholder={`timestamp,${fieldNames.join(',')}\n2024-01-15,100\n2024-01-16,150`}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-violet-500 focus:border-violet-500 font-mono text-sm"
            />
          </div>

          {/* Parse Results */}
          {parsedData && (
            <div className="mb-4">
              {parsedData.errors.length > 0 && (
                <div className="mb-2 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-md">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Warnings:</p>
                  <ul className="text-sm text-yellow-600 dark:text-yellow-400 list-disc list-inside">
                    {parsedData.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {parsedData.errors.length > 5 && (
                      <li>...and {parsedData.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
              
              {parsedData.rows.length > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-md">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ Ready to import <strong>{parsedData.rows.length}</strong> data points
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Date range: {new Date(parsedData.rows[0].timestamp).toLocaleDateString()} 
                    {parsedData.rows.length > 1 && ` to ${new Date(parsedData.rows[parsedData.rows.length - 1].timestamp).toLocaleDateString()}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Import Progress */}
          {importProgress && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Importing...</span>
                <span>{importProgress.current} / {importProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-violet-600 h-2 rounded-full transition-all"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!parsedData || parsedData.rows.length === 0 || importMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-50"
            >
              {importMutation.isPending ? 'Importing...' : `Import ${parsedData?.rows.length || 0} Rows`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
