# Database Backups & Performance Monitoring

## Database Backups

### Automatic Backups (Supabase)

Supabase provides automatic point-in-time recovery (PITR) backups.

**Verification:**
1. Go to Supabase Dashboard → Database → Backups
2. Verify backup status and retention period
3. Test restore functionality

**Retention:**
- Free tier: 7 days
- Paid tiers: 30+ days

### Manual Backup Script

**Verify backups:**
```bash
cd backend
npm run backup:verify
```

**Create manual backup:**
```bash
cd backend
npm run backup:create
```

**Automated daily backups:**
```bash
cd backend
chmod +x scripts/setup-backup-cron.sh
./scripts/setup-backup-cron.sh
```

This sets up a cron job that:
- Runs daily at 2 AM
- Creates JSON backup file
- Keeps last 10 backups
- Logs to `/var/log/lpv-backup.log`

**Backup location:** `backend/backups/backup-YYYY-MM-DDTHH-MM-SS.json`

---

## Performance Monitoring

### Overview

Performance monitoring tracks server metrics **WITHOUT collecting any customer data**.

**What is tracked:**
- ✅ Request counts (by method, endpoint, status)
- ✅ Response times (average, min, max)
- ✅ Error rates
- ✅ Database query performance
- ✅ Webhook processing times
- ✅ Email delivery success rates

**What is NOT tracked:**
- ❌ Customer emails
- ❌ License keys
- ❌ Personal information
- ❌ Request payloads
- ❌ Response bodies

### Accessing Metrics

**Metrics endpoint:**
```bash
curl http://localhost:3001/metrics
```

**Response format:**
```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "metrics": {
    "requests": {
      "total": 1250,
      "byMethod": { "GET": 800, "POST": 450 },
      "byStatus": { "2xx": 1200, "4xx": 30, "5xx": 20 },
      "byEndpoint": {
        "/api/lpv/license/activate": 150,
        "/api/trial/signup": 200
      }
    },
    "responseTimes": {
      "endpoints": {
        "/api/lpv/license/activate": {
          "count": 150,
          "avgTime": 245.5,
          "minTime": 120,
          "maxTime": 850
        }
      }
    },
    "errors": {
      "total": 50,
      "rate": "4.0%",
      "byEndpoint": {
        "/api/lpv/license/activate": 5
      }
    },
    "database": {
      "totalQueries": 3500,
      "slowQueries": 12,
      "avgQueryTime": "45.2ms"
    },
    "webhooks": {
      "processed": 200,
      "failed": 2,
      "successRate": "99.0%",
      "avgProcessingTime": "1250.5ms"
    },
    "emails": {
      "sent": 450,
      "failed": 3,
      "successRate": "99.3%"
    }
  }
}
```

### Privacy Guarantee

**Path Normalization:**
- `/api/trial/status/user@example.com` → `/api/trial/status/:email`
- `/api/lpv/license/activate` (with license key) → `/api/lpv/license/activate`
- `/api/checkout/session/cs_xxx` → `/api/checkout/session/:sessionId`

**No Customer Data:**
- Email addresses are removed from paths
- License keys are removed from paths
- Only aggregate counts and times are tracked
- No request/response bodies logged

### Monitoring Integration

**Optional: Export to monitoring service**

The metrics can be exported to external monitoring systems:

```javascript
// Example: Export to Prometheus, Datadog, etc.
const metrics = performanceMonitor.export();
// Send to monitoring service (no customer data included)
```

**Recommended monitoring services:**
- Prometheus + Grafana
- Datadog
- New Relic
- Custom dashboard

---

## Setup Checklist

### Database Backups
- [ ] Verify Supabase automatic backups enabled
- [ ] Test manual backup script
- [ ] Set up automated daily backups (optional)
- [ ] Test backup restoration
- [ ] Document backup location

### Performance Monitoring
- [ ] Metrics endpoint accessible: `/metrics`
- [ ] Verify no customer data in metrics
- [ ] Set up monitoring dashboard (optional)
- [ ] Configure alerts for slow queries (>1000ms)
- [ ] Configure alerts for high error rates (>5%)

---

## Security Notes

### Backups
- Backup files contain sensitive data
- Store backups in encrypted storage
- Limit file permissions (chmod 600)
- Don't commit backups to version control
- Rotate backups regularly

### Metrics
- Metrics endpoint should be protected in production
- Add authentication or IP whitelist
- Don't expose metrics publicly
- No customer data is collected

---

## Troubleshooting

### Backup Issues

**Problem:** Backup script fails
- Check Supabase credentials in `.env`
- Verify database connection
- Check file permissions

**Problem:** Cron job not running
- Verify cron service: `systemctl status cron`
- Check cron logs: `grep CRON /var/log/syslog`
- Verify script path is correct

### Performance Monitoring

**Problem:** Metrics endpoint not accessible
- Check server is running
- Verify route is registered
- Check firewall rules

**Problem:** Metrics show slow performance
- Check database connection pool
- Review slow query logs
- Check server resources (CPU, memory)

---

## Maintenance

### Daily
- Review error logs
- Check backup success (if automated)

### Weekly
- Review performance metrics
- Check slow query trends
- Verify backup files exist

### Monthly
- Test backup restoration
- Review and optimize slow queries
- Clean up old backup files





