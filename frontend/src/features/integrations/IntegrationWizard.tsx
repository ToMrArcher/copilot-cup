import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { IntegrationType, IntegrationConfig, FieldSchema, DataField } from '../../types/integration'
import { SelectTypeStep } from './wizard/SelectTypeStep'
import { ConfigureConnectionStep } from './wizard/ConfigureConnectionStep'
import { MapFieldsStep } from './wizard/MapFieldsStep'
import { ReviewStep } from './wizard/ReviewStep'
import { integrationsApi, dataFieldsApi } from '../../lib/api'
import { queryKeys } from '../../hooks/useIntegrations'

export type WizardStep = 'type' | 'connection' | 'fields' | 'review'

export interface WizardState {
  name: string
  type: IntegrationType | null
  config: IntegrationConfig
  syncInterval: number | null
  syncEnabled: boolean
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
    syncInterval: 3600,
    syncEnabled: true,
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
  const queryClient = useQueryClient()
  const { id } = useParams<{ id: string }>()
  const isEditMode = !!id
  
  const [currentStep, setCurrentStep] = useState<WizardStep>('type')
  const [data, setData] = useState<WizardData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [isLoading, setIsLoading] = useState(isEditMode)

  // Load existing integration data in edit mode
  useEffect(() => {
    if (id) {
      setIsLoading(true)
      integrationsApi.getById(id)
        .then((integration) => {
          setData({
            state: {
              name: integration.name,
              type: integration.type as IntegrationType,
              config: integration.config as IntegrationConfig,
              syncInterval: integration.syncInterval ?? 3600,
              syncEnabled: integration.syncEnabled ?? true,
            },
            discoveredFields: [],
            selectedFields: integration.dataFields?.map(f => ({
              id: f.id,
              // Handle both legacy and new field formats
              sourceField: 'path' in f ? f.path : f.sourceField,
              targetField: 'name' in f ? f.name : f.targetField,
              fieldType: 'dataType' in f ? f.dataType as DataField['fieldType'] : f.fieldType,
            })) || [],
          })
        })
        .catch((error) => {
          console.error('Failed to load integration:', error)
          alert('Failed to load integration')
          navigate('/integrations')
        })
        .finally(() => setIsLoading(false))
    }
  }, [id, navigate])

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  const updateState = (updates: Partial<WizardState>) => {
    setData(prev => ({ ...prev, state: { ...prev.state, ...updates } }))
  }

  const updateSelectedFields = (fields: Partial<DataField>[]) => {
    setData(prev => ({ ...prev, selectedFields: fields }))
  }

  const handleDiscoverFields = async () => {
    if ((data.state.type !== 'API' && data.state.type !== 'GRAPHQL') || !data.state.config.url) return
    
    // For GraphQL, also require a query
    if (data.state.type === 'GRAPHQL' && !data.state.config.query) {
      alert('Please enter a GraphQL query before discovering fields')
      return
    }
    
    setIsDiscovering(true)
    try {
      // Use backend to discover fields (avoids CORS issues with external APIs)
      const fields = await integrationsApi.discoverFieldsFromConfig(
        data.state.type,
        data.state.config
      )
      setData(prev => ({ ...prev, discoveredFields: fields }))
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
      let integrationId: string

      if (isEditMode && id) {
        // Update existing integration
        await integrationsApi.update(id, {
          name: data.state.name,
          config: data.state.config as Record<string, unknown>,
          syncInterval: data.state.syncInterval,
          syncEnabled: data.state.syncEnabled,
        })
        integrationId = id
      } else {
        // Create the integration
        const integration = await integrationsApi.create({
          name: data.state.name,
          type: data.state.type,
          config: data.state.config as Record<string, unknown>,
          syncInterval: data.state.syncInterval,
          syncEnabled: data.state.syncEnabled,
        })
        integrationId = integration.id
      }

      // Create field mappings if any (for new fields)
      if (data.selectedFields.length > 0) {
        for (const field of data.selectedFields) {
          // Only create fields that don't have an id (new fields)
          if (!field.id && field.sourceField && field.targetField && field.fieldType) {
            await dataFieldsApi.create(integrationId, {
              name: field.targetField,
              path: field.sourceField,
              dataType: field.fieldType.toLowerCase(),
            })
          }
        }
      }

      // Invalidate the integrations cache to refresh the list
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations })
      
      navigate('/integrations')
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} integration:`, error)
      alert(`Failed to ${isEditMode ? 'update' : 'create'} integration: ` + (error instanceof Error ? error.message : 'Unknown error'))
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
        if (data.state.type === 'GRAPHQL') {
          return !!data.state.config.url && !!data.state.config.query
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

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {isEditMode ? 'Edit Integration' : 'New Integration'}
      </h1>
      
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
            onDiscover={(data.state.type === 'API' || data.state.type === 'GRAPHQL') ? handleDiscoverFields : undefined}
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
            {isSubmitting 
              ? (isEditMode ? 'Saving...' : 'Creating...') 
              : (isEditMode ? 'Save Changes' : 'Create Integration')}
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
