# M-Pesa STK Push Integration

This document describes the complete M-Pesa STK Push giving/donation system for Glorious Gospel Centre Church.

## Architecture Overview

```
DONOR
  ↓
NEXT.JS GIVING PAGE (/give)
  ↓
SUPABASE EDGE FUNCTION: mpesa-stk-push
  ↓
SAFARICOM DARAJA API (OAuth + STK Push)
  ↓
M-PESA STK PUSH PROMPT ON DONOR'S PHONE
  ↓
DONOR ENTERS M-PESA PIN
  ↓
SAFARICOM CALLBACK → EDGE FUNCTION: mpesa-callback
  ↓
DATABASE TRANSACTION UPDATE (giving_transactions)
  ↓
FRONTEND POLLS EDGE FUNCTION: mpesa-payment-status
  ↓
ADMIN DASHBOARD (/admin/giving)
```

**Security Principle**: The browser NEVER contains M-Pesa credentials. All sensitive operations run in Supabase Edge Functions with service-role access.

---

## Database Schema

### Tables

#### `giving_categories`
```sql
kind         giving_category_kind  -- TITHE | OFFERING | MISSIONS | OTHER
label        text
description  text
is_active    boolean
sort_order   integer
```

#### `giving_transactions`
```sql
id                    uuid (PK)
category_id           uuid (FK → giving_categories, SET NULL)
provider              text  -- "mpesa-daraja"
external_reference    text  -- CheckoutRequestID or idempotency key
amount_cents          bigint  -- positive, in cents
currency              text  -- default "KES"
phone                 text  -- normalized E.164 format (2547XXXXXXXX)
status                giving_tx_status  -- PENDING | PROCESSING | SUCCESS | FAILED | CANCELLED
raw_callback          jsonb  -- full Daraja callback payload
admin_notes           text  -- manual override notes
created_at            timestamptz
updated_at            timestamptz
created_by            uuid (FK → profiles, SET NULL)
```

### Indexes
- `idx_giving_tx_external_ref` (provider, external_reference) WHERE external_reference IS NOT NULL
- `idx_giving_tx_status` (status)
- `idx_giving_tx_created_at` (created_at)
- `idx_giving_tx_phone` (phone)

### Enums
```sql
giving_category_kind: TITHE | OFFERING | MISSIONS | OTHER
giving_tx_status: PENDING | PROCESSING | SUCCESS | FAILED | CANCELLED
```

---

## Edge Functions

### 1. `mpesa-stk-push`
**Purpose**: Initiate STK Push payment

**Endpoint**: `POST /functions/v1/mpesa-stk-push`

**Authentication**: Bearer token (Supabase anon or service role)

**Request Body**:
```json
{
  "categoryId": "uuid",
  "amountCents": 10000,
  "currency": "KES",
  "phone": "254712345678",
  "description": "Tithe",
  "donorName": "John Doe"
}
```

**Response** (200):
```json
{
  "ok": true,
  "message": "STK Push initiated. Check your phone to complete the payment.",
  "transactionId": "uuid",
  "externalReference": "ws_CO_12345",
  "mode": "live"
}
```

**Response** (400):
```json
{
  "ok": false,
  "message": "Provider declined the request.",
  "mode": "live"
}
```

**Behavior**:
1. Validates input (amount > 0, valid phone, valid category)
2. Creates/finds idempotent `giving_transactions` record (5-min window)
3. Calls Daraja OAuth → STK Push
4. Updates transaction with `external_reference` (CheckoutRequestID) and status `PROCESSING`
5. Returns immediately — does NOT wait for payment completion

### 2. `mpesa-callback`
**Purpose**: Receive and process Daraja callbacks

**Endpoint**: `POST /functions/v1/mpesa-callback`

**Authentication**: None (public endpoint for Safaricom)

**Headers**:
- `X-Daraja-Signature` or `X-Signature`: HMAC-SHA256 of raw body

**Request Body**: Raw Daraja callback JSON

**Response** (always 200):
```json
{
  "ok": true,
  "updated": true,
  "status": "SUCCESS"
}
```

**Behavior**:
1. Verifies HMAC signature (using `M_PESA_CALLBACK_SECRET` or `M_PESA_PASSKEY`)
2. Parses callback payload
3. Finds transaction by `external_reference` (CheckoutRequestID)
4. Idempotently updates status:
   - `ResultCode === 0` → `SUCCESS`
   - `ResultCode === 1032` → `CANCELLED`
   - Other → `FAILED`
5. Stores full callback in `raw_callback`
6. Ignores duplicate callbacks for already `SUCCESS` transactions

### 3. `mpesa-payment-status`
**Purpose**: Poll transaction status for frontend UX

**Endpoint**: `GET /functions/v1/mpesa-payment-status?transactionId=uuid` or `?externalReference=ws_CO_12345`

**Authentication**: Bearer token (Supabase anon)

