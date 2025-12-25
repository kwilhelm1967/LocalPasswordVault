/**
 * Webhook Handler Tests
 * 
 * Tests for Stripe webhook processing, license generation, and email delivery.
 * 
 * Note: These tests require proper mocking of external dependencies.
 * Run with: npm test -- webhooks.test.js
 */

const request = require('supertest');
const express = require('express');

// Mock dependencies before requiring routes
jest.mock('../database/db');
jest.mock('../services/stripe', () => {
  const mockStripe = {
    checkout: {
      sessions: {
        listLineItems: jest.fn(),
      },
    },
  };
  return {
    stripe: mockStripe,
    verifyWebhookSignature: jest.fn(),
    getCheckoutSession: jest.fn(),
    getProductByPriceId: jest.fn(),
    PRODUCTS: {},
  };
});
jest.mock('../services/email');
jest.mock('../services/licenseGenerator');
jest.mock('../utils/logger', () => ({
  webhook: jest.fn(),
  webhookError: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  email: jest.fn(),
  emailError: jest.fn(),
  dbError: jest.fn(),
  maskEmail: jest.fn((email) => email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'unknown'),
}));
jest.mock('../utils/performanceMonitor', () => ({
  trackWebhook: jest.fn(),
  trackRequest: jest.fn(),
  trackDatabaseQuery: jest.fn(),
  trackEmail: jest.fn(),
}));

const webhooksRouter = require('../routes/webhooks');
const db = require('../database/db');
const stripeService = require('../services/stripe');

const app = express();
app.use(express.json());
app.use('/api/webhooks', webhooksRouter);

