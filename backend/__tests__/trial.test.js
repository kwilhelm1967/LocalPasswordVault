/**
 * Trial Signup Tests
 * 
 * Tests for trial signup, status checks, and email delivery.
 * 
 * Note: These tests require proper mocking of external dependencies.
 * Run with: npm test -- trial.test.js
 */

const request = require('supertest');
const express = require('express');

// Mock dependencies before requiring routes
jest.mock('../database/db');
jest.mock('../services/email');
jest.mock('../services/licenseGenerator');
jest.mock('../utils/logger', () => ({
  email: jest.fn(),
  emailError: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  maskEmail: jest.fn((email) => email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : 'unknown'),
}));

const trialRouter = require('../routes/trial');
const db = require('../database/db');
const emailService = require('../services/email');
const licenseGenerator = require('../services/licenseGenerator');

const app = express();
app.use(express.json());
app.use('/api/trial', trialRouter);

describe('Trial Signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/trial/signup', () => {
    it('should reject requests without email', async () => {
      const response = await request(app)
        .post('/api/trial/signup')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email is required');
    });

    it('should reject invalid email formats', async () => {
      const response = await request(app)
        .post('/api/trial/signup')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid email format');
    });

    it('should create new trial for valid email', async () => {
      const email = 'test@example.com';
      const trialKey = 'TRIA-TEST-1234-5678';
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      db.trials.findByEmail.mockResolvedValue(null);
      db.licenses.findByEmail.mockResolvedValue([]);
      db.trials.create.mockResolvedValue({
        email,
        trial_key: trialKey,
        expires_at: expiresAt.toISOString(),
      });
      emailService.sendTrialEmail.mockResolvedValue({});
      licenseGenerator.generateTrialKey.mockReturnValue(trialKey);

      const response = await request(app)
        .post('/api/trial/signup')
        .send({ email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Trial key sent');
      expect(emailService.sendTrialEmail).toHaveBeenCalledWith({
        to: email,
        trialKey,
        expiresAt: expect.any(Date),
      });
    });

    it('should resend trial key if trial exists and is valid', async () => {
      const email = 'existing@example.com';
      const trialKey = 'TRIA-EXIST-1234';
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3); // Still valid

      db.trials.findByEmail.mockResolvedValue({
        email,
        trial_key: trialKey,
        expires_at: expiresAt.toISOString(),
      });
      emailService.sendTrialEmail.mockResolvedValue({});

      const response = await request(app)
        .post('/api/trial/signup')
        .send({ email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Trial key resent');
      expect(emailService.sendTrialEmail).toHaveBeenCalled();
    });

    it('should reject if trial exists but is expired', async () => {
      const email = 'expired@example.com';
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() - 1); // Expired

      db.trials.findByEmail.mockResolvedValue({
        email,
        trial_key: 'TRIA-EXPIRED',
        expires_at: expiresAt.toISOString(),
      });

      const response = await request(app)
        .post('/api/trial/signup')
        .send({ email });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Trial has expired');
      expect(response.body.expired).toBe(true);
    });

    it('should reject if customer already has a license', async () => {
      const email = 'licensed@example.com';

      db.trials.findByEmail.mockResolvedValue(null);
      db.licenses.findByEmail.mockResolvedValue([
        { license_key: 'PERS-XXXX-XXXX-XXXX' },
      ]);

      const response = await request(app)
        .post('/api/trial/signup')
        .send({ email });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already have a license');
      expect(response.body.hasLicense).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      const email = 'test@example.com';

      db.trials.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/trial/signup')
        .send({ email });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to create trial');
    });

    it('should handle email sending failures gracefully', async () => {
      const email = 'test@example.com';
      const trialKey = 'TRIA-TEST-1234';

      db.trials.findByEmail.mockResolvedValue(null);
      db.licenses.findByEmail.mockResolvedValue([]);
      db.trials.create.mockResolvedValue({
        email,
        trial_key: trialKey,
        expires_at: new Date().toISOString(),
      });
      emailService.sendTrialEmail.mockRejectedValue(new Error('Email service unavailable'));
      licenseGenerator.generateTrialKey.mockReturnValue(trialKey);

      // Should still succeed even if email fails
      const response = await request(app)
        .post('/api/trial/signup')
        .send({ email });

      // Trial is created, but email failed (logged but doesn't fail request)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/trial/status/:email', () => {
    it('should return trial status for existing trial', async () => {
      const email = 'test@example.com';
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 5);

      db.trials.findByEmail.mockResolvedValue({
        email,
        trial_key: 'TRIA-TEST-1234',
        expires_at: expiresAt.toISOString(),
        is_activated: true,
        is_converted: false,
      });

      const response = await request(app)
        .get(`/api/trial/status/${email}`);

      expect(response.status).toBe(200);
      expect(response.body.hasTrial).toBe(true);
      expect(response.body.isExpired).toBe(false);
      expect(response.body.isActivated).toBe(true);
      expect(response.body.canStartTrial).toBe(false);
    });

    it('should return no trial status for non-existent trial', async () => {
      const email = 'new@example.com';

      db.trials.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/trial/status/${email}`);

      expect(response.status).toBe(200);
      expect(response.body.hasTrial).toBe(false);
      expect(response.body.canStartTrial).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const email = 'test@example.com';

      db.trials.findByEmail.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(`/api/trial/status/${email}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to check trial status');
    });

    it('should handle expired trial status', async () => {
      const email = 'expired@example.com';
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() - 1); // Expired

      db.trials.findByEmail.mockResolvedValue({
        email,
        trial_key: 'TRIA-EXPIRED',
        expires_at: expiresAt.toISOString(),
        is_activated: true,
        is_converted: false,
      });

      const response = await request(app)
        .get(`/api/trial/status/${email}`);

      expect(response.status).toBe(200);
      expect(response.body.hasTrial).toBe(true);
      expect(response.body.isExpired).toBe(true);
      expect(response.body.canStartTrial).toBe(false);
    });

    it('should handle database connection errors', async () => {
      const email = 'test@example.com';

      db.trials.findByEmail.mockRejectedValue(new Error('Connection timeout'));

      const response = await request(app)
        .get(`/api/trial/status/${email}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to check trial status');
    });

    it('should handle duplicate trial creation attempt', async () => {
      const email = 'duplicate@example.com';
      const trialKey = 'TRIA-DUP-1234';

      db.trials.findByEmail.mockResolvedValue(null);
      db.licenses.findByEmail.mockResolvedValue([]);
      db.trials.create.mockRejectedValue({
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      });
      licenseGenerator.generateTrialKey.mockReturnValue(trialKey);

      const response = await request(app)
        .post('/api/trial/signup')
        .send({ email });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Trial already exists');
    });

    it('should normalize email addresses', async () => {
      const email = '  TEST@EXAMPLE.COM  '; // With spaces and uppercase
      const normalizedEmail = 'test@example.com';
      const trialKey = 'TRIA-NORM-1234';

      db.trials.findByEmail.mockResolvedValue(null);
      db.licenses.findByEmail.mockResolvedValue([]);
      db.trials.create.mockResolvedValue({
        email: normalizedEmail,
        trial_key: trialKey,
        expires_at: new Date().toISOString(),
      });
      emailService.sendTrialEmail.mockResolvedValue({});
      licenseGenerator.generateTrialKey.mockReturnValue(trialKey);

      const response = await request(app)
        .post('/api/trial/signup')
        .send({ email });

      expect(response.status).toBe(200);
      expect(db.trials.findByEmail).toHaveBeenCalledWith(normalizedEmail);
      expect(db.trials.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: normalizedEmail })
      );
    });

    it('should handle email validation edge cases', async () => {
      const invalidEmails = [
        '',
        'notanemail',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/trial/signup')
          .send({ email });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });
  });
});

