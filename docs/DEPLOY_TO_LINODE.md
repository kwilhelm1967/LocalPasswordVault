# Deploy Backend to Linode - Step by Step

## What You Need from Linode

1. **Linode Dashboard Access**
   - Log in at: https://cloud.linode.com

2. **Your Server's IP Address**
   - Go to: Linodes → Your Server → Networking
   - Copy the IPv4 address (looks like: `192.168.1.100`)

3. **Root Password**
   - You set this when you created the Linode
   - Or reset it: Linodes → Your Server → Settings → Reset Root Password

---

## Step 1: Access Your Linode Server

### Option A: Use Linode's Web Console (Easiest)

1. **Go to Linode Dashboard:** https://cloud.linode.com
2. **Click on your Linode server**
3. **Click "Launch LISH Console"** (or "Launch Console")
4. **You're now connected!** You'll see a command prompt

### Option B: Use SSH from Your Computer

1. **Open PowerShell** on Windows
2. **Type:**
   ```
   ssh root@YOUR-LINODE-IP
   ```
   (Replace `YOUR-LINODE-IP` with your actual IP address)
3. **Enter your root password** when prompted
4. **You're connected!**

---

## Step 2: Install Required Software

Once you're connected to your Linode, run these commands one by one:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 (keeps server running)
npm install -g pm2

# Verify installations
node --version
npm --version
pm2 --version
```

**Wait for each command to finish before running the next one!**

---

## Step 3: Upload Backend Code

### Option A: Using Git (If you have Git on Linode)

```bash
# Install Git
apt install -y git

# Create directory
mkdir -p /var/www/lpv-api
cd /var/www/lpv-api

# Clone your repository
git clone https://github.com/kwilhelm1967/Vault.git .

# Go to backend folder
cd backend
```

### Option B: Upload Files Manually

1. **On your computer:** Zip the `backend` folder
2. **Use Linode's File Manager** or **SFTP client** (like FileZilla)
3. **Upload to:** `/var/www/lpv-api/backend/`
4. **On Linode, extract:**
   ```bash
   mkdir -p /var/www/lpv-api
   cd /var/www/lpv-api
   unzip backend.zip
   ```

---

## Step 4: Configure Backend

```bash
# Go to backend directory
cd /var/www/lpv-api/backend

# Install dependencies
npm install

# Create .env file
nano .env
```

**In the editor, paste this (replace with your actual values):**

```env
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://kzsbotkuhoigmoqinkiz.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6c2JvdGt1aG9pZ21vcWlua2l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk0NDQyNSwiZXhwIjoyMDcwNTIwNDI1fQ.DqbVaRM6FeMok7ObkY1GBkXhmrcIhTUFNEOq37J12fU

# License Signing Secret (generate new one)
LICENSE_SIGNING_SECRET=YOUR-64-CHAR-HEX-STRING-HERE

# Stripe
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_ad2z4z9LNetCBQ6aAPVzYtxG3TinBBfT
STRIPE_PRICE_PERSONAL=price_1STRWdI1GYJUOJOHtK889VkU
STRIPE_PRICE_FAMILY=price_1STRUEI1GYJUOJOHhe3o55tv
STRIPE_PRICE_LLV_PERSONAL=price_1SjRBuI1GYJUOJOHXpFt4OwD
STRIPE_PRICE_LLV_FAMILY=price_1SjRCVI1GYJUOJOHvpbaoM9U

# Brevo Email
BREVO_API_KEY=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
FROM_EMAIL=noreply@localpasswordvault.com
SUPPORT_EMAIL=support@localpasswordvault.com

# Website
WEBSITE_URL=https://localpasswordvault.com

# Admin
ADMIN_API_KEY=XOhYqZH1sCM70dWIyjzrgLQVGxnfePRv4JK2ATNklDEi39SFwop8t6acB5Uumb
```

**To save in nano:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

**Generate LICENSE_SIGNING_SECRET:**
```bash
openssl rand -hex 32
```
Copy the output and paste it in the `.env` file.

---

## Step 5: Start the Backend Server

```bash
# Start with PM2
pm2 start server.js --name lpv-api

# Make it start automatically on reboot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs lpv-api
```

**You should see:** Server running on port 3001

---

## Step 6: Configure Firewall

```bash
# Allow port 3001
ufw allow 3001/tcp
ufw allow 22/tcp  # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

---

## Step 7: Set Up Domain (Optional but Recommended)

### If you have a domain (server.localpasswordvault.com):

1. **In Linode Dashboard:**
   - Go to: Domains → Add Domain
   - Add: `server.localpasswordvault.com`
   - Point to your Linode's IP address

2. **Or in your DNS provider:**
   - Add A record: `server` → Your Linode IP

3. **Install SSL Certificate:**
   ```bash
   apt install -y certbot
   certbot certonly --standalone -d server.localpasswordvault.com
   ```

---

## Step 8: Test It Works

```bash
# Test locally on server
curl http://localhost:3001/health

# Should return: {"status":"ok"}
```

**Test from your computer:**
- Open browser: `http://YOUR-LINODE-IP:3001/health`
- Should show: `{"status":"ok"}`

---

## Troubleshooting

### Server won't start?
```bash
# Check logs
pm2 logs lpv-api

# Check if port is in use
netstat -tulpn | grep 3001
```

### Can't connect from outside?
- Check Linode Firewall settings
- Check UFW firewall: `ufw status`
- Verify port 3001 is open

### Need to restart?
```bash
pm2 restart lpv-api
```

### Need to stop?
```bash
pm2 stop lpv-api
```

---

## Quick Commands Reference

```bash
# View server status
pm2 status

# View logs
pm2 logs lpv-api

# Restart server
pm2 restart lpv-api

# Stop server
pm2 stop lpv-api

# Start server
pm2 start lpv-api
```

---

**Once this is done, your backend will be running on production!**
