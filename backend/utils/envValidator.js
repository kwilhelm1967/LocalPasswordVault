/**
 * Environment Variable Validator
 * 
 * Validates all required environment variables are set and properly formatted.
 * Provides clear error messages for missing or invalid configuration.
 */

const logger = require('./logger');

/**
 * Required environment variables for production
 */
const REQUIRED_VARS = {
  // Server
  NODE_ENV: {
    required: true,
    validate: (value) => ['production', 'development', 'test'].includes(value),
    message: 'Must be "production", "development", or "test"',
  },
  PORT: {
    required: true,
    validate: (value) => {
      const port = parseInt(value, 10);
      return !isNaN(port) && port > 0 && port < 65536;
    },
    message: 'Must be a valid port number (1-65535)',
  },

  // Database
  SUPABASE_URL: {
    required: true,
    validate: (value) => value.startsWith('https://') && value.includes('.supabase.co'),
    message: 'Must be a valid Supabase URL (https://*.supabase.co)',
  },
  SUPABASE_SERVICE_KEY: {
    required: true,
    validate: (value) => value.startsWith('eyJ') && value.length > 100,
    message: 'Must be a valid Supabase service role key',
  },

  // License Signing (replaces JWT - all validation uses signed files)
  LICENSE_SIGNING_SECRET: {
    required: true,
    validate: (value) => value.length >= 32,
    message: 'Must be at least 32 characters long',
  },

  // Stripe
  STRIPE_SECRET_KEY: {
    required: true,
    validate: (value) => value.startsWith('sk_live_') || value.startsWith('sk_test_'),
    message: 'Must start with sk_live_ or sk_test_',
  },
  STRIPE_WEBHOOK_SECRET: {
    required: true,
    validate: (value) => value.startsWith('whsec_'),
    message: 'Must start with whsec_',
  },
  STRIPE_PRICE_PERSONAL: {
    required: true,
    validate: (value) => value.startsWith('price_'),
    message: 'Must start with price_',
  },
  STRIPE_PRICE_FAMILY: {
    required: true,
    validate: (value) => value.startsWith('price_'),
    message: 'Must start with price_',
  },
  // Email
  BREVO_API_KEY: {
    required: true,
    validate: (value) => value.startsWith('xkeysib-') || value.length > 20,
    message: 'Must be a valid Brevo API key',
  },
  FROM_EMAIL: {
    required: true,
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Must be a valid email address',
  },
  SUPPORT_EMAIL: {
    required: true,
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Must be a valid email address',
  },

  // Website
  WEBSITE_URL: {
    required: true,
    validate: (value) => value.startsWith('https://'),
    message: 'Must be a valid HTTPS URL',
  },
};

/**
 * Optional environment variables
 */
const OPTIONAL_VARS = {
  SENTRY_DSN: {
    validate: (value) => value.startsWith('https://') && value.includes('@'),
    message: 'Must be a valid Sentry DSN',
  },
};

/**
 * Validate all environment variables
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];

  // Check required variables
  for (const [key, config] of Object.entries(REQUIRED_VARS)) {
    const value = process.env[key];

    if (!value) {
      if (config.required) {
        errors.push(`Missing required environment variable: ${key}`);
      }
      continue;
    }

    if (config.validate && !config.validate(value)) {
      errors.push(`Invalid ${key}: ${config.message}`);
    }
  }

  // Check optional variables
  for (const [key, config] of Object.entries(OPTIONAL_VARS)) {
    const value = process.env[key];

    if (value && config.validate && !config.validate(value)) {
      warnings.push(`Invalid ${key}: ${config.message}`);
    }
  }

  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    // Warn if using test keys in production
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      warnings.push('Using Stripe test key in production mode. Switch to live key.');
    }

    // Warn if Sentry not configured
    if (!process.env.SENTRY_DSN) {
      warnings.push('Sentry DSN not configured. Error tracking will be disabled.');
    }
  }

  return { errors, warnings };
}

/**
 * Validate and log results
 */
function validateAndLog() {
  const { errors, warnings } = validateEnvironment();

  if (errors.length > 0) {
    logger.error('Environment validation failed', null, {
      errors,
      operation: 'env_validation',
    });
    console.error('\n❌ Environment Validation Failed:');
    errors.forEach((error) => {
      console.error(`   - ${error}`);
    });
    console.error('\nPlease fix the errors above and restart the server.\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    logger.warn('Environment validation warnings', {
      warnings,
      operation: 'env_validation',
    });
    console.warn('\n⚠️  Environment Validation Warnings:');
    warnings.forEach((warning) => {
      console.warn(`   - ${warning}`);
    });
    console.warn('');
  }

  if (errors.length === 0 && warnings.length === 0) {
    logger.info('Environment validation passed', {
      operation: 'env_validation',
    });
    console.log('✅ Environment validation passed\n');
  }
}

module.exports = {
  validateEnvironment,
  validateAndLog,
  REQUIRED_VARS,
  OPTIONAL_VARS,
};

