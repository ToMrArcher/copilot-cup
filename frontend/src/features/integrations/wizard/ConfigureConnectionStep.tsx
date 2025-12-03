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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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

  return (
    <div className="text-center py-8 text-gray-500">
      Please select an integration type first.
    </div>
  )
}
