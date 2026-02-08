# Supabase Edge Functions & Secrets Audit — Local Password Vault

**Date:** February 8, 2026  
**Scope:** Full audit of Supabase configuration requirements for all LPV processes: purchases, emails, downloads, license activation, trials, admin dashboard.

---

## EXECUTIVE SUMMARY

The backend (`backend/server.js`) is a standalone Express.js server that connects to Supabase **only as a database** (via `@supabase/supabase-js` client). All business logic (license generation, Stripe checkout, email sending, webhook processing) runs in this Express server — **NOT** in Supabase Edge Functions.

However, the **Admin Dashboard** (`src/components/AdminDashboard.tsx`) calls `{SUPABASE_URL}/functions/v1/*` endpoints, expecting **40+ Supabase Edge Functions** that do **NOT exist** in this repository. This is the single biggest gap.

| Area | Status | Critical Issue? |
|------|--------|----------------|
| Supabase Database (tables/schema) | MOSTLY COMPLETE | 1 missing column |
| Supabase Auth (admin login) | IN USE | Needs admin user created |
| Supabase Edge Functions | **NOT DEPLOYED** | 40+ functions missing |
| Backend Secrets (.env) | DOCUMENTED | Need to be set on server |
| Frontend Secrets (.env) | DOCUMENTED | Need to be set at build |
| Stripe Integration | COMPLETE | Needs live keys |
| Email (Brevo) Integration | COMPLETE | Needs API key |
| Trial Email Job | COMPLETE | Needs cron setup |

---

## SECTION 1: SUPABASE DATABASE TABLES

### Required Tables (from `backend/database/schema.sql`)

| Table | Status | Notes |
|-------|--------|-------|
| `customers` | REQUIRED | Email, Stripe customer ID, name |
| `licenses` | REQUIRED | License keys, activation, device binding |
| `trials` | REQUIRED | Trial signups, expiration tracking |
| `device_activations` | REQUIRED | Family plan multi-device tracking |
| `webhook_events` | REQUIRED | Stripe webhook idempotency log |
| `support_tickets` | REQUIRED | Customer support system |
| `ticket_messages` | REQUIRED | Ticket conversation thread |

### Schema Gap: `trials.product_type` Column Missing

The schema at `backend/database/schema.sql` does **not** include a `product_type` column on the `trials` table, but the backend code at `backend/database/db.js:293` conditionally inserts it:

```javascript
if (product_type) {
  insertData.product_type = product_type;
}
```

**Fix required — run this ALTER in Supabase SQL Editor:**

```sql
ALTER TABLE trials ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'lpv';
```

### Schema Gap: `licenses.plan_type` CHECK Constraint Too Restrictive

The schema's CHECK constraint is:
```sql
CHECK (plan_type IN ('personal', 'family', 'llv_personal', 'llv_family'))
```

But the webhook handler at `backend/routes/webhooks.js:274-281` also creates licenses with plan types `afterpassing_addon` and `afterpassing_standalone`. These will fail the constraint.

**Fix required — run this ALTER in Supabase SQL Editor:**

```sql
ALTER TABLE licenses DROP CONSTRAINT IF EXISTS licenses_plan_type_check;
ALTER TABLE licenses ADD CONSTRAINT licenses_plan_type_check 
  CHECK (plan_type IN ('personal', 'family', 'llv_personal', 'llv_family', 'afterpassing_addon', 'afterpassing_standalone', 'trial'));
```

### Schema Gap: `licenses.product_type` CHECK Constraint Too Restrictive

The schema's CHECK constraint is:
```sql
CHECK (product_type IN ('lpv', 'llv'))
```

But AfterPassing products use `product_type = 'afterpassing'` (set in `backend/services/stripe.js:43,49`).

**Fix required:**

```sql
ALTER TABLE licenses DROP CONSTRAINT IF EXISTS licenses_product_type_check;
ALTER TABLE licenses ADD CONSTRAINT licenses_product_type_check 
  CHECK (product_type IN ('lpv', 'llv', 'afterpassing'));
```

