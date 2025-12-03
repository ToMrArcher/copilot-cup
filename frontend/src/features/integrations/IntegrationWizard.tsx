import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IntegrationType, IntegrationConfig, FieldSchema, DataField } from '../../types/integration'
import { SelectTypeStep } from './wizard/SelectTypeStep'
import { ConfigureConnectionStep } from './wizard/ConfigureConnectionStep'
import { MapFieldsStep } from './wizard/MapFieldsStep'
import { ReviewStep } from './wizard/ReviewStep'
import { integrationsApi, dataFieldsApi } from '../../lib/api'

export type WizardStep = 'type' | 'connection' | 'fields' | 'review'

export interface WizardState {
  name: string
  type: IntegrationType | null
  config: IntegrationConfig
}

interface WizardData {
  state: WizardState
  discoveredFields: FieldSchema[]
  selectedFields: Partial<DataField>[]
}

const initialData: WizardData = {
  state: {
    name: '',
    type: null,
    config: {},
  },
  discoveredFields: [],
  selectedFields: [],
}

const steps: { id: WizardStep; label: string }[] = [
  { id: 'type', label: 'Type' },
  { id: 'connection', label: 'Connection' },
  { id: 'fields', label: 'Fields' },
  { id: 'review', label: 'Review' },
]

export function IntegrationWizard() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<WizardStep>('type')
  const [data, setData] = useState<WizardData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDiscovering, setIsDiscovering] = useState(false)

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  const updateState = (updates: Partial<WizardState>) => {
    setData(prev => ({ ...prev, state: { ...prev.state, ...updates } }))
  }

  const updateSelectedFields = (fields: Partial<DataField>[]) => {
    setData(prev => ({ ...prev, selectedFields: fields }))
  }

  const handleDiscoverFields = async () => {
    if (data.state.type !== 'API' || !data.state.config.url) return
    
    setIsDiscovering(true)
    try {
      // Fetch data from the configured URL to discover fields
      const response = await fetch(data.state.config.url, {
        method: data.state.config.method || 'GET',
        headers: data.state.config.authType === 'bearer' && data.state.config.authValue
          ? { 'Authorization': `Bearer ${data.state.config.authValue}` }
          : {},
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const json = await response.json()
      
      // Extract fields from the response (handle both array and object with data property)
      const sampleData = Array.isArray(json) ? json[0] : (json.data?.[0] || json)
      
      if (sampleData && typeof sampleData === 'object') {
        const discoveredFields: FieldSchema[] = Object.entries(sampleData).map(([key, value]) => ({
          name: key,
          type: typeof value === 'number' ? 'number' 
              : typeof value === 'boolean' ? 'boolean'
              : value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)) && value.includes('-')) ? 'date'
              : 'string',
          required: false,
        }))
        setData(prev => ({ ...prev, discoveredFields }))
      }
    } catch (error) {
      console.error('Failed to discover fields:', error)
      alert('Failed to discover fields: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsDiscovering(false)
    }
  }

  const goNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const goBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
    }
  }

  const handleSubmit = async () => {
    if (!data.state.type || !data.state.name) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      // Create the integration
      const integration = await integrationsApi.create({
        name: data.state.name,
        type: data.state.type,
        config: data.state.config as Record<string, unknown>,
      })

      // Create field mappings if any
      if (data.selectedFields.length > 0) {
        for (const field of data.selectedFields) {
          if (field.sourceField && field.targetField && field.fieldType) {
            await dataFieldsApi.create(integration.id, {
              name: field.targetField,
              path: field.sourceField,
              dataType: field.fieldType.toLowerCase(),
            })
          }
        }
      }

      navigate('/integrations')
    } catch (error) {
      console.error('Failed to create integration:', error)
      alert('Failed to create integration: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'type':
        return data.state.type !== null && data.state.name.trim().length > 0
      case 'connection':
        if (data.state.type === 'API') {
          return !!data.state.config.url
        }
        return true
      case 'fields':
        return data.selectedFields.length > 0
      case 'review':
        return true
      default:
        return false
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Progress Steps */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className={`relative ${index !== steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div className="flex items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    index < currentStepIndex
                      ? 'bg-violet-600'
                      : index === currentStepIndex
                      ? 'border-2 border-violet-600 bg-white'
                      : 'border-2 border-gray-300 bg-white'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span
                      className={
                        index === currentStepIndex ? 'text-violet-600' : 'text-gray-500'
                      }
                    >
                      {index + 1}
                    </span>
                  )}
                </div>
                {index !== steps.length - 1 && (
                  <div
                    className={`h-0.5 w-full ${
                      index < currentStepIndex ? 'bg-violet-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
              <span className="absolute -bottom-6 left-0 w-full text-center text-xs text-gray-500">
                {step.label}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      {/* Step Content */}
      <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {currentStep === 'type' && (
          <SelectTypeStep state={data.state} updateState={updateState} />
        )}
        {currentStep === 'connection' && (
          <ConfigureConnectionStep state={data.state} updateState={updateState} />
        )}
        {currentStep === 'fields' && (
          <MapFieldsStep
            discoveredFields={data.discoveredFields}
            selectedFields={data.selectedFields}
            onFieldsChange={updateSelectedFields}
            onDiscover={data.state.type === 'API' ? handleDiscoverFields : undefined}
            isDiscovering={isDiscovering}
          />
        )}
        {currentStep === 'review' && (
          <ReviewStep state={data.state} selectedFields={data.selectedFields} />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={currentStepIndex === 0 ? () => navigate('/integrations') : goBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {currentStepIndex === 0 ? 'Cancel' : 'Back'}
        </button>

        {currentStep === 'review' ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Integration'}
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={!canProceed()}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
