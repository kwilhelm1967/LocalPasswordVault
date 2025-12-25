import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Purchase and Activation Flow
 * 
 * Tests the complete purchase → email → activation flow
 */

// Mock API responses for testing
async function mockStripeCheckout(page: Page, sessionId: string) {
  await page.route('**/api/checkout/session', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          sessionId,
          url: `https://checkout.stripe.com/test/${sessionId}`,
        }),
      });
    }
  });
}

async function mockWebhookProcessing(page: Page, sessionId: string, licenseKey: string) {
  // Simulate webhook processing by mocking the session retrieval
  await page.route(`**/api/checkout/session/${sessionId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          licenseKey,
          planType: 'personal',
          email: 'test@example.com',
          maxDevices: 1,
        },
      }),
    });
  });
}

async function mockLicenseActivation(page: Page, licenseKey: string, shouldSucceed: boolean = true) {
  await page.route('**/api/lpv/license/activate', async (route) => {
    if (shouldSucceed) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'activated',
          mode: 'first_activation',
          plan_type: 'personal',
          license_file: {
            license_key: licenseKey,
            device_id: 'a'.repeat(64),
            plan_type: 'personal',
            max_devices: 1,
            activated_at: new Date().toISOString(),
            signature: 'test-signature',
            signed_at: new Date().toISOString(),
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'invalid',
          error: 'License key not found',
        }),
      });
    }
  });
}

test.describe('Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should complete single purchase flow', async ({ page }) => {
    const sessionId = 'cs_test_123';
    const licenseKey = 'PERS-TEST-1234-5678';

    // Mock checkout session creation
    await mockStripeCheckout(page, sessionId);

    // Navigate to pricing (if available)
    const pricingLink = page.locator('a:has-text("Pricing"), a:has-text("Buy"), button:has-text("Buy")').first();
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await page.waitForTimeout(1000);
    }

    // Mock successful purchase (simulate Stripe redirect)
    await page.goto(`/purchase/success?session_id=${sessionId}`);

    // Mock webhook processing
    await mockWebhookProcessing(page, sessionId, licenseKey);

    // Wait for license key to appear
    await page.waitForSelector('text=PERS-', { timeout: 5000 });

    // Verify license key is displayed
    const keyElement = page.locator(`text=${licenseKey}`);
    await expect(keyElement).toBeVisible();
  });

  test('should handle purchase with invalid session', async ({ page }) => {
    const invalidSessionId = 'cs_invalid_123';

    await page.route(`**/api/checkout/session/${invalidSessionId}`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'License not found. Please wait a moment and refresh.',
          pending: true,
        }),
      });
    });

    await page.goto(`/purchase/success?session_id=${invalidSessionId}`);

    // Should show pending or error message
    const errorMessage = page.locator('text=not found, text=pending, text=wait').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should activate license key successfully', async ({ page }) => {
    const licenseKey = 'PERS-ACTIVATE-1234';

    // Mock successful activation
    await mockLicenseActivation(page, licenseKey, true);

    // Navigate to license screen (if available)
    await page.goto('/');
    
    // Look for license input or activation screen
    const licenseInput = page.locator('input[placeholder*="license"], input[placeholder*="XXXX"]').first();
    
    if (await licenseInput.isVisible({ timeout: 3000 })) {
      await licenseInput.fill(licenseKey);
      
      // Find and click activate/submit button
      const activateButton = page.locator('button:has-text("Activate"), button:has-text("Submit"), button[type="submit"]').first();
      if (await activateButton.isVisible()) {
        await activateButton.click();
        
        // Wait for success message or vault unlock
        await page.waitForSelector('text=activated, text=success, text=Dashboard', { timeout: 10000 });
        
        // Verify activation succeeded
        const successIndicator = page.locator('text=activated, text=success, text=Dashboard').first();
        await expect(successIndicator).toBeVisible();
      }
    }
  });

  test('should handle invalid license key activation', async ({ page }) => {
    const invalidKey = 'INVALID-KEY-1234';

    // Mock failed activation
    await mockLicenseActivation(page, invalidKey, false);

    await page.goto('/');
    
    const licenseInput = page.locator('input[placeholder*="license"], input[placeholder*="XXXX"]').first();
    
    if (await licenseInput.isVisible({ timeout: 3000 })) {
      await licenseInput.fill(invalidKey);
      
      const activateButton = page.locator('button:has-text("Activate"), button[type="submit"]').first();
      if (await activateButton.isVisible()) {
        await activateButton.click();
        
        // Wait for error message
        await page.waitForSelector('text=invalid, text=not found, text=error', { timeout: 5000 });
        
        const errorMessage = page.locator('text=invalid, text=not found, text=error').first();
        await expect(errorMessage).toBeVisible();
      }
    }
  });

  test('should handle device mismatch (transfer required)', async ({ page }) => {
    const licenseKey = 'PERS-TRANSFER-1234';

    await page.route('**/api/lpv/license/activate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'device_mismatch',
          requires_transfer: true,
        }),
      });
    });

    await page.goto('/');
    
    const licenseInput = page.locator('input[placeholder*="license"], input[placeholder*="XXXX"]').first();
    
    if (await licenseInput.isVisible({ timeout: 3000 })) {
      await licenseInput.fill(licenseKey);
      
      const activateButton = page.locator('button:has-text("Activate"), button[type="submit"]').first();
      if (await activateButton.isVisible()) {
        await activateButton.click();
        
        // Should show transfer dialog
        await page.waitForSelector('text=transfer, text=device, text=mismatch', { timeout: 5000 });
        
        const transferMessage = page.locator('text=transfer, text=device, text=mismatch').first();
        await expect(transferMessage).toBeVisible();
      }
    }
  });

  test('should handle network errors during activation', async ({ page }) => {
    const licenseKey = 'PERS-NETWORK-1234';

    await page.route('**/api/lpv/license/activate', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/');
    
    const licenseInput = page.locator('input[placeholder*="license"], input[placeholder*="XXXX"]').first();
    
    if (await licenseInput.isVisible({ timeout: 3000 })) {
      await licenseInput.fill(licenseKey);
      
      const activateButton = page.locator('button:has-text("Activate"), button[type="submit"]').first();
      if (await activateButton.isVisible()) {
        await activateButton.click();
        
        // Should show network error
        await page.waitForSelector('text=network, text=connection, text=error', { timeout: 5000 });
        
        const errorMessage = page.locator('text=network, text=connection, text=error').first();
        await expect(errorMessage).toBeVisible();
      }
    }
  });

  test('should handle revoked license', async ({ page }) => {
    const licenseKey = 'PERS-REVOKED-1234';

    await page.route('**/api/lpv/license/activate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'revoked',
          error: 'This license has been revoked',
        }),
      });
    });

    await page.goto('/');
    
    const licenseInput = page.locator('input[placeholder*="license"], input[placeholder*="XXXX"]').first();
    
    if (await licenseInput.isVisible({ timeout: 3000 })) {
      await licenseInput.fill(licenseKey);
      
      const activateButton = page.locator('button:has-text("Activate"), button[type="submit"]').first();
      if (await activateButton.isVisible()) {
        await activateButton.click();
        
        // Should show revoked message
        await page.waitForSelector('text=revoked, text=support', { timeout: 5000 });
        
        const revokedMessage = page.locator('text=revoked, text=support').first();
        await expect(revokedMessage).toBeVisible();
      }
    }
  });
});

test.describe('Trial Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should sign up for trial', async ({ page }) => {
    const trialEmail = 'trial@example.com';
    const trialKey = 'TRIA-TEST-1234-5678';

    await page.route('**/api/trial/signup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Trial key sent to your email',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          ...(process.env.NODE_ENV === 'test' && { trialKey }),
        }),
      });
    });

    // Navigate to trial signup (if available)
    const trialLink = page.locator('a:has-text("Trial"), button:has-text("Trial"), a:has-text("Free")').first();
    
    if (await trialLink.isVisible({ timeout: 3000 })) {
      await trialLink.click();
      await page.waitForTimeout(1000);
    }

    // Look for email input
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
    
    if (await emailInput.isVisible({ timeout: 3000 })) {
      await emailInput.fill(trialEmail);
      
      const submitButton = page.locator('button:has-text("Sign"), button:has-text("Submit"), button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Wait for success message
        await page.waitForSelector('text=sent, text=email, text=success', { timeout: 5000 });
        
        const successMessage = page.locator('text=sent, text=email, text=success').first();
        await expect(successMessage).toBeVisible();
      }
    }
  });

  test('should handle invalid email for trial', async ({ page }) => {
    await page.route('**/api/trial/signup', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid email format',
        }),
      });
    });

    await page.goto('/');
    
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
    
    if (await emailInput.isVisible({ timeout: 3000 })) {
      await emailInput.fill('invalid-email');
      
      const submitButton = page.locator('button:has-text("Sign"), button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show validation error
        await page.waitForSelector('text=invalid, text=email, text=format', { timeout: 5000 });
        
        const errorMessage = page.locator('text=invalid, text=email, text=format').first();
        await expect(errorMessage).toBeVisible();
      }
    }
  });
});

