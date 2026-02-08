const express = require('express');
const { createCheckoutSession, createBundleCheckoutSession, PRODUCTS } = require('../services/stripe');
const logger = require('../utils/logger');

const router = express.Router();

router.post('/session', async (req, res) => {
  try {
    const { planType, email } = req.body;
    
    // LPV only: plan types that exist in Stripe PRODUCTS (personal, family, afterpassing)
    const validPlanTypes = ['personal', 'family', 'afterpassing_addon', 'afterpassing_standalone'];
    const actualPlanType = planType;
    
    if (!actualPlanType || !validPlanTypes.includes(actualPlanType)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid plan type. Must be one of: ${validPlanTypes.join(', ')}` 
      });
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
      const errorMsg = 'STRIPE_SECRET_KEY environment variable is not set. Payment processing cannot be initialized.';
      logger.error('Stripe not configured', new Error(errorMsg), {
        planType: actualPlanType,
        operation: 'checkout_session_creation',
      });
      return res.status(500).json({ 
        success: false, 
        error: `Payment processing is not configured. Please contact ${process.env.SUPPORT_EMAIL || 'support@localpasswordvault.com'}`,
        errorCode: 'STRIPE_NOT_CONFIGURED'
      });
    }
    
    const isAfterpassing = actualPlanType.startsWith('afterpassing_');
    const baseUrl = isAfterpassing
      ? (process.env.AFTERPASSING_WEBSITE_URL || 'https://afterpassingguide.com')
      : (process.env.WEBSITE_URL || 'https://localpasswordvault.com');
    
    const successUrl = `${baseUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/pricing?cancelled=true`;
    
    const session = await createCheckoutSession(
      actualPlanType,
      email || null,
      successUrl,
      cancelUrl
    );
    
    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
    
  } catch (error) {
    const errorMessage = error.message || 'Unknown error';
    const stripeError = error.type || error.code || '';
    
    logger.error('Checkout session error', error, {
      planType: req.body?.planType,
      errorMessage: errorMessage,
      errorType: error.constructor.name,
      stripeError: stripeError,
      stripeErrorType: error.type,
      operation: 'checkout_session_creation',
      stack: error.stack,
    });
    
    // Return actual error message - this helps diagnose the issue
    let userMessage = errorMessage;
    
    // Handle specific error cases
    if (errorMessage.includes('STRIPE_SECRET_KEY')) {
      userMessage = 'Payment system is not configured. Please contact support@localpasswordvault.com';
    } else if (error.type && error.type.startsWith('Stripe')) {
      if (error.code === 'api_key_expired' || error.code === 'invalid_api_key') {
        userMessage = 'Payment system configuration error. Please contact support.';
      } else if (error.message) {
        userMessage = `Payment error: ${error.message}`;
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: userMessage,
      errorCode: stripeError || error.code || 'UNKNOWN',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId || !sessionId.startsWith('cs_')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid session ID' 
      });
    }
    
    const db = require('../database/db');
    const licenses = await db.licenses.findAllBySessionId(sessionId);
    
    if (!licenses || licenses.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'License not found. Please wait a moment and refresh.',
        pending: true,
      });
    }
    
    // Single purchase
    if (licenses.length === 1) {
      res.json({
        success: true,
        data: {
          licenseKey: licenses[0].license_key,
          planType: licenses[0].plan_type,
          email: licenses[0].email,
          maxDevices: licenses[0].max_devices,
          createdAt: licenses[0].created_at,
        },
      });
    } else {
      // Bundle purchase
      res.json({
        success: true,
        isBundle: true,
        data: {
          licenses: licenses.map(license => ({
            licenseKey: license.license_key,
            planType: license.plan_type,
            productType: license.product_type,
            maxDevices: license.max_devices,
          })),
          email: licenses[0].email,
          totalKeys: licenses.length,
          createdAt: licenses[0].created_at,
        },
      });
    }
    
  } catch (error) {
    logger.error('Get session error', error, {
      sessionId: req.params?.sessionId,
      operation: 'checkout_session_retrieval',
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve session' 
    });
  }
});

router.post('/bundle', async (req, res) => {
  try {
    const { items, email } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid items. Must be a non-empty array of { productKey, quantity } objects.' 
      });
    }
    
    const seenProductKeys = new Set();
    const productTypes = new Set();
    
    for (const item of items) {
      if (!item.productKey || !PRODUCTS[item.productKey]) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid product key: ${item.productKey}. Valid keys: ${Object.keys(PRODUCTS).join(', ')}` 
        });
      }
      
      // Prevent duplicate products in bundle
      if (seenProductKeys.has(item.productKey)) {
        return res.status(400).json({ 
          success: false, 
          error: `Duplicate product in bundle: ${item.productKey}. Each product can only appear once in a bundle.` 
        });
      }
      seenProductKeys.add(item.productKey);
      
      // Track product types for validation
      const product = PRODUCTS[item.productKey];
      productTypes.add(product.productType || 'lpv');
    }
    
    if (items.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Bundle must contain at least 2 products. For single product purchases, use the regular checkout.' 
      });
    }
    
    // LPV only: reject bundles that include LLV products
    const hasLLVProduct = items.some(item => {
      const product = PRODUCTS[item.productKey];
      return product && product.productType === 'llv';
    });
    if (hasLLVProduct) {
      return res.status(400).json({ 
        success: false, 
        error: 'This checkout only supports Local Password Vault products. LLV products are not available here.' 
      });
    }
    
    const baseUrl = process.env.WEBSITE_URL || 'https://localpasswordvault.com';
    const successUrl = `${baseUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/pricing?cancelled=true`;
    
    const session = await createBundleCheckoutSession(
      items,
      email || null,
      successUrl,
      cancelUrl
    );
    
    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
    
  } catch (error) {
    logger.error('Bundle checkout session error', error, {
      items: req.body?.items,
      operation: 'bundle_checkout_session_creation',
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create bundle checkout session' 
    });
  }
});

router.get('/products', (req, res) => {
  res.json({
    success: true,
    products: Object.entries(PRODUCTS).map(([id, product]) => ({
      id,
      name: product.name,
      description: product.description,
      price: product.price,
      priceFormatted: `$${(product.price / 100).toFixed(2)}`,
      maxDevices: product.maxDevices,
      productType: product.productType,
    })),
  });
});

// Alias for /session endpoint (backward compatibility)
router.post('/', async (req, res) => {
  // Forward to /session endpoint
  req.url = '/session';
  router.handle(req, res);
});

module.exports = router;

