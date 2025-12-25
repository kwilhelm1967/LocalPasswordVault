# Monitoring Setup Guide

This guide covers setting up error tracking with Sentry and uptime monitoring for Local Password Vault.

---

## 1. Sentry Error Tracking

Sentry provides real-time error tracking, performance monitoring, and session replay.

### Frontend Setup

#### Step 1: Install Dependencies

```bash
npm install @sentry/react
```

#### Step 2: Get Sentry DSN

1. Go to [sentry.io](https://sentry.io) and create an account (free tier available)
2. Create a new project:
   - Select **React** as the platform
   - Name it "Local Password Vault - Frontend"
3. Copy the **DSN** (Data Source Name)

#### Step 3: Configure Environment Variable

Add to your `.env` file (or `.env.production`):

```bash
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Note:** The `VITE_` prefix is required for Vite to expose the variable to the frontend.

#### Step 4: Verify Setup

1. Build the production app: `npm run build`
2. Deploy and trigger an error
3. Check Sentry dashboard for the error

### Backend Setup

#### Step 1: Install Dependencies

```bash
cd backend
npm install @sentry/node @sentry/profiling-node
```

#### Step 2: Get Sentry DSN

1. In Sentry, create a new project:
   - Select **Node.js** as the platform
   - Name it "Local Password Vault - Backend"
2. Copy the **DSN**

#### Step 3: Configure Environment Variable

Add to `backend/.env`:

```bash
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

#### Step 4: Verify Setup

1. Start the backend: `npm start`
2. Trigger an error (e.g., invalid API call)
3. Check Sentry dashboard

### Sentry Features Enabled

- ✅ **Error Tracking**: Automatic capture of unhandled errors
- ✅ **Performance Monitoring**: 10% transaction sampling
- ✅ **Session Replay**: 10% of sessions, 100% of error sessions
- ✅ **Sensitive Data Filtering**: Passwords, license keys, etc. are redacted
- ✅ **Production Only**: Disabled in development mode

### Privacy & Security

Sentry is configured to:
- ✅ Redact sensitive data (passwords, license keys, API keys)
- ✅ Remove PII from user context
- ✅ Filter out browser extension errors
- ✅ Only send errors in production mode

---

## 2. Uptime Monitoring

Uptime monitoring ensures your API is always accessible. We recommend using **UptimeRobot** (free tier available).

### UptimeRobot Setup

#### Step 1: Create Account

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up for a free account (50 monitors free)

#### Step 2: Add Monitor

1. Click **"Add New Monitor"**
2. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Local Password Vault API
   - **URL**: `https://api.localpasswordvault.com/health`
   - **Monitoring Interval**: 5 minutes (free tier)
   - **Alert Contacts**: Add your email

#### Step 3: Configure Health Endpoint

The backend already has a `/health` endpoint that returns:

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

#### Step 4: Set Up Alerts

1. Go to **Alert Contacts** in UptimeRobot
2. Add your email address
3. Configure alert settings:
   - **When to alert**: When monitor goes down
   - **Alert frequency**: Every 5 minutes (free tier)

### Alternative: Pingdom

If you prefer Pingdom:

1. Sign up at [pingdom.com](https://pingdom.com)
2. Create a new HTTP check:
   - **URL**: `https://api.localpasswordvault.com/health`
   - **Check interval**: 1 minute (paid) or 5 minutes (free)
3. Configure alerts to your email/SMS

### Alternative: StatusCake

1. Sign up at [statuscake.com](https://www.statuscake.com)
2. Create an **Uptime Test**:
   - **Website URL**: `https://api.localpasswordvault.com/health`
   - **Check rate**: 5 minutes (free tier)
3. Add alert contacts

---

## 3. Monitoring Dashboard

### Recommended Setup

1. **Sentry**: Error tracking and performance
2. **UptimeRobot**: Uptime monitoring
3. **Backend `/metrics` endpoint**: Performance metrics (optional)

### Monitoring Checklist

- [ ] Sentry frontend project created and DSN configured
- [ ] Sentry backend project created and DSN configured
- [ ] Environment variables set in production
- [ ] Uptime monitor configured
- [ ] Alert contacts configured
- [ ] Test error sent to Sentry (verify it appears)
- [ ] Health endpoint accessible
- [ ] Uptime monitor shows "UP" status

---

## 4. Production Deployment

### Environment Variables Required

**Frontend (`.env.production`):**
```bash
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Backend (`backend/.env`):**
```bash
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NODE_ENV=production
```

### Verification Steps

1. **Test Error Tracking**:
   ```bash
   # Frontend: Trigger an error in production
   # Backend: Make invalid API call
   # Check Sentry dashboard within 1-2 minutes
   ```

2. **Test Uptime Monitoring**:
   ```bash
   # Check UptimeRobot dashboard
   # Should show "UP" status
   # Health endpoint should return 200 OK
   ```

3. **Test Alerts**:
   ```bash
   # Temporarily stop backend server
   # Wait 5 minutes
   # Verify alert email received
   ```

---

## 5. Monitoring Best Practices

### Error Tracking

- ✅ **Review errors daily**: Check Sentry dashboard for new issues
- ✅ **Set up alerts**: Configure Sentry to email on critical errors
- ✅ **Tag errors**: Use tags to categorize errors (e.g., "payment", "license")
- ✅ **Ignore noise**: Configure ignored errors for known issues

### Uptime Monitoring

- ✅ **Multiple monitors**: Monitor both API and website
- ✅ **Multiple locations**: Use different monitoring locations
- ✅ **Alert escalation**: Set up SMS alerts for critical downtime
- ✅ **Status page**: Consider public status page for transparency

### Performance Monitoring

- ✅ **Track slow queries**: Monitor database query performance
- ✅ **API response times**: Use Sentry performance monitoring
- ✅ **Set thresholds**: Alert on response times > 1 second

---

## 6. Troubleshooting

### Sentry Not Receiving Errors

1. **Check DSN**: Verify DSN is correct in environment variables
2. **Check environment**: Sentry only works in production mode
3. **Check network**: Ensure server can reach Sentry API
4. **Check Sentry dashboard**: Verify project is active

### Uptime Monitor Shows Down

1. **Check health endpoint**: `curl https://api.localpasswordvault.com/health`
2. **Check server status**: Verify backend is running
3. **Check firewall**: Ensure port 443 is open
4. **Check SSL certificate**: Verify certificate is valid

### Performance Issues

1. **Check Sentry performance tab**: Identify slow transactions
2. **Check backend logs**: Look for slow queries
3. **Check database**: Monitor database performance
4. **Check server resources**: CPU, memory, disk usage

---

## 7. Cost Estimates

### Free Tier Limits

**Sentry (Free Tier):**
- 5,000 errors/month
- 10,000 performance units/month
- 1,000 replay sessions/month
- ✅ Sufficient for small to medium apps

**UptimeRobot (Free Tier):**
- 50 monitors
- 5-minute check interval
- Email alerts
- ✅ Sufficient for basic monitoring

### Paid Options (if needed)

- **Sentry Team**: $26/month (50k errors, better features)
- **UptimeRobot Pro**: $7/month (1-minute intervals, SMS alerts)
- **Pingdom**: $10/month (1-minute checks, better features)

---

## 8. Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [UptimeRobot Documentation](https://uptimerobot.com/api/)
- [Backend Health Endpoint](../backend/server.js#L67)
- [Error Handling Guide](./ERROR_HANDLING.md)

---

## Summary

✅ **Sentry**: Error tracking and performance monitoring  
✅ **UptimeRobot**: Uptime monitoring and alerts  
✅ **Health Endpoint**: `/health` for status checks  
✅ **Privacy**: Sensitive data automatically redacted  
✅ **Production Only**: Monitoring disabled in development  

Your application is now fully monitored and ready for production! 🚀

