# Production UAT Setup - Complete Steps

## ✅ What's Done
- ✅ Backend running on Linode (172.236.111.48:3001)
- ✅ Database tables created
- ✅ Stripe configured
- ✅ Email service configured
- ✅ `.env` file created in project root

## 📋 What You Need to Complete

### Step 1: Get LICENSE_SIGNING_SECRET from Server

**In your SSH terminal (connected to Linode server):**

```bash
grep LICENSE_SIGNING_SECRET /var/www/lpv-api/Vault/backend/.env
```

**Copy the value** (it will look like: `LICENSE_SIGNING_SECRET=57a1755a36ae9774635953c2663f0c62815f17e59232eacc65c05d75c80de665`)

**Then update `.env` file in project root:**
- Open `.env` file
- Replace `VITE_LICENSE_SIGNING_SECRET=` with `VITE_LICENSE_SIGNING_SECRET=YOUR_SECRET_HERE` (just the value, not the variable name)

---

### Step 2: Get Stripe Publishable Key

1. Go to: https://dashboard.stripe.com/apikeys
2. Find your **Publishable key** (starts with `pk_live_` for production)
3. Copy it
4. Update `.env` file:
   - Replace `VITE_STRIPE_PUBLISHABLE_KEY=` with `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE`

---

### Step 3: Rebuild the App

**In your Windows command prompt (in project root):**

```bash
npm run build:prod
```

This will create a production build with the correct backend URL.

---

### Step 4: Configure Stripe Webhooks

**This is CRITICAL for purchases to work!**

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"** (or edit existing)
3. Set **Endpoint URL** to:
   ```
   http://172.236.111.48:3001/api/webhooks/stripe
   ```
   (Or use your domain if configured: `https://server.localpasswordvault.com/api/webhooks/stripe`)
4. Select event: **`checkout.session.completed`**
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)
7. **Verify it matches** what's in `backend/.env` on your server:
   ```bash
   grep STRIPE_WEBHOOK_SECRET /var/www/lpv-api/Vault/backend/.env
   ```
   Should show: `STRIPE_WEBHOOK_SECRET=whsec_ad2z4z9LNetCBQ6aAPVzYtxG3TinBBfT`

---

### Step 5: Test Everything

1. **Test trial signup:**
   - Sign up for a trial
   - Check email for trial key
   - Download and install app
   - Activate with trial key

2. **Test purchase:**
   - Go through checkout
   - Complete payment
   - Check email for license key
   - Activate app with license key

---

## 🎯 Quick Checklist

- [ ] Get LICENSE_SIGNING_SECRET from server and add to `.env`
- [ ] Get Stripe publishable key and add to `.env`
- [ ] Run `npm run build:prod`
- [ ] Configure Stripe webhook endpoint
- [ ] Test trial signup
- [ ] Test purchase flow

---

## 📝 Notes

- The backend URL in `.env` is set to `http://172.236.111.48:3001` (IP address)
- If you have a domain configured, you can change it to `https://server.localpasswordvault.com`
- The app must be rebuilt after changing `.env` values
- Stripe webhooks must point to your production backend for purchases to work
