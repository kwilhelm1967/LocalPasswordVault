# Email Templates Reference

**Note:** The backend uses HTML template files directly from `backend/templates/`. This document is for reference only to understand the email structure and variables used.

The actual templates are located in:
- `backend/templates/purchase-confirmation-email.html`
- `backend/templates/bundle-email.html`
- `backend/templates/trial-welcome-email.html`
- `backend/templates/trial-expires-tomorrow-email.html`
- `backend/templates/trial-expired-email.html`

These templates are automatically loaded by `backend/services/email.js` - no additional setup required.

---

## Template Variables

All templates use the `{{ params.KEY }}` format for variables.

### Purchase Confirmation Email

**File:** `purchase-confirmation-email.html`

**Variables:**
- `{{ params.planName }}` - Product name (e.g., "Personal Vault" or "Family Vault")
- `{{ params.licenseKey }}` - License key (e.g., "PERS-XXXX-XXXX-XXXX")
- `{{ params.amount }}` - Amount paid in cents (e.g., 4900)

### Bundle Email

**File:** `bundle-email.html`

**Variables:**
- `{{ params.LICENSE_COUNT }}` - Total number of license keys
- `{{ params.TOTAL_AMOUNT }}` - Total amount paid
- `{{ params.LICENSE_KEYS_HTML }}` - HTML formatted list of all license keys
- `{{ params.ORDER_DATE }}` - Order date
- `{{ params.ORDER_ID }}` - Stripe checkout session ID

### Trial Welcome Email

**File:** `trial-welcome-email.html`

**Variables:**
- `{{ params.TRIAL_KEY }}` - Trial key (e.g., "TRIA-XXXX-XXXX-XXXX")
- `{{ params.EXPIRES_AT }}` - Expiration date (formatted)
- `{{ params.SIGNUP_DATE }}` - Signup date

### Trial Expires Tomorrow Email

**File:** `trial-expires-tomorrow-email.html`

**Variables:**
- `{{ params.EXPIRES_AT }}` - Expiration date (formatted)

### Trial Expired Email

**File:** `trial-expired-email.html`

**Variables:**
- `{{ params.EXPIRED_DATE }}` - Date trial expired
- `{{ params.EMAIL }}` - User's email address

---

## License Key Formats

- **Personal Vault:** `PERS-XXXX-XXXX-XXXX`
- **Family Vault:** `FMLY-XXXX-XXXX-XXXX`
- **Local Legacy Vault - Personal:** `LLVP-XXXX-XXXX-XXXX`
- **Local Legacy Vault - Family:** `LLVF-XXXX-XXXX-XXXX`
- **Trial:** `TRIA-XXXX-XXXX-XXXX`

---

## Download Links

All email templates include OS-specific download buttons:
- Windows: `https://localpasswordvault.com/download/windows`
- macOS: `https://localpasswordvault.com/download/macos`
- Linux: `https://localpasswordvault.com/download/linux`

---

## Pricing Links

All "View Pricing" links point to:
- `https://localpasswordvault.com/pricing.html`
