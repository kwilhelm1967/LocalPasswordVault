/**
 * Structured Error Logging Utility for Backend
 * 
 * Provides consistent, structured error logging with context, error codes,
 * and Sentry error tracking service integration.
 */

const { captureException, captureMessage, addBreadcrumb } = require('./sentry');

// Error codes for different error types
const ERROR_CODES = {
  // Server errors
  SERVER_ERROR: 'ERR_SERVER_001',
  DATABASE_ERROR: 'ERR_DB_001',
  DATABASE_CONNECTION_ERROR: 'ERR_DB_002',
  DATABASE_QUERY_ERROR: 'ERR_DB_003',
  
  // Email errors
  EMAIL_INIT_ERROR: 'ERR_EMAIL_001',
  EMAIL_SEND_ERROR: 'ERR_EMAIL_002',
  EMAIL_TEMPLATE_ERROR: 'ERR_EMAIL_003',
  EMAIL_VALIDATION_ERROR: 'ERR_EMAIL_004',
  
  // Webhook errors
  WEBHOOK_SIGNATURE_ERROR: 'ERR_WEBHOOK_001',
  WEBHOOK_PROCESSING_ERROR: 'ERR_WEBHOOK_002',
  WEBHOOK_ALERT_ERROR: 'ERR_WEBHOOK_003',
  
  // License errors
  LICENSE_VALIDATION_ERROR: 'ERR_LICENSE_001',
  LICENSE_GENERATION_ERROR: 'ERR_LICENSE_002',
  LICENSE_SIGNING_ERROR: 'ERR_LICENSE_003',
  
  // Stripe errors
  STRIPE_ERROR: 'ERR_STRIPE_001',
  STRIPE_WEBHOOK_ERROR: 'ERR_STRIPE_002',
  STRIPE_CHECKOUT_ERROR: 'ERR_STRIPE_003',
  
  // Authentication/Authorization errors
  AUTH_ERROR: 'ERR_AUTH_001',
  AUTH_MISSING_SECRET: 'ERR_AUTH_002',
  
  // Validation errors
  VALIDATION_ERROR: 'ERR_VALID_001',
  ENV_VALIDATION_ERROR: 'ERR_VALID_002',
  
  // Generic
  UNKNOWN_ERROR: 'ERR_UNKNOWN_001',
  CONFIG_ERROR: 'ERR_CONFIG_001',
};

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    this.errorHistory = [];
    this.MAX_HISTORY = 100;
    this.ERROR_CODES = ERROR_CODES;
  }

  /**
   * Log levels: error, warn, info, debug
   */
  shouldLog(level) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return levels[level] <= levels[this.logLevel];
  }

  /**
   * Create structured log entry
   */
  createLogEntry(level, message, context = {}, error = null, errorCode = null) {
    // Extract request ID from context if available
    // Supports: context.requestId, context.req?.requestId, or req object directly
    let requestId = context.requestId;
    if (!requestId && context.req) {
      requestId = context.req.requestId;
    }
    if (!requestId && typeof context === 'object' && context.constructor && context.constructor.name === 'IncomingMessage') {
      // If context itself is the req object
      requestId = context.requestId;
    }
    
    // Extract user ID from context if available
    let userId = context.userId || (context.user && context.user.id) || null;
    
    // Use error code from context, error object, or parameter
    const code = errorCode || context.errorCode || (error && error.code) || null;
    
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      errorCode: code, // Include error code for categorization
      requestId, // Include request ID for tracing
      userId, // Include user ID if available
      context: {
        ...context,
        environment: process.env.NODE_ENV || 'development',
        service: 'local-password-vault-backend',
      },
    };
    
    // Remove duplicate fields from context
    ['requestId', 'userId', 'user', 'errorCode', 'req'].forEach(key => {
      if (entry.context[key]) {
        delete entry.context[key];
      }
    });

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack, // Always include stack trace for errors
        code: error.code || code,
      };
    }

    return entry;
  }

  /**
   * Log error with full context
   * @param {string} message - Error message
   * @param {Error} error - Error object (optional)
   * @param {object} context - Additional context (optional)
   * @param {string} errorCode - Error code from ERROR_CODES (optional)
   */
  error(message, error = null, context = {}, errorCode = null) {
    if (!this.shouldLog('error')) return;

    const entry = this.createLogEntry('error', message, context, error, errorCode);
    
    // Add to history
    this.errorHistory.push(entry);
    if (this.errorHistory.length > this.MAX_HISTORY) {
      this.errorHistory.shift();
    }

    // Structured console output with all context
    const logOutput = {
      timestamp: entry.timestamp,
      level: 'ERROR',
      errorCode: entry.errorCode,
      message: entry.message,
      requestId: entry.requestId,
      userId: entry.userId,
      context: entry.context,
    };

    if (entry.error) {
      logOutput.error = {
        name: entry.error.name,
        message: entry.error.message,
        code: entry.error.code,
        stack: entry.error.stack, // Always include stack trace
      };
    }

    console.error(JSON.stringify(logOutput, null, 2));

    // Send to Sentry error tracking service (only in production)
    if (error) {
      captureException(error, {
        ...context,
        errorCode: entry.errorCode,
        requestId: entry.requestId,
        userId: entry.userId,
        level: 'error',
      });
    } else {
      captureMessage(message, 'error', {
        ...context,
        errorCode: entry.errorCode,
        requestId: entry.requestId,
        userId: entry.userId,
      });
    }
  }

  /**
   * Log warning
   */
  warn(message, context = {}) {
    if (!this.shouldLog('warn')) return;

    const entry = this.createLogEntry('warn', message, context);
    const logOutput = {
      timestamp: entry.timestamp,
      level: 'WARN',
      message: entry.message,
      requestId: entry.requestId,
      userId: entry.userId,
      context: entry.context,
    };
    console.warn(JSON.stringify(logOutput, null, 2));
    
    // Add breadcrumb to Sentry for warnings (helps with debugging)
    addBreadcrumb(message, 'warning', 'warning', {
      ...context,
      requestId: entry.requestId,
      userId: entry.userId,
    });
  }

  /**
   * Log info
   */
  info(message, context = {}) {
    if (!this.shouldLog('info')) return;

    const entry = this.createLogEntry('info', message, context);
    const logOutput = {
      timestamp: entry.timestamp,
      level: 'INFO',
      message: entry.message,
      requestId: entry.requestId,
      userId: entry.userId,
      context: entry.context,
    };
    console.log(JSON.stringify(logOutput, null, 2));
  }

  /**
   * Log debug (only in development)
   */
  debug(message, context = {}) {
    if (!this.shouldLog('debug')) return;

    const entry = this.createLogEntry('debug', message, context);
    const logOutput = {
      timestamp: entry.timestamp,
      level: 'DEBUG',
      message: entry.message,
      requestId: entry.requestId,
      userId: entry.userId,
      context: entry.context,
    };
    console.log(JSON.stringify(logOutput, null, 2));
  }

  /**
   * Log webhook event
   */
  webhook(eventType, eventId, context = {}) {
    this.info(`Webhook received: ${eventType}`, {
      eventId,
      eventType,
      ...context,
    });
  }

  /**
   * Log webhook error
   */
  webhookError(eventType, eventId, error, context = {}) {
    this.error(`Webhook processing failed: ${eventType}`, error, {
      eventId,
      eventType,
      operation: 'webhook_processing',
      ...context,
    });
  }

  /**
   * Log database operation
   */
  db(operation, table, context = {}) {
    this.debug(`DB ${operation}: ${table}`, context);
  }

  /**
   * Log database error
   */
  dbError(operation, table, error, context = {}) {
    this.error(`DB ${operation} failed: ${table}`, error, context);
  }

  /**
   * Log email operation
   */
  email(operation, recipient, context = {}) {
    this.info(`Email ${operation}`, {
      recipient: this.maskEmail(recipient),
      ...context,
    });
  }

  /**
   * Log email error
   */
  emailError(operation, recipient, error, context = {}) {
    this.error(`Email ${operation} failed`, error, {
      recipient: this.maskEmail(recipient),
      ...context,
    });
  }

  /**
   * Mask email for privacy (show only first 3 chars and domain)
   */
  maskEmail(email) {
    if (!email || typeof email !== 'string') return 'unknown';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    return `${local.substring(0, 3)}***@${domain}`;
  }

  /**
   * Get recent error history
   */
  getErrorHistory(limit = 10) {
    return this.errorHistory.slice(-limit);
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const errors = this.errorHistory;
    const byLevel = {};
    const byContext = {};

    errors.forEach(entry => {
      byLevel[entry.level] = (byLevel[entry.level] || 0) + 1;
      if (entry.context && entry.context.operation) {
        byContext[entry.context.operation] = (byContext[entry.context.operation] || 0) + 1;
      }
    });

    return {
      total: errors.length,
      byLevel,
      byContext,
      recent: errors.slice(-5),
    };
  }
}

// Export singleton instance
const loggerInstance = new Logger();

/**
 * Helper function for routes to log with automatic requestId inclusion
 * Usage: logger.withRequest(req).error('message', error, context)
 */
loggerInstance.withRequest = function(req) {
  return {
    error: (message, error, context = {}) => {
      return loggerInstance.error(message, error, {
        ...context,
        requestId: req && req.requestId,
      });
    },
    warn: (message, context = {}) => {
      return loggerInstance.warn(message, {
        ...context,
        requestId: req && req.requestId,
      });
    },
    info: (message, context = {}) => {
      return loggerInstance.info(message, {
        ...context,
        requestId: req && req.requestId,
      });
    },
    debug: (message, context = {}) => {
      return loggerInstance.debug(message, {
        ...context,
        requestId: req && req.requestId,
      });
    },
  };
};

// Export ERROR_CODES for use in other modules
loggerInstance.ERROR_CODES = ERROR_CODES;

module.exports = loggerInstance;





