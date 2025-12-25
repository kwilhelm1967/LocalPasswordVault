/**
 * Service Registry Pattern
 * 
 * Provides dependency injection and service location pattern.
 * Allows for better testability and loose coupling.
 */

type ServiceConstructor<T> = new (...args: unknown[]) => T;
type ServiceFactory<T> = () => T;
type ServiceProvider<T> = ServiceConstructor<T> | ServiceFactory<T>;

/**
 * Service Registry for dependency injection
 */
class ServiceRegistry {
  private services = new Map<string, unknown>();
  private factories = new Map<string, ServiceProvider<unknown>>();
  private singletons = new Map<string, unknown>();

  /**
   * Register a service with a factory function
   */
  register<T>(key: string, factory: ServiceProvider<T>): void {
    this.factories.set(key, factory);
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(key: string, instance: T): void {
    this.singletons.set(key, instance);
  }

  /**
   * Resolve a service
   */
  resolve<T>(key: string): T {
    // Check if already instantiated singleton
    if (this.singletons.has(key)) {
      return this.singletons.get(key) as T;
    }

    // Check if we have a factory
    const factory = this.factories.get(key);
    if (!factory) {
      throw new Error(`Service '${key}' not found in registry`);
    }

    // Create instance
    let instance: T;
    if (typeof factory === "function") {
      // Check if it's a constructor (class) or factory function
      try {
        instance = new (factory as ServiceConstructor<T>)() as T;
      } catch {
        // Not a constructor, treat as factory function
        instance = (factory as ServiceFactory<T>)() as T;
      }
    } else {
      instance = factory as T;
    }

    // Store as singleton if it's a class instance
    if (instance && typeof instance === "object") {
      this.singletons.set(key, instance);
    }

    return instance;
  }

  /**
   * Check if a service is registered
   */
  has(key: string): boolean {
    return this.factories.has(key) || this.singletons.has(key);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  /**
   * Remove a specific service
   */
  remove(key: string): void {
    this.factories.delete(key);
    this.singletons.delete(key);
    this.services.delete(key);
  }
}

// Export singleton registry instance
export const serviceRegistry = new ServiceRegistry();

// Service keys as constants for type safety
export const ServiceKeys = {
  Storage: "storage",
  License: "license",
  Trial: "trial",
  ApiClient: "apiClient",
  ErrorHandler: "errorHandler",
  Logger: "logger",
  DeviceFingerprint: "deviceFingerprint",
} as const;

export type ServiceKey = typeof ServiceKeys[keyof typeof ServiceKeys];

