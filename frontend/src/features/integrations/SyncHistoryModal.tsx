import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { integrationsApi } from '../../lib/api'
import type { Integration } from '../../types/integration'

// Sync log status type
type SyncStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'

interface SyncLog {
  id: string
  integrationId: string
  status: SyncStatus
  startedAt: string
  completedAt: string | null
  duration: number | null
  recordsCount: number | null
  errorMessage: string | null
  createdAt: string
}

interface SyncHistoryResponse {
  logs: SyncLog[]
  total: number
  page: number
  pageSize: number
}

interface SyncHistoryModalProps {
  integration: Integration
  isOpen: boolean
  onClose: () => void
}

const statusStyles: Record<SyncStatus, { bg: string; text: string; icon: string }> = {
  PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', icon: '⏳' },
  RUNNING: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', icon: '🔄' },
  SUCCESS: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: '✓' },
  FAILED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: '✕' },
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDateTime(dateString)
}

export function SyncHistoryModal({
  integration,
  isOpen,
  onClose,
}: SyncHistoryModalProps) {
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading, error } = useQuery<SyncHistoryResponse>({
    queryKey: ['sync-history', integration.id, page],
    queryFn: () => integrationsApi.getSyncHistory(integration.id, page, pageSize),
    enabled: isOpen,
  })

  if (!isOpen) return null

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Sync History
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {integration.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-300">
                Failed to load sync history: {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          )}

          {data && data.logs.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-4xl mb-2">📭</p>
              <p>No sync history yet</p>
              <p className="text-sm mt-1">Sync the integration to see history here.</p>
            </div>
          )}

          {data && data.logs.length > 0 && (
            <div className="space-y-3">
              {data.logs.map((log) => {
                const style = statusStyles[log.status]
                return (
                  <div
                    key={log.id}
                    className={`rounded-lg border ${
                      log.status === 'FAILED'
                        ? 'border-red-200 dark:border-red-800'
                        : 'border-gray-200 dark:border-gray-700'
                    } p-4`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
                        >
                          <span>{style.icon}</span>
                          {log.status}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(log.startedAt)}
                        </span>
                      </div>
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                        {log.duration !== null && (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDuration(log.duration)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        Started: {formatDateTime(log.startedAt)}
                      </span>
                      {log.completedAt && (
                        <span className="text-gray-600 dark:text-gray-300">
                          Completed: {formatDateTime(log.completedAt)}
                        </span>
                      )}
                      {log.recordsCount !== null && (
                        <span className="text-gray-600 dark:text-gray-300">
                          Records: {log.recordsCount}
                        </span>
                      )}
                    </div>

                    {log.errorMessage && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-300 font-mono break-words">
                          {log.errorMessage}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with pagination */}
        {data && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, data.total)} of {data.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Close button footer for single page */}
        {(!data || totalPages <= 1) && (
          <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
