# Local Password Vault - Backend API

Backend server for Local Password Vault. Handles license key management, trial signups, and Stripe payment processing.

## Stack

| Component | Service |
|-----------|---------|
| Server | Linode |
| Email | Brevo |
| Payments | Stripe |
| Database | SQLite |

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
JWT_SECRET=[64-char-random-string]

# Stripe
STRIPE_SECRET_KEY=[your-stripe-secret-key]
STRIPE_WEBHOOK_SECRET=[your-webhook-secret]

# Brevo
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=[your-brevo-email]
SMTP_PASSWORD=[your-brevo-smtp-key]

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
| `/api/checkout/session` | POST | Create Stripe checkout |
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
│   ├── db.js              # SQLite connection
│   └── schema.sql         # Tables
└── templates/
    ├── purchase-email.html
    └── trial-email.html
```

## Pricing

| Plan | Price | Devices |
|------|-------|---------|
| Free Trial | $0 | 1 (7 days) |
| Personal Vault | $49 | 1 (lifetime) |
| Family Vault | $79 | 5 (lifetime) |

## Support

Contact: support@localpasswordvault.com
