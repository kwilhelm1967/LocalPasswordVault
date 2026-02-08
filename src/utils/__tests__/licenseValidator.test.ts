/**
 * License Validator Tests
 * 
 * Tests for ECDSA P-256 license file signature verification.
 */

import { verifyLicenseSignature, verifyLicenseSignatureSync } from '../licenseValidator';

describe('License Validator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyLicenseSignature', () => {
    it('should accept unsigned files in development mode', async () => {
      const originalEnv = import.meta.env.DEV;
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: true },
        writable: true,
      });

      const licenseFile = {
        license_key: 'PERS-XXXX-XXXX-XXXX',
        device_id: 'device-id-123',
        plan_type: 'personal',
        max_devices: 1,
        activated_at: new Date().toISOString(),
        signed_at: new Date().toISOString(),
      };

      const result = await verifyLicenseSignature(licenseFile as Parameters<typeof verifyLicenseSignature>[0]);
      
      expect(result).toBe(true);

      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: originalEnv },
        writable: true,
      });
    });

    it('should reject files without signature in production', async () => {
      const originalEnv = import.meta.env.DEV;
      const originalKey = import.meta.env.VITE_LICENSE_PUBLIC_KEY;
      
      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...import.meta.env, 
          DEV: false,
          VITE_LICENSE_PUBLIC_KEY: 'some-public-key',
        },
        writable: true,
      });

      const licenseFile = {
        license_key: 'PERS-XXXX-XXXX-XXXX',
        device_id: 'device-id-123',
        plan_type: 'personal',
        max_devices: 1,
        activated_at: new Date().toISOString(),
        signed_at: new Date().toISOString(),
      };

      const result = await verifyLicenseSignature(licenseFile as Parameters<typeof verifyLicenseSignature>[0]);
      
      expect(result).toBe(false);

      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...import.meta.env, 
          DEV: originalEnv,
          VITE_LICENSE_PUBLIC_KEY: originalKey,
        },
        writable: true,
      });
    });

    it('should reject files without public key in production', async () => {
      const originalEnv = import.meta.env.DEV;
      const originalKey = import.meta.env.VITE_LICENSE_PUBLIC_KEY;
      
      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...import.meta.env, 
          DEV: false,
          VITE_LICENSE_PUBLIC_KEY: '',
        },
        writable: true,
      });

      const licenseFile = {
        license_key: 'PERS-XXXX-XXXX-XXXX',
        device_id: 'device-id-123',
        plan_type: 'personal',
        max_devices: 1,
        activated_at: new Date().toISOString(),
        signature: 'valid-looking-signature-hex',
        signed_at: new Date().toISOString(),
      };

      const result = await verifyLicenseSignature(licenseFile as Parameters<typeof verifyLicenseSignature>[0]);
      
      // Without a public key in production, should reject
      expect(result).toBe(false);

      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...import.meta.env, 
          DEV: originalEnv,
          VITE_LICENSE_PUBLIC_KEY: originalKey,
        },
        writable: true,
      });
    });

    it('should handle crypto errors gracefully', async () => {
      const originalEnv = import.meta.env.DEV;
      const originalKey = import.meta.env.VITE_LICENSE_PUBLIC_KEY;
      
      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...import.meta.env, 
          DEV: false,
          // Invalid public key that will cause crypto.subtle.importKey to fail
          VITE_LICENSE_PUBLIC_KEY: 'deadbeef',
        },
        writable: true,
      });

      const licenseFile = {
        license_key: 'PERS-XXXX-XXXX-XXXX',
        device_id: 'device-id-123',
        plan_type: 'personal',
        max_devices: 1,
        activated_at: new Date().toISOString(),
        signature: 'abcdef1234567890',
        signed_at: new Date().toISOString(),
      };

      const result = await verifyLicenseSignature(licenseFile as Parameters<typeof verifyLicenseSignature>[0]);
      
      // Should return false on crypto errors, not throw
      expect(result).toBe(false);

      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...import.meta.env, 
          DEV: originalEnv,
          VITE_LICENSE_PUBLIC_KEY: originalKey,
        },
        writable: true,
      });
    });

    it('should allow unsigned files in dev when no public key', async () => {
      const originalEnv = import.meta.env.DEV;
      const originalKey = import.meta.env.VITE_LICENSE_PUBLIC_KEY;
      
      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...import.meta.env, 
          DEV: true,
          VITE_LICENSE_PUBLIC_KEY: '',
        },
        writable: true,
      });

      const licenseFile = {
        license_key: 'PERS-XXXX-XXXX-XXXX',
        device_id: 'device-id-123',
        plan_type: 'personal',
        max_devices: 1,
        activated_at: new Date().toISOString(),
        signature: 'some-sig',
        signed_at: new Date().toISOString(),
      };

      const result = await verifyLicenseSignature(licenseFile as Parameters<typeof verifyLicenseSignature>[0]);
      
      expect(result).toBe(true);

      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...import.meta.env, 
          DEV: originalEnv,
          VITE_LICENSE_PUBLIC_KEY: originalKey,
        },
        writable: true,
      });
    });
  });

  describe('verifyLicenseSignatureSync', () => {
    it('should accept unsigned files in development mode', () => {
      const originalEnv = import.meta.env.DEV;
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: true },
        writable: true,
      });

      const licenseFile = {
        license_key: 'PERS-XXXX-XXXX-XXXX',
        device_id: 'device-id-123',
        plan_type: 'personal',
        max_devices: 1,
        activated_at: new Date().toISOString(),
        signed_at: new Date().toISOString(),
      };

      const result = verifyLicenseSignatureSync(licenseFile as Parameters<typeof verifyLicenseSignatureSync>[0]);
      
      expect(result).toBe(true);

      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: originalEnv },
        writable: true,
      });
    });

    it('should reject files without signature in production', () => {
      const originalEnv = import.meta.env.DEV;
      
      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...import.meta.env, 
          DEV: false,
        },
        writable: true,
      });

      const licenseFile = {
        license_key: 'PERS-XXXX-XXXX-XXXX',
        device_id: 'device-id-123',
        plan_type: 'personal',
        max_devices: 1,
        activated_at: new Date().toISOString(),
        signed_at: new Date().toISOString(),
      };

      const result = verifyLicenseSignatureSync(licenseFile as Parameters<typeof verifyLicenseSignatureSync>[0]);
      
      expect(result).toBe(false);

      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...import.meta.env, 
          DEV: originalEnv,
        },
        writable: true,
      });
    });

    it('should accept files with valid hex signature structure', () => {
      const originalEnv = import.meta.env.DEV;
      
      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...import.meta.env, 
          DEV: false,
        },
        writable: true,
      });

      const licenseFile = {
        license_key: 'PERS-XXXX-XXXX-XXXX',
        device_id: 'device-id-123',
        plan_type: 'personal',
        max_devices: 1,
        activated_at: new Date().toISOString(),
        // Valid hex string of appropriate ECDSA length (~128 chars)
        signature: 'a'.repeat(128),
        signed_at: new Date().toISOString(),
      };

      const result = verifyLicenseSignatureSync(licenseFile as Parameters<typeof verifyLicenseSignatureSync>[0]);
      
      expect(result).toBe(true);

      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...import.meta.env, 
          DEV: originalEnv,
        },
        writable: true,
      });
    });

    it('should reject files with non-hex signature', () => {
      const originalEnv = import.meta.env.DEV;
      
      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...import.meta.env, 
          DEV: false,
        },
        writable: true,
      });

      const licenseFile = {
        license_key: 'PERS-XXXX-XXXX-XXXX',
        device_id: 'device-id-123',
        plan_type: 'personal',
        max_devices: 1,
        activated_at: new Date().toISOString(),
        signature: 'not-valid-hex!@#$',
        signed_at: new Date().toISOString(),
      };

      const result = verifyLicenseSignatureSync(licenseFile as Parameters<typeof verifyLicenseSignatureSync>[0]);
      
      expect(result).toBe(false);

      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...import.meta.env, 
          DEV: originalEnv,
        },
        writable: true,
      });
    });
  });
});
