# Sentry Quick Start Guide

Quick reference for setting up Sentry error tracking.

## Frontend Setup

1. **Install dependency:**
   ```bash
   npm install @sentry/react
   ```

2. **Add to `.env.production`:**
   ```bash
   VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```

3. **Done!** Sentry is already initialized in `src/main.tsx`

## Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install @sentry/node @sentry/profiling-node
   ```

2. **Add to `backend/.env`:**
   ```bash
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```

3. **Done!** Sentry is already initialized in `backend/server.js`

## Get Your DSN

1. Go to [sentry.io](https://sentry.io)
2. Create account (free tier available)
3. Create project:
   - Frontend: Select **React**
   - Backend: Select **Node.js**
4. Copy the DSN from project settings

## Testing

**Frontend:**
- Trigger an error in production build
- Check Sentry dashboard within 1-2 minutes

**Backend:**
- Make invalid API call
- Check Sentry dashboard

## Privacy

✅ Sensitive data automatically redacted:
- Passwords
- License keys
- API keys
- User emails

✅ Only active in production mode

See [MONITORING_SETUP.md](./MONITORING_SETUP.md) for full details.