---

## SECTION 2: SUPABASE EDGE FUNCTIONS — CRITICAL GAP

### The Problem

The Admin Dashboard (`AdminPortal.tsx` line 8) constructs its API base as:

```typescript
apiBase: SUPABASE_URL + "/functions/v1"
```

Then `AdminDashboard.tsx` calls `fetchAdmin(path)` which resolves to:

```
{SUPABASE_URL}/functions/v1/{function-name}
```

This means the Admin Dashboard expects **Supabase Edge Functions** to be deployed. These are **separate serverless functions** that run inside Supabase's Deno runtime, distinct from the Express backend.

### Required Edge Functions (40+ endpoints called by AdminDashboard)

**Core Metrics & Stats:**
| Edge Function | Purpose | Called From |
|--------------|---------|------------|
| `admin-dashboard-metrics` | Dashboard KPIs (revenue, users, conversions) | `loadMetrics()` |
| `admin-stats-overview` | License counts, revenue totals | `loadOverview()` |
| `admin-stats-recent` | Recent 30-day license activity | `loadRecent()` |
| `admin-stats-trials` | Trial statistics and conversion rates | `loadTrials()` |
| `admin-stats-customers` | Customer LTV and top customers | `loadCustomers()` |

**License Management:**
| Edge Function | Purpose |
|--------------|---------|
| `admin-license-actions` | Create, revoke, search, lookup licenses |
| `admin-license-reports` | License analytics and reports |

**Customer Management:**
| Edge Function | Purpose |
|--------------|---------|
| `admin-customer-actions` | Search customers, view details, merge |

**Webhook Management:**
| Edge Function | Purpose |
|--------------|---------|
| `admin-webhooks-failed` | List failed Stripe webhooks |

**Email & Communication:**
| Edge Function | Purpose |
|--------------|---------|
| `admin-resend-email` | Resend purchase/trial emails |
| `admin-email-logs` | View sent email history |
| `admin-email-deliverability` | Email delivery metrics |
| `admin-suppression` | Manage suppressed/bounced emails |

**Fraud & Security:**
| Edge Function | Purpose |
|--------------|---------|
| `admin-fraud-signals` | Fraud detection signals |
| `admin-audit-log` | Admin action audit trail |
| `admin-policy` | Security policy management |

**Support & Tickets:**
| Edge Function | Purpose |
|--------------|---------|
| `admin-ticket-actions` | Manage support tickets |

**Downloads:**
| Edge Function | Purpose |
|--------------|---------|
| `admin-download-health` | Download link health checks |

**Trials:**
| Edge Function | Purpose |
|--------------|---------|
| `trial-signup` | Create trial (called from admin) |

**Leads & Marketing:**
| Edge Function | Purpose |
|--------------|---------|
| `admin-leads` | Lead management and CRM |
| `admin-campaign-costs` | Marketing campaign tracking |
| `admin-nps` | Net Promoter Score tracking |
| `admin-analytics` | User analytics dashboard |

**Product Management:**
| Edge Function | Purpose |
|--------------|---------|
| `admin-feature-requests` | Feature request tracking |
| `admin-bug-dashboard` | Bug tracking overview |
| `admin-bug-reports` | Individual bug reports |
| `admin-builds` | Build/release management |
| `admin-release-notes` | Release notes CRUD |
| `admin-announcements` | User announcements |
| `admin-rollout` | Feature flag rollout |
| `admin-error-rates` | Error rate monitoring |

**Knowledge Base:**
| Edge Function | Purpose |
|--------------|---------|
| `admin-kb-articles` | Knowledge base article management |

**Automation:**
| Edge Function | Purpose |
|--------------|---------|
| `admin-automation` | Workflow automation, attribution |

