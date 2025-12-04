import type { DataField, FieldSchema } from '../../../types/integration'
import { getFieldType } from '../../../types/integration'
import { useState } from 'react'

/**
 * Format sample value for display based on data type
 * Returns { display: string, full: string, isTruncated: boolean }
 */
function formatSampleValue(sample: unknown, type: string): { display: string; full: string; isTruncated: boolean } {
  const MAX_LENGTH = 50

  if (sample === null || sample === undefined) {
    return { display: '—', full: 'No sample data', isTruncated: false }
  }

  let formatted: string

  switch (type.toLowerCase()) {
    case 'number':
    case 'integer':
      formatted = typeof sample === 'number' ? sample.toLocaleString() : String(sample)
      break
    case 'boolean':
      formatted = sample ? 'true' : 'false'
      break
    case 'date':
      try {
        formatted = new Date(sample as string).toLocaleDateString()
      } catch {
        formatted = String(sample)
      }
      break
    case 'object':
      try {
        const json = JSON.stringify(sample)
        const keys = Object.keys(sample as object)
        formatted = `{ ${keys.slice(0, 2).join(', ')}${keys.length > 2 ? ', ...' : ''} }`
        return {
          display: formatted.length > MAX_LENGTH ? formatted.slice(0, MAX_LENGTH) + '...' : formatted,
          full: json,
          isTruncated: true,
        }
      } catch {
        formatted = '[object]'
      }
      break
    case 'array':
      try {
        const arr = sample as unknown[]
        formatted = `[${arr.length} items]`
        return {
          display: formatted,
          full: JSON.stringify(sample),
          isTruncated: true,
        }
      } catch {
        formatted = '[array]'
      }
      break
    default:
      formatted = String(sample)
  }

  const isTruncated = formatted.length > MAX_LENGTH
  return {
    display: isTruncated ? formatted.slice(0, MAX_LENGTH) + '...' : formatted,
    full: formatted,
    isTruncated,
  }
}

interface MapFieldsStepProps {
  discoveredFields: FieldSchema[]
  selectedFields: Partial<DataField>[]
  onFieldsChange: (fields: Partial<DataField>[]) => void
  onDiscover?: () => Promise<void>
  isDiscovering?: boolean
}

