import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IntegrationCard } from './IntegrationCard'
import { ManualDataEntryModal } from './ManualDataEntryModal'
import type { Integration } from '../../types/integration'
import {
  useIntegrations,
  useDeleteIntegration,
} from '../../hooks/useIntegrations'

// Mock data for development fallback
const mockIntegrations: Integration[] = [
  {
    id: '1',
    name: 'Sales API',
    type: 'API',
    config: { url: 'https://api.example.com/sales' },
    status: 'synced',
    lastSync: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataFields: [
      { id: '1', integrationId: '1', name: 'revenue', path: 'revenue', dataType: 'number', createdAt: '' },
      { id: '2', integrationId: '1', name: 'orders', path: 'orders', dataType: 'number', createdAt: '' },
    ],
  },
  {
    id: '2',
    name: 'Manual KPIs',
    type: 'MANUAL',
    config: {},
    status: 'connected',
    lastSync: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataFields: [],
  },
]

export function IntegrationList() {
  const { data: apiIntegrations, isLoading, error } = useIntegrations()
  const deleteIntegration = useDeleteIntegration()
  const [actionId, setActionId] = useState<string | null>(null)
  const [dataEntryIntegration, setDataEntryIntegration] = useState<Integration | null>(null)

  // Use API data if available, otherwise fall back to mock data for development
  const integrations = apiIntegrations || mockIntegrations

  const handleEnterData = (id: string) => {
    const integration = integrations.find(i => i.id === id)
    if (integration) {
      setDataEntryIntegration(integration)
    }
  }

  const handleSync = async (id: string) => {
    setActionId(id)
    try {
      // Create a temporary hook usage - in production, this would be handled differently
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/integrations/${id}/sync`, {
        method: 'POST',
      })
    } catch (e) {
      console.error('Sync failed', e)
    }
    setActionId(null)
  }

  const handleTest = async (id: string) => {
    setActionId(id)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/integrations/${id}/test`, {
        method: 'POST',
      })
      const data = await res.json()
      alert(data.success ? 'Connection successful!' : `Connection failed: ${data.error}`)
    } catch {
      alert('Connection test failed')
    }
    setActionId(null)
  }

  const handleEdit = (id: string) => {
    // TODO: Navigate to edit wizard
    console.log('Edit', id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return
    deleteIntegration.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (error) {
    console.warn('API error, using mock data:', error)
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Connect your data sources</p>
        </div>
        <Link
          to="/integrations/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700"
        >
          + Add Integration
        </Link>
      </div>

      {integrations.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <span className="text-4xl">🔌</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No integrations yet</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Get started by adding your first data source.</p>
          <Link
            to="/integrations/new"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-900/50"
          >
            + Add Integration
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map(integration => (
            <div key={integration.id} className="relative">
              {actionId === integration.id && (
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                </div>
              )}
              <IntegrationCard
                integration={integration}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSync={handleSync}
                onTest={handleTest}
                onEnterData={handleEnterData}
              />
            </div>
          ))}
        </div>
      )}

      {/* Manual Data Entry Modal */}
      {dataEntryIntegration && (
        <ManualDataEntryModal
          integration={dataEntryIntegration}
          isOpen={true}
          onClose={() => setDataEntryIntegration(null)}
        />
      )}
    </div>
  )
}
