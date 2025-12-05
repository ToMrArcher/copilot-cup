/**
 * ImageWidget Component
 * Displays an image on the dashboard with configurable sizing
 */

import { useState } from 'react'

interface ImageWidgetProps {
  imageUrl: string
  altText?: string
  objectFit?: 'contain' | 'cover' | 'fill'
  caption?: string
  onDelete?: () => void
}

export function ImageWidget({
  imageUrl,
  altText = 'Dashboard image',
  objectFit = 'contain',
  caption,
  onDelete
}: ImageWidgetProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const objectFitClass = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
  }[objectFit]

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 dark:hover:bg-red-900 z-10"
          title="Delete widget"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {/* Image container */}
      <div className="flex-1 relative flex items-center justify-center p-2 min-h-0">
        {/* Loading state */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Failed to load image</span>
          </div>
        )}

        {/* Image */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={altText}
            className={`max-w-full max-h-full w-full h-full ${objectFitClass} ${isLoading || hasError ? 'invisible' : 'visible'}`}
            onLoad={() => {
              setIsLoading(false)
              setHasError(false)
            }}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
          />
        )}

        {/* No URL placeholder */}
        {!imageUrl && (
          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">No image URL</span>
          </div>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <div className="px-3 py-2 text-sm text-center text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {caption}
        </div>
      )}
    </div>
  )
}
