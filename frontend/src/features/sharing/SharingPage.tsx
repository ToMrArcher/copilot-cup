import { useState } from 'react'
import { useShareLinks } from '../../hooks/useSharing'
import { ShareLinkCard } from './ShareLinkCard'

type FilterType = 'all' | 'dashboard' | 'kpi'
type FilterStatus = 'all' | 'active' | 'expired' | 'inactive'

export function SharingPage() {
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const { data: links = [], isLoading, error } = useShareLinks(
    filterType !== 'all' ? filterType : undefined
  )

  // Filter by status
  const filteredLinks = links.filter(link => {
    if (filterStatus === 'all') return true

    const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date()
    const status = !link.active ? 'inactive' : isExpired ? 'expired' : 'active'

    return status === filterStatus
  })

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load share links. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Share Links</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your shared dashboards and KPIs
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            id="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All types</option>
            <option value="dashboard">Dashboards</option>
            <option value="kpi">KPIs</option>
          </select>
        </div>

        <div>
          <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Links list */}
      {filteredLinks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No share links</h3>
          <p className="mt-2 text-sm text-gray-500">
            {links.length === 0
              ? 'Create your first share link from a dashboard or KPI page.'
              : 'No links match your current filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => (
            <ShareLinkCard key={link.id} link={link} />
          ))}
        </div>
      )}
    </div>
  )
}
