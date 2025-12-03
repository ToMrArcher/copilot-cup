import type { WizardState } from '../IntegrationWizard'
import type { IntegrationType } from '../../../types/integration'

interface SelectTypeStepProps {
  state: WizardState
  updateState: (updates: Partial<WizardState>) => void
}

const integrationTypes: {
  type: IntegrationType
  name: string
  description: string
  icon: string
}[] = [
  {
    type: 'API',
    name: 'REST API',
    description: 'Connect to any REST API endpoint to fetch data',
    icon: '🔌',
  },
  {
    type: 'MANUAL',
    name: 'Manual Input',
    description: 'Enter data manually for KPIs without external sources',
    icon: '✏️',
  },
]

export function SelectTypeStep({ state, updateState }: SelectTypeStepProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Choose Integration Type
      </h2>
      <p className="text-gray-600 mb-6">
        Select how you want to connect your data source.
      </p>

      {/* Name Input */}
      <div className="mb-6">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Integration Name
        </label>
        <input
          type="text"
          id="name"
          value={state.name}
          onChange={e => updateState({ name: e.target.value })}
          placeholder="e.g., Sales API, Monthly KPIs"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Type Selection */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {integrationTypes.map(({ type, name, description, icon }) => (
          <button
            key={type}
            onClick={() => updateState({ type })}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              state.type === type
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-3xl">{icon}</span>
            <h3 className="mt-2 font-semibold text-gray-900">{name}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