**Data Export:**
| Edge Function | Purpose |
|--------------|---------|
| `admin-exports` | CSV export of licenses/customers/trials |

**Compliance:**
| Edge Function | Purpose |
|--------------|---------|
| `admin-texas-filing` | Texas business filing tracking |

### What Needs to Happen

**Option A (Recommended): Route Admin Dashboard through Express backend**

The Express backend already has admin endpoints at `/api/admin/*` (see `backend/routes/admin.js`). These cover some of the functionality (stats, webhook retry, email resend, license search). The simplest fix is:

1. Change `AdminPortal.tsx` to point `apiBase` at the Express backend URL instead of Supabase Edge Functions
2. Add the missing admin endpoints to `backend/routes/admin.js`
3. This avoids the need for Supabase Edge Functions entirely

**Option B: Deploy Supabase Edge Functions**

Create and deploy 40+ Edge Functions in a `supabase/functions/` directory. Each function would:
1. Authenticate via the Supabase JWT token (already sent in Authorization header)
2. Query the Supabase database
3. Return JSON responses

This is significantly more work and creates a second deployment surface.

---

## SECTION 3: REQUIRED SECRETS / ENVIRONMENT VARIABLES

### Backend Server (.env) — All Required

| Variable | Purpose | Format | Status |
|----------|---------|--------|--------|
| `NODE_ENV` | Environment mode | `production`/`development`/`test` | Documented |
| `PORT` | Server port | Number (e.g., `3001`) | Documented |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` | Documented |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJ...` (JWT) | Documented |
| `LICENSE_SIGNING_SECRET` | HMAC signing for license files | 32+ char hex string | Documented |
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_live_...` or `sk_test_...` | Documented |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature secret | `whsec_...` | Documented |
| `STRIPE_PRICE_PERSONAL` | Stripe price ID for Personal plan | `price_...` | Documented |
| `STRIPE_PRICE_FAMILY` | Stripe price ID for Family plan | `price_...` | Documented |
| `BREVO_API_KEY` | Brevo transactional email API key | `xkeysib-...` | Documented |
| `FROM_EMAIL` | Sender email address | Email address | Documented |
| `SUPPORT_EMAIL` | Support email address | Email address | Documented |
| `WEBSITE_URL` | Main website URL | `https://...` | Documented |
| `ADMIN_API_KEY` | Admin dashboard API key | Random hex string | Documented |

**Optional Backend Secrets:**

| Variable | Purpose | Status |
|----------|---------|--------|
| `SENTRY_DSN` | Error tracking | Optional |
| `STRIPE_PRICE_AFTERPASSING_ADDON` | AfterPassing add-on price ID | Used if selling bundles |
| `STRIPE_PRICE_AFTERPASSING_STANDALONE` | AfterPassing standalone price ID | Used if selling bundles |
| `AFTERPASSING_WEBSITE_URL` | AfterPassing redirect URL | Used if selling bundles |
| `LLV_WEBSITE_URL` | Legacy Vault website | Not used in LPV-only mode |

### Frontend (.env) — Build-Time Variables

