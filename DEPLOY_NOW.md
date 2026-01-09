# 🚨 DEPLOY CORS FIX NOW - Step by Step

## Current Situation
- ✅ Code is FIXED and in GitHub
- ❌ Production server is still running OLD code
- ❌ Server is blocking `localhost:8080`

## ⚡ FASTEST WAY TO DEPLOY (5 minutes)

### Method 1: Linode Web Console (EASIEST)

1. **Open Linode Dashboard:**
   - Go to: https://cloud.linode.com
   - Log in

2. **Find Your Server:**
   - Look for server with IP: `45.79.40.42`
   - Click on it

3. **Open Web Console:**
   - Click **"Launch LISH Console"** button (or "Weblish")
   - A terminal window will open in your browser

4. **Deploy the Fix:**
   Type these commands one by one:
   ```bash
   cd /var/www/lpv-api/backend
   git pull origin main
   pm2 restart lpv-api
   pm2 status
   ```

5. **Verify:**
   - You should see `lpv-api` status as "online"
   - Test: http://localhost:8080/trial.html

**DONE!** The fix is deployed.

---

### Method 2: Manual File Upload (If Git Doesn't Work)

1. **Download the Fixed File:**
   - File is ready: `DEPLOY_THIS_server.js` (in project root)
   - OR download from: https://raw.githubusercontent.com/kwilhelm1967/Vault/main/backend/server.js

2. **Upload to Server:**
   - Use Linode File Manager (in Linode dashboard)
   - OR use FileZilla/WinSCP
   - Upload to: `/var/www/lpv-api/backend/server.js`
   - Replace the existing file

3. **Restart Server:**
   - Use Linode web console
   - Run: `pm2 restart lpv-api`

---

### Method 3: GitHub Actions (Automatic - Requires Setup)

I've created a GitHub Actions workflow (`.github/workflows/deploy-backend.yml`).

**To enable it:**
1. Go to: https://github.com/kwilhelm1967/Vault/settings/secrets/actions
2. Add secret: `SSH_PRIVATE_KEY` (your server's SSH private key)
3. Future pushes to `main` will auto-deploy

**For now, use Method 1 or 2 above.**

---

## ✅ What Gets Fixed

The server will allow:
- ✅ `http://localhost:8080`
- ✅ `http://localhost:5173`
- ✅ `http://localhost:3000`
- ✅ Any `localhost` or `127.0.0.1` port

## 🧪 Test After Deployment

1. Open: http://localhost:8080/trial.html
2. Enter an email
3. Click "Get My Trial Key"
4. Should work without "Failed to fetch" error

---

## ⚠️ If You Can't Access Linode

Contact your server administrator or:
- Check if you have access to another deployment method
- Verify server IP and credentials
- Check Linode account access

---

**The fix is ready - it just needs to be deployed to the server!**
