const express = require('express');
const db = require('../database/db');
const { getStripeInstance, verifyWebhookSignature, getCheckoutSession, PRODUCTS, getProductByPriceId } = require('../services/stripe');
const { 
  generatePersonalKey, 
  generateFamilyKey, 
  generateAfterPassingAddonKey,
  generateAfterPassingStandaloneKey
} = require('../services/licenseGenerator');
const { sendPurchaseEmail, sendBundleEmail } = require('../services/email');
const { signLicenseFile } = require('../services/licenseSigner');
const logger = require('../utils/logger');
const performanceMonitor = require('../utils/performanceMonitor');

const router = express.Router();

// Webhook failure tracking for alerts
const webhookFailureTracker = {
  consecutiveFailures: 0,
  lastFailureTime: null,
  lastAlertTime: null,
  FAILURE_THRESHOLD: 3, // Alert after 3 consecutive failures
  ALERT_COOLDOWN: 3600000, // 1 hour between alerts
};

/**
 * Check if webhook failure alert should be sent
 */
async function checkAndSendWebhookAlert(eventType, eventId, error) {
  webhookFailureTracker.consecutiveFailures++;
  webhookFailureTracker.lastFailureTime = new Date();

  // Check if we should send an alert
  if (webhookFailureTracker.consecutiveFailures >= webhookFailureTracker.FAILURE_THRESHOLD) {
    const now = Date.now();
    const lastAlert = webhookFailureTracker.lastAlertTime?.getTime() || 0;
    
    // Only send alert if cooldown period has passed
    if (now - lastAlert > webhookFailureTracker.ALERT_COOLDOWN) {
      webhookFailureTracker.lastAlertTime = new Date();
      
      try {
        const { sendAlertEmail } = require('../services/email');
        await sendAlertEmail({
          subject: `⚠️ Webhook Failure Alert: ${webhookFailureTracker.consecutiveFailures} Consecutive Failures`,
          message: `Webhook processing has failed ${webhookFailureTracker.consecutiveFailures} times in a row.\n\n` +
                   `Event Type: ${eventType}\n` +
                   `Event ID: ${eventId}\n` +
                   `Error: ${error?.message || 'Unknown error'}\n` +
                   `Time: ${new Date().toISOString()}\n\n` +
                   `Please check the backend logs and Stripe webhook configuration.`,
        });
        
        logger.warn('Webhook failure alert sent', {
          consecutiveFailures: webhookFailureTracker.consecutiveFailures,
          eventType,
          eventId,
          operation: 'webhook_alert',
        });
      } catch (alertError) {
        logger.error('Failed to send webhook failure alert', alertError, {
          operation: 'webhook_alert_send',
        });
      }
    }
  }
}

/**
 * Reset failure counter on successful webhook
 */
function resetWebhookFailureCounter() {
  if (webhookFailureTracker.consecutiveFailures > 0) {
    logger.info('Webhook processing succeeded, resetting failure counter', {
      previousFailures: webhookFailureTracker.consecutiveFailures,
      operation: 'webhook_recovery',
    });
  }
  webhookFailureTracker.consecutiveFailures = 0;
}

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const webhookStartTime = Date.now();
  
  let event;
  try {
    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }
    event = verifyWebhookSignature(req.body, signature);
  } catch (error) {
    logger.webhookError('signature_verification', null, error, {
      operation: 'webhook_verification',
      requestId: req.requestId,
    });
    const duration = Date.now() - webhookStartTime;
    performanceMonitor.trackWebhook('signature_verification', false, duration);
    
    // Track signature verification failures
    await checkAndSendWebhookAlert('signature_verification', null, error);
    
    return res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
  
  // Prevent duplicate processing (idempotency)
  const existingEvent = await db.webhookEvents.exists(event.id);
  if (existingEvent) {
    logger.webhook(event.type, event.id, { duplicate: true });
    const duration = Date.now() - webhookStartTime;
    performanceMonitor.trackWebhook(event.type, true, duration);
    return res.json({ received: true, duplicate: true });
  }
  
  try {
    await db.webhookEvents.create({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: JSON.stringify(event.data),
    });
  } catch (logError) {
    logger.dbError('create', 'webhook_events', logError, {
      eventId: event.id,
      eventType: event.type,
    });
  }
  
  try {
    let webhookSuccess = false;
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        webhookSuccess = true;
        break;
      case 'payment_intent.succeeded':
        logger.info('Payment succeeded', {
          paymentIntentId: event.data.object.id,
          eventId: event.id,
        });
        webhookSuccess = true;
        break;
      case 'payment_intent.payment_failed':
        logger.warn('Payment failed', {
          paymentIntentId: event.data.object.id,
          eventId: event.id,
        });
        webhookSuccess = true; // Processed successfully, payment just failed
        break;
      default:
        logger.debug(`Unhandled event type: ${event.type}`, {
          eventId: event.id,
          eventType: event.type,
        });
        webhookSuccess = true;
    }
    
    await db.webhookEvents.markProcessed(event.id);
    
    const webhookDuration = Date.now() - webhookStartTime;
    performanceMonitor.trackWebhook(event.type, webhookSuccess, webhookDuration);
    
    // Reset failure counter on success
    resetWebhookFailureCounter();
  } catch (error) {
    logger.webhookError(event.type, event.id, error, {
      operation: 'webhook_processing',
      requestId: req.requestId,
    });
    await db.webhookEvents.markError(event.id, error.message);
    
    const webhookDuration = Date.now() - webhookStartTime;
    performanceMonitor.trackWebhook(event.type, false, webhookDuration);
    
    // Check and send alert if threshold reached
    await checkAndSendWebhookAlert(event.type, event.id, error);
  }
  
  res.json({ received: true });
});

