import {
  IntegrationAdapter,
  IntegrationType,
} from './adapter.interface'
import { ApiAdapter } from './adapters/api.adapter'
import { ManualAdapter } from './adapters/manual.adapter'
import { GraphqlAdapter } from './adapters/graphql.adapter'

/**
 * Registry for integration adapters.
 * Provides a central point to access adapters by type.
 */
class AdapterRegistryClass {
  private adapters: Map<IntegrationType, IntegrationAdapter> = new Map()

  constructor() {
    // Register built-in adapters
    this.register(new ApiAdapter())
    this.register(new ManualAdapter())
    this.register(new GraphqlAdapter())
  }

  /**
   * Register a new adapter.
   */
  register(adapter: IntegrationAdapter): void {
    this.adapters.set(adapter.type, adapter)
  }

  /**
   * Get an adapter by type.
   * @throws Error if adapter type is not registered
   */
  get(type: IntegrationType): IntegrationAdapter {
    const adapter = this.adapters.get(type)
    if (!adapter) {
      throw new Error(`No adapter registered for type: ${type}`)
    }
    return adapter
  }

  /**
   * Check if an adapter type is registered.
   */
  has(type: IntegrationType): boolean {
    return this.adapters.has(type)
  }

  /**
   * Get all registered adapter types.
   */
  getTypes(): IntegrationType[] {
    return Array.from(this.adapters.keys())
  }
}

// Export singleton instance
export const AdapterRegistry = new AdapterRegistryClass()
