import { useState } from 'react'
import { useAvailableFields, useCreateKpi, useValidateFormula } from '../../hooks/useKpis'
import type { CreateKpiRequest, AvailableField, IntegrationWithFields } from '../../types/kpi'

interface KpiWizardProps {
  onClose: () => void
}

type WizardStep = 1 | 2 | 3 | 4

interface SelectedSource {
  dataFieldId: string
  alias: string
  field: AvailableField
  integrationName: string
}

export function KpiWizard({ onClose }: KpiWizardProps) {
  const [step, setStep] = useState<WizardStep>(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedSources, setSelectedSources] = useState<SelectedSource[]>([])
  const [formula, setFormula] = useState('')
  const [formulaError, setFormulaError] = useState<string | null>(null)
  const [targetValue, setTargetValue] = useState<string>('')
  const [targetDirection, setTargetDirection] = useState<'increase' | 'decrease'>('increase')
  const [targetPeriod, setTargetPeriod] = useState<string>('monthly')

  const { data: availableFields, isLoading: fieldsLoading } = useAvailableFields()
  const createKpi = useCreateKpi()
  const validateFormula = useValidateFormula()

  const handleSourceToggle = (field: AvailableField, integration: IntegrationWithFields['integration']) => {
    const existing = selectedSources.find(s => s.dataFieldId === field.id)
    if (existing) {
      setSelectedSources(selectedSources.filter(s => s.dataFieldId !== field.id))
    } else {
      // Create a sensible alias from the field name
      const alias = field.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      setSelectedSources([
        ...selectedSources,
        {
          dataFieldId: field.id,
          alias,
          field,
          integrationName: integration.name,
        },
      ])
    }
  }

  const handleAliasChange = (dataFieldId: string, alias: string) => {
    setSelectedSources(
      selectedSources.map(s =>
        s.dataFieldId === dataFieldId ? { ...s, alias } : s
      )
    )
  }

  const handleValidateFormula = async () => {
    if (!formula.trim()) {
      setFormulaError('Formula is required')
      return false
    }

    const aliases = selectedSources.map(s => s.alias)
    try {
      const result = await validateFormula.mutateAsync({ formula, variables: aliases })
      if (!result.valid) {
        setFormulaError(result.error || 'Invalid formula')
        return false
      }
      setFormulaError(null)
      return true
    } catch {
      setFormulaError('Failed to validate formula')
      return false
    }
  }

  const handleNext = async () => {
    if (step === 1) {
      if (!name.trim()) return
      setStep(2)
    } else if (step === 2) {
      if (selectedSources.length === 0) return
      setStep(3)
    } else if (step === 3) {
      const valid = await handleValidateFormula()
      if (valid) setStep(4)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as WizardStep)
  }

  const handleCreate = async () => {
    const data: CreateKpiRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      formula: formula.trim(),
      sources: selectedSources.map(s => ({
        dataFieldId: s.dataFieldId,
        alias: s.alias,
      })),
      targetValue: targetValue ? parseFloat(targetValue) : undefined,
      targetDirection,
      targetPeriod,
    }

    try {
      await createKpi.mutateAsync(data)
      onClose()
    } catch (error) {
      console.error('Failed to create KPI:', error)
    }
  }

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0
    if (step === 2) return selectedSources.length > 0
    if (step === 3) return formula.trim().length > 0
    return true
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create KPI</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex mt-4 gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex-1">
                <div
                  className={`h-1 rounded-full ${
                    s <= step ? 'bg-violet-600 dark:bg-violet-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
                <div className={`text-xs mt-1 ${s === step ? 'text-violet-600 dark:text-violet-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                  {s === 1 && 'Basic Info'}
                  {s === 2 && 'Data Sources'}
                  {s === 3 && 'Formula'}
                  {s === 4 && 'Target'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  KPI Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Revenue per Employee"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional description of what this KPI measures"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>
          )}

          {/* Step 2: Data Sources */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select the data fields to use in your KPI formula. You can assign short aliases for easier formula writing.
              </p>

              {fieldsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
                </div>
              ) : availableFields?.integrations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No data sources available. Please create an integration and sync data first.
                </div>
              ) : (
                <div className="space-y-4">
                  {availableFields?.integrations.map(({ integration, fields }) => (
                    <div key={integration.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 font-medium text-gray-700 dark:text-gray-200">
                        {integration.name}
                        <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({integration.type})</span>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {fields.map(field => {
                          const selected = selectedSources.find(s => s.dataFieldId === field.id)
                          return (
                            <div
                              key={field.id}
                              className={`px-4 py-3 flex items-center gap-4 ${
                                selected ? 'bg-violet-50 dark:bg-violet-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={!!selected}
                                onChange={() => handleSourceToggle(field, integration)}
                                className="w-4 h-4 text-violet-600 rounded"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{field.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {field.path} · {field.dataType}
                                  {!field.hasData && (
                                    <span className="text-amber-500 dark:text-amber-400 ml-2">⚠ No data synced</span>
                                  )}
                                </div>
                              </div>
                              {selected && (
                                <input
                                  type="text"
                                  value={selected.alias}
                                  onChange={e => handleAliasChange(field.id, e.target.value)}
                                  placeholder="alias"
                                  className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-1 focus:ring-violet-500"
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedSources.length > 0 && (
                <div className="mt-4 p-3 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
                  <div className="text-sm font-medium text-violet-700 dark:text-violet-300">
                    Selected: {selectedSources.length} field(s)
                  </div>
                  <div className="text-xs text-violet-600 dark:text-violet-400 mt-1">
                    Variables: {selectedSources.map(s => s.alias).join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Formula */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Formula *
                </label>
                <input
                  type="text"
                  value={formula}
                  onChange={e => {
                    setFormula(e.target.value)
                    setFormulaError(null)
                  }}
                  placeholder="e.g., revenue / employees"
                  className={`w-full px-3 py-2 border rounded-lg font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 ${
                    formulaError ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {formulaError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formulaError}</p>
                )}
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Available Variables</div>
                <div className="flex flex-wrap gap-2">
                  {selectedSources.map(s => (
                    <button
                      key={s.dataFieldId}
                      type="button"
                      onClick={() => setFormula(f => f + (f && !f.endsWith(' ') ? ' ' : '') + s.alias)}
                      className="px-2 py-1 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded text-sm hover:bg-violet-200 dark:hover:bg-violet-800/50"
                    >
                      {s.alias}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Formula Examples</div>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div><code className="dark:text-gray-300">revenue / employees</code> - Revenue per employee</div>
                  <div><code className="dark:text-gray-300">(revenue - costs) / revenue * 100</code> - Profit margin %</div>
                  <div><code className="dark:text-gray-300">sum(sales) / count(sales)</code> - Average sale</div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Supported Functions</div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {['sum', 'avg', 'min', 'max', 'count'].map(fn => (
                    <code key={fn} className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded">
                      {fn}()
                    </code>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Target */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set a target goal for this KPI (optional). The system will track progress toward your goal.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Value
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={e => setTargetValue(e.target.value)}
                  placeholder="e.g., 100000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Direction
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="direction"
                      checked={targetDirection === 'increase'}
                      onChange={() => setTargetDirection('increase')}
                      className="w-4 h-4 text-violet-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">↑ Increase (higher is better)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="direction"
                      checked={targetDirection === 'decrease'}
                      onChange={() => setTargetDirection('decrease')}
                      className="w-4 h-4 text-violet-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">↓ Decrease (lower is better)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Period
                </label>
                <select
                  value={targetPeriod}
                  onChange={e => setTargetPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-violet-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {/* Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Summary</div>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div><strong className="dark:text-gray-200">Name:</strong> {name}</div>
                  <div><strong className="dark:text-gray-200">Formula:</strong> <code className="dark:text-gray-300">{formula}</code></div>
                  <div><strong className="dark:text-gray-200">Sources:</strong> {selectedSources.map(s => s.alias).join(', ')}</div>
                  {targetValue && (
                    <div>
                      <strong className="dark:text-gray-200">Target:</strong> {targetValue} ({targetDirection}, {targetPeriod})
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={step === 1 ? onClose : handleBack}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={createKpi.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {createKpi.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Creating...
                </>
              ) : (
                'Create KPI'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
