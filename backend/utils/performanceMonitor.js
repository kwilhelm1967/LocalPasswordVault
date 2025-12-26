/**
 * Backend Performance Monitoring
 * 
 * Tracks server performance metrics WITHOUT collecting any customer data.
 * Only aggregates: request counts, response times, error rates, etc.
 * 
 * PRIVACY: No customer emails, license keys, or personal data is tracked.
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byEndpoint: {},
        byStatus: {},
      },
      responseTimes: {
        endpoints: new Map(), // endpoint -> { count, totalTime, min, max }
        methods: new Map(),   // method -> { count, totalTime }
      },
      errors: {
        total: 0,
        byEndpoint: {},
        byType: {},
      },
      database: {
        queries: 0,
        slowQueries: 0, // > 1000ms
        totalQueryTime: 0,
      },
      webhooks: {
        processed: 0,
        failed: 0,
        avgProcessingTime: 0,
      },
      emails: {
        sent: 0,
        failed: 0,
      },
    };

    this.MAX_METRICS_HISTORY = 1000;
    this.slowQueryThreshold = 1000; // ms
    this.slowRequestThreshold = 500; // ms
  }

  /**
   * Track HTTP request
   * NO customer data collected - only method, path, status, duration
   */
  trackRequest(method, path, statusCode, duration) {
    this.metrics.requests.total++;

    // Track by method
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;

    // Track by endpoint (normalize path - remove IDs, emails, etc.)
    const normalizedPath = this.normalizePath(path);
    this.metrics.requests.byEndpoint[normalizedPath] = 
      (this.metrics.requests.byEndpoint[normalizedPath] || 0) + 1;

    // Track by status
    const statusGroup = `${Math.floor(statusCode / 100)}xx`;
    this.metrics.requests.byStatus[statusGroup] = 
      (this.metrics.requests.byStatus[statusGroup] || 0) + 1;

    // Track response times
    if (!this.metrics.responseTimes.endpoints.has(normalizedPath)) {
      this.metrics.responseTimes.endpoints.set(normalizedPath, {
        count: 0,
        totalTime: 0,
        min: Infinity,
        max: 0,
      });
    }

    const endpointMetrics = this.metrics.responseTimes.endpoints.get(normalizedPath);
    endpointMetrics.count++;
    endpointMetrics.totalTime += duration;
    endpointMetrics.min = Math.min(endpointMetrics.min, duration);
    endpointMetrics.max = Math.max(endpointMetrics.max, duration);

    // Track by method
    if (!this.metrics.responseTimes.methods.has(method)) {
      this.metrics.responseTimes.methods.set(method, { count: 0, totalTime: 0 });
    }
    const methodMetrics = this.metrics.responseTimes.methods.get(method);
    methodMetrics.count++;
    methodMetrics.totalTime += duration;

    // Track slow requests
    if (duration > this.slowRequestThreshold) {
      // Log slow request (no customer data)
      const logger = require('./logger');
      logger.warn(`Slow request detected: ${method} ${normalizedPath}`, {
        operation: 'performance_monitoring',
        type: 'slow_request',
        method: method,
        path: normalizedPath,
        duration: duration,
        threshold: this.slowRequestThreshold,
      });
    }

    // Track errors
    if (statusCode >= 400) {
      this.metrics.errors.total++;
      this.metrics.errors.byEndpoint[normalizedPath] = 
        (this.metrics.errors.byEndpoint[normalizedPath] || 0) + 1;
    }
  }

  /**
   * Track database query performance
   * NO customer data - only operation type, table, duration
   */
  trackDatabaseQuery(operation, table, duration) {
    this.metrics.database.queries++;
    this.metrics.database.totalQueryTime += duration;

    if (duration > this.slowQueryThreshold) {
      this.metrics.database.slowQueries++;
      const logger = require('./logger');
      logger.warn(`Slow query detected: ${operation} on ${table}`, {
        operation: 'performance_monitoring',
        type: 'slow_query',
        dbOperation: operation,
        table: table,
        duration: duration,
        threshold: this.slowQueryThreshold,
      });
    }
  }

  /**
   * Track webhook processing
   * NO customer data - only event type, success/failure, duration
   */
  trackWebhook(eventType, success, duration) {
    if (success) {
      this.metrics.webhooks.processed++;
    } else {
      this.metrics.webhooks.failed++;
    }

    // Update average (simple moving average)
    const total = this.metrics.webhooks.processed + this.metrics.webhooks.failed;
    if (total > 0) {
      this.metrics.webhooks.avgProcessingTime = 
        (this.metrics.webhooks.avgProcessingTime * (total - 1) + duration) / total;
    }
  }

  /**
   * Track email operation
   * NO customer data - only success/failure count
   */
  trackEmail(success) {
    if (success) {
      this.metrics.emails.sent++;
    } else {
      this.metrics.emails.failed++;
    }
  }

  /**
   * Normalize path to remove customer data
   * Example: /api/trial/status/user@example.com -> /api/trial/status/:email
   */
  normalizePath(path) {
    // Remove email addresses
    path = path.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ':email');
    
    // Remove license keys (format: XXXX-XXXX-XXXX-XXXX)
    path = path.replace(/[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4,5}/gi, ':licenseKey');
    
    // Remove UUIDs
    path = path.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id');
    
    // Remove session IDs (cs_xxx, pi_xxx, evt_xxx)
    path = path.replace(/(cs_|pi_|evt_)[a-zA-Z0-9_]+/g, ':sessionId');
    
    // Remove numeric IDs in path segments
    path = path.replace(/\/\d+/g, '/:id');
    
    return path;
  }

  /**
   * Get performance summary (no customer data)
   */
  getSummary() {
    const endpointStats = {};
    this.metrics.responseTimes.endpoints.forEach((stats, endpoint) => {
      endpointStats[endpoint] = {
        count: stats.count,
        avgTime: stats.totalTime / stats.count,
        minTime: stats.min === Infinity ? 0 : stats.min,
        maxTime: stats.max,
      };
    });

    const methodStats = {};
    this.metrics.responseTimes.methods.forEach((stats, method) => {
      methodStats[method] = {
        count: stats.count,
        avgTime: stats.totalTime / stats.count,
      };
    });

    return {
      requests: {
        total: this.metrics.requests.total,
        byMethod: this.metrics.requests.byMethod,
        byStatus: this.metrics.requests.byStatus,
        byEndpoint: this.metrics.requests.byEndpoint,
      },
      responseTimes: {
        endpoints: endpointStats,
        methods: methodStats,
      },
      errors: {
        total: this.metrics.errors.total,
        rate: this.metrics.requests.total > 0 
          ? (this.metrics.errors.total / this.metrics.requests.total * 100).toFixed(2) + '%'
          : '0%',
        byEndpoint: this.metrics.errors.byEndpoint,
      },
      database: {
        totalQueries: this.metrics.database.queries,
        slowQueries: this.metrics.database.slowQueries,
        avgQueryTime: this.metrics.database.queries > 0
          ? (this.metrics.database.totalQueryTime / this.metrics.database.queries).toFixed(2) + 'ms'
          : '0ms',
      },
      webhooks: {
        processed: this.metrics.webhooks.processed,
        failed: this.metrics.webhooks.failed,
        successRate: (this.metrics.webhooks.processed + this.metrics.webhooks.failed) > 0
          ? ((this.metrics.webhooks.processed / (this.metrics.webhooks.processed + this.metrics.webhooks.failed)) * 100).toFixed(2) + '%'
          : '0%',
        avgProcessingTime: this.metrics.webhooks.avgProcessingTime.toFixed(2) + 'ms',
      },
      emails: {
        sent: this.metrics.emails.sent,
        failed: this.metrics.emails.failed,
        successRate: (this.metrics.emails.sent + this.metrics.emails.failed) > 0
          ? ((this.metrics.emails.sent / (this.metrics.emails.sent + this.metrics.emails.failed)) * 100).toFixed(2) + '%'
          : '0%',
      },
    };
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byEndpoint: {},
        byStatus: {},
      },
      responseTimes: {
        endpoints: new Map(),
        methods: new Map(),
      },
      errors: {
        total: 0,
        byEndpoint: {},
        byType: {},
      },
      database: {
        queries: 0,
        slowQueries: 0,
        totalQueryTime: 0,
      },
      webhooks: {
        processed: 0,
        failed: 0,
        avgProcessingTime: 0,
      },
      emails: {
        sent: 0,
        failed: 0,
      },
    };
  }

  /**
   * Export metrics (for external monitoring systems)
   * NO customer data included
   */
  export() {
    return {
      timestamp: new Date().toISOString(),
      summary: this.getSummary(),
    };
  }
}

// Export singleton instance
module.exports = new PerformanceMonitor();