| Variable | Purpose | Format | Status |
|----------|---------|--------|--------|
| `VITE_SUPABASE_URL` | Supabase URL (for Admin Portal) | `https://xxx.supabase.co` | Documented |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (for Admin Portal auth) | `eyJ...` | Documented |
| `VITE_LICENSE_SERVER_URL` | Backend API URL | `https://api.localpasswordvault.com` | Documented |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` or `pk_test_...` | In `.env.example` |
| `VITE_LICENSE_SIGNING_SECRET` | **SECURITY ISSUE** — signing secret in frontend | Same as backend `LICENSE_SIGNING_SECRET` | See Gap Analysis |
| `VITE_ADMIN_PORTAL_ENABLED` | Enable admin portal | `true`/`false` | In `.env.example` |
| `VITE_APP_MODE` | App mode | `production`/`development` | Optional |
| `VITE_ANALYTICS_ENABLED` | Analytics flag (no-op) | `false` | Optional |

---

## SECTION 4: PROCESS-BY-PROCESS VERIFICATION

### 1. PURCHASE FLOW (Buy a License)

| Step | Component | Secrets Needed | Status |
|------|-----------|---------------|--------|
| User clicks Buy | `LicenseScreen.tsx` | `VITE_STRIPE_PUBLISHABLE_KEY` | OK — handled client-side |
| Create checkout session | `backend/routes/checkout.js` | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PERSONAL`, `STRIPE_PRICE_FAMILY` | OK |
| Stripe redirects to success | `PurchaseSuccessPage.tsx` | None (reads from backend) | OK |
| Webhook fires | `backend/routes/webhooks.js` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | OK |
| License key generated | `backend/services/licenseGenerator.js` | None (crypto.randomBytes) | OK |
| License file signed | `backend/services/licenseSigner.js` | `LICENSE_SIGNING_SECRET` | OK |
| License saved to DB | `backend/database/db.js` | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | OK |
| Purchase email sent | `backend/services/email.js` | `BREVO_API_KEY`, `FROM_EMAIL` | OK |
| **VERDICT** | | | **ALL PROCESSES IN PLACE** |

### 2. TRIAL FLOW

| Step | Component | Secrets Needed | Status |
|------|-----------|---------------|--------|
| User enters email | `LicenseScreen.tsx` → `POST /api/trial/signup` | None client-side | OK |
| Trial created in DB | `backend/routes/trial.js` | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | OK |
| Trial email sent | `backend/services/email.js` | `BREVO_API_KEY`, `FROM_EMAIL` | OK |
| User activates trial key | `trialService.ts` → `POST /api/lpv/license/trial/activate` | `VITE_LICENSE_SERVER_URL` | OK |
| Trial file signed | `backend/services/licenseSigner.js` | `LICENSE_SIGNING_SECRET` | OK |
| Expiring email (24hr) | `backend/jobs/trialEmails.js` | `BREVO_API_KEY`, cron job | **NEEDS CRON SETUP** |
| Expired email (discount) | `backend/jobs/trialEmails.js` | `BREVO_API_KEY`, cron job | **NEEDS CRON SETUP** |
| **VERDICT** | | | **CORE OK; CRON JOBS NEED SETUP** |

### 3. LICENSE ACTIVATION FLOW

| Step | Component | Secrets Needed | Status |
|------|-----------|---------------|--------|
| User enters key | `LicenseScreen.tsx` | None client-side | OK |
| Activation API call | `licenseService.ts` → `POST /api/lpv/license/activate` | `VITE_LICENSE_SERVER_URL` | OK |
| Device ID validated | `backend/routes/lpv-licenses.js` | None (regex check) | OK |
| License looked up in DB | `backend/database/db.js` | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | OK |
| Device bound in DB | `backend/routes/lpv-licenses.js` | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | OK |
| License file signed | `backend/services/licenseSigner.js` | `LICENSE_SIGNING_SECRET` | OK |
| Offline validation | `licenseValidator.ts` | `VITE_LICENSE_SIGNING_SECRET` | OK (but security concern — see Gap Analysis) |
| **VERDICT** | | | **ALL PROCESSES IN PLACE** |

### 4. EMAIL SYSTEM

| Email Type | Template | Service | Status |
|-----------|----------|---------|--------|
| Purchase confirmation | `purchase-confirmation-email.html` | Brevo | OK |
| Bundle purchase | `bundle-email.html` | Brevo | OK |
| Trial welcome | `trial-welcome-email.html` | Brevo | OK |
| Trial expiring (24hr) | `trial-expires-tomorrow-email.html` | Brevo | OK but **needs cron** |
| Trial expired (discount) | `trial-expired-email.html` | Brevo | OK but **needs cron** |
| Support ticket created | Inline HTML in `email.js` | Brevo | OK |
| Support ticket response | Inline HTML in `email.js` | Brevo | OK |
| System alert | Inline HTML in `email.js` | Brevo | OK |
| **VERDICT** | | | **TEMPLATES IN PLACE; CRON NEEDED** |

