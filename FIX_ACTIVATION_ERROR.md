# Fix Activation Error - Steps

## Problem
The app can't connect to the license server because CORS is blocking Electron app requests.

## Solution Applied
Updated backend CORS to allow Electron app requests (which don't send an Origin header).

## Steps to Fix on Server

### 1. Pull the latest code on your Linode server

**In your SSH terminal (connected to Linode):**

```bash
cd /var/www/lpv-api/Vault
git pull
```

### 2. Restart the backend

```bash
cd /var/www/lpv-api/Vault/backend
pm2 restart lpv-api
```

### 3. Verify it's running

```bash
pm2 status
```

Should show `lpv-api` as "online".

### 4. Test the health endpoint

```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok",...}`

---

## Important: App Must Be Built with Correct Backend URL

**If you downloaded a pre-built app from GitHub Releases**, it might have been built with the wrong backend URL.

**You need to rebuild the app** with the production settings:

1. Make sure `.env` file in project root has:
   ```
   VITE_LICENSE_SERVER_URL=http://172.236.111.48:3001
   VITE_APP_MODE=production
   VITE_LICENSE_SIGNING_SECRET=57a1755a36ae9774635953c2663f0c62815f17e59232eacc65c05d75c80de665
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51RjoKKI1GYJUOJOHFhrQIOM8jcjj5CTtcQzzjyHGi4ne3SD2GBxLvWRBIGJmHPPEojVHKZJoRq88EChyVQthL2tw00EQzjYvp2
   ```

2. Rebuild:
   ```bash
   npm run build:prod
   ```

3. Create the distributable:
   ```bash
   npm run dist:win
   ```
   (or `dist:mac` or `dist:linux` for other platforms)

4. Install and test the newly built app

---

## After Fix

Once the backend is restarted and you're using an app built with the correct settings, activation should work!
