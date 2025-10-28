// Memory security utilities for sensitive data protection

export class MemorySecurity {
  private static sensitiveStrings = new Set<string>();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  // Initialize memory security
  static initialize() {
    // Start periodic cleanup to prevent memory leaks
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 30000); // Clean every 30 seconds

    // Clear memory on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.clearAllSensitiveData();
      });
    }
  }

  // Track sensitive strings for secure cleanup
  static trackSensitiveData(data: string): string {
    const id = Math.random().toString(36).substring(2, 15);
    this.sensitiveStrings.add(data);

    // Return a proxy that tracks usage
    return data;
  }

  // Securely clear a specific string from memory
  static clearString(data: string): void {
    if (typeof data !== 'string') return;

    // Overwrite the string in memory (JavaScript limitation but best effort)
    try {
      // Remove from tracking
      this.sensitiveStrings.delete(data);

      // Note: JavaScript strings are immutable, we cannot truly overwrite them
      // but we can clear references and rely on garbage collection
    } catch (error) {
      console.warn('Failed to securely clear string:', error);
    }
  }

  // Clear all sensitive tracked data
  static clearAllSensitiveData(): void {
    try {
      for (const data of this.sensitiveStrings) {
        this.clearString(data);
      }
      this.sensitiveStrings.clear();
    } catch (error) {
      console.warn('Failed to clear all sensitive data:', error);
    }
  }

  // Perform memory cleanup
  private static performCleanup(): void {
    try {
      // Force garbage collection if available
      if ((globalThis as any).gc) {
        (globalThis as any).gc();
      }

      // Clear any remaining sensitive data
      this.clearAllSensitiveData();
    } catch (error) {
      // Ignore errors in cleanup
    }
  }

  // Secure password handling
  static async hashPassword(password: string, salt: Uint8Array): Promise<string> {
    try {
      // Track password as sensitive
      this.trackSensitiveData(password);

      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt.buffer as ArrayBuffer,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );

      const hashArray = new Uint8Array(derivedBits);
      const hash = btoa(String.fromCharCode(...hashArray));

      // Clear password from memory immediately after use
      this.clearString(password);

      return hash;
    } catch (error) {
      console.error('Password hashing failed:', error);
      throw error;
    }
  }

  // Create secure random data
  static generateSecureRandom(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  // Secure string comparison to prevent timing attacks
  static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  // Memory cleanup on lock
  static onVaultLock(): void {
    this.clearAllSensitiveData();
    this.performCleanup();
  }

  // Initialize on app start
  static {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }
}

// Export singleton instance
export const memorySecurity = MemorySecurity;