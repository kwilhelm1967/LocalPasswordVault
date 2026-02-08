# Fix SSL Certificate Using Linode Web Console (No SSH Required)

Use Linode's browser-based console to fix the `api.localpasswordvault.com` certificate error.

---

## Step 1: Open Linode

1. Go to **https://cloud.linode.com**
2. Log in
3. Click **Linodes** in the left sidebar
4. Click your server (the one that hosts the API)

---

## Step 2: Open the Web Console

1. On your Linode's page, look for **Launch LISH Console** or **Launch Console**
2. Click it – a terminal window opens in your browser
3. If prompted, press **Enter** to start the session

---

## Step 3: Log In (if needed)

- You may see `login:` – type your **root** username and press Enter
- Then enter your root password (characters won't show – that's normal)
- Press Enter

---

## Step 4: Run the SSL Fix Commands

Copy and paste these commands **one at a time**, pressing Enter after each:

**Command 1 – Get/renew the certificate:**
```
sudo certbot --nginx -d api.localpasswordvault.com
```

- If asked for an email, enter your email and press Enter
- If asked to agree to terms, type `Y` and press Enter
- If asked to share email with EFF, type `Y` or `N` and press Enter
- Certbot will issue the certificate and update Nginx

**Command 2 – Reload Nginx:**
```
sudo systemctl reload nginx
```

---

## Step 5: Verify

Open this in your browser:
```
https://api.localpasswordvault.com/health
```

You should see a healthy response and no certificate error.

---

## Troubleshooting

**"certbot: command not found"**
- Install certbot first:
  ```
  sudo apt update && sudo apt install certbot python3-certbot-nginx -y
  ```
- Then run the certbot command again

**"Connection refused" or "No route to host"**
- Nginx may not be installed. The certbot command above assumes Nginx is already set up. If not, you'll need the full server setup from `backend/DEVELOPER_SETUP.md`.

**Still getting certificate error after running commands**
- Wait 1–2 minutes for changes to take effect
- Try in an incognito/private window
- Clear your browser cache