**Response** (200):
```json
{
  "ok": true,
  "transaction": {
    "id": "uuid",
    "status": "SUCCESS",
    "externalReference": "ws_CO_12345",
    "amountCents": 10000,
    "currency": "KES",
    "phone": "254712345678",
    "categoryLabel": "Tithe",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:31:00Z",
    "mpesaReceiptNumber": "QK12345",
    "rawCallback": { ... }
  }
}
```

---

## Environment Variables

### Required for Live Payments
```bash
# Server-only — NEVER expose to browser
M_PESA_ENVIRONMENT=sandbox|production
M_PESA_CONSUMER_KEY=your_daraja_consumer_key
M_PESA_CONSUMER_SECRET=your_daraja_consumer_secret
M_PESA_SHORTCODE=174379          # Paybill or Till number
M_PESA_PASSKEY=your_daraja_passkey
M_PESA_CALLBACK_URL=https://your-domain.com/functions/v1/mpesa-callback
M_PESA_CALLBACK_SECRET=optional_hmac_secret  # defaults to passkey
```

### Public (Safe for Browser)
```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Server-Only (Supabase Secrets)
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

---

## Setup Instructions

### 1. Daraja Sandbox Credentials
1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create a new app → "M-Pesa Express (STK Push)"
3. Note: `Consumer Key`, `Consumer Secret`
4. Get test `Shortcode` (default: `174379`) and `Passkey` from sandbox credentials page
5. Set callback URL to your deployed Edge Function: `https://xxx.supabase.co/functions/v1/mpesa-callback`

### 2. Supabase Configuration
```bash
# Add secrets to Supabase (Dashboard → Settings → Edge Functions → Secrets)
supabase secrets set M_PESA_CONSUMER_KEY=xxx M_PESA_CONSUMER_SECRET=xxx M_PESA_SHORTCODE=174379 M_PESA_PASSKEY=xxx M_PESA_ENVIRONMENT=sandbox M_PESA_CALLBACK_SECRET=xxx
```

### 3. Deploy Edge Functions
```bash
supabase functions deploy mpesa-stk-push
supabase functions deploy mpesa-callback
supabase functions deploy mpesa-payment-status
```

