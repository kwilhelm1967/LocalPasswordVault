# Email Service Diagnosis Steps

## Problem
No emails are being sent (trial signups, purchase confirmations, etc.)

## Quick Diagnosis on Linode Server

### Step 1: Deploy Latest Code
```bash
cd /var/www/lpv-api/backend
git pull origin main
pm2 restart lpv-api
```

### Step 2: Run Email Diagnostic
```bash
node scripts/diagnose-email-issue.js your-email@example.com
```

Replace `your-email@example.com` with your actual email address.

### Step 3: Check Diagnostic Results

The script will tell you:
- ✅ If BREVO_API_KEY is set
- ✅ If email service initialized
- ✅ If it can connect to Brevo
- ✅ If test email was sent successfully

## Common Issues & Fixes

### Issue 1: BREVO_API_KEY Not Set
**Symptom:** Script says "BREVO_API_KEY: NOT SET"

**Fix:**
1. Go to Linode server console
2. Edit `.env` file: `nano /var/www/lpv-api/backend/.env`
3. Add line: `BREVO_API_KEY=xkeysib-your-actual-key-here`
4. Restart server: `pm2 restart lpv-api`

### Issue 2: Invalid/Expired API Key
**Symptom:** Script says "Email service failed to connect" or "unauthorized"

**Fix:**
1. Log in to Brevo dashboard: https://app.brevo.com
2. Go to Settings → API Keys
3. Create a new API key
4. Update `.env` file with new key
5. Restart server

### Issue 3: Email Service Not Initializing
**Symptom:** Script says "API client not initialized"

**Fix:**
- Check server logs: `pm2 logs lpv-api --lines 50`
- Look for "Email service initialization failed" errors
- Verify `BREVO_API_KEY` is in `.env` file
- Restart server

### Issue 4: Brevo Account Issues
**Symptom:** "Email send failed" with specific Brevo error

**Fix:**
- Check Brevo account status in dashboard
- Verify account is active (not suspended)
- Check email sending limits/quota
- Verify sender email is verified in Brevo

## Check Server Logs for Email Errors

```bash
pm2 logs lpv-api --lines 100 | grep -i email
```

Look for:
- "Email service initialization failed"
- "Brevo API error"
- "Email send failed"

## Test Email Manually

After fixing issues, test again:
```bash
node scripts/diagnose-email-issue.js your-email@example.com
```

Check your inbox (and spam folder) for the test email.
