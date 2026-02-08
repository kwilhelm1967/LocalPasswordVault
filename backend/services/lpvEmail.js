/**
 * LPV Email Service
 * 
 * LPV-SPECIFIC: Handles emails that need license file attachments.
 * Does NOT modify the shared email.js used by LLV.
 * 
 * Uses the same Brevo API key but its own client instance.
 */

const brevo = require('@getbrevo/brevo');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

let apiInstance;

function initBrevo() {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[LPV Email] ⚠️  BREVO_API_KEY not set. LPV emails will not be sent.');
    return;
  }
  try {
    apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.authentications.apiKey.apiKey = process.env.BREVO_API_KEY;
    console.log('[LPV Email] ✅ LPV email service initialized');
  } catch (error) {
    console.error('[LPV Email] ❌ Initialization failed:', error.message);
  }
}

initBrevo();

function loadTemplate(templateName, variables = {}) {
  const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
  let html = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*params\\.${key}\\s*\\}\\}`, 'g');
    html = html.replace(regex, value);
  }
  return html;
}

/**
 * Send LPV trial email with signed license file attached.
 * 
 * The attached .license file is the customer's proof-of-trial.
 * They import it into the app — no server call needed from the app.
 */
async function sendLpvTrialEmail({ to, trialKey, expiresAt, licenseFileContent }) {
  if (!apiInstance) {
    throw new Error('LPV email service not initialized (check BREVO_API_KEY)');
  }

  const expiresFormatted = expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let html;
  try {
    html = loadTemplate('lpv-trial-license-email', {
      TRIAL_KEY: trialKey,
      EXPIRES_AT: expiresFormatted,
      SIGNUP_DATE: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    });
  } catch {
    // Fallback if template doesn't exist yet — use plain HTML
    html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; padding: 40px 32px; text-align: center; color: white;">
    <h1 style="margin: 0 0 8px; font-size: 24px;">Local Password Vault</h1>
    <p style="margin: 0; color: #94a3b8; font-size: 14px;">Your 7-Day Free Trial</p>
  </div>
  <div style="background: white; border-radius: 12px; padding: 32px; margin-top: 16px; border: 1px solid #e2e8f0;">
    <p style="color: #334155; font-size: 15px; line-height: 1.6;">Welcome! Your trial license file is attached to this email.</p>
    <div style="background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 4px; color: #0369a1; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your License Key</p>
      <p style="margin: 0; color: #0c4a6e; font-size: 18px; font-weight: 700; font-family: monospace; letter-spacing: 2px;">${trialKey}</p>
    </div>
    <h3 style="color: #1e293b; margin: 24px 0 12px;">Getting Started:</h3>
    <ol style="color: #475569; font-size: 14px; line-height: 1.8; padding-left: 20px;">
      <li>Download the app from <a href="https://localpasswordvault.com/download" style="color: #0ea5e9;">localpasswordvault.com/download</a></li>
      <li>Install and launch the app</li>
      <li><strong>Import the attached .license file</strong> when prompted</li>
    </ol>
    <p style="color: #64748b; font-size: 13px; margin-top: 20px;">Trial expires: <strong>${expiresFormatted}</strong></p>
    <p style="color: #64748b; font-size: 13px;">After importing, everything runs locally on your device. No internet required.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="color: #64748b; font-size: 13px; text-align: center;">
      Ready to keep your passwords secure forever?<br>
      <a href="https://localpasswordvault.com/pricing" style="color: #0ea5e9; font-weight: 600;">Upgrade to a lifetime license</a>
    </p>
  </div>
  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">
    Questions? Contact <a href="mailto:support@localpasswordvault.com" style="color: #94a3b8;">support@localpasswordvault.com</a>
  </p>
</body></html>`;
  }

  const text = `Welcome to Local Password Vault!\n\nYour 7-Day Free Trial\n\nYour License Key: ${trialKey}\nExpires: ${expiresFormatted}\n\nGetting Started:\n1. Download the app from https://localpasswordvault.com/download\n2. Install and launch the app\n3. Import the attached .license file when prompted\n\nAfter importing, everything runs locally. No internet required.\n\nUpgrade to lifetime: https://localpasswordvault.com/pricing\nSupport: support@localpasswordvault.com`;

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.sender = {
    name: 'Local Password Vault',
    email: process.env.FROM_EMAIL || 'noreply@localpasswordvault.com',
  };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = 'Your Trial License — Local Password Vault';
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.textContent = text;

  // Attach the signed license file
  if (licenseFileContent) {
    const base64Content = Buffer.from(licenseFileContent, 'utf8').toString('base64');
    sendSmtpEmail.attachment = [{
      name: 'LocalPasswordVault-Trial.license',
      content: base64Content,
    }];
  }

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    logger.email('lpv_trial_sent', to, {
      operation: 'lpv_trial_email',
      trialKey: trialKey.substring(0, 8) + '...',
    });
    return result;
  } catch (error) {
    const errorMessage = error.response?.body?.message || error.message || 'Unknown error';
    logger.emailError('lpv_trial', to, error, {
      operation: 'lpv_trial_email',
      brevoError: errorMessage,
    });
    throw new Error(`LPV trial email failed: ${errorMessage}`);
  }
}

module.exports = {
  sendLpvTrialEmail,
};
