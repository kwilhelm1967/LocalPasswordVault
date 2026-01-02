# Check Email Issues - Steps

## Problem
Not receiving emails with download links and keys after:
- Trial signup
- Purchase completion

## Steps to Diagnose

### 1. Check Backend Logs for Email Errors

**In your SSH terminal (connected to Linode server):**

```bash
pm2 logs lpv-api --lines 100 | grep -i email
```

This will show recent email-related log entries.

### 2. Test Email Service Directly

**Test endpoint (from your Windows machine or server):**

```bash
curl -X POST http://172.236.111.48:3001/api/test/send-email \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL@example.com","type":"trial"}'
```

Replace `YOUR_EMAIL@example.com` with your actual email address.

### 3. Check Email Service Configuration

**On server, verify Brevo API key is set:**

```bash
grep BREVO_API_KEY /var/www/lpv-api/Vault/backend/.env
```

Should show your Brevo API key.

### 4. Check Spam Folder

- Check your spam/junk folder
- Check email filters
- Verify the email address you used

### 5. Verify Email Service is Working

**Check if Brevo API is accessible and configured correctly.**
