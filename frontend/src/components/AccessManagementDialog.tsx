/**
 * AccessManagementDialog Component
 * Dialog for managing access to dashboards and KPIs
 * Allows owner to view, grant, update, and revoke access
 */

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dashboardsApi, kpisApi, authApi } from '../lib/api'
import type { AccessPermission, AccessEntry, UserSummary } from '../types/dashboard'
import type { User } from '../types/auth'

interface AccessManagementDialogProps {
  isOpen: boolean
  onClose: () => void
  resourceType: 'dashboard' | 'kpi'
  resourceId: string
  resourceName: string
  owner: UserSummary
}

export function AccessManagementDialog({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceName,
  owner,
}: AccessManagementDialogProps) {
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedPermission, setSelectedPermission] = useState<AccessPermission>('VIEW')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  // Fetch access list
  const { data: accessData, isLoading: accessLoading } = useQuery({
    queryKey: [resourceType, resourceId, 'access'],
    queryFn: () =>
      resourceType === 'dashboard'
        ? dashboardsApi.getAccess(resourceId)
        : kpisApi.getAccess(resourceId),
    enabled: isOpen,
  })

  // Fetch all users for the dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.listUsers(),
    enabled: isOpen,
  })

  // Grant access mutation
  const grantAccess = useMutation({
    mutationFn: (data: { userId: string; permission: AccessPermission }) =>
      resourceType === 'dashboard'
        ? dashboardsApi.grantAccess(resourceId, data)
        : kpisApi.grantAccess(resourceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resourceType, resourceId, 'access'] })
      setSelectedUserId('')
      setSearchQuery('')
    },
  })

  // Update permission mutation
  const updateAccess = useMutation({
    mutationFn: (data: { userId: string; permission: AccessPermission }) =>
      resourceType === 'dashboard'
        ? dashboardsApi.updateAccess(resourceId, data.userId, data.permission)
        : kpisApi.updateAccess(resourceId, data.userId, data.permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resourceType, resourceId, 'access'] })
    },
  })

  // Revoke access mutation
  const revokeAccess = useMutation({
    mutationFn: (userId: string) =>
      resourceType === 'dashboard'
        ? dashboardsApi.revokeAccess(resourceId, userId)
        : kpisApi.revokeAccess(resourceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resourceType, resourceId, 'access'] })
    },
  })

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedUserId('')
      setSelectedPermission('VIEW')
      setSearchQuery('')
      setShowUserDropdown(false)
    }
  }, [isOpen])

  // Filter users: exclude owner and already-granted users
  const availableUsers =
    usersData?.users.filter((user: User) => {
      // Exclude owner
      if (user.id === owner.id) return false
      // Exclude users who already have access
      if (accessData?.accessList.some((a: AccessEntry) => a.userId === user.id)) return false
      // Filter by search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          user.email.toLowerCase().includes(q) ||
          (user.name?.toLowerCase().includes(q) ?? false)
        )
      }
      return true
    }) ?? []

  const handleGrantAccess = () => {
    if (!selectedUserId) return
    grantAccess.mutate({ userId: selectedUserId, permission: selectedPermission })
  }

  const handleSelectUser = (user: User) => {
    setSelectedUserId(user.id)
    setSearchQuery(user.email)
    setShowUserDropdown(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Manage Access
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Resource info */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {resourceType}
            </p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{resourceName}</p>
          </div>

          {/* Owner Section */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Owner</h4>
            <div className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
              <div className="w-8 h-8 bg-violet-200 dark:bg-violet-700 rounded-full flex items-center justify-center text-violet-700 dark:text-violet-200 font-medium">
                {owner.name?.[0]?.toUpperCase() || owner.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {owner.name || owner.email}
                </p>
                {owner.name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{owner.email}</p>
                )}
              </div>
              <span className="px-2 py-1 text-xs bg-violet-100 dark:bg-violet-800 text-violet-700 dark:text-violet-300 rounded">
                Owner
              </span>
            </div>
          </div>

          {/* Add User Section */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add User
            </h4>
            {/* User search input - full width */}
            <div className="relative mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedUserId('')
                  setShowUserDropdown(true)
                }}
                onFocus={() => setShowUserDropdown(true)}
                placeholder="Search by email or name..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500"
              />

              {/* User dropdown */}
              {showUserDropdown && availableUsers.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl max-h-60 overflow-y-auto">
                  {availableUsers.slice(0, 8).map((user: User) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-4 py-3 text-left hover:bg-violet-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/50 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-300 text-sm font-medium flex-shrink-0">
                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.name || user.email}
                        </p>
                        {user.name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Permission dropdown and Add button */}
            <div className="flex gap-2">
              <select
                value={selectedPermission}
                onChange={(e) => setSelectedPermission(e.target.value as AccessPermission)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="VIEW">Can View</option>
                <option value="EDIT">Can Edit</option>
              </select>

              <button
                onClick={handleGrantAccess}
                disabled={!selectedUserId || grantAccess.isPending}
                className="px-6 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {grantAccess.isPending ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  'Add'
                )}
              </button>
            </div>
          </div>

          {/* Access List Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              People with Access
            </h4>
            {accessLoading ? (
              <div className="flex justify-center py-4">
                <svg className="animate-spin h-6 w-6 text-violet-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : accessData?.accessList.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No one else has access yet
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {accessData?.accessList.map((access: AccessEntry) => (
                  <div
                    key={access.userId}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                      {access.userName?.[0]?.toUpperCase() || access.userEmail[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {access.userName || access.userEmail}
                      </p>
                      {access.userName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {access.userEmail}
                        </p>
                      )}
                    </div>

                    {/* Permission dropdown */}
                    <select
                      value={access.permission}
                      onChange={(e) =>
                        updateAccess.mutate({
                          userId: access.userId,
                          permission: e.target.value as AccessPermission,
                        })
                      }
                      disabled={updateAccess.isPending}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md"
                    >
                      <option value="VIEW">Can View</option>
                      <option value="EDIT">Can Edit</option>
                    </select>

                    {/* Remove button */}
                    <button
                      onClick={() => revokeAccess.mutate(access.userId)}
                      disabled={revokeAccess.isPending}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Remove access"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