### 4. Configure Callback URL in Daraja
- Log into Daraja portal
- Update app callback URL to: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/mpesa-callback`
- Ensure it's publicly accessible (no auth required)

### 5. Test Sandbox Flow
1. Visit `/give` on your deployed site
2. Select category, enter amount (e.g., 100 KES), phone (use sandbox test number: `254708374149`)
3. Submit → check phone for STK Push prompt
4. Enter sandbox PIN (default: `1234`)
5. Verify transaction appears in `/admin/giving` with status `SUCCESS`

---

## Production Migration Checklist

- [ ] Switch `M_PESA_ENVIRONMENT=production`
- [ ] Use production `Consumer Key`, `Consumer Secret`, `Shortcode`, `Passkey`
- [ ] Update callback URL to production domain
- [ ] Verify `M_PESA_CALLBACK_SECRET` is set (recommended: separate from passkey)
- [ ] Test with real phone numbers (small amounts)
- [ ] Confirm transactions appear in admin dashboard
- [ ] Verify receipt emails/notifications work (if configured)
- [ ] Monitor Daraja portal for failed transactions
- [ ] Set up alerts for callback failures

---

## Transaction Lifecycle

| Status | Description | Trigger |
|--------|-------------|---------|
| `PENDING` | Created, awaiting STK Push | User submits form |
| `PROCESSING` | STK Push sent, awaiting user PIN | Daraja accepts request |
| `SUCCESS` | Payment confirmed | Callback `ResultCode=0` |
| `FAILED` | Payment failed/declined | Callback `ResultCode!=0,1032` |
| `CANCELLED` | User cancelled on phone | Callback `ResultCode=1032` |

**Critical**: Status becomes `SUCCESS` ONLY after valid callback. STK Push acceptance ≠ payment success.

---

## Idempotency & Duplicate Handling

### STK Push Idempotency
- Key: `categoryId|amountCents|phone|5minBucket`
- Same inputs within 5 minutes → returns existing `PENDING` transaction
- Prevents duplicate STK Push prompts

### Callback Idempotency
- Identified by `external_reference` (CheckoutRequestID)
- If transaction already `SUCCESS` → ignore callback
- Database update uses `.neq("status", "SUCCESS")` guard
- Duplicate `SUCCESS` callbacks cannot create duplicate completions

### Receipt Uniqueness
- `MpesaReceiptNumber` extracted from callback metadata
- Unique constraint on `(provider, external_reference)` prevents duplicate completed transactions

---

## Frontend UX Flow

### States
1. **IDLE** — Form displayed
2. **PROCESSING** — "Initiating M-Pesa payment..."
3. **STK_SENT** — "Check your phone. Enter M-Pesa PIN to complete."
4. **SUCCESS** — "Thank you! Your giving of KES X received. Receipt: QK12345"
5. **FAILED** — "Payment failed. You can try again."
6. **CANCELLED** — "Payment cancelled. You can try again."
7. **TIMEOUT** — "Payment timed out. You can try again." (after 2 min polling)

### Polling
- Interval: 3 seconds
- Max attempts: 40 (2 minutes)
- Stops automatically on terminal status (SUCCESS/FAILED/CANCELLED)

---

## Admin Dashboard

### `/admin/giving`
- Filterable list (status, search by phone/reference)
- Status counts (all, pending, processing, success, failed, cancelled)
- Click row → detail view

### `/admin/giving/[id]`
- Full transaction details
- Raw callback debug view
- Status override (with audit log) — requires `giving.manage` permission

---

## Security

### Credential Isolation
- M-Pesa credentials only in Supabase Edge Function secrets
- Never in `.env.local`, never in client bundle
- Service-role key only in Edge Functions (not in Next.js)

### RLS Policies
- `giving_categories`: Public read (active only), admin write
- `giving_transactions`: **No public access**, admin full access
- `audit_logs`: Admin read only, service-role write only

### Callback Verification
- HMAC-SHA256 signature verification
- Constant-time comparison
- Rejects unsigned/invalid callbacks with 401

### Rate Limiting
- 5 requests per 10 minutes per IP (on `/give` form submit)
- In-memory token bucket (single instance)

---

## Testing

### Unit Tests
```bash
npm run test
```
- Phone normalization (07, 2547, +2547, 7, 01, 2541, 1, +2541 formats)
- Amount validation (positive, max limits)
- Giving schema validation (UUID, honeypot, required fields)
- Provider mock mode detection
- Callback parsing (success, failed, cancelled, malformed)
- HMAC verification (valid, invalid, missing secret/signature)
- Idempotency key generation
- Payment status mapping

### Manual Sandbox Testing
1. Use test shortcode `174379`
2. Test phone: `254708374149` (Safaricom sandbox)
3. Test PIN: `1234`
4. Verify callback received and processed

---

## Troubleshooting

### STK Push Fails Immediately
- Check `M_PESA_CONSUMER_KEY/SECRET` are valid
- Verify `M_PESA_SHORTCODE` matches Daraja app
- Check Daraja app has "M-Pesa Express" enabled
- Review Edge Function logs: `supabase functions logs mpesa-stk-push`

### Callback Not Received
- Verify callback URL is publicly accessible (no auth, no firewall)
- Check Daraja portal callback URL matches deployed function
- Check `M_PESA_CALLBACK_SECRET` matches what Daraja sends
- Review Edge Function logs: `supabase functions logs mpesa-callback`

### Transaction Stuck in PROCESSING
- User didn't enter PIN (wait 2 min → times out to FAILED)
- Callback failed signature verification (check secret)
- Callback payload malformed (check Daraja logs)

### Duplicate Transactions
- Idempotency key prevents duplicate STK Push within 5 min
- Callback idempotency prevents duplicate completion
- Check unique index on `(provider, external_reference)`

### "Invalid Signature" Errors
- Ensure `M_PESA_CALLBACK_SECRET` is set in Supabase secrets
- If unset, defaults to `M_PESA_PASSKEY`
- Daraja sandbox may not send signature — mock mode accepts `dev-signature`

---

## File Reference

| File | Purpose |
|------|---------|
| `supabase/functions/mpesa-stk-push/index.ts` | STK Push initiation |
| `supabase/functions/mpesa-callback/index.ts` | Daraja callback handler |
| `supabase/functions/mpesa-payment-status/index.ts` | Status polling |
| `services/payment/mpesa.ts` | Daraja provider (mock + live) |
| `services/payment/provider.ts` | Payment provider interface |
| `services/giving.ts` | Business logic (initiate, callback) |
| `services/giving.actions.ts` | Server action (rate limit, validation) |
| `app/give/_components/GivingForm.tsx` | Giving UI with polling |
| `lib/hooks/usePaymentStatus.ts` | Frontend polling hook |
| `app/admin/(protected)/giving/page.tsx` | Admin list view |
| `app/admin/(protected)/giving/[id]/page.tsx` | Admin detail + override |
| `tests/unit/phone-normalization.test.ts` | Phone format tests |
| `tests/unit/mpesa-provider.test.ts` | Provider behavior tests |

---

## Common Daraja Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `0` | Success | Mark `SUCCESS` |
| `1` | Insufficient funds | Mark `FAILED` |
| `1032` | Cancelled by user | Mark `CANCELLED` |
| `1037` | Timeout | Mark `FAILED` |
| `2001` | Invalid initiator | Check credentials |
| `4001` | Invalid shortcode | Check `M_PESA_SHORTCODE` |

---

## Support

For issues with:
- **Daraja credentials**: Safaricom Developer Support
- **Supabase Edge Functions**: Supabase Dashboard → Logs
- **Application logic**: Check `supabase/functions/logs` and Next.js server logs