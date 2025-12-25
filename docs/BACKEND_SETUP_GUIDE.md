# Local Password Vault - Backend Setup Guide

## Overview

This guide walks through deploying the existing backend API codebase to handle:
- License key generation and validation
- Stripe payment webhook processing
- Email delivery via Brevo Transactional API
- Trial signup management

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Linode API    │────▶│    Supabase     │
│   (Electron)    │     │   (Node.js)     │     │   (PostgreSQL)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │     Stripe      │
                        │   (Payments)    │
                        └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │     Brevo       │
                        │  (Transactional)│
                        └─────────────────┘
```

**Stack:**
- **Server**: Linode (Ubuntu 22.04 LTS)
- **Database**: Supabase (PostgreSQL)
- **Email**: Brevo Transactional API
- **Payments**: Stripe

---

## Step 1: Supabase Database Setup

### 1.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **New Project**
3. Enter project name: `local-password-vault`
4. Set database password (save securely)
5. Choose region closest to your server
6. Click **Create new project**
7. Wait 2-3 minutes for project to initialize

### 1.2 Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Open `backend/database/schema.sql` from the repository
3. Copy the entire schema
4. Paste into SQL Editor
5. Click **Run** to execute

The schema creates these tables:
- `customers` - Customer records from Stripe
- `licenses` - License keys with activation tracking
- `trials` - Trial signups with expiration tracking
- `device_activations` - Device tracking for family plans
- `webhook_events` - Stripe webhook event logging

### 1.3 Get Supabase Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://YOUR-PROJECT-ID.supabase.co`
   - **Service Role Key**: `eyJhbGc...` (use service_role key, NOT anon key)

Save these for Step 2.

---

## Step 2: Deploy Backend Code

### 2.1 Server Setup

```bash
# SSH into Linode server
ssh root@[LINODE_IP]

# Install Node.js 18+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (reverse proxy)
apt update && apt install -y nginx
```

### 2.2 Clone and Setup Repository

```bash
# Clone repository
git clone https://github.com/kwilhelm1967/Vault.git
cd Vault/backend

# Install dependencies
npm install

# Create environment file
cp env.example .env
nano .env
```

### 2.3 Configure Environment Variables

Edit `.env` with your values:

```env
NODE_ENV=production
PORT=3001

# Generate: openssl rand -base64 32
JWT_SECRET=[64-CHAR-RANDOM-STRING]

# Stripe (from Stripe Dashboard → Developers → API keys)
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Stripe Price IDs (from Stripe Dashboard → Products → Prices)
STRIPE_PRICE_PERSONAL=price_xxxxx
STRIPE_PRICE_FAMILY=price_xxxxx
STRIPE_PRICE_LLV_PERSONAL=price_xxxxx
STRIPE_PRICE_LLV_FAMILY=price_xxxxx

# Brevo Transactional API (from Brevo → Settings → SMTP & API → API Keys)
BREVO_API_KEY=xkeysib-YOUR_API_KEY

# Supabase (from Step 1.3)
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...YOUR-SERVICE-ROLE-KEY

# Email addresses
FROM_EMAIL=noreply@localpasswordvault.com
SUPPORT_EMAIL=support@localpasswordvault.com

# Website
WEBSITE_URL=https://localpasswordvault.com
```

### 2.4 Start Server

```bash
# Start with PM2
pm2 start server.js --name vault-api

# Save PM2 process list (auto-restart on reboot)
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs vault-api
```

---

## Step 3: Configure Nginx

### 3.1 Create Nginx Config

```bash
nano /etc/nginx/sites-available/vault-api
```

Paste:

```nginx
server {
    listen 80;
    server_name api.localpasswordvault.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.localpasswordvault.com;

    ssl_certificate /etc/letsencrypt/live/api.localpasswordvault.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.localpasswordvault.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3.2 Enable Site

```bash
ln -s /etc/nginx/sites-available/vault-api /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 3.3 Install SSL Certificate

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.localpasswordvault.com
```

---

## Step 4: Configure Stripe

### 4.1 Create Products in Stripe

Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products) and create:

| Product | Price | Type | Price ID Variable |
|---------|-------|------|-------------------|
| Personal Vault (LPV) | $49.00 | One-time | `STRIPE_PRICE_PERSONAL` |
| Family Vault (LPV) | $79.00 | One-time | `STRIPE_PRICE_FAMILY` |
| Local Legacy Vault - Personal | $49.00 | One-time | `STRIPE_PRICE_LLV_PERSONAL` |
| Local Legacy Vault - Family | $129.00 | One-time | `STRIPE_PRICE_LLV_FAMILY` |

Copy each Price ID and add to `.env`.

### 4.2 Configure Webhook

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter URL: `https://api.localpasswordvault.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
5. Click **Add endpoint**
6. Copy **Signing secret** (starts with `whsec_`)
7. Add to `.env` as `STRIPE_WEBHOOK_SECRET`
8. Restart server: `pm2 restart vault-api`

---

## Step 5: Configure Brevo Email

1. Go to [Brevo Dashboard](https://app.brevo.com)
2. Navigate to **Settings** → **SMTP & API** → **API Keys**
3. Click **Generate a new API key**
4. Name: `Local Password Vault Backend`
5. Permissions: **Send emails**
6. Copy the API key (starts with `xkeysib-`)
7. Add to `.env` as `BREVO_API_KEY`

**Note:** The backend uses Brevo's Transactional API (not SMTP). This is more reliable and doesn't require SMTP credentials.

---

## Step 6: DNS Configuration

Add DNS A record pointing to your Linode IP:

| Type | Name | Value |
|------|------|-------|
| A | api | [YOUR_LINODE_IP] |

---

## Step 7: Test Deployment

### Health Check

```bash
curl https://api.localpasswordvault.com/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-01-09T...","version":"1.0.0"}
```

### Test Trial Signup

```bash
curl -X POST https://api.localpasswordvault.com/api/trial/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Check that email was sent via Brevo.

---

## Step 8: Set Up Trial Email Automation

The system sends automated emails for trial expiration. Set up a daily cron job:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 9 AM)
0 9 * * * cd /path/to/Vault/backend && /usr/bin/node jobs/trialEmails.js >> /var/log/trial-emails.log 2>&1
```

Or use PM2:

```bash
pm2 start backend/jobs/trialEmails.js --name trial-emails --cron "0 9 * * *" --no-autorestart
pm2 save
```

---

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Server status check |
| `/api/licenses/validate` | POST | Legacy JWT-based license validation |
| `/api/lpv/license/activate` | POST | Modern license activation with device binding |
| `/api/lpv/license/transfer` | POST | Transfer license to new device |
| `/api/trial/signup` | POST | Start 7-day free trial |
| `/api/checkout/session` | POST | Create Stripe checkout (single product) |
| `/api/checkout/bundle` | POST | Create Stripe checkout (bundle with discount) |
| `/api/checkout/products` | GET | List available products |
| `/api/webhooks/stripe` | POST | Handle Stripe payment webhooks |

---

## Monitoring

### View Logs

```bash
# API logs
pm2 logs vault-api

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Restart Services

```bash
# Restart API
pm2 restart vault-api

# Restart Nginx
systemctl restart nginx
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Email not sending | Verify `BREVO_API_KEY` in `.env` |
| Webhook failing | Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard |
| 502 Bad Gateway | Check `pm2 status` - server may not be running |
| Database errors | Verify Supabase credentials and schema is run |
| SSL errors | Run `certbot renew` |

---

## Security Checklist

- [ ] SSL certificate installed (HTTPS)
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Environment variables secured (`.env` not in git)
- [ ] PM2 running with auto-restart
- [ ] Regular backups of Supabase data
- [ ] Brevo API key has minimal required permissions

---

## Support

For issues, contact: support@localpasswordvault.com
