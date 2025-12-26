require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const db = require('../database/db');
const { sendEmail } = require('../services/email');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

function loadTemplate(templateName, variables = {}) {
  const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
  let html = fs.readFileSync(templatePath, 'utf-8');
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*params\\.${key}\\s*\\}\\}`, 'g');
    html = html.replace(regex, value);
  }
  
  return html;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

async function sendTrialExpiringEmail(email, expiresAt) {
  const html = loadTemplate('trial-expires-tomorrow-email', {
    EXPIRES_AT: formatDate(expiresAt),
  });

  const text = `Your Local Password Vault trial expires tomorrow (${formatDate(expiresAt)}). Upgrade now to keep your passwords secure: https://localpasswordvault.com/pricing`;

  await sendEmail({
    to: email,
    subject: '⏰ Your trial expires tomorrow - Local Password Vault',
    html,
    text,
  });

  logger.email('sent', email, {
    operation: 'trial_email_expiring',
    job: 'trial_emails',
  });
}

async function sendTrialExpiredEmail(email, expiredDate) {
  const html = loadTemplate('trial-expired-email', {
    EXPIRED_DATE: formatDate(expiredDate),
    EMAIL: email,
  });

  const text = `Your Local Password Vault trial has ended. Your passwords are still safe! Use code COMEBACK10 for 10% off: https://localpasswordvault.com/pricing?code=COMEBACK10`;

  await sendEmail({
    to: email,
    subject: 'Your trial ended - Here\'s 10% off to come back',
    html,
    text,
  });

  logger.email('sent', email, {
    operation: 'trial_email_expired',
    job: 'trial_emails',
    expiredDate: expiredDate.toISOString(),
  });
}

async function checkTrialEmails() {
  logger.info('Trial email job started', {
    operation: 'trial_email_job',
    job: 'trial_emails',
  });

  const now = new Date();
  // Find trials expiring in ~24 hours (23-25 hour window)
  const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  // Find trials that expired 1-2 days ago
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  let expiringCount = 0;
  let expiredCount = 0;
  let errorCount = 0;

  try {
    const { data: expiringTrials, error: expiringError } = await db.supabase
      .from('trials')
      .select('*')
      .gte('expires_at', in23Hours.toISOString())
      .lte('expires_at', in25Hours.toISOString())
      .eq('is_converted', false)
      .or('expiring_email_sent.is.null,expiring_email_sent.eq.false');

    if (expiringError) {
      logger.error('Error fetching expiring trials', expiringError, {
        operation: 'trial_email_job',
        job: 'trial_emails',
        stage: 'fetch_expiring',
      }, logger.ERROR_CODES.DATABASE_QUERY_ERROR);
      throw expiringError;
    }

    logger.info(`Found ${expiringTrials?.length || 0} trials expiring in ~24 hours`, {
      operation: 'trial_email_job',
      job: 'trial_emails',
      count: expiringTrials?.length || 0,
    });

    for (const trial of expiringTrials || []) {
      try {
        await sendTrialExpiringEmail(trial.email, trial.expires_at);
        
        await db.supabase
          .from('trials')
          .update({ expiring_email_sent: true })
          .eq('id', trial.id);
        
        expiringCount++;
      } catch (error) {
        logger.emailError('trial_expiring', trial.email, error, {
          operation: 'trial_email_job',
          job: 'trial_emails',
          trialId: trial.id,
        });
        errorCount++;
      }
    }

    const { data: expiredTrials, error: expiredError } = await db.supabase
      .from('trials')
      .select('*')
      .gte('expires_at', twoDaysAgo.toISOString())
      .lte('expires_at', oneDayAgo.toISOString())
      .eq('is_converted', false)
      .or('expired_email_sent.is.null,expired_email_sent.eq.false');

    if (expiredError) {
      logger.error('Error fetching expired trials', expiredError, {
        operation: 'trial_email_job',
        job: 'trial_emails',
        stage: 'fetch_expired',
      }, logger.ERROR_CODES.DATABASE_QUERY_ERROR);
      throw expiredError;
    }

    logger.info(`Found ${expiredTrials?.length || 0} trials that expired recently`, {
      operation: 'trial_email_job',
      job: 'trial_emails',
      count: expiredTrials?.length || 0,
    });

    for (const trial of expiredTrials || []) {
      try {
        await sendTrialExpiredEmail(trial.email, trial.expires_at);
        
        await db.supabase
          .from('trials')
          .update({ expired_email_sent: true })
          .eq('id', trial.id);
        
        expiredCount++;
      } catch (error) {
        logger.emailError('trial_expired', trial.email, error, {
          operation: 'trial_email_job',
          job: 'trial_emails',
          trialId: trial.id,
        });
        errorCount++;
      }
    }

  } catch (error) {
    logger.error('Trial email job error', error, {
      operation: 'trial_email_job',
      job: 'trial_emails',
    }, logger.ERROR_CODES.SERVER_ERROR);
    errorCount++;
  }

  logger.info('Trial email job complete', {
    operation: 'trial_email_job',
    job: 'trial_emails',
    expiringCount,
    expiredCount,
    errorCount,
  });

  return { expiringCount, expiredCount, errorCount };
}

// Run if called directly
if (require.main === module) {
  checkTrialEmails()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Fatal error in trial email job', error, {
        operation: 'trial_email_job',
        job: 'trial_emails',
        fatal: true,
      }, logger.ERROR_CODES.SERVER_ERROR);
      process.exit(1);
    });
}

module.exports = { checkTrialEmails };

