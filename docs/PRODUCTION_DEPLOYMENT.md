# Production Deployment Guide

Complete guide for deploying Local Password Vault to production.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Variables](#environment-variables)
3. [Server Setup](#server-setup)
4. [Database Configuration](#database-configuration)
5. [Monitoring Setup](#monitoring-setup)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Deployment Steps](#deployment-steps)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Backend Requirements

- [ ] Server provisioned (Linode, AWS, DigitalOcean, etc.)
- [ ] Domain name configured (api.localpasswordvault.com)
- [ ] SSL certificate obtained (Let's Encrypt recommended)
- [ ] Node.js 18+ installed
- [ ] PM2 process manager installed
- [ ] Nginx or reverse proxy configured
- [ ] Firewall configured (ports 80, 443 open)

### Services Setup

- [ ] Supabase project created
- [ ] Stripe account configured (live mode)
- [ ] Brevo account created
- [ ] Sentry account created (optional)
- [ ] Uptime monitoring configured (UptimeRobot/Pingdom)

---

## Environment Variables

### Backend Environment Variables

Create `backend/.env` file with all required variables:

```bash
# Server
NODE_ENV=production
PORT=3001

# Database (Supabase)
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...YOUR-SERVICE-ROLE-KEY

# JWT Secret (generate: openssl rand -base64 64)
JWT_SECRET=your-64-character-secret-here

# License Signing Secret (generate: openssl rand -hex 32)
LICENSE_SIGNING_SECRET=your-64-character-hex-secret-here

# Stripe (LIVE keys)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_PRICE_PERSONAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_FAMILY=price_xxxxxxxxxxxxx
STRIPE_PRICE_LLV_PERSONAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_LLV_FAMILY=price_xxxxxxxxxxxxx

# Email (Brevo)
BREVO_API_KEY=xkeysib-your-api-key-here
FROM_EMAIL=noreply@localpasswordvault.com
SUPPORT_EMAIL=support@localpasswordvault.com

# Website
WEBSITE_URL=https://localpasswordvault.com

# Sentry (Optional)
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### Frontend Environment Variables

Create `.env.production` file:

```bash
# License Server
VITE_LICENSE_SERVER_URL=https://api.localpasswordvault.com
VITE_LICENSE_SIGNING_SECRET=your-64-character-hex-secret-here

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx

# Sentry (Optional)
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# App Version
VITE_APP_VERSION=1.2.0
VITE_APP_MODE=production
```

### Environment Variable Validation

The backend automatically validates all environment variables on startup:

```bash
cd backend
node server.js
```

**Expected output:**
```
✅ Environment validation passed
```

If validation fails, fix the errors and restart.

---

## Server Setup

### 1. Install Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be 18+
npm --version
```

### 2. Install PM2

```bash
sudo npm install -g pm2

# Start PM2 on boot
pm2 startup
# Follow the instructions shown
```

### 3. Clone and Setup Repository

```bash
# Clone repository
git clone https://github.com/kwilhelm1967/Vault.git
cd Vault/backend

# Install dependencies
npm install --production

# Create .env file
cp env.example .env
# Edit .env with your values
nano .env
```

### 4. Configure Nginx

Create `/etc/nginx/sites-available/localpasswordvault-api`:

```nginx
server {
    listen 80;
    server_name api.localpasswordvault.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.localpasswordvault.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.localpasswordvault.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.localpasswordvault.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js
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

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/localpasswordvault-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.localpasswordvault.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

---

## Database Configuration

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for project to be ready
4. Go to Settings → API
5. Copy:
   - Project URL → `SUPABASE_URL`
   - Service Role Key → `SUPABASE_SERVICE_KEY` (NOT anon key)

### 2. Initialize Database Schema

```bash
cd backend
# Run schema SQL in Supabase SQL Editor
# Or use Supabase CLI:
supabase db push
```

### 3. Verify Database Connection

```bash
cd backend
node -e "require('./database/db').initialize().then(() => console.log('✅ Connected')).catch(e => console.error('❌ Failed:', e))"
```

---

## Monitoring Setup

### 1. Sentry Error Tracking

1. Go to [sentry.io](https://sentry.io)
2. Create account and project
3. Select **Node.js** platform
4. Copy DSN to `SENTRY_DSN` in `.env`
5. Verify errors appear in Sentry dashboard

### 2. Uptime Monitoring (UptimeRobot)

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create account
3. Add new monitor:
   - Type: HTTP(s)
   - URL: `https://api.localpasswordvault.com/health`
   - Interval: 5 minutes
4. Add alert contacts (email)
5. Save monitor

### 3. Health Endpoint

Verify health endpoint works:

```bash
curl https://api.localpasswordvault.com/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

## SSL/TLS Configuration

### Let's Encrypt Setup

1. **Install Certbot:**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Obtain Certificate:**
   ```bash
   sudo certbot --nginx -d api.localpasswordvault.com
   ```

3. **Auto-Renewal:**
   Certbot automatically sets up renewal. Test:
   ```bash
   sudo certbot renew --dry-run
   ```

### SSL Configuration Best Practices

- ✅ Use TLS 1.2+ only
- ✅ Strong cipher suites
- ✅ HSTS header enabled
- ✅ Certificate auto-renewal configured
- ✅ Regular certificate monitoring

---

## Deployment Steps

### 1. Build Frontend

```bash
# In project root
npm install
npm run build:prod

# Verify build
ls -la dist/
```

### 2. Deploy Backend

```bash
cd backend

# Install dependencies
npm install --production

# Start with PM2
pm2 start server.js --name lpv-api

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs lpv-api
```

### 3. Verify Deployment

```bash
# Check server is running
curl http://localhost:3001/health

# Check Nginx proxy
curl https://api.localpasswordvault.com/health

# Check PM2
pm2 status
pm2 logs lpv-api --lines 50
```

---

## Post-Deployment Verification

### 1. API Endpoints

Test all endpoints:

```bash
# Health check
curl https://api.localpasswordvault.com/health

# Trial signup (test)
curl -X POST https://api.localpasswordvault.com/api/trial/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Checkout session (test)
curl -X POST https://api.localpasswordvault.com/api/checkout/session \
  -H "Content-Type: application/json" \
  -d '{"product":"personal"}'
```

### 2. Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://api.localpasswordvault.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 3. Email Delivery

Test email sending:

```bash
# Send test email (if test endpoint exists)
# Or make a test purchase and verify email received
```

### 4. Monitoring

- [ ] Sentry dashboard shows no errors
- [ ] UptimeRobot shows "UP" status
- [ ] Health endpoint responds correctly
- [ ] PM2 shows process running
- [ ] Nginx logs show successful requests

---

## Troubleshooting

### Server Won't Start

**Check:**
1. Environment variables validated: `node -e "require('./utils/envValidator').validateAndLog()"`
2. Port 3001 not in use: `lsof -i :3001`
3. Node.js version: `node --version` (should be 18+)
4. Dependencies installed: `npm install`

### Database Connection Fails

**Check:**
1. Supabase URL correct
2. Service role key (not anon key)
3. Database schema initialized
4. Network connectivity

### SSL Certificate Issues

**Check:**
1. Certificate exists: `sudo certbot certificates`
2. Nginx config: `sudo nginx -t`
3. Certificate renewal: `sudo certbot renew --dry-run`

### PM2 Process Crashes

**Check:**
1. PM2 logs: `pm2 logs lpv-api`
2. Environment variables: `pm2 env lpv-api`
3. Restart: `pm2 restart lpv-api`

---

## Maintenance

### Regular Tasks

- **Daily**: Check Sentry for errors
- **Weekly**: Review uptime monitoring
- **Monthly**: Check SSL certificate expiration
- **Quarterly**: Review and update dependencies

### Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Restart PM2
pm2 restart lpv-api

# Verify
pm2 logs lpv-api
```

---

## Security Checklist

- [ ] All environment variables set
- [ ] `.env` file permissions: `chmod 600 .env`
- [ ] SSL certificate valid and auto-renewing
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] PM2 running as non-root user
- [ ] Database uses service role key (not anon key)
- [ ] Stripe using live keys (not test keys)
- [ ] Sentry configured for error tracking
- [ ] Uptime monitoring active

---

## Support

For deployment issues:

- **Email**: support@localpasswordvault.com
- **Documentation**: See other guides in `/docs`
- **Logs**: `pm2 logs lpv-api`

---

**Your production deployment is ready!** 🚀

