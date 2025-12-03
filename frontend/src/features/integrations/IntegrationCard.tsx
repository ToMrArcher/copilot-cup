import type { Integration, IntegrationStatus } from '../../types/integration'

interface IntegrationCardProps {
  integration: Integration
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onSync: (id: string) => void
  onTest: (id: string) => void
  onEnterData?: (id: string) => void
}

const statusStyles: Record<IntegrationStatus, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', dot: 'bg-yellow-400' },
  active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', dot: 'bg-green-400' },
  connected: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-800 dark:text-violet-300', dot: 'bg-blue-400' },
  synced: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', dot: 'bg-green-400' },
  error: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', dot: 'bg-red-400' },
}

const typeIcons: Record<string, string> = {
  API: '🔌',
  MANUAL: '✏️',
  WEBHOOK: '🔗',
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

export function IntegrationCard({
  integration,
  onEdit,
  onDelete,
  onSync,
  onTest,
  onEnterData,
}: IntegrationCardProps) {
  const status = statusStyles[integration.status]
  const isManual = integration.type === 'MANUAL'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{typeIcons[integration.type] || '📊'}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{integration.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{integration.type}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
          {integration.status}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Last sync</span>
          <span className="text-gray-700 dark:text-gray-300">{formatRelativeTime(integration.lastSync)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Fields mapped</span>
          <span className="text-gray-700 dark:text-gray-300">{integration.dataFields?.length || 0}</span>
        </div>
        {integration.config?.url && (
          <div className="text-sm overflow-hidden">
            <span className="text-gray-500 dark:text-gray-400">URL: </span>
            <span className="text-gray-700 dark:text-gray-300 break-all line-clamp-1">{integration.config.url}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
        {isManual && onEnterData ? (
          <button
            onClick={() => onEnterData(integration.id)}
            className="flex-1 px-3 py-1.5 text-sm text-white bg-violet-600 hover:bg-violet-700 rounded-md transition-colors font-medium"
          >
            Enter Data
          </button>
        ) : (
          <button
            onClick={() => onSync(integration.id)}
            className="flex-1 px-3 py-1.5 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-md transition-colors"
          >
            Sync Now
          </button>
        )}
        <button
          onClick={() => onTest(integration.id)}
          className="flex-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          Test
        </button>
        <button
          onClick={() => onEdit(integration.id)}
          className="flex-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(integration.id)}
          className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
        >
          🗑
        </button>
      </div>
    </div>
  )
}