export function MapFieldsStep({
  discoveredFields,
  selectedFields,
  onFieldsChange,
  onDiscover,
  isDiscovering = false,
}: MapFieldsStepProps) {
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customField, setCustomField] = useState({
    sourceField: '',
    targetField: '',
    fieldType: 'STRING' as DataField['fieldType'],
  })

  const toggleField = (field: FieldSchema) => {
    // Use path for data extraction (e.g., "rates.USD"), fall back to name
    const fieldPath = field.path || field.name
    const existing = selectedFields.find(f => f.sourceField === fieldPath)
    if (existing) {
      onFieldsChange(selectedFields.filter(f => f.sourceField !== fieldPath))
    } else {
      onFieldsChange([
        ...selectedFields,
        {
          sourceField: fieldPath,  // Use path for data extraction
          targetField: field.name, // Use name for display
          fieldType: mapSchemaType(getFieldType(field)),
        },
      ])
    }
  }

  const mapSchemaType = (type: string): DataField['fieldType'] => {
    switch (type.toLowerCase()) {
      case 'number':
      case 'integer':
        return 'NUMBER'
      case 'boolean':
        return 'BOOLEAN'
      case 'date':
        return 'DATE'
      default:
        return 'STRING'
    }
  }

  const updateFieldMapping = (sourceField: string, updates: Partial<DataField>) => {
    onFieldsChange(
      selectedFields.map(f =>
        f.sourceField === sourceField ? { ...f, ...updates } : f
      )
    )
  }

  const addCustomField = () => {
    if (customField.sourceField && customField.targetField) {
      onFieldsChange([...selectedFields, { ...customField }])
      setCustomField({ sourceField: '', targetField: '', fieldType: 'STRING' })
      setShowAddCustom(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Map Data Fields
      </h2>
      <p className="text-gray-600 mb-6">
        Select which fields to import and how to map them.
      </p>

      {/* Discover Button */}
      {onDiscover && (
        <div className="mb-6">
          <button
            onClick={onDiscover}
            disabled={isDiscovering}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
          >
            {isDiscovering ? 'Discovering...' : 'Discover Fields'}
          </button>
        </div>
      )}

      {/* Discovered Fields */}
      {discoveredFields.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Discovered Fields
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto border dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-800">
            {discoveredFields.map(field => {
              const fieldPath = field.path || field.name
              const isSelected = selectedFields.some(f => f.sourceField === fieldPath)
              const fieldType = getFieldType(field)
              const sampleInfo = formatSampleValue(field.sample, fieldType)
              return (
                <label
                  key={fieldPath}
                  className={`block p-3 rounded cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-violet-100 dark:bg-violet-900/30' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleField(field)}
                      className="h-4 w-4 mt-0.5 text-violet-600 rounded border-gray-300 dark:border-gray-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{field.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                          {fieldType}
                        </span>
                      </div>
                      <div 
                        className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-mono truncate"
                        title={sampleInfo.isTruncated ? sampleInfo.full : undefined}
                      >
                        <span className="text-gray-400 dark:text-gray-500">Example: </span>
                        <span className={sampleInfo.display === '—' ? 'italic' : ''}>                          {sampleInfo.display}
                        </span>
                      </div>
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected Field Mappings */}
      {selectedFields.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Field Mappings ({selectedFields.length})
          </h3>
          <div className="space-y-3">
            {selectedFields.map((field, index) => (
              <div
                key={field.sourceField || index}
                className="flex items-center gap-3 p-3 border rounded-md bg-white"
              >
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Source</label>
                  <div className="font-mono text-sm">{field.sourceField}</div>
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Target Name</label>
                  <input
                    type="text"
                    value={field.targetField || ''}
                    onChange={e =>
                      updateFieldMapping(field.sourceField!, {
                        targetField: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs text-gray-500">Type</label>
                  <select
                    value={field.fieldType || 'STRING'}
                    onChange={e =>
                      updateFieldMapping(field.sourceField!, {
                        fieldType: e.target.value as DataField['fieldType'],
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="STRING">String</option>
                    <option value="NUMBER">Number</option>
                    <option value="BOOLEAN">Boolean</option>
                    <option value="DATE">Date</option>
                    <option value="JSON">JSON</option>
                  </select>
                </div>
                <button
                  onClick={() =>
                    onFieldsChange(selectedFields.filter(f => f.sourceField !== field.sourceField))
                  }
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Field */}
      {showAddCustom ? (
        <div className="border rounded-md p-4 bg-gray-50">
          <h4 className="font-medium mb-3">Add Custom Field</h4>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Source field"
              value={customField.sourceField}
              onChange={e => setCustomField({ ...customField, sourceField: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              placeholder="Target name"
              value={customField.targetField}
              onChange={e => setCustomField({ ...customField, targetField: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <select
              value={customField.fieldType}
              onChange={e =>
                setCustomField({
                  ...customField,
                  fieldType: e.target.value as DataField['fieldType'],
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="STRING">String</option>
              <option value="NUMBER">Number</option>
              <option value="BOOLEAN">Boolean</option>
              <option value="DATE">Date</option>
              <option value="JSON">JSON</option>
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={addCustomField}
              className="px-3 py-1 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddCustom(false)}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddCustom(true)}
          className="text-violet-600 hover:text-violet-800 text-sm"
        >
          + Add custom field
        </button>
      )}

      {/* Empty State */}
      {discoveredFields.length === 0 && selectedFields.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-md">
          <p>No fields discovered yet.</p>
          <p className="text-sm mt-1">
            {onDiscover
              ? 'Click "Discover Fields" to fetch available fields from the API.'
              : 'Add custom fields manually for this integration.'}
          </p>
        </div>
      )}
    </div>
  )
}
