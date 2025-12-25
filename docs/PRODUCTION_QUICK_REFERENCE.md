# Production Deployment - Quick Reference

Quick reference for production deployment and edge case handling.

---

## Environment Variables Checklist

### Backend (`backend/.env`)

```bash
✅ NODE_ENV=production
✅ PORT=3001
✅ SUPABASE_URL=https://*.supabase.co
✅ SUPABASE_SERVICE_KEY=eyJ...
✅ JWT_SECRET=(64+ chars)
✅ LICENSE_SIGNING_SECRET=(64+ chars hex)
✅ STRIPE_SECRET_KEY=sk_live_...
✅ STRIPE_WEBHOOK_SECRET=whsec_...
✅ STRIPE_PRICE_PERSONAL=price_...
✅ STRIPE_PRICE_FAMILY=price_...
✅ STRIPE_PRICE_LLV_PERSONAL=price_...
✅ STRIPE_PRICE_LLV_FAMILY=price_...
✅ BREVO_API_KEY=xkeysib-...
✅ FROM_EMAIL=noreply@...
✅ SUPPORT_EMAIL=support@...
✅ WEBSITE_URL=https://...
⚠️ SENTRY_DSN=https://... (optional)
```

### Frontend (`.env.production`)

```bash
✅ VITE_LICENSE_SERVER_URL=https://api.localpasswordvault.com
✅ VITE_LICENSE_SIGNING_SECRET=(same as backend)
✅ VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
⚠️ VITE_SENTRY_DSN=https://... (optional)
✅ VITE_APP_MODE=production
✅ VITE_APP_VERSION=1.2.0
```

---

## Validation Commands

### Validate Environment Variables

```bash
# Backend validation (automatic on startup)
cd backend
node server.js

# Manual validation
node scripts/validate-env.js

# Or use the validator directly
node -e "require('./backend/utils/envValidator').validateAndLog()"
```

---

## Deployment Commands

### Backend Deployment

```bash
# 1. Install dependencies
cd backend
npm install --production

# 2. Validate environment
node scripts/validate-env.js

# 3. Start with PM2
pm2 start server.js --name lpv-api

# 4. Save PM2 config
pm2 save

# 5. Check status
pm2 status
pm2 logs lpv-api
```

### Frontend Deployment

```bash
# 1. Install dependencies
npm install

# 2. Build production
npm run build:prod

# 3. Deploy dist/ folder to hosting
```

---

## Monitoring Commands

### Check Health

```bash
# Local
curl http://localhost:3001/health

# Production
curl https://api.localpasswordvault.com/health
```

### Check PM2

```bash
# Status
pm2 status

# Logs
pm2 logs lpv-api

# Restart
pm2 restart lpv-api

# Stop
pm2 stop lpv-api
```

### Check Storage (Frontend)

```typescript
import { getStorageStats } from './utils/storageQuotaHandler';

const stats = await getStorageStats();
console.log(`Storage: ${stats.percentage.toFixed(1)}% used`);
```

---

## Edge Case Handling

### Storage Quota

**Automatic:**
- ✅ Pre-save quota checking
- ✅ Automatic cleanup (old backups)
- ✅ Clear error messages

**Manual:**
```typescript
import { freeUpStorage } from './utils/storageQuotaHandler';

const result = await freeUpStorage();
console.log(result.message);
```

### Corrupted Files

**Automatic:**
- ✅ Corruption detection
- ✅ Automatic recovery
- ✅ Backup restoration

**Manual Recovery:**
```typescript
import { recoverVaultData, restoreFromBackup } from './utils/corruptionHandler';

// Restore from backup
const backup = restoreFromBackup('password_entries_v2');

// Recover corrupted data
const recovery = recoverVaultData(corruptedData);
```

---

## Troubleshooting

### Server Won't Start

```bash
# Check environment
node scripts/validate-env.js

# Check port
lsof -i :3001

# Check logs
pm2 logs lpv-api
```

### Storage Quota Error

1. Check storage: `getStorageStats()`
2. Free space: `freeUpStorage()`
3. Export entries to reduce size
4. Clear old backups

### Corrupted Data

1. Check corruption: `checkVaultDataCorruption(data)`
2. Attempt recovery: `recoverVaultData(data)`
3. Restore backup: `restoreFromBackup(key)`
4. If all fails: Restore from export

---

## Security Checklist

- [ ] `.env` file permissions: `chmod 600 .env`
- [ ] SSL certificate valid
- [ ] Firewall configured
- [ ] PM2 running as non-root
- [ ] Database uses service role key
- [ ] Stripe using live keys
- [ ] Sentry configured
- [ ] Uptime monitoring active

---

## Quick Links

- **Full Deployment Guide**: `PRODUCTION_DEPLOYMENT.md`
- **Edge Case Handling**: `EDGE_CASE_HANDLING.md`
- **Monitoring Setup**: `MONITORING_SETUP.md`
- **Environment Validator**: `backend/utils/envValidator.js`

---

**Keep this reference handy for quick deployment checks!**

