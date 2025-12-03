/**
 * Base Widget Component
 * Wrapper component with header, menu, and loading/error states
 */

import { useState } from 'react'

export interface WidgetProps {
  title: string
  children: React.ReactNode
  onEdit?: () => void
  onDelete?: () => void
  isLoading?: boolean
  error?: string | null
  className?: string
}

export function Widget({
  title,
  children,
  onEdit,
  onDelete,
  isLoading = false,
  error = null,
  className = '',
}: WidgetProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 truncate">{title}</h3>
        
        {(onEdit || onDelete) && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {menuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                  {onEdit && (
                    <button
                      onClick={() => { onEdit(); setMenuOpen(false) }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => { onDelete(); setMenuOpen(false) }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 text-sm">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
