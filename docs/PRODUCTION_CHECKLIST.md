# Production Launch Checklist

**Version:** 1.2.0  
**Last Updated:** January 2025

This is a comprehensive, actionable checklist to ensure everything is ready for production launch.

---

## ✅ Pre-Launch: Infrastructure Setup

### Backend API
- [ ] Server deployed and accessible (Linode/VPS)
- [ ] SSL certificate installed and valid (Let's Encrypt)
- [ ] Health endpoint responds: `curl https://api.localpasswordvault.com/health`
- [ ] PM2 process manager installed and configured
- [ ] PM2 auto-start enabled: `pm2 startup` and `pm2 save`
- [ ] Nginx reverse proxy configured and running
- [ ] Firewall rules configured (ports 80, 443 open)
- [ ] Server monitoring set up (optional: UptimeRobot, Pingdom)

### Database (Supabase)
- [ ] Supabase project created
- [ ] Database schema executed (`backend/database/schema.sql`)
- [ ] Connection string verified
- [ ] Service role key configured (NOT anon key)
- [ ] Database backups enabled
- [ ] Connection tested from backend server

### Environment Variables
- [ ] All required `.env` variables set:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3001`
  - [ ] `LICENSE_SIGNING_SECRET` (64-character hex string - used for signed license/trial files)
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_KEY`
  - [ ] `STRIPE_SECRET_KEY` (LIVE key, not test)
  - [ ] `STRIPE_PUBLISHABLE_KEY` (LIVE key)
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `BREVO_API_KEY`
  - [ ] `FROM_EMAIL`
  - [ ] `SUPPORT_EMAIL`
  - [ ] `WEBSITE_URL`
  - [ ] `API_URL`
- [ ] `.env` file permissions set correctly (600)
- [ ] No sensitive data in version control

---

## ✅ Payment Processing (Stripe)

### Products Created
- [ ] Personal Vault ($49) - Price ID: `price_xxxxx`
- [ ] Family Vault ($79) - Price ID: `price_xxxxx`
- [ ] Local Legacy Vault - Personal ($49) - Price ID: `price_xxxxx`
- [ ] Local Legacy Vault - Family ($129) - Price ID: `price_xxxxx`
- [ ] All Price IDs added to backend `.env`

### Stripe Configuration
- [ ] Live API keys configured (switched from test mode)
- [ ] Webhook endpoint configured: `https://api.localpasswordvault.com/api/webhooks/stripe`
- [ ] Webhook events selected:
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.succeeded` (optional)
  - [ ] `payment_intent.payment_failed` (optional)
- [ ] Webhook signing secret copied to `.env`
- [ ] Test webhook sent and verified in logs
- [ ] Stripe dashboard shows webhook endpoint as active

---

## ✅ Email Service (Brevo)

### Brevo Setup
- [ ] Brevo account created and verified
- [ ] API key generated with "Send emails" permission
- [ ] API key added to backend `.env`
- [ ] Sender email verified in Brevo
- [ ] Test email sent successfully
- [ ] Email service connection verified: `node -e "require('./services/email').verifyConnection()"`

### Email Templates
- [ ] `purchase-confirmation-email.html` - Tested and working
- [ ] `bundle-email.html` - Tested and working
- [ ] `trial-welcome-email.html` - Tested and working
- [ ] `trial-expires-tomorrow-email.html` - Tested and working
- [ ] `trial-expired-email.html` - Tested and working
- [ ] All download links in emails point to correct URLs
- [ ] All email templates render correctly in major email clients

---

## ✅ Application Builds

### Windows
- [ ] Installer built: `npm run dist:win`
- [ ] Code signing certificate configured (if available)
- [ ] Installer tested on clean Windows machine
- [ ] Installer verified: Right-click → Properties → Digital Signatures

### macOS
- [ ] DMG built: `npm run dist:mac`
- [ ] Apple Developer account configured
- [ ] Code signing configured
- [ ] Notarization completed (if applicable)
- [ ] DMG tested on clean macOS machine

### Linux
- [ ] AppImage built: `npm run dist:linux`
- [ ] AppImage tested on clean Linux machine
- [ ] Executable permissions set correctly

---

## ✅ Download Packages

### Package Contents
- [ ] Installer file (`.exe`, `.dmg`, or `.AppImage`)
- [ ] `README.txt` included
- [ ] `User Manual.pdf` generated and included
- [ ] `Quick Start Guide.pdf` generated and included
- [ ] `Privacy Policy.pdf` generated and included
- [ ] `Terms of Service.pdf` generated and included
- [ ] `License.txt` included

### Package Creation
- [ ] Windows ZIP package created
- [ ] macOS ZIP package created
- [ ] Linux ZIP package created
- [ ] All ZIP files tested (extract and verify contents)

### Hosting
- [ ] Packages uploaded to GitHub Releases (or alternative hosting)
- [ ] Download URLs tested and working
- [ ] Download links updated in email templates
- [ ] Website download page links to correct URLs

---

## ✅ Testing

### Purchase Flow
- [ ] Personal Vault purchase tested end-to-end
- [ ] Family Vault purchase tested end-to-end
- [ ] Bundle purchase tested (if applicable)
- [ ] License key received in email
- [ ] License key format correct (`PERS-XXXX-XXXX-XXXX` or `FMLY-XXXX-XXXX-XXXX`)
- [ ] License appears in database
- [ ] Email contains correct download links

### Trial Flow
- [ ] Trial signup tested
- [ ] Trial key received in email
- [ ] Trial key format correct (`TRIA-XXXX-XXXX-XXXX`)
- [ ] Trial appears in database with 7-day expiration
- [ ] Trial welcome email received

### License Activation
- [ ] License activation tested (first time)
- [ ] License activation tested (same device reinstall)
- [ ] License transfer tested (different device)
- [ ] Device binding verified (license tied to device)
- [ ] Transfer limit enforced (3 per year)

### Offline Operation
- [ ] App works 100% offline after activation
- [ ] No network calls after activation (verified in DevTools)
- [ ] Trial expiration checked locally (no network calls)
- [ ] All features work without internet

### Email Delivery
- [ ] Purchase confirmation email received
- [ ] Bundle email received (if applicable)
- [ ] Trial welcome email received
- [ ] Trial expiring email received (24-hour warning)
- [ ] Trial expired email received
- [ ] All email links work correctly

### Error Handling
- [ ] Invalid license key handled gracefully
- [ ] Expired trial handled gracefully
- [ ] Network errors handled gracefully
- [ ] Database errors logged properly
- [ ] Webhook failures logged properly

---

## ✅ Security

### Code Signing
- [ ] Windows installer signed (if certificate available)
- [ ] macOS app signed and notarized (if applicable)
- [ ] Signatures verified

### Security Headers
- [ ] Nginx security headers configured:
  - [ ] `X-Frame-Options: SAMEORIGIN`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-XSS-Protection: 1; mode=block`
- [ ] Helmet.js configured in Express (already in code)

### Secrets Management
- [ ] All API keys stored in `.env` (not in code)
- [ ] `.env` file excluded from version control
- [ ] `.env.example` updated with all required variables
- [ ] No hardcoded secrets in codebase

### Database Security
- [ ] Service role key used (not anon key)
- [ ] Database connection uses SSL
- [ ] Row-level security policies configured (if applicable)

---

## ✅ Monitoring & Logging

### Logging
- [ ] Structured logging implemented (using `backend/utils/logger.js`)
- [ ] Error logs include context and stack traces
- [ ] Webhook events logged
- [ ] Email delivery logged
- [ ] Database operations logged (errors only)

### Monitoring
- [ ] Server uptime monitoring configured
- [ ] API endpoint monitoring configured
- [ ] Error tracking configured (optional: Sentry, Rollbar)
- [ ] Email delivery monitoring (check Brevo dashboard)

### Alerts
- [ ] Webhook failure alerts configured
- [ ] Email delivery failure alerts configured
- [ ] Server downtime alerts configured

---

## ✅ Documentation

### User Documentation
- [ ] User Manual PDF generated
- [ ] Quick Start Guide created
- [ ] All documentation included in download packages

### Developer Documentation
- [ ] `BACKEND_SETUP_GUIDE.md` up to date
- [ ] `PRODUCTION_LAUNCH_GUIDE.md` up to date
- [ ] `README.md` up to date
- [ ] API documentation (if applicable)

### Legal Documents
- [ ] Privacy Policy finalized and included
- [ ] Terms of Service finalized and included
- [ ] License agreement finalized and included

---

## ✅ Website

### Pages
- [ ] Homepage live and working
- [ ] Pricing page links to Stripe checkout
- [ ] Download page working
- [ ] Support/Contact page working
- [ ] Privacy Policy page live
- [ ] Terms of Service page live

### Links
- [ ] All internal links tested
- [ ] All external links tested
- [ ] Stripe checkout links working
- [ ] Download links working

---

## ✅ Final Verification

### End-to-End Test
1. [ ] Make a test purchase (use real card or Stripe test mode)
2. [ ] Receive license key in email
3. [ ] Download installer from email link
4. [ ] Install application
5. [ ] Enter license key
6. [ ] Verify activation successful
7. [ ] Disconnect internet
8. [ ] Verify app works offline
9. [ ] Test all features offline

### Performance
- [ ] API response times acceptable (< 500ms)
- [ ] Email delivery times acceptable (< 30 seconds)
- [ ] License generation instant
- [ ] Database queries optimized

### Backup & Recovery
- [ ] Database backup strategy in place
- [ ] Backup restoration tested
- [ ] Server backup configured (if applicable)

---

## 🚀 Launch Day

### Pre-Launch (Morning)
- [ ] Final backup of database
- [ ] Switch Stripe to live mode (if not already)
- [ ] Verify all environment variables are production values
- [ ] Restart backend: `pm2 restart lpv-api`
- [ ] Verify health endpoint: `curl https://api.localpasswordvault.com/health`
- [ ] Send test purchase email to yourself
- [ ] Verify test purchase email received

### Launch
- [ ] Announce on website
- [ ] Announce on social media (if applicable)
- [ ] Send to email list (if applicable)

### Post-Launch Monitoring (First 24 Hours)
- [ ] Monitor PM2 logs: `pm2 logs lpv-api --lines 100`
- [ ] Monitor Stripe dashboard for payments
- [ ] Monitor Brevo dashboard for email delivery
- [ ] Monitor server resources (CPU, memory, disk)
- [ ] Check for error logs
- [ ] Verify first real purchase processed correctly
- [ ] Verify first real license activation successful

---

## 📋 Maintenance Checklist (Ongoing)

### Daily
- [ ] Check PM2 logs for errors: `pm2 logs lpv-api --lines 50`
- [ ] Monitor Stripe webhook events
- [ ] Check email delivery rates in Brevo

### Weekly
- [ ] Review license activations
- [ ] Review trial conversion rates
- [ ] Check server disk space
- [ ] Review error logs

### Monthly
- [ ] Update dependencies: `npm audit` and `npm update`
- [ ] Review server resources
- [ ] Check SSL certificate expiration
- [ ] Backup database
- [ ] Review and optimize slow database queries

---

## 🆘 Emergency Contacts

- **Server Hosting:** [Your hosting provider support]
- **Database (Supabase):** [Supabase support]
- **Payment (Stripe):** [Stripe support]
- **Email (Brevo):** [Brevo support]
- **Domain:** [Domain registrar support]

---

## 📝 Notes

- Keep this checklist updated as you complete items
- Add any project-specific items as needed
- Review this checklist before each major release

---

**Last Updated:** January 2025  
**Next Review:** Before next major release



