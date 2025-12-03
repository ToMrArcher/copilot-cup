import { useState } from 'react'
import type { ShareLink } from '../../types/sharing'
import { useUpdateShareLink, useDeleteShareLink } from '../../hooks/useSharing'

interface ShareLinkCardProps {
  link: ShareLink
}

export function ShareLinkCard({ link }: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false)
  const updateLink = useUpdateShareLink()
  const deleteLink = useDeleteShareLink()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleToggleActive = () => {
    updateLink.mutate({
      id: link.id,
      data: { active: !link.active },
    })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this share link?')) {
      deleteLink.mutate(link.id)
    }
  }

  // Calculate status
  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date()
  const status = !link.active ? 'inactive' : isExpired ? 'expired' : 'active'

  // Format relative time
  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const absDiff = Math.abs(diff)

    if (absDiff < 60000) return diff > 0 ? 'Less than a minute' : 'Just now'
    if (absDiff < 3600000) {
      const mins = Math.floor(absDiff / 60000)
      return diff > 0 ? `${mins} minute${mins > 1 ? 's' : ''}` : `${mins} minute${mins > 1 ? 's' : ''} ago`
    }
    if (absDiff < 86400000) {
      const hours = Math.floor(absDiff / 3600000)
      return diff > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : `${hours} hour${hours > 1 ? 's' : ''} ago`
    }
    const days = Math.floor(absDiff / 86400000)
    return diff > 0 ? `${days} day${days > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''} ago`
  }

  const statusStyles = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    inactive: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Resource type icon */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            link.resourceType === 'dashboard' ? 'bg-indigo-100' : 'bg-emerald-100'
          }`}>
            {link.resourceType === 'dashboard' ? (
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-900">
              {link.name || link.resourceName}
            </h3>
            <p className="text-sm text-gray-500">
              {link.resourceType === 'dashboard' ? 'Dashboard' : 'KPI'}
              {link.name && ` • ${link.resourceName}`}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Expires</p>
          <p className="font-medium text-gray-900">
            {link.expiresAt ? formatRelativeTime(link.expiresAt) : 'Never'}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Views</p>
          <p className="font-medium text-gray-900">{link.accessCount}</p>
        </div>
        <div>
          <p className="text-gray-500">Last viewed</p>
          <p className="font-medium text-gray-900">
            {link.lastAccessedAt ? formatRelativeTime(link.lastAccessedAt) : 'Never'}
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="mt-4 flex items-center gap-2 text-sm">
        {link.showTarget ? (
          <span className="inline-flex items-center gap-1 text-gray-600">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Target visible
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-gray-600">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            Target hidden
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Link
            </>
          )}
        </button>

        <button
          onClick={handleToggleActive}
          disabled={updateLink.isPending}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            link.active
              ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
              : 'text-green-600 bg-green-50 hover:bg-green-100'
          }`}
        >
          {link.active ? 'Deactivate' : 'Activate'}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleteLink.isPending}
          className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
