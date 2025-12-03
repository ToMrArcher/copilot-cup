import type { DataField } from '../../types/integration'

interface FieldPreviewProps {
  fields: Partial<DataField>[]
  sampleData: Record<string, unknown>[]
  isLoading?: boolean
}

export function FieldPreview({ fields, sampleData, isLoading = false }: FieldPreviewProps) {
  if (isLoading) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading preview...</span>
        </div>
      </div>
    )
  }

  if (fields.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50 text-center text-gray-500">
        <p>No fields mapped yet.</p>
        <p className="text-sm mt-1">Map some fields to see a data preview.</p>
      </div>
    )
  }

  if (sampleData.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-gray-50 text-center text-gray-500">
        <p>No sample data available.</p>
        <p className="text-sm mt-1">Connect to the data source to preview data.</p>
      </div>
    )
  }

  const applyTransform = (value: unknown, transform?: string): unknown => {
    if (!transform) return value
    try {
      // Simple transform evaluation (in production, use a proper expression parser)
      // This is a basic implementation for demo purposes
      const fn = new Function('value', `return ${transform}`)
      return fn(value)
    } catch {
      return value
    }
  }

  const formatValue = (value: unknown, fieldType?: DataField['fieldType']): string => {
    if (value === null || value === undefined) return '—'
    
    switch (fieldType) {
      case 'BOOLEAN':
        return value ? '✓ Yes' : '✗ No'
      case 'DATE':
        try {
          return new Date(value as string).toLocaleDateString()
        } catch {
          return String(value)
        }
      case 'NUMBER':
        return typeof value === 'number' ? value.toLocaleString() : String(value)
      case 'JSON':
        return typeof value === 'object' ? JSON.stringify(value) : String(value)
      default:
        return String(value)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b">
        <h4 className="font-medium text-gray-700 text-sm">
          Data Preview ({sampleData.length} rows)
        </h4>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {fields.map((field, index) => (
                <th
                  key={field.sourceField || index}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div>{field.targetField || field.sourceField}</div>
                  <div className="text-[10px] text-gray-400 font-normal">
                    {field.sourceField} → {field.fieldType}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sampleData.slice(0, 5).map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {fields.map((field, colIndex) => {
                  const rawValue = row[field.sourceField || '']
                  const transformedValue = applyTransform(rawValue, field.transform)
                  const displayValue = formatValue(transformedValue, field.fieldType)
                  
                  return (
                    <td
                      key={colIndex}
                      className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap"
                    >
                      {displayValue}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sampleData.length > 5 && (
        <div className="bg-gray-50 px-4 py-2 border-t text-center text-xs text-gray-500">
          Showing 5 of {sampleData.length} rows
        </div>
      )}
    </div>
  )
}
