#!/usr/bin/env node

/**
 * Email Service Diagnostic Script
 * Tests email configuration and connectivity
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sendTrialEmail, verifyConnection } = require('../services/email');
const logger = require('../utils/logger');

async function diagnoseEmailIssue() {
  console.log('='.repeat(60));
  console.log('EMAIL SERVICE DIAGNOSTIC');
  console.log('='.repeat(60));
  console.log('');

  // Step 1: Check environment variables
  console.log('STEP 1: Checking Environment Variables');
  console.log('-'.repeat(60));
  
  const brevoKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const supportEmail = process.env.SUPPORT_EMAIL;
  
  console.log(`BREVO_API_KEY: ${brevoKey ? `✅ Set (${brevoKey.substring(0, 10)}...)` : '❌ NOT SET'}`);
  console.log(`FROM_EMAIL: ${fromEmail ? `✅ Set (${fromEmail})` : '⚠️  Not set (will use default)'}`);
  console.log(`SUPPORT_EMAIL: ${supportEmail ? `✅ Set (${supportEmail})` : '⚠️  Not set (will use default)'}`);
  console.log('');

  if (!brevoKey) {
    console.error('❌ CRITICAL: BREVO_API_KEY is not set!');
    console.error('   Email service cannot initialize without this.');
    console.error('   Add BREVO_API_KEY to your .env file on the Linode server.');
    return;
  }

  // Step 2: Check email service initialization
  console.log('STEP 2: Checking Email Service Initialization');
  console.log('-'.repeat(60));
  
  try {
    const isConnected = await verifyConnection();
    if (isConnected) {
      console.log('✅ Email service initialized and connected');
    } else {
      console.log('❌ Email service failed to connect');
      console.log('   Check BREVO_API_KEY validity');
    }
  } catch (error) {
    console.log(`❌ Email service initialization error: ${error.message}`);
    console.log('');
    console.log('Possible causes:');
    console.log('1. Invalid BREVO_API_KEY');
    console.log('2. Brevo API key expired or revoked');
    console.log('3. Network connectivity issues');
    console.log('4. Brevo service outage');
  }
  console.log('');

  // Step 3: Test email sending
  console.log('STEP 3: Testing Email Sending');
  console.log('-'.repeat(60));
  
  const testEmail = process.argv[2] || process.env.TEST_EMAIL || 'test@example.com';
  console.log(`Test email address: ${testEmail}`);
  console.log('');

  if (!testEmail || testEmail === 'test@example.com') {
    console.log('⚠️  No test email provided. Using placeholder.');
    console.log('   Usage: node diagnose-email-issue.js your-email@example.com');
    console.log('   Or set TEST_EMAIL in .env file');
    console.log('');
  }

  try {
    const { generateTrialKey } = require('../services/licenseGenerator');
    const trialKey = generateTrialKey('llv');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    console.log(`Attempting to send test email to: ${testEmail}...`);
    const result = await sendTrialEmail({
      to: testEmail,
      trialKey: trialKey,
      expiresAt: expiresAt,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${result?.messageId || 'N/A'}`);
    console.log('');
    console.log('Check your inbox (and spam folder) for the trial email.');
    
  } catch (error) {
    console.log('❌ Failed to send test email');
    console.log(`   Error: ${error.message}`);
    console.log('');
    
    if (error.message.includes('API client not initialized')) {
      console.log('   Issue: Email service not initialized');
      console.log('   Fix: Check BREVO_API_KEY is set correctly');
    } else if (error.message.includes('invalid')) {
      console.log('   Issue: Invalid email address or API key');
    } else if (error.message.includes('unauthorized')) {
      console.log('   Issue: Brevo API key is invalid or expired');
      console.log('   Fix: Generate a new API key in Brevo dashboard');
    } else {
      console.log('   Full error details:');
      console.error(error);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('='.repeat(60));
}

// Run diagnostic
diagnoseEmailIssue().catch(error => {
  console.error('Fatal error running diagnostic:', error);
  process.exit(1);
});
