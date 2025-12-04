import type { WizardState } from '../IntegrationWizard'

interface ConfigureConnectionStepProps {
  state: WizardState
  updateState: (updates: Partial<WizardState>) => void
}

export function ConfigureConnectionStep({ state, updateState }: ConfigureConnectionStepProps) {
  const updateConfig = (key: string, value: string) => {
    updateState({
      config: { ...state.config, [key]: value },
    })
  }

  if (state.type === 'API') {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Configure API Connection
        </h2>
        <p className="text-gray-600 mb-6">
          Enter the API endpoint details and authentication.
        </p>

        <div className="space-y-4">
          {/* URL */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              API URL
            </label>
            <input
              type="url"
              id="url"
              value={state.config.url || ''}
              onChange={e => updateConfig('url', e.target.value)}
              placeholder="https://api.example.com/data"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          {/* Method */}
          <div>
            <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
              HTTP Method
            </label>
            <select
              id="method"
              value={state.config.method || 'GET'}
              onChange={e => updateConfig('method', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          {/* Auth Type */}
          <div>
            <label htmlFor="authType" className="block text-sm font-medium text-gray-700 mb-1">
              Authentication Type
            </label>
            <select
              id="authType"
              value={state.config.authType || 'none'}
              onChange={e => updateConfig('authType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="none">None</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="apiKey">API Key</option>
            </select>
          </div>

          {/* Auth Value - shown based on auth type */}
          {state.config.authType && state.config.authType !== 'none' && (
            <div>
              <label htmlFor="authValue" className="block text-sm font-medium text-gray-700 mb-1">
                {state.config.authType === 'bearer' && 'Bearer Token'}
                {state.config.authType === 'basic' && 'Username:Password'}
                {state.config.authType === 'apiKey' && 'API Key'}
              </label>
              <input
                type="password"
                id="authValue"
                value={state.config.authValue || ''}
                onChange={e => updateConfig('authValue', e.target.value)}
                placeholder="Enter your credentials"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Your credentials will be encrypted before storage.
              </p>
            </div>
          )}

          {/* Headers */}
          <div>
            <label htmlFor="headers" className="block text-sm font-medium text-gray-700 mb-1">
              Custom Headers (JSON)
            </label>
            <textarea
              id="headers"
              value={state.config.headers || ''}
              onChange={e => updateConfig('headers', e.target.value)}
              placeholder='{"Content-Type": "application/json"}'
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 font-mono text-sm"
            />
          </div>

          {/* Sync Settings Section */}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Sync Settings</h3>
            
            {/* Sync Enabled */}
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="syncEnabled"
                checked={state.syncEnabled}
                onChange={e => updateState({ syncEnabled: e.target.checked })}
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
              />
              <label htmlFor="syncEnabled" className="text-sm font-medium text-gray-700">
                Enable automatic sync
              </label>
            </div>

            {/* Sync Interval */}
            <div>
              <label htmlFor="syncInterval" className="block text-sm font-medium text-gray-700 mb-1">
                Sync Interval
              </label>
              <select
                id="syncInterval"
                value={state.syncInterval ?? 3600}
                onChange={e => updateState({ syncInterval: parseInt(e.target.value) })}
                disabled={!state.syncEnabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value={300}>Every 5 minutes</option>
                <option value={900}>Every 15 minutes</option>
                <option value={1800}>Every 30 minutes</option>
                <option value={3600}>Every hour</option>
                <option value={21600}>Every 6 hours</option>
                <option value={86400}>Daily</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                How often the worker will automatically sync data from this integration.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state.type === 'MANUAL') {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Configure Manual Input
        </h2>
        <p className="text-gray-600 mb-6">
          Set up how you want to enter data manually.
        </p>

        <div className="space-y-4">
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={state.config.description || ''}
              onChange={e => updateConfig('description', e.target.value)}
              placeholder="Describe what data will be entered manually..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          {/* Update Frequency */}
          <div>
            <label htmlFor="updateFrequency" className="block text-sm font-medium text-gray-700 mb-1">
              Update Frequency
            </label>
            <select
              id="updateFrequency"
              value={state.config.updateFrequency || 'weekly'}
              onChange={e => updateConfig('updateFrequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  if (state.type === 'GRAPHQL') {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Configure GraphQL Connection
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Enter the GraphQL endpoint and your query.
        </p>

        <div className="space-y-4">
          {/* URL */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              GraphQL Endpoint URL
            </label>
            <input
              type="url"
              id="url"
              value={state.config.url || ''}
              onChange={e => updateConfig('url', e.target.value)}
              placeholder="https://api.example.com/graphql"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* GraphQL Query */}
          <div>
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              GraphQL Query
            </label>
            <textarea
              id="query"
              value={state.config.query || ''}
              onChange={e => updateConfig('query', e.target.value)}
              placeholder={`query GetData {
  items {
    id
    name
    value
  }
}`}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 font-mono text-sm dark:bg-gray-700 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter the GraphQL query to execute. The response data will be used for field mapping.
            </p>
          </div>

          {/* Variables (JSON) */}
          <div>
            <label htmlFor="variables" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Query Variables (JSON, optional)
            </label>
            <textarea
              id="variables"
              value={state.config.variables ? JSON.stringify(state.config.variables, null, 2) : ''}
              onChange={e => {
                try {
                  const parsed = e.target.value ? JSON.parse(e.target.value) : undefined
                  updateState({
                    config: { ...state.config, variables: parsed },
                  })
                } catch {
                  // Allow invalid JSON while typing
                  updateState({
                    config: { ...state.config, variables: e.target.value as unknown as Record<string, unknown> },
                  })
                }
              }}
              placeholder='{ "year": 2024 }'
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 font-mono text-sm dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Operation Name (optional) */}
          <div>
            <label htmlFor="operationName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Operation Name (optional)
            </label>
            <input
              type="text"
              id="operationName"
              value={state.config.operationName || ''}
              onChange={e => updateConfig('operationName', e.target.value)}
              placeholder="GetData"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Required if your document contains multiple operations.
            </p>
          </div>

          {/* Auth Type */}
          <div>
            <label htmlFor="authType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Authentication Type
            </label>
            <select
              id="authType"
              value={state.config.authType || 'none'}
              onChange={e => updateConfig('authType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="none">None</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="apiKey">API Key</option>
            </select>
          </div>

          {/* Auth Value - shown based on auth type */}
          {state.config.authType && state.config.authType !== 'none' && (
            <div>
              <label htmlFor="authValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {state.config.authType === 'bearer' && 'Bearer Token'}
                {state.config.authType === 'basic' && 'Username:Password'}
                {state.config.authType === 'apiKey' && 'API Key'}
              </label>
              <input
                type="password"
                id="authValue"
                value={state.config.authValue || ''}
                onChange={e => updateConfig('authValue', e.target.value)}
                placeholder="Enter your credentials"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Your credentials will be encrypted before storage.
              </p>
            </div>
          )}

          {/* Custom Headers */}
          <div>
            <label htmlFor="headers" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custom Headers (JSON, optional)
            </label>
            <textarea
              id="headers"
              value={state.config.headers || ''}
              onChange={e => updateConfig('headers', e.target.value)}
              placeholder='{"X-Custom-Header": "value"}'
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 font-mono text-sm dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Sync Settings Section */}
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">Sync Settings</h3>
            
            {/* Sync Enabled */}
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="syncEnabled"
                checked={state.syncEnabled}
                onChange={e => updateState({ syncEnabled: e.target.checked })}
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
              />
              <label htmlFor="syncEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable automatic sync
              </label>
            </div>

            {/* Sync Interval */}
            <div>
              <label htmlFor="syncInterval" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sync Interval
              </label>
              <select
                id="syncInterval"
                value={state.syncInterval ?? 3600}
                onChange={e => updateState({ syncInterval: parseInt(e.target.value) })}
                disabled={!state.syncEnabled}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-violet-500 focus:border-violet-500 disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:disabled:bg-gray-800"
              >
                <option value={300}>Every 5 minutes</option>
                <option value={900}>Every 15 minutes</option>
                <option value={1800}>Every 30 minutes</option>
                <option value={3600}>Every hour</option>
                <option value={21600}>Every 6 hours</option>
                <option value={86400}>Daily</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                How often the worker will automatically sync data from this integration.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center py-8 text-gray-500">
      Please select an integration type first.
    </div>
  )
}
