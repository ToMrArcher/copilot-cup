import { useState, useRef } from 'react'
import type { DataField, FieldSchema } from '../../types/integration'

interface FieldMapperProps {
  sourceFields: FieldSchema[]
  mappedFields: Partial<DataField>[]
  onMappingChange: (fields: Partial<DataField>[]) => void
}

interface DragItem {
  type: 'source' | 'mapped'
  field: FieldSchema | Partial<DataField>
  index?: number
}

export function FieldMapper({ sourceFields, mappedFields, onMappingChange }: FieldMapperProps) {
  const [dragItem, setDragItem] = useState<DragItem | null>(null)
  const [dropTarget, setDropTarget] = useState<'mapped' | null>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (item: DragItem) => (e: React.DragEvent) => {
    setDragItem(item)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify(item))
    if (dragRef.current) {
      dragRef.current.style.opacity = '0.5'
    }
  }

  const handleDragEnd = () => {
    setDragItem(null)
    setDropTarget(null)
    if (dragRef.current) {
      dragRef.current.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!dragItem) return

    if (dragItem.type === 'source') {
      const field = dragItem.field as FieldSchema
      // Add to mapped fields if not already mapped
      const alreadyMapped = mappedFields.some(f => f.sourceField === field.name)
      if (!alreadyMapped) {
        onMappingChange([
          ...mappedFields,
          {
            sourceField: field.name,
            targetField: field.name,
            fieldType: mapSchemaType(field.type),
          },
        ])
      }
    }

    setDragItem(null)
    setDropTarget(null)
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

  const removeMapping = (sourceField: string) => {
    onMappingChange(mappedFields.filter(f => f.sourceField !== sourceField))
  }

  const updateMapping = (sourceField: string, updates: Partial<DataField>) => {
    onMappingChange(
      mappedFields.map(f =>
        f.sourceField === sourceField ? { ...f, ...updates } : f
      )
    )
  }

  const unmappedFields = sourceFields.filter(
    sf => !mappedFields.some(mf => mf.sourceField === sf.name)
  )

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Source Fields Panel */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Available Fields ({unmappedFields.length})
        </h3>
        <div className="border rounded-lg bg-gray-50 min-h-[300px] p-3">
          {unmappedFields.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              All fields have been mapped
            </div>
          ) : (
            <div className="space-y-2">
              {unmappedFields.map(field => (
                <div
                  key={field.name}
                  ref={dragRef}
                  draggable
                  onDragStart={handleDragStart({ type: 'source', field })}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-2 p-3 bg-white rounded-md border border-gray-200 cursor-grab hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <span className="text-gray-400">⠿</span>
                  <span className="font-mono text-sm flex-1">{field.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500">
                    {field.type}
                  </span>
                  {field.required && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mapped Fields Panel */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Mapped Fields ({mappedFields.length})
        </h3>
        <div
          onDragOver={handleDragOver}
          onDragEnter={() => setDropTarget('mapped')}
          onDragLeave={() => setDropTarget(null)}
          onDrop={handleDrop}
          className={`border-2 rounded-lg min-h-[300px] p-3 transition-colors ${
            dropTarget === 'mapped'
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-dashed border-gray-300 bg-white'
          }`}
        >
          {mappedFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-gray-400">
              <span className="text-3xl mb-2">📥</span>
              <p className="text-sm">Drag fields here to map them</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mappedFields.map((field, index) => (
                <div
                  key={field.sourceField || index}
                  className="p-3 bg-green-50 rounded-md border border-green-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-green-800">
                      {field.sourceField}
                    </span>
                    <button
                      onClick={() => removeMapping(field.sourceField!)}
                      className="text-red-400 hover:text-red-600 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Target Name</label>
                      <input
                        type="text"
                        value={field.targetField || ''}
                        onChange={e =>
                          updateMapping(field.sourceField!, {
                            targetField: e.target.value,
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Type</label>
                      <select
                        value={field.fieldType || 'STRING'}
                        onChange={e =>
                          updateMapping(field.sourceField!, {
                            fieldType: e.target.value as DataField['fieldType'],
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="STRING">String</option>
                        <option value="NUMBER">Number</option>
                        <option value="BOOLEAN">Boolean</option>
                        <option value="DATE">Date</option>
                        <option value="JSON">JSON</option>
                      </select>
                    </div>
                  </div>
                  {/* Optional: Transform expression */}
                  <div className="mt-2">
                    <label className="text-xs text-gray-500">Transform (optional)</label>
                    <input
                      type="text"
                      value={field.transform || ''}
                      onChange={e =>
                        updateMapping(field.sourceField!, {
                          transform: e.target.value || undefined,
                        })
                      }
                      placeholder="e.g., value * 100, value.toUpperCase()"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
