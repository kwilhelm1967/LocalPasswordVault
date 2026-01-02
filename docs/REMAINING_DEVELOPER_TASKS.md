# Remaining Developer Tasks

## 🚨 CRITICAL: Connection Error (Red Box) Issue

### Problem Description
Users are seeing a red error box with the message: **"Activation Error: Unable to connect to license server"** when attempting to activate license keys or trial keys. This error appears even when the user has internet connectivity.

### Root Cause Analysis
The error occurs in the license activation flow when the application cannot successfully connect to the backend license server. The current implementation has the following potential issues:

1. **Electron HTTP Request Handler**: The custom HTTP request handler in `electron/main.js` (lines ~1869-2083) attempts to use Electron's `net` module to make requests that bypass browser CORS restrictions. However, there may be:
   - SSL/TLS certificate validation issues
   - Network timeout configurations that are too aggressive
   - Error handling that doesn't properly surface the underlying connection problem
   - DNS resolution failures that aren't being caught or reported correctly

2. **API Client Fallback Logic**: The `apiClient.ts` checks for Electron API availability but may fail to properly fallback to standard `fetch` when Electron API is unavailable, or the Electron API itself may be failing silently.

3. **Error Message Propagation**: While error messages have been improved to show specific network errors (DNS, connection refused, timeout), the underlying connection failures may not be reaching the error handlers properly.

4. **Backend Server Configuration**: The backend server URL configuration may be incorrect, or the backend server may not be properly accessible from the Electron app.

### What Needs Investigation
1. **Verify Backend Server is Running**: Check if `https://server.localpasswordvault.com` (or the configured license server URL) is accessible and responding to health checks
2. **Check SSL Certificate**: Verify the backend SSL certificate is valid and trusted by Electron
3. **Test Network Connection**: Verify the Electron app can actually reach the backend server from a user's machine (not just from development environment)
4. **Review Timeout Settings**: Current timeout is 30 seconds in `apiClient.ts` and 30 seconds in `electron/main.js` - may need adjustment
5. **Error Logging**: Add more detailed logging in `electron/main.js` HTTP handler to capture what's actually failing (currently uses `devError` which may not be visible in production)
6. **Certificate Validation**: Electron's `net` module may be rejecting self-signed certificates or certificates from certain CAs - may need to configure certificate validation bypass or proper certificate chain

### Files to Review
- `electron/main.js` (lines ~1869-2083) - HTTP request handler
- `src/utils/apiClient.ts` - API client with Electron API detection
- `src/utils/licenseService.ts` - License activation logic
- `src/utils/trialService.ts` - Trial activation logic
- `src/config/environment.ts` - License server URL configuration

### Potential Solutions to Try
1. **Add Certificate Validation Override**: In `electron/main.js`, configure `session.defaultSession.setCertificateVerifyProc()` to handle certificate validation
2. **Improve Error Reporting**: Add detailed error logging that works in production (not just dev mode)
3. **Network Diagnostics**: Add a network diagnostic feature to test connectivity before attempting activation
4. **User-Friendly Error Messages**: Provide more actionable error messages (e.g., "Check your firewall settings" or "Your network may be blocking HTTPS connections")
5. **Retry Logic**: Implement exponential backoff retry logic for network failures
6. **Offline Detection**: Detect if the user is actually offline and show a different message

### Status
**NOT FIXED** - The error handling has been improved, but the root cause of why connections are failing has not been identified or resolved.

---

## 📋 Backend Server Deployment

### Task: Deploy Updated Backend Templates to Production Server

**Problem**: The local code repository has been updated with corrected email templates that point to `.exe` installer files instead of `.zip` files, but the production server is still running the old templates.

**What Needs to be Done**:
1. **SSH into Production Server**:
   - Access the server where the backend is deployed (likely at `/var/www/lpv-api` or similar)
   - Use SSH: `ssh root@YOUR-SERVER-IP`
   - Or use Linode web console if available

2. **Update Backend Code**:
   ```bash
   cd /var/www/lpv-api  # or your deployment path
   git pull  # if using git
   # OR manually upload updated template files
   ```

3. **Files That Need Updating on Server**:
   - `backend/templates/trial-welcome-email.html` - Line 214 (Windows download link)
   - `backend/templates/purchase-confirmation-email.html` - Line 124 (Windows download link)
   - `backend/templates/bundle-email.html` - Line 120 (Windows download link)

4. **Restart Backend Server**:
   ```bash
   pm2 restart lpv-api
   pm2 status  # Verify it's running
   ```

5. **Verify Update**:
   - Send a test trial email
   - Verify the email contains the correct `.exe` download link
   - Link should be: `https://github.com/kwilhelm1967/Vault/releases/download/V1.2.0/Local.Password.Vault.Setup.1.2.0.exe`

**Status**: ⏳ PENDING - Templates fixed in code, but not yet deployed to server

