import {
  IntegrationAdapter,
  IntegrationConfig,
  ConnectionResult,
  DataResult,
  FieldSchema,
} from '../adapter.interface'

/**
 * Adapter for manual data input.
 * Allows users to define fields and enter data manually.
 */
export class ManualAdapter implements IntegrationAdapter {
  type = 'MANUAL' as const

  async testConnection(_config: IntegrationConfig): Promise<ConnectionResult> {
    // Manual integrations always "connect" successfully
    return {
      success: true,
      message: 'Manual integration ready for data entry',
      responseTime: 0,
    }
  }

  async fetchData(
    config: IntegrationConfig,
    _fieldPaths?: string[],
    _limit?: number
  ): Promise<DataResult> {
    // For manual integrations, data is stored in the database
    // This adapter doesn't fetch external data, it just validates the config
    return {
      success: true,
      data: [],
      totalRows: 0,
      fetchedAt: new Date(),
    }
  }

  async discoverFields(config: IntegrationConfig): Promise<FieldSchema[]> {
    // Return the fields defined in the config
    return config.fields || []
  }
}
