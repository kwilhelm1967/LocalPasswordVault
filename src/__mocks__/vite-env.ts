// Mock for Vite's import.meta.env in Jest tests
export const mockImportMetaEnv = {
  DEV: true,
  PROD: false,
  MODE: 'test',
  VITE_APP_VERSION: '1.2.0',
  VITE_LICENSE_SIGNING_SECRET: 'test-secret',
  VITE_USE_STRICT_PERFORMANCE: 'false',
};