### 5. DOWNLOADS

Downloads are handled via direct GitHub Release URLs hardcoded in `backend/services/email.js:125-128`:

```
Windows: https://github.com/kwilhelm1967/Vault/releases/download/V1.2.0/...
Mac: https://github.com/kwilhelm1967/Vault/releases/latest/download/...
Linux: https://github.com/kwilhelm1967/Vault/releases/latest/download/...
```

No Supabase dependency. No secrets needed. **Status: IN PLACE**.

### 6. ADMIN DASHBOARD

| Component | Dependency | Status |
|-----------|-----------|--------|
| Admin login | Supabase Auth (`/auth/v1/token`) | **NEEDS: Supabase Auth user created** |
| API base | `{SUPABASE_URL}/functions/v1` | **BROKEN: No edge functions deployed** |
| 40+ admin endpoints | Supabase Edge Functions | **NOT DEPLOYED** |
| **VERDICT** | | **ADMIN DASHBOARD WILL NOT WORK** |

---

## SECTION 5: ACTION ITEMS

### P0 — Must Fix for Core Functionality

1. **Run `schema.sql`** in Supabase SQL Editor to create all tables
2. **Run schema fixes** (ALTER TABLE commands above) for `trials.product_type`, `licenses.plan_type`, `licenses.product_type`
3. **Set all backend `.env` secrets** on the production server (see Section 3)
4. **Set frontend `.env` build variables** before building the Electron app

### P1 — Must Fix for Full Functionality

5. **Set up cron job** for `backend/jobs/trialEmails.js` — run every hour:
   ```bash
   0 * * * * cd /path/to/backend && node jobs/trialEmails.js >> /var/log/trial-emails.log 2>&1
   ```

6. **Fix Admin Dashboard** — either:
   - **(Recommended)** Repoint `AdminPortal.tsx` to the Express backend at `https://api.localpasswordvault.com/api/admin` and extend `backend/routes/admin.js` to cover all 40+ endpoints
   - OR deploy 40+ Supabase Edge Functions

7. **Create Supabase Auth admin user** for Admin Portal login:
   - Go to Supabase Dashboard → Authentication → Users → Add User
   - Create a user with email/password for admin access

### P2 — Security Improvements (from Gap Analysis)

8. **Remove `VITE_LICENSE_SIGNING_SECRET`** from frontend — switch to asymmetric crypto
9. **Remove `licenseKeys.ts`** hardcoded keys from frontend bundle
10. **Add `VITE_SUPABASE_URL`** and `VITE_SUPABASE_ANON_KEY`** to frontend .env for Admin Portal

---

## SECTION 6: SUPABASE PROJECT CHECKLIST

Run through this checklist in the Supabase Dashboard:

- [ ] **Database → SQL Editor:** Run `backend/database/schema.sql` 
- [ ] **Database → SQL Editor:** Run the 3 ALTER TABLE commands from Section 1
- [ ] **Settings → API:** Copy `SUPABASE_URL` → set in backend `.env`
- [ ] **Settings → API:** Copy `service_role` key → set as `SUPABASE_SERVICE_KEY` in backend `.env`
- [ ] **Settings → API:** Copy `anon` key → set as `VITE_SUPABASE_ANON_KEY` in frontend `.env`
- [ ] **Authentication → Users:** Create admin user (email + password)
- [ ] **Authentication → Settings:** Ensure email auth is enabled
- [ ] **Database → Tables:** Verify all 7 tables exist with correct columns
- [ ] **Database → Policies:** (Optional) Add RLS policies for additional security
- [ ] **Edge Functions:** Deploy required functions OR repoint Admin Dashboard to Express backend
