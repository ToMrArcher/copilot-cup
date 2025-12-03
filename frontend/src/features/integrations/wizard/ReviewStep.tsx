import type { WizardState } from '../IntegrationWizard'
import type { DataField } from '../../../types/integration'

interface ReviewStepProps {
  state: WizardState
  selectedFields: Partial<DataField>[]
}

export function ReviewStep({ state, selectedFields }: ReviewStepProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Review & Create
      </h2>
      <p className="text-gray-600 mb-6">
        Review your integration settings before creating.
      </p>

      <div className="space-y-6">
        {/* Basic Info */}
        <section className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Basic Information</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium text-gray-900">{state.name || '(No name)'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Type</dt>
              <dd className="font-medium text-gray-900">
                {state.type === 'API' && '🔌 REST API'}
                {state.type === 'MANUAL' && '✏️ Manual Input'}
                {!state.type && '(Not selected)'}
              </dd>
            </div>
          </dl>
        </section>

        {/* Connection Config */}
        <section className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Connection Settings</h3>
          {state.type === 'API' && (
            <dl className="space-y-2 text-sm">
              <div className="flex">
                <dt className="text-gray-500 w-24">URL</dt>
                <dd className="font-mono text-gray-900 break-all">
                  {state.config.url || '(Not set)'}
                </dd>
              </div>
              <div className="flex">
                <dt className="text-gray-500 w-24">Method</dt>
                <dd className="font-medium text-gray-900">
                  {state.config.method || 'GET'}
                </dd>
              </div>
              <div className="flex">
                <dt className="text-gray-500 w-24">Auth</dt>
                <dd className="font-medium text-gray-900">
                  {state.config.authType === 'bearer' && 'Bearer Token'}
                  {state.config.authType === 'basic' && 'Basic Auth'}
                  {state.config.authType === 'apiKey' && 'API Key'}
                  {(!state.config.authType || state.config.authType === 'none') && 'None'}
                  {state.config.authValue && (
                    <span className="ml-2 text-green-600">✓ Configured</span>
                  )}
                </dd>
              </div>
              {state.config.headers && (
                <div className="flex">
                  <dt className="text-gray-500 w-24">Headers</dt>
                  <dd className="font-mono text-xs text-gray-900 bg-gray-100 p-1 rounded break-all">
                    {state.config.headers}
                  </dd>
                </div>
              )}
            </dl>
          )}
          {state.type === 'MANUAL' && (
            <dl className="space-y-2 text-sm">
              <div className="flex">
                <dt className="text-gray-500 w-24">Frequency</dt>
                <dd className="font-medium text-gray-900">
                  {state.config.updateFrequency || 'Weekly'}
                </dd>
              </div>
              {state.config.description && (
                <div className="flex">
                  <dt className="text-gray-500 w-24">Description</dt>
                  <dd className="text-gray-900">{state.config.description}</dd>
                </div>
              )}
            </dl>
          )}
        </section>

        {/* Field Mappings */}
        <section className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">
            Field Mappings ({selectedFields.length})
          </h3>
          {selectedFields.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-1">Source Field</th>
                    <th className="py-1">Target Name</th>
                    <th className="py-1">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedFields.map((field, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-2 font-mono">{field.sourceField}</td>
                      <td className="py-2">{field.targetField}</td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                          {field.fieldType}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No fields configured yet.</p>
          )}
        </section>

        {/* Warnings */}
        {(!state.name || !state.type) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-1">⚠️ Missing Information</h4>
            <ul className="text-sm text-yellow-700 list-disc list-inside">
              {!state.name && <li>Integration name is required</li>}
              {!state.type && <li>Integration type must be selected</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
