# Developer Handoff: What's Left to Do

## Overview

This document lists only the tasks that need to be completed to deploy the system and get it ready for users.

**For complete step-by-step instructions, see:** `docs/ACTIVATION_AND_FIRST_USER.md`

---

## Phase 1: Backend Deployment

### 1.1 Deploy Backend to Server

**Required Steps:**
1. SSH into production server (Linode/VPS)
2. Clone or upload backend code to `/var/www/lpv-api`
3. Install dependencies: `npm install`
4. Create `.env` file with all required variables (see `backend/env.example`)
5. Start with PM2: `pm2 start server.js --name lpv-api`
6. Enable auto-start: `pm2 startup` and `pm2 save`

**Required Environment Variables:**
```env
NODE_ENV=production
PORT=3001
LICENSE_SIGNING_SECRET=<64-character-hex-string>
SUPABASE_URL=<supabase-project-url>
SUPABASE_SERVICE_KEY=<service-role-key>
STRIPE_SECRET_KEY=<live-key>
STRIPE_PUBLISHABLE_KEY=<live-key>
STRIPE_WEBHOOK_SECRET=<webhook-secret>
BREVO_API_KEY=<brevo-api-key>
FROM_EMAIL=<sender-email>
SUPPORT_EMAIL=<support-email>
WEBSITE_URL=<website-url>
API_URL=<api-url>
```

**Generate LICENSE_SIGNING_SECRET:**
```bash
openssl rand -hex 32
```

**Reference:** `docs/PRODUCTION_LAUNCH_GUIDE.md` - Step 2

---

### 1.2 Configure Nginx & SSL

