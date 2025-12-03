/**
 * PublicShareView Component
 * Determines the resource type and renders the appropriate view
 */

import { useParams } from 'react-router-dom'
import { useSharedResource } from '../../hooks/useSharing'
import { PublicDashboardView } from './PublicDashboardView'
import { PublicKpiView } from './PublicKpiView'

export function PublicShareView() {
  const { token } = useParams<{ token: string }>()
  const { data: sharedResource, isLoading, error } = useSharedResource(token || '')

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-500">This share link is not valid.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
      </div>
    )
  }

  if (error || !sharedResource) {
    const errorMessage = error?.message || 'Unable to load shared content'
    const isExpired = errorMessage.includes('expired')
    const isInactive = errorMessage.includes('inactive')

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
            {isExpired ? (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isExpired ? 'Link Expired' : isInactive ? 'Link Inactive' : 'Link Not Found'}
          </h1>
          <p className="text-gray-500">
            {isExpired 
              ? 'This share link has expired. Please request a new link from the owner.'
              : isInactive
              ? 'This share link has been deactivated.'
              : 'This share link is invalid or has been removed.'}
          </p>
        </div>
      </div>
    )
  }

  // Route to the appropriate view based on resource type
  if (sharedResource.type === 'dashboard') {
    return <PublicDashboardView />
  } else if (sharedResource.type === 'kpi') {
    return <PublicKpiView />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unknown Content</h1>
        <p className="text-gray-500">Unable to display this shared content.</p>
      </div>
    </div>
  )
}
