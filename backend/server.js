require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const performanceMonitor = require('./utils/performanceMonitor');

const licensesRouter = require('./routes/licenses');
const lpvLicensesRouter = require('./routes/lpv-licenses');
const trialRouter = require('./routes/trial');
const webhooksRouter = require('./routes/webhooks');
const checkoutRouter = require('./routes/checkout');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());

const allowedOrigins = [
  'https://localpasswordvault.com',
  'https://www.localpasswordvault.com',
];

if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Performance monitoring middleware (tracks response times - NO customer data)
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Track response time after response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    performanceMonitor.trackRequest(req.method, req.path, res.statusCode, duration);
  });
  
  next();
});

// Webhook endpoint needs raw body for Stripe signature verification
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhooks/stripe') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Performance metrics endpoint (NO customer data)
app.get('/metrics', (req, res) => {
  // Optional: Add basic auth or IP whitelist for production
  const summary = performanceMonitor.getSummary();
  res.json({
    timestamp: new Date().toISOString(),
    metrics: summary,
  });
});

app.use('/api/licenses', licensesRouter);
app.use('/api/lpv/license', lpvLicensesRouter);
app.use('/api/trial', trialRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/checkout', checkoutRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  logger.error('Server error', err, {
    path: req.path,
    method: req.method,
    operation: 'server_error_handler',
  });
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

db.initialize().catch(err => {
  logger.warn('Database initialization warning', {
    message: err.message,
    operation: 'database_init',
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    operation: 'server_start',
  });
});

module.exports = app;