**Required Steps:**
1. Install Nginx (if not installed)
2. Configure SSL certificate (Let's Encrypt)
3. Set up reverse proxy for API domain (api.localpasswordvault.com)
4. Test health endpoint: `curl https://api.localpasswordvault.com/health`

**Reference:** `docs/PRODUCTION_LAUNCH_GUIDE.md` - Step 2

---

### 1.3 Database Setup

**Required Steps:**
1. Verify Supabase project exists
2. Run database schema: Execute `backend/database/schema.sql` in Supabase SQL Editor
3. Get connection details:
   - Project URL (from Supabase Settings → API)
   - Service Role Key (NOT anon key)
4. Add to backend `.env` file
5. Test connection from backend server

**Reference:** `docs/PRODUCTION_LAUNCH_GUIDE.md` - Step 1

---

## Phase 2: Payment & Email Configuration

### 2.1 Stripe Configuration

**Required Steps:**
1. Create Stripe products (if not done):
   - Personal Vault ($49) - Get Price ID
   - Family Vault ($79) - Get Price ID
   - LLV Personal ($49) - Get Price ID
   - LLV Family ($129) - Get Price ID

2. Configure Stripe Webhook:
   - Add endpoint: `https://api.localpasswordvault.com/api/webhooks/stripe`
   - Select event: `checkout.session.completed`
   - Copy webhook signing secret
   - Add to backend `.env` as `STRIPE_WEBHOOK_SECRET`

3. Switch to Live Mode:
   - Replace test keys with live keys in backend `.env`
   - Update frontend environment with live publishable key

4. Test Webhook:
   - Send test event from Stripe dashboard
   - Verify webhook received and processed
   - Check backend logs for webhook processing

**Reference:** `docs/PRODUCTION_LAUNCH_GUIDE.md` - Step 3

---

### 2.2 Email Service (Brevo)

**Required Steps:**
1. Create/verify Brevo account
2. Generate API key with "Send emails" permission
3. Verify sender email address in Brevo
4. Add API key to backend `.env` as `BREVO_API_KEY`
5. Test email sending

**Reference:** `docs/PRODUCTION_LAUNCH_GUIDE.md` - Step 4

---

## Phase 3: Application Builds

### 3.1 Build Applications

**Required Steps:**

**Windows:**
1. Run: `npm run dist:win`
2. Test installer on clean Windows machine
3. (Optional) Code sign installer if certificate available

**macOS:**
1. Run: `npm run dist:mac`
2. Test DMG on clean macOS machine
3. (Optional) Code sign and notarize if Apple Developer account available

**Linux:**
1. Run: `npm run dist:linux`
2. Test AppImage on clean Linux machine

**Reference:** `docs/PRODUCTION_LAUNCH_GUIDE.md` - Step 5

---

### 3.2 Create Download Packages

**Required Steps:**
1. Create ZIP package for each platform containing:
   - Installer file (`.exe`, `.dmg`, or `.AppImage`)
   - `README.txt` (if available)
   - Documentation files (if available)

2. Host packages:
   - Upload to GitHub Releases (or alternative hosting)
   - Get download URLs
   - Update email templates with download URLs

**Files to Update:**
- Email templates in `backend/templates/` - Update download links

**Reference:** `docs/PRODUCTION_LAUNCH_GUIDE.md` - Step 6

---

## Phase 4: Testing & Verification

### 4.1 End-to-End Purchase Test

**Required Test Steps:**

1. **Single Purchase Test:**
   - [ ] Go to pricing page
   - [ ] Click "Buy Now" for Personal Vault
   - [ ] Complete Stripe checkout
   - [ ] Verify webhook received and processed
   - [ ] Verify license key generated in database
   - [ ] Verify email received with license key
   - [ ] Verify email contains correct download links
   - [ ] Download and install application
   - [ ] Enter license key in app
   - [ ] Verify activation successful
   - [ ] Disconnect internet
   - [ ] Verify app works offline

2. **Bundle Purchase Test:**
   - [ ] Purchase bundle (2 products)
   - [ ] Verify multiple license keys in email
   - [ ] Verify success page shows all keys
   - [ ] Activate first key
   - [ ] Activate second key
   - [ ] Verify both keys work independently

3. **Trial Flow Test:**
   - [ ] Sign up for trial on website
   - [ ] Verify trial key received in email
   - [ ] Activate trial key in app
   - [ ] Verify trial works
   - [ ] Verify trial expiration detected offline

---

### 4.2 Error Scenario Testing

**Required Test Scenarios:**

1. **Invalid License Key:**
   - [ ] Enter invalid format key
   - [ ] Enter non-existent key
   - [ ] Verify appropriate error message shown

2. **Network Failure:**
   - [ ] Disable network connection
   - [ ] Attempt license activation
   - [ ] Verify network error message shown
   - [ ] Re-enable network and verify retry works

3. **Device Transfer:**
   - [ ] Activate license on Device A
   - [ ] Enter same key on Device B
   - [ ] Verify transfer dialog appears
   - [ ] Complete transfer
   - [ ] Verify Device B works after transfer
   - [ ] Verify Device A no longer works

4. **Transfer Limit:**
   - [ ] Perform 3 transfers
   - [ ] Attempt 4th transfer
   - [ ] Verify transfer limit message shown

---

### 4.3 Offline Operation Verification

**Required Verification:**

1. **After Activation:**
   - [ ] Activate license successfully
   - [ ] Disconnect internet completely
   - [ ] Use app for 30+ minutes
   - [ ] Verify zero network requests (check DevTools Network tab)
   - [ ] Verify all app features work offline
   - [ ] Verify license validation works offline

2. **App Restart Offline:**
   - [ ] Activate license
   - [ ] Disconnect internet
   - [ ] Close application completely
   - [ ] Reopen application
   - [ ] Verify app loads without network calls
   - [ ] Verify license validated from local file

**Verification Method:**
- Open browser DevTools → Network tab
- Filter by "Fetch/XHR" or "WS"
- Disconnect internet
- Use app for extended period
- Verify Network tab shows ZERO requests

---

## Phase 5: Pre-Launch Checklist

**Complete before accepting first real customer:**

### Infrastructure
- [ ] Backend API deployed and accessible
- [ ] Health endpoint responds: `curl https://api.localpasswordvault.com/health`
- [ ] SSL certificate valid
- [ ] Database connected and schema executed
- [ ] All environment variables set correctly

### Payment & Email
- [ ] Stripe products created and configured
- [ ] Stripe webhook endpoint active and tested
- [ ] Brevo email service configured and tested
- [ ] Test purchase email received successfully

### Application
- [ ] At least one platform built (Windows recommended)
- [ ] Installer tested on clean machine
- [ ] Download package created and hosted
- [ ] Download URLs working

### Testing
- [ ] End-to-end purchase tested successfully
- [ ] License activation tested successfully
- [ ] Offline operation verified
- [ ] Error scenarios tested

---

## 📞 Reference Documents

- **`docs/ACTIVATION_AND_FIRST_USER.md`** - ⭐ **START HERE** - Complete step-by-step deployment guide
- `docs/PRODUCTION_LAUNCH_GUIDE.md` - Detailed production setup guide
- `docs/PRODUCTION_CHECKLIST.md` - Comprehensive production checklist
- `backend/README.md` - API documentation
- `backend/database/schema.sql` - Database structure
- `backend/env.example` - Environment variables reference

---

**Last Updated:** January 2025  
**Status:** Deployment tasks remaining
