# ⚠️ URGENT: Deploy CORS Fix to Production

## Current Status
- ✅ Code fixed and committed (commit: `fb3abfa`)
- ✅ Code pushed to GitHub
- ❌ **NOT YET DEPLOYED TO PRODUCTION SERVER**
- ❌ Server is still blocking `localhost:8080` requests

## The Problem
The production server is still running the OLD code that doesn't allow `localhost:8080`. The fix is ready but needs to be deployed.

## Quick Deployment Options

### Option 1: Linode Web Console (LISH) - RECOMMENDED
1. Log into your Linode account: https://cloud.linode.com
2. Go to your server (45.79.40.42)
3. Click "Launch LISH Console" or "Weblish" (web-based terminal)
4. Once in the terminal, run:
   ```bash
   cd /var/www/lpv-api/backend
   git pull origin main
   pm2 restart lpv-api
   pm2 status
   ```

### Option 2: Manual File Edit (If Git Not Available)
1. Access server via Linode web console
2. Edit the file: `/var/www/lpv-api/backend/server.js`
3. Find line ~70-73 (the CORS origin function)
4. Add these lines AFTER line 69 (after `if (!origin) { return callback(null, true); }`):
   ```javascript
   // Allow localhost origins for local development/testing (regardless of NODE_ENV)
   if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
     return callback(null, true);
   }
   ```
5. Save the file
6. Restart: `pm2 restart lpv-api`

### Option 3: Download and Upload File
1. Download from GitHub: https://raw.githubusercontent.com/kwilhelm1967/Vault/main/backend/server.js
2. Upload via Linode File Manager or SFTP to: `/var/www/lpv-api/backend/server.js`
3. Restart: `pm2 restart lpv-api`

## Exact Code to Add
The CORS function should look like this (around line 64-80):

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Electron apps, mobile apps, or curl)
    if (!origin) {
      return callback(null, true);
    }
    // Allow localhost origins for local development/testing (regardless of NODE_ENV)
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    // Allow requests from allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};
```

## Verification After Deployment
1. Test from browser: `http://localhost:8080/trial.html`
2. Enter an email and click "Get My Trial Key"
3. Should work without "Failed to fetch" error

## Server Details
- **IP:** 45.79.40.42
- **Backend Path:** `/var/www/lpv-api/backend` (or wherever your backend is)
- **PM2 App Name:** `lpv-api`
- **GitHub Repo:** https://github.com/kwilhelm1967/Vault
