# Fix SSL Certificate Error (NET::ERR_CERT_COMMON_NAME_INVALID)

When you see **"Your connection is not private"** or **NET::ERR_CERT_COMMON_NAME_INVALID** for `api.localpasswordvault.com`, the server's SSL certificate does not match the domain.

## What This Means

The certificate installed on the server was issued for a different domain (or no domain), so browsers reject the connection for security.

## Fix (on your Linode/server)

SSH into your server and run these steps.

### 1. Check current certificate

```bash
sudo certbot certificates
```

Look for `api.localpasswordvault.com`. If it's missing or shows the wrong domain, you need to fix it.

### 2. Get a correct certificate

```bash
sudo certbot --nginx -d api.localpasswordvault.com
```

Follow the prompts. Certbot will request a new cert from Let's Encrypt and configure Nginx.

### 3. Verify Nginx is using the right cert

Edit your Nginx config:

```bash
sudo nano /etc/nginx/sites-available/vault-api
```

Ensure it references the correct certificate paths:

```nginx
ssl_certificate /etc/letsencrypt/live/api.localpasswordvault.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/api.localpasswordvault.com/privkey.pem;
```

And that `server_name` matches:

```nginx
server_name api.localpasswordvault.com;
```

### 4. Test and reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Verify from a browser

Open `https://api.localpasswordvault.com/health` – it should load without certificate errors.

## Common Causes

- **Certificate for wrong domain**: Cert was issued for `localpasswordvault.com` but API uses `api.localpasswordvault.com`. Use `certbot -d api.localpasswordvault.com`.
- **Default/placeholder cert**: Nginx was using a default cert. Run certbot to obtain the correct one.
- **Expired cert**: Run `sudo certbot renew` and `sudo systemctl reload nginx`.
- **DNS not propagated**: Ensure `api.localpasswordvault.com` resolves to your server IP before requesting a cert.

## Quick Check from Your Machine

```powershell
# DNS resolves?
nslookup api.localpasswordvault.com

# Certificate details (PowerShell)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$request = [Net.HttpWebRequest]::Create("https://api.localpasswordvault.com/health")
$request.GetResponse()
```

If the request fails with a certificate error, the fix must be done on the server.