---

## 🔧 Backend Server Initial Deployment (If Not Yet Deployed)

### Task: Complete Backend Server Setup

**Location**: See `docs/DEPLOY_TO_LINODE.md` for complete instructions

**Essential Steps**:
1. **Server Setup**:
   - Install Node.js 18+ on server
   - Install PM2: `npm install -g pm2`
   - Create deployment directory: `/var/www/lpv-api`

2. **Backend Code Deployment**:
   - Clone repository or upload backend folder
   - Install dependencies: `npm install`
   - Create `.env` file with all required environment variables

3. **Required Environment Variables** (see `backend/env.example`):
   - `NODE_ENV=production`
   - `PORT=3001`
   - `SUPABASE_URL` - Database connection URL
   - `SUPABASE_SERVICE_KEY` - Database service role key
   - `LICENSE_SIGNING_SECRET` - 64-character hex string (generate with `openssl rand -hex 32`)
   - `STRIPE_SECRET_KEY` - Stripe live secret key
   - `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
   - `STRIPE_PRICE_*` - All Stripe price IDs for products
   - `BREVO_API_KEY` - Email service API key
   - `FROM_EMAIL` - Sender email address
   - `SUPPORT_EMAIL` - Support email address
   - `WEBSITE_URL` - Website URL
   - `ADMIN_API_KEY` - Admin dashboard API key

4. **Start Server**:
   ```bash
   pm2 start server.js --name lpv-api
   pm2 startup  # Enable auto-start on reboot
   pm2 save
   ```

5. **Configure Domain/SSL**:
   - Set up DNS for API domain (e.g., `api.localpasswordvault.com`)
   - Configure SSL certificate (Let's Encrypt or Cloudflare)
   - Test health endpoint: `curl https://api.localpasswordvault.com/health`

6. **Verify Backend is Accessible**:
   - Test from browser: `https://api.localpasswordvault.com/health`
   - Should return: `{"status":"ok"}`
   - Test from Electron app (if possible)

**Status**: ⏳ PENDING - Verify if backend is already deployed or needs initial setup

---

## 💳 Stripe Configuration

### Task: Complete Stripe Payment Setup

**What Needs to be Done**:

1. **Create Stripe Products** (if not already created):
   - Personal Vault - $49
   - Family Vault - $79
   - LLV Personal - $49
   - LLV Family - $129

2. **Get Stripe Live Secret Key**:
   - Go to Stripe Dashboard → Developers → API keys
   - Switch to "Live mode"
   - Create or copy secret key (starts with `sk_live_`)
   - Add to backend `.env`: `STRIPE_SECRET_KEY=sk_live_xxxxx`