describe('Webhook Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/webhooks/stripe', () => {
    it('should reject requests without signature', async () => {
      const response = await request(app)
        .post('/api/webhooks/stripe')
        .send({ type: 'checkout.session.completed' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Webhook Error');
    });

    it('should reject invalid signatures', async () => {
      stripeService.verifyWebhookSignature.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'invalid-signature')
        .send({ type: 'checkout.session.completed' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Webhook Error');
    });

    it('should ignore duplicate events', async () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test_123' } },
      };

      stripeService.verifyWebhookSignature.mockReturnValue(mockEvent);
      db.webhookEvents.exists.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid-signature')
        .send(mockEvent);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
      expect(response.body.duplicate).toBe(true);
    });

    it('should process checkout.session.completed events', async () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer_email: 'test@example.com',
            amount_total: 4900,
          },
        },
      };

      stripeService.verifyWebhookSignature.mockReturnValue(mockEvent);
      stripeService.getCheckoutSession.mockResolvedValue({
        id: 'cs_test_123',
        customer_email: 'test@example.com',
        amount_total: 4900,
      });
      stripeService.stripe = {
        checkout: {
          sessions: {
            listLineItems: jest.fn().mockResolvedValue({
              data: [{
                price: { id: process.env.STRIPE_PRICE_PERSONAL || 'price_personal' },
                amount_total: 4900,
                quantity: 1,
              }],
            }),
          },
        },
      };
      stripeService.getProductByPriceId.mockReturnValue({
        key: 'personal',
        name: 'Personal Vault',
        price: 4900,
        maxDevices: 1,
        productType: 'lpv',
      });
      db.webhookEvents.exists.mockResolvedValue(false);
      db.webhookEvents.create.mockResolvedValue({});
      db.webhookEvents.markProcessed.mockResolvedValue({});
      db.licenses.findAllBySessionId.mockResolvedValue([]);
      db.customers.findByEmail.mockResolvedValue(null);
      db.customers.create.mockResolvedValue({ id: 1, email: 'test@example.com' });
      db.trials.findByEmail.mockResolvedValue(null);
      
      const licenseGenerator = require('../services/licenseGenerator');
      licenseGenerator.generatePersonalKey.mockReturnValue('PERS-TEST-1234-5678');
      
      const emailService = require('../services/email');
      emailService.sendPurchaseEmail.mockResolvedValue({});
      
      db.licenses.create.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid-signature')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(mockEvent));

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should handle payment_intent.succeeded events', async () => {
      const mockEvent = {
        id: 'evt_test_456',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test_123' } },
      };

      stripeService.verifyWebhookSignature.mockReturnValue(mockEvent);
      db.webhookEvents.exists.mockResolvedValue(false);
      db.webhookEvents.create.mockResolvedValue({});
      db.webhookEvents.markProcessed.mockResolvedValue({});

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid-signature')
        .send(mockEvent);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should handle processing errors gracefully', async () => {
      const mockEvent = {
        id: 'evt_test_789',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test_123' } },
      };

      stripeService.verifyWebhookSignature.mockReturnValue(mockEvent);
      db.webhookEvents.exists.mockResolvedValue(false);
      db.webhookEvents.create.mockResolvedValue({});
      db.licenses.findAllBySessionId.mockRejectedValue(new Error('Database error'));
      db.webhookEvents.markError.mockResolvedValue({});

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid-signature')
        .send(mockEvent);

      expect(response.status).toBe(200);
      expect(db.webhookEvents.markError).toHaveBeenCalled();
    });

    it('should handle family plan purchase (5 keys)', async () => {
      const mockEvent = {
        id: 'evt_family_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_family_123',
            customer_email: 'family@example.com',
            amount_total: 7900,
          },
        },
      };

      stripeService.verifyWebhookSignature.mockReturnValue(mockEvent);
      stripeService.getCheckoutSession.mockResolvedValue({
        id: 'cs_family_123',
        customer_email: 'family@example.com',
        amount_total: 7900,
      });
      
      // Mock the stripe object that's imported in the route
      stripeService.stripe.checkout.sessions.listLineItems.mockResolvedValue({
        data: [{
          price: { id: process.env.STRIPE_PRICE_FAMILY || 'price_family' },
          amount_total: 7900,
          quantity: 1,
        }],
      });
      stripeService.getProductByPriceId.mockReturnValue({
        key: 'family',
        name: 'Family Vault',
        price: 7900,
        maxDevices: 5,
        productType: 'lpv',
        priceId: process.env.STRIPE_PRICE_FAMILY || 'price_family',
      });
      db.webhookEvents.exists.mockResolvedValue(false);
      db.webhookEvents.create.mockResolvedValue({});
      db.webhookEvents.markProcessed.mockResolvedValue({});
      db.licenses.findAllBySessionId.mockResolvedValue([]);
      db.customers.findByEmail.mockResolvedValue(null);
      db.customers.create.mockResolvedValue({ id: 1, email: 'family@example.com' });
      db.trials.findByEmail.mockResolvedValue(null);
      
      const licenseGenerator = require('../services/licenseGenerator');
      licenseGenerator.generateFamilyKey
        .mockReturnValueOnce('FMLY-KEY1-1234-5678')
        .mockReturnValueOnce('FMLY-KEY2-1234-5678')
        .mockReturnValueOnce('FMLY-KEY3-1234-5678')
        .mockReturnValueOnce('FMLY-KEY4-1234-5678')
        .mockReturnValueOnce('FMLY-KEY5-1234-5678');
      
      const emailService = require('../services/email');
      emailService.sendPurchaseEmail.mockResolvedValue({});
      
      db.licenses.create.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid-signature')
        .send(JSON.stringify(mockEvent));

      expect(response.status).toBe(200);
      expect(licenseGenerator.generateFamilyKey).toHaveBeenCalledTimes(5);
      expect(db.licenses.create).toHaveBeenCalledTimes(5);
    });

    it('should handle bundle purchase (multiple products)', async () => {
      const mockEvent = {
        id: 'evt_bundle_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_bundle_123',
            customer_email: 'bundle@example.com',
            amount_total: 12800,
            metadata: { is_bundle: 'true' },
          },
        },
      };

      stripeService.verifyWebhookSignature.mockReturnValue(mockEvent);
      stripeService.getCheckoutSession.mockResolvedValue({
        id: 'cs_bundle_123',
        customer_email: 'bundle@example.com',
        amount_total: 12800,
        metadata: { is_bundle: 'true' },
      });
      stripeService.stripe.checkout.sessions.listLineItems.mockResolvedValue({
        data: [
          {
            price: { id: process.env.STRIPE_PRICE_PERSONAL || 'price_personal' },
            amount_total: 4900,
            quantity: 1,
          },
          {
            price: { id: process.env.STRIPE_PRICE_FAMILY || 'price_family' },
            amount_total: 7900,
            quantity: 1,
          },
        ],
      });
      stripeService.getProductByPriceId
        .mockReturnValueOnce({
          key: 'personal',
          name: 'Personal Vault',
          price: 4900,
          maxDevices: 1,
          productType: 'lpv',
        })
        .mockReturnValueOnce({
          key: 'family',
          name: 'Family Vault',
          price: 7900,
          maxDevices: 5,
          productType: 'lpv',
        });
      db.webhookEvents.exists.mockResolvedValue(false);
      db.webhookEvents.create.mockResolvedValue({});
      db.webhookEvents.markProcessed.mockResolvedValue({});
      db.licenses.findAllBySessionId.mockResolvedValue([]);
      db.customers.findByEmail.mockResolvedValue(null);
      db.customers.create.mockResolvedValue({ id: 1, email: 'bundle@example.com' });
      db.trials.findByEmail.mockResolvedValue(null);
      
      const licenseGenerator = require('../services/licenseGenerator');
      licenseGenerator.generatePersonalKey.mockReturnValue('PERS-BUNDLE-1234');
      licenseGenerator.generateFamilyKey
        .mockReturnValueOnce('FMLY-BUNDLE-1')
        .mockReturnValueOnce('FMLY-BUNDLE-2')
        .mockReturnValueOnce('FMLY-BUNDLE-3')
        .mockReturnValueOnce('FMLY-BUNDLE-4')
        .mockReturnValueOnce('FMLY-BUNDLE-5');
      
      const emailService = require('../services/email');
      emailService.sendBundleEmail.mockResolvedValue({});
      
      db.licenses.create.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid-signature')
        .send(JSON.stringify(mockEvent));

      expect(response.status).toBe(200);
      expect(licenseGenerator.generatePersonalKey).toHaveBeenCalledTimes(1);
      expect(licenseGenerator.generateFamilyKey).toHaveBeenCalledTimes(5);
      expect(emailService.sendBundleEmail).toHaveBeenCalled();
      expect(db.licenses.create).toHaveBeenCalledTimes(6); // 1 personal + 5 family
    });

    it('should skip discount line items', async () => {
      const mockEvent = {
        id: 'evt_discount_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_discount_123',
            customer_email: 'discount@example.com',
            amount_total: 4410, // After discount
          },
        },
      };

      stripeService.verifyWebhookSignature.mockReturnValue(mockEvent);
      stripeService.getCheckoutSession.mockResolvedValue({
        id: 'cs_discount_123',
        customer_email: 'discount@example.com',
        amount_total: 4410,
      });
      stripeService.stripe.checkout.sessions.listLineItems.mockResolvedValue({
        data: [
          {
            price: { id: process.env.STRIPE_PRICE_PERSONAL || 'price_personal' },
            amount_total: 4900,
            quantity: 1,
          },
          {
            price: { id: 'price_discount' },
            amount_total: -490, // Discount line item
            quantity: 1,
            description: 'Bundle Discount',
          },
        ],
      });
      stripeService.getProductByPriceId
        .mockReturnValueOnce({
          key: 'personal',
          name: 'Personal Vault',
          price: 4900,
          maxDevices: 1,
          productType: 'lpv',
        })
        .mockReturnValueOnce(null); // Discount item not in catalog
      db.webhookEvents.exists.mockResolvedValue(false);
      db.webhookEvents.create.mockResolvedValue({});
      db.webhookEvents.markProcessed.mockResolvedValue({});
      db.licenses.findAllBySessionId.mockResolvedValue([]);
      db.customers.findByEmail.mockResolvedValue(null);
      db.customers.create.mockResolvedValue({ id: 1 });
      db.trials.findByEmail.mockResolvedValue(null);
      
      const licenseGenerator = require('../services/licenseGenerator');
      licenseGenerator.generatePersonalKey.mockReturnValue('PERS-DISC-1234');
      
      const emailService = require('../services/email');
      emailService.sendPurchaseEmail.mockResolvedValue({});
      
      db.licenses.create.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid-signature')
        .send(JSON.stringify(mockEvent));

      expect(response.status).toBe(200);
      // Should only create 1 license (discount skipped)
      expect(db.licenses.create).toHaveBeenCalledTimes(1);
    });

    it('should handle missing customer email', async () => {
      const mockEvent = {
        id: 'evt_no_email',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_no_email',
          },
        },
      };

      stripeService.verifyWebhookSignature.mockReturnValue(mockEvent);
      stripeService.getCheckoutSession.mockResolvedValue({
        id: 'cs_no_email',
        // No customer_email or customer_details
      });
      stripeService.stripe.checkout.sessions.listLineItems.mockResolvedValue({ data: [] });
      db.webhookEvents.exists.mockResolvedValue(false);
      db.webhookEvents.create.mockResolvedValue({});
      db.licenses.findAllBySessionId.mockResolvedValue([]);
      db.webhookEvents.markError.mockResolvedValue({});

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid-signature')
        .send(JSON.stringify(mockEvent));

      expect(response.status).toBe(200);
      expect(db.webhookEvents.markError).toHaveBeenCalled();
    });

    it('should handle email sending failure', async () => {
      const mockEvent = {
        id: 'evt_email_fail',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_email_fail',
            customer_email: 'emailfail@example.com',
            amount_total: 4900,
          },
        },
      };

      stripeService.verifyWebhookSignature.mockReturnValue(mockEvent);
      stripeService.getCheckoutSession.mockResolvedValue({
        id: 'cs_email_fail',
        customer_email: 'emailfail@example.com',
        amount_total: 4900,
      });
      stripeService.stripe.checkout.sessions.listLineItems.mockResolvedValue({
        data: [{
          price: { id: process.env.STRIPE_PRICE_PERSONAL || 'price_personal' },
          amount_total: 4900,
          quantity: 1,
        }],
      });
      stripeService.getProductByPriceId.mockReturnValue({
        key: 'personal',
        name: 'Personal Vault',
        price: 4900,
        maxDevices: 1,
        productType: 'lpv',
      });
      db.webhookEvents.exists.mockResolvedValue(false);
      db.webhookEvents.create.mockResolvedValue({});
      db.webhookEvents.markProcessed.mockResolvedValue({});
      db.licenses.findAllBySessionId.mockResolvedValue([]);
      db.customers.findByEmail.mockResolvedValue(null);
      db.customers.create.mockResolvedValue({ id: 1 });
      db.trials.findByEmail.mockResolvedValue(null);
      
      const licenseGenerator = require('../services/licenseGenerator');
      licenseGenerator.generatePersonalKey.mockReturnValue('PERS-EMAIL-FAIL');
      
      const emailService = require('../services/email');
      emailService.sendPurchaseEmail.mockRejectedValue(new Error('Email service down'));
      
      db.licenses.create.mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid-signature')
        .send(JSON.stringify(mockEvent));

      // Should still succeed (license created, email failure logged)
      expect(response.status).toBe(200);
      expect(db.licenses.create).toHaveBeenCalled();
    });

    it('should handle trial conversion', async () => {
      const mockEvent = {
        id: 'evt_trial_conv',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_trial_conv',
            customer_email: 'trial@example.com',
            amount_total: 4900,
          },
        },
      };

      stripeService.verifyWebhookSignature.mockReturnValue(mockEvent);
      stripeService.getCheckoutSession.mockResolvedValue({
        id: 'cs_trial_conv',
        customer_email: 'trial@example.com',
        amount_total: 4900,
      });
      stripeService.stripe.checkout.sessions.listLineItems.mockResolvedValue({
        data: [{
          price: { id: process.env.STRIPE_PRICE_PERSONAL || 'price_personal' },
          amount_total: 4900,
          quantity: 1,
        }],
      });
      stripeService.getProductByPriceId.mockReturnValue({
        key: 'personal',
        name: 'Personal Vault',
        price: 4900,
        maxDevices: 1,
        productType: 'lpv',
      });
      db.webhookEvents.exists.mockResolvedValue(false);
      db.webhookEvents.create.mockResolvedValue({});
      db.webhookEvents.markProcessed.mockResolvedValue({});
      db.licenses.findAllBySessionId.mockResolvedValue([]);
      db.customers.findByEmail.mockResolvedValue(null);
      db.customers.create.mockResolvedValue({ id: 1 });
      db.trials.findByEmail.mockResolvedValue({
        email: 'trial@example.com',
        trial_key: 'TRIA-OLD-1234',
        expires_at: new Date().toISOString(),
      });
      
      const licenseGenerator = require('../services/licenseGenerator');
      licenseGenerator.generatePersonalKey.mockReturnValue('PERS-TRIAL-CONV');
      
      const emailService = require('../services/email');
      emailService.sendPurchaseEmail.mockResolvedValue({});
      
      db.licenses.create.mockResolvedValue({ id: 1 });
      db.licenses.findByKey.mockResolvedValue({ id: 1 });
      db.trials.markConverted.mockResolvedValue({});

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid-signature')
        .send(JSON.stringify(mockEvent));

      expect(response.status).toBe(200);
      expect(db.trials.markConverted).toHaveBeenCalled();
    });

    it('should handle unknown product types gracefully', async () => {
      const mockEvent = {
        id: 'evt_unknown',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_unknown',
            customer_email: 'unknown@example.com',
            amount_total: 4900,
          },
        },
      };

      stripeService.verifyWebhookSignature.mockReturnValue(mockEvent);
      stripeService.getCheckoutSession.mockResolvedValue({
        id: 'cs_unknown',
        customer_email: 'unknown@example.com',
        amount_total: 4900,
      });
      stripeService.stripe = {
        checkout: {
          sessions: {
            listLineItems: jest.fn().mockResolvedValue({
              data: [{
                price: { id: 'price_unknown_product' },
                amount_total: 4900,
                quantity: 1,
              }],
            }),
          },
        },
      };
      stripeService.getProductByPriceId.mockReturnValue(null); // Unknown product
      db.webhookEvents.exists.mockResolvedValue(false);
      db.webhookEvents.create.mockResolvedValue({});
      db.webhookEvents.markProcessed.mockResolvedValue({});
      db.licenses.findAllBySessionId.mockResolvedValue([]);
      db.webhookEvents.markError.mockResolvedValue({});

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'valid-signature')
        .send(JSON.stringify(mockEvent));

      expect(response.status).toBe(200);
      expect(db.webhookEvents.markError).toHaveBeenCalled();
    });
  });
});

