# Update Server Templates - Quick Guide

## 🎯 Problem
The server still has old email templates pointing to ZIP files. The local code now uses `.exe` files, but the server needs to be updated.

## ✅ Solution: Update Backend Templates on Server

### Step 1: Access Your Server

**Option A: SSH (Recommended)**
```powershell
ssh root@YOUR-SERVER-IP
```

**Option B: Linode Console**
1. Go to: https://cloud.linode.com
2. Click your server
3. Click "Launch LISH Console"

### Step 2: Navigate to Backend Directory

```bash
cd /var/www/lpv-api/backend
# OR wherever your backend is deployed
cd backend
```

### Step 3: Update Templates (Choose ONE method)

**Option A: Using Git (Easiest if server uses git)**
```bash
cd /var/www/lpv-api
git pull
cd backend
```

**Option B: Manual Upload (If no git)**

1. **On your local computer**, upload these 3 files to the server:
   - `backend/templates/trial-welcome-email.html`
   - `backend/templates/purchase-confirmation-email.html`
   - `backend/templates/bundle-email.html`

2. **On server**, replace the old files:
   ```bash
   # Backup old files first
   cd /var/www/lpv-api/backend/templates
   cp trial-welcome-email.html trial-welcome-email.html.backup
   cp purchase-confirmation-email.html purchase-confirmation-email.html.backup
   cp bundle-email.html bundle-email.html.backup
   
   # Then upload new files via SFTP/FileZilla or copy manually
   ```

### Step 4: Restart Backend Server

```bash
# If using PM2
pm2 restart lpv-api

# Verify it's running
pm2 status
pm2 logs lpv-api --lines 20
```

### Step 5: Verify the Update

The updated templates should now point to:
- ✅ `https://github.com/kwilhelm1967/Vault/releases/download/V1.2.0/Local.Password.Vault.Setup.1.2.0.exe`

Instead of the old ZIP file.

---

## 📋 Files That Need Updating on Server

These 3 files in `backend/templates/` need to be updated:
1. `trial-welcome-email.html` - Line 214
2. `purchase-confirmation-email.html` - Line 124  
3. `bundle-email.html` - Line 120

All should now have:
```html
<a href="https://github.com/kwilhelm1967/Vault/releases/download/V1.2.0/Local.Password.Vault.Setup.1.2.0.exe">
```

---

## 🚨 Important Notes

- **No downtime needed**: Just restart PM2, the server will reload templates
- **Test after update**: Send a test trial email to verify the link is correct
- **Backup first**: Always backup old files before replacing