async function handleCheckoutCompleted(session) {
  logger.info('Processing checkout session', {
    sessionId: session.id,
    operation: 'checkout_processing',
  });
  
  const existingLicenses = await db.licenses.findAllBySessionId(session.id);
  if (existingLicenses && existingLicenses.length > 0) {
    logger.info('License(s) already exist for session', {
      sessionId: session.id,
      licenseCount: existingLicenses.length,
      operation: 'checkout_duplicate',
    });
    return;
  }
  
  const fullSession = await getCheckoutSession(session.id);
  const stripe = getStripeInstance();
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ['data.price.product'],
  });
  
  const customerEmail = fullSession.customer_email || fullSession.customer_details?.email;
  if (!customerEmail) {
    throw new Error('No customer email found in checkout session');
  }
  
  let customer = await db.customers.findByEmail(customerEmail);
  if (!customer) {
    customer = await db.customers.create({
      email: customerEmail,
      stripe_customer_id: fullSession.customer || null,
      name: fullSession.customer_details?.name || null,
    });
  } else if (fullSession.customer && !customer.stripe_customer_id) {
    customer = await db.customers.updateStripeId({
      email: customerEmail,
      stripe_customer_id: fullSession.customer,
    });
  }
  
  const licenses = [];
  const isBundle = lineItems.data.length > 1 || fullSession.metadata?.is_bundle === 'true';
  
  // Process each line item and generate license keys
  for (const lineItem of lineItems.data) {
    // Skip discount line items (negative amounts)
    if (lineItem.amount_total < 0 || (lineItem.price && lineItem.price.unit_amount < 0)) {
      logger.debug('Skipping discount line item', {
        description: lineItem.description,
        amount: lineItem.amount_total,
        sessionId: session.id,
        operation: 'checkout_discount_skip',
      });
      continue;
    }
    
    // Skip line items without price ID (custom price_data items not in our product catalog)
    if (!lineItem.price || !lineItem.price.id) {
      logger.warn('Line item missing price ID', {
        description: lineItem.description,
        sessionId: session.id,
        operation: 'checkout_missing_price_id',
      });
      continue;
    }
    
    const priceId = lineItem.price.id;
    const product = getProductByPriceId(priceId);
    
    if (!product) {
      logger.warn('Unknown price ID in checkout', {
        priceId,
        sessionId: session.id,
        operation: 'checkout_unknown_product',
      });
      continue;
    }
    
    // Determine plan type and key generator
    let planType, numKeys, keyGenerator;
    if (product.key === 'personal') {
      planType = 'personal';
      numKeys = 1;
      keyGenerator = generatePersonalKey;
    } else if (product.key === 'family') {
      planType = 'family';
      numKeys = 5;
      keyGenerator = generateFamilyKey;
    } else if (product.key === 'llv_personal' || product.key === 'llv_family') {
      // LPV backend: do not issue LLV keys; skip this line item
      logger.warn('Skipping LLV product in LPV webhook', { productKey: product.key, sessionId: session.id });
      continue;
    } else if (product.key === 'afterpassing_addon') {
      planType = 'afterpassing_addon';
      numKeys = 1;
      keyGenerator = generateAfterPassingAddonKey;
    } else if (product.key === 'afterpassing_standalone') {
      planType = 'afterpassing_standalone';
      numKeys = 1;
      keyGenerator = generateAfterPassingStandaloneKey;
    } else {
      logger.warn('Unknown product key', {
        productKey: product.key,
        priceId,
        sessionId: session.id,
        operation: 'checkout_unknown_product_key',
      });
      continue;
    }
    
    const lineItemAmount = lineItem.amount_total || (product.price * lineItem.quantity);
    const productKeys = [];
    const maxDevicesPerKey = 1;

    // Generate keys (1 for personal, 5 for family)
    // Family plan: 5 separate keys, each for 1 device (no sharing)
    // Personal plan: 1 key for 1 device
    for (let i = 0; i < numKeys; i++) {
      const licenseKey = keyGenerator();

      await db.licenses.create({
        license_key: licenseKey,
        plan_type: planType,
        product_type: product.productType || 'lpv',
        customer_id: customer?.id || null,
        email: customerEmail,
        stripe_payment_id: fullSession.payment_intent?.id || null,
        stripe_checkout_session_id: session.id,
        amount_paid: lineItemAmount / numKeys,
        max_devices: maxDevicesPerKey,
      });

      productKeys.push(licenseKey);
      logger.info('License created', {
        licenseKey,
        productName: product.name,
        customerEmail: logger.maskEmail(customerEmail),
        operation: 'license_creation',
      });
    }

    licenses.push({
      keys: productKeys,
      planType: planType,
      productName: product.name,
      amount: lineItemAmount,
      maxDevices: product.maxDevices,
    });
  }
  
  if (licenses.length === 0) {
    throw new Error('No valid products found in checkout session');
  }
  
  // Mark trial as converted if customer had one
  const existingTrial = await db.trials.findByEmail(customerEmail);
  if (existingTrial && licenses.length > 0 && licenses[0].keys && licenses[0].keys.length > 0) {
    const firstLicense = await db.licenses.findByKey(licenses[0].keys[0]);
    await db.trials.markConverted({
      email: customerEmail,
      license_id: firstLicense?.id || null,
    });
    logger.info('Trial converted', {
      customerEmail: logger.maskEmail(customerEmail),
      licenseId: firstLicense?.id,
      operation: 'trial_conversion',
    });
  }
  
  // Build signed license file(s) for email attachment (LPV only - like LLV format)
  function buildLicenseFileAttachment(licenseKey, planType, maxDevices = 1) {
    try {
      const signed = signLicenseFile({
        license_key: licenseKey,
        device_id: null,
        plan_type: planType,
        max_devices: maxDevices,
        activated_at: new Date().toISOString(),
        product_type: 'lpv',
        transfer_count: 0,
        last_transfer_at: null,
      });
      const jsonStr = JSON.stringify(signed);
      const content = Buffer.from(jsonStr, 'utf8').toString('base64');
      return { name: 'Local-Password-Vault-License.txt', content };
    } catch (err) {
      logger.error('Failed to build license file for email', err, { licenseKey: licenseKey?.substring(0, 12), operation: 'license_file_attachment' });
      return null;
    }
  }

  // Send appropriate email (bundle vs single purchase) with license key + optional attachment
  try {
    if (isBundle || licenses.length > 1) {
      const licenseFileAttachments = [];
      for (const lic of licenses) {
        for (const key of lic.keys || []) {
          const att = buildLicenseFileAttachment(key, lic.planType, 1);
          if (att) licenseFileAttachments.push(att);
        }
      }
      await sendBundleEmail({
        to: customerEmail,
        licenses: licenses,
        totalAmount: fullSession.amount_total,
        orderId: session.id,
        licenseFileAttachments: licenseFileAttachments.length > 0 ? licenseFileAttachments : null,
      });
      logger.email('bundle_purchase_sent', customerEmail, {
        sessionId: session.id,
        licenseCount: licenses.length,
        operation: 'email_delivery',
      });
    } else {
      const firstKey = licenses[0].keys[0];
      const licenseFileAttachment = buildLicenseFileAttachment(firstKey, licenses[0].planType, licenses[0].planType === 'family' ? 5 : 1);
      await sendPurchaseEmail({
        to: customerEmail,
        licenseKey: firstKey,
        planType: licenses[0].planType,
        amount: licenses[0].amount,
        licenseFileAttachment: licenseFileAttachment || undefined,
      });
      logger.email('purchase_sent', customerEmail, {
        sessionId: session.id,
        planType: licenses[0].planType,
        operation: 'email_delivery',
      });
    }
  } catch (emailError) {
    logger.emailError('purchase_email', customerEmail, emailError, {
      sessionId: session.id,
      isBundle: isBundle || licenses.length > 1,
      operation: 'email_delivery',
      planTypes: licenses.map(l => l.planType),
      errorMessage: emailError.message,
      errorStack: emailError.stack,
    });
    // Don't throw - license was created successfully, email failure is logged
  }
}

module.exports = router;
module.exports.handleCheckoutCompleted = handleCheckoutCompleted;

