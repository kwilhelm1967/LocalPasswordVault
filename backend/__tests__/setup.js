/**
 * Jest Setup File for Backend Tests
 * 
 * Configures test environment and mocks.
 */

// Set test environment variables BEFORE any modules are loaded
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Suppress logs during tests

// Set required Supabase environment variables for tests (dummy values - will be mocked)
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

// Set other required environment variables
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy';
process.env.BREVO_API_KEY = 'test-api-key';
process.env.FROM_EMAIL = 'test@example.com';
process.env.SUPPORT_EMAIL = 'support@example.com';
process.env.WEBSITE_URL = 'https://test.example.com';
process.env.API_URL = 'https://api.test.example.com';
// JWT_SECRET only needed for legacy /api/licenses/validate endpoint (backward compatibility)
// Main LPV endpoints use LICENSE_SIGNING_SECRET for signed files
process.env.JWT_SECRET = 'test-jwt-secret-64-characters-long-for-testing-purposes-only';
process.env.LICENSE_SIGNING_SECRET = 'test-license-signing-secret';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

