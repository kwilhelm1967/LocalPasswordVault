# Local Password Vault - Backend API

Backend server for Local Password Vault. Handles license key management, trial signups, and Stripe payment processing.

## Stack

| Component | Service |
|-----------|---------|
| Server | Linode |
| Email | Brevo |
| Payments | Stripe |
| Database | Supabase |

## Quick Start

```bash
cd backend
npm install
cp env.example .env
# Edit .env with your values
npm start
```

## Configuration

See `DEVELOPER_SETUP.md` for complete setup instructions.

### Required Environment Variables

```
NODE_ENV=production
PORT=3001

# License Signing Secret (Required - generate: openssl rand -hex 32)
# Used to sign license files and trial files for offline validation
# All validation uses HMAC-SHA256 signed files (not JWT)
# Same secret must be set in frontend VITE_LICENSE_SIGNING_SECRET
LICENSE_SIGNING_SECRET=[64-char-hex-string]

# Stripe
STRIPE_SECRET_KEY=[your-stripe-secret-key]
STRIPE_WEBHOOK_SECRET=[your-webhook-secret]
STRIPE_PRICE_PERSONAL=[price_id_for_personal]
STRIPE_PRICE_FAMILY=[price_id_for_family]

# Brevo (Transactional API - Recommended)
# Get API key from: Brevo → Settings → SMTP & API → API Keys
BREVO_API_KEY=xkeysib-your-api-key-here

# Supabase (Database)
# Get from: Supabase Dashboard → Settings → API
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...YOUR-SERVICE-ROLE-KEY

# Email addresses
FROM_EMAIL=noreply@localpasswordvault.com
SUPPORT_EMAIL=support@localpasswordvault.com

# Website
WEBSITE_URL=https://localpasswordvault.com
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/licenses/validate` | POST | Activate license key |
| `/api/trial/signup` | POST | Start 7-day trial |
| `/api/checkout/session` | POST | Create Stripe checkout (single product) |
| `/api/checkout/bundle` | POST | Create Stripe checkout (bundle with discount) |
| `/api/checkout/products` | GET | List available products |
| `/api/webhooks/stripe` | POST | Handle Stripe payments |
| `/health` | GET | Server status |

## File Structure

```
backend/
├── server.js              # Main server
├── package.json           
├── env.example            # Environment template
├── DEVELOPER_SETUP.md     # Full setup guide
├── routes/
│   ├── licenses.js        # License validation
│   ├── trial.js           # Trial signup
│   ├── checkout.js        # Stripe checkout
│   └── webhooks.js        # Stripe webhooks
├── services/
│   ├── stripe.js          # Stripe integration
│   ├── email.js           # Brevo email
│   └── licenseGenerator.js
├── database/
│   ├── db.js              # Supabase connection
│   └── schema.sql         # Tables
└── templates/
    ├── bundle-email.html
    ├── purchase-confirmation-email.html
    ├── trial-expired-email.html
    ├── trial-expires-tomorrow-email.html
    └── trial-welcome-email.html
```

## Pricing

### Individual Products

| Plan | Price | Devices |
|------|-------|---------|
| Free Trial | $0 | 1 (7 days) |
| Personal Vault | $49 | 1 (lifetime) |
| Family Vault | $79 | 5 (lifetime) |

LPV-only. Bundles (e.g. personal + family) receive discount via `/api/checkout/bundle`.

## Support

Contact: support@localpasswordvault.com
