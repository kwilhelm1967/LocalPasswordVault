# LPV Purchase → Email → License Flow (Same Idea as LLV)

**Product:** Local Password Vault (LPV) only. No LLV code or content is changed.

## Flow (like LLV)

1. **Purchase any plan** – Customer completes Stripe Checkout (personal, family, or AfterPassing plans supported by this backend).
2. **Get the email** – Stripe sends `checkout.session.completed` to the LPV webhook; the backend creates the license(s) and sends a purchase confirmation email to the customer.
3. **Get the license** – The email includes:
   - The **license key** in the body (and in the template).
   - An **attached signed license file** (`Local-Password-Vault-License.txt`) when `LICENSE_SIGNING_SECRET` is set. The file is JSON, signed with HMAC-SHA256, and can be opened in the app or used to activate.

## What’s in place

- **Checkout** (`/api/checkout/session`): Plan types aligned with Stripe `PRODUCTS`: `personal`, `family`, `afterpassing_addon`, `afterpassing_standalone`. Success URL points to LPV (or AfterPassing) site.
- **Webhook** (`/api/webhooks/stripe`): On `checkout.session.completed`:
  - Creates license(s) in the database (personal = 1 key, family = 5 keys).
  - Builds a signed license file per key (same format as activation, with `device_id: null` until first activation).
  - Sends **purchase confirmation email** (single purchase) or **bundle email** (multiple keys) via Brevo, with the license key in the body and the license file(s) as attachment(s) when signing is configured.
- **Emails**: LPV-only copy and branding (Local Password Vault, localpasswordvault.com, Vault repo download links). No LLV references.

## Env / config

- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and Stripe Price IDs for each product (e.g. `STRIPE_PRICE_PERSONAL`, `STRIPE_PRICE_FAMILY`).
- **Brevo:** `BREVO_API_KEY`, `FROM_EMAIL` (e.g. `noreply@localpasswordvault.com`).
- **License file attachment:** `LICENSE_SIGNING_SECRET` (same as used for activation). If not set, the email is still sent with the license key in the body; the attachment is skipped.

## Templates

- `backend/templates/purchase-confirmation-email.html` – Single purchase (key + optional attachment note).
- `backend/templates/bundle-email.html` – Bundle purchase (multiple keys + optional license file attachments).

Both are LPV-only (no LLV content).