3. **Configure Stripe Webhook**:
   - Create webhook endpoint: `https://api.localpasswordvault.com/api/webhooks/stripe`
   - Select event: `checkout.session.completed`
   - Copy webhook signing secret (starts with `whsec_`)
   - Add to backend `.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

4. **Test Webhook**:
   - Send test event from Stripe dashboard
   - Verify webhook is received and processed
   - Check backend logs for webhook processing
   - Verify license key is generated in database

**Status**: ⏳ PENDING - Stripe price IDs are configured, but live secret key may need to be added

---

## 🧪 Testing & Verification

### Task: Complete End-to-End Testing

**What Needs to be Done**:

1. **End-to-End Purchase Flow**:
   - Test complete purchase flow from website to app activation
   - Verify payment processes through Stripe
   - Verify webhook creates license key
   - Verify email is sent with license key and download links
   - Verify download links work (point to `.exe` files, not `.zip`)
   - Download and install application
   - Activate license key in app
   - Verify activation succeeds
   - Disconnect internet and verify app works offline

2. **Trial Flow Testing**:
   - Request trial on website
   - Verify trial key is received in email
   - Activate trial key in app
   - Verify trial works
   - Verify trial expiration detection works offline

3. **Error Scenario Testing**:
   - Test with invalid license key format
   - Test with non-existent license key
   - Test network failure scenarios (should show appropriate error)
   - Test device transfer flow
   - Test transfer limit enforcement

4. **Offline Operation Verification**:
   - After activation, disconnect internet
   - Use app for extended period (30+ minutes)
   - Verify zero network requests (check DevTools Network tab)
   - Restart app while offline
   - Verify app loads and works completely offline

5. **Cross-Platform Testing** (if applicable):
   - Test on Windows (primary)
   - Test on macOS (if built)
   - Test on Linux (if built)

**Status**: ⏳ PENDING - Comprehensive testing needed before launch

---

## 📦 Application Builds

### Task: Build and Test Application Installers

**What Needs to be Done**:

1. **Windows Build**:
   - Run: `npm run dist:win`
   - Test installer on clean Windows machine
   - Verify installer creates proper shortcuts
   - Verify app launches correctly
   - (Optional) Code sign installer if certificate is available

2. **macOS Build** (if needed):
   - Run: `npm run dist:mac` (requires macOS system)
   - Test DMG on clean macOS machine
   - (Optional) Code sign and notarize if Apple Developer account available

3. **Linux Build** (if needed):
   - Run: `npm run dist:linux` (requires Linux system)
   - Test AppImage on clean Linux machine

4. **Upload to GitHub Releases**:
   - Create release tag: `v1.2.0`
   - Upload installer files
   - Verify download links work
   - Test download from different network locations

**Status**: ⏳ PENDING - Windows build may exist, but needs verification

---

## 📧 Email Service Verification

### Task: Verify Email Service is Working

**What Needs to be Done**:

1. **Brevo Configuration Verification**:
   - Verify Brevo API key is correct in backend `.env`
   - Verify sender email is verified in Brevo dashboard
   - Test email sending from backend

2. **Email Template Testing**:
   - Send test trial email
   - Send test purchase confirmation email
   - Verify email content is correct
   - Verify download links in emails work
   - Verify links point to `.exe` files (not `.zip`)

3. **Email Deliverability**:
   - Test emails reach inbox (not spam)
   - Test from multiple email providers
   - Verify email formatting is correct

**Status**: ⏳ PENDING - Email service may be configured but needs testing

---

## 🔍 Monitoring & Error Tracking

### Task: Set Up Production Monitoring

**What Needs to be Done**:

1. **Sentry Configuration** (Optional but Recommended):
   - Create Sentry account
   - Create Node.js project
   - Get DSN
   - Add `SENTRY_DSN` to backend `.env`
   - Test error tracking

2. **Backend Log Monitoring**:
   - Set up log aggregation (optional)
   - Verify structured logging is working
   - Monitor for errors in production

3. **Webhook Monitoring**:
   - Monitor Stripe webhook processing
   - Set up alerts for webhook failures
   - Verify webhook failure emails are sent

**Status**: ⏳ PENDING - Monitoring setup needed for production

---

## 🌐 DNS & Domain Configuration

### Task: Verify Domain Configuration

**What Needs to be Done**:

1. **API Domain**:
   - Verify `api.localpasswordvault.com` (or configured domain) points to backend server
   - Verify SSL certificate is valid
   - Test health endpoint is accessible

2. **Website Domain**:
   - Verify `localpasswordvault.com` is configured correctly
   - Verify SSL certificate is valid

3. **DNS Propagation**:
   - Verify DNS changes have propagated
   - Test from multiple locations if possible

**Status**: ⏳ PENDING - Domain configuration may need verification

---

## ✅ CI/CD Pipeline Verification

### Task: Verify Automated Tests Pass

**What Needs to be Done**:

1. **Check CI Test Results**:
   - Verify unit tests pass
   - Verify e2e tests pass
   - Fix any failing tests

2. **Review Test Coverage**:
   - Ensure critical paths are covered
   - Add tests for any new changes

**Status**: ⏳ PENDING - Tests were recently fixed, but need verification they pass in CI

---

## 📝 Documentation Updates

### Task: Update Documentation for Production

**What Needs to be Done**:

1. **Update Deployment Guides**:
   - Verify all deployment steps are documented
   - Add any missing configuration steps
   - Document any server-specific requirements

2. **Update User Documentation**:
   - Verify user manual is complete
   - Verify troubleshooting guide covers common issues
   - Update download instructions if needed

**Status**: ⏳ MOSTLY COMPLETE - Documentation exists but may need final review

---

## 🎯 Priority Summary

### High Priority (Must Complete Before Launch):
1. **Fix Connection Error** - Red box error when activating licenses
2. **Deploy Backend Templates** - Update server with corrected email templates
3. **Verify Backend Server** - Ensure backend is accessible and responding
4. **Complete Stripe Setup** - Get live secret key if not already done
5. **End-to-End Testing** - Test complete purchase and activation flow

### Medium Priority (Should Complete):
6. **Build Verification** - Test Windows installer on clean machine
7. **Email Service Testing** - Verify emails are sent and received correctly
8. **Error Scenario Testing** - Test error handling and edge cases

### Low Priority (Can Complete After Launch):
9. **Monitoring Setup** - Sentry configuration
10. **macOS/Linux Builds** - If needed for other platforms
11. **Documentation Polish** - Final documentation review

---

## 📚 Reference Documents

- `docs/DEPLOY_TO_LINODE.md` - Backend deployment guide
- `docs/DEVELOPER_HANDOFF.md` - Complete deployment checklist
- `docs/PRODUCTION_UAT_QUICK_START.md` - Quick start for UAT testing
- `backend/env.example` - Environment variables reference
- `backend/README.md` - Backend API documentation

---

**Last Updated**: Based on current codebase state
**Note**: This document should be updated as tasks are completed
