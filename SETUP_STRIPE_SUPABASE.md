# SETUP_STRIPE_SUPABASE.md

## 1) Create dedicated Supabase project (separate from EarlCoin)

```bash
# if logged in:
supabase projects create autonomous-ops-studio --org-id <ORG_ID> --region eu-west-1
```

If CLI auth/project create is unavailable, create project in dashboard manually and continue.

## 2) Link and run migrations

```bash
cd supabase
supabase link --project-ref <PROJECT_REF>
supabase db push --include-all
```

## 3) Deploy Edge Functions

```bash
supabase functions deploy create-checkout-session --project-ref <PROJECT_REF>
supabase functions deploy create-audit-checkout-session --project-ref <PROJECT_REF>
supabase functions deploy stripe-webhook --project-ref <PROJECT_REF>
```

## 4) Set function secrets

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_xxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxx \
  SUPABASE_URL=https://<PROJECT_REF>.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY> \
  --project-ref <PROJECT_REF>
```

## 5) Configure Stripe webhook endpoint

Endpoint URL:

```text
https://<PROJECT_REF>.functions.supabase.co/stripe-webhook
```

Listen for events:
- `checkout.session.completed`

## 6) Configure frontend public values

Edit `site/js/config.js`:
- `supabaseUrl`
- `supabaseAnonKey`
- `edgeBaseUrl`
- `auditPriceUsd` (default 20)
- `auditDeliveryWindow` (default 1-2 business days)

Do not put Stripe secret keys in frontend files.

## 7) Verify end-to-end

1. submit lead form from `/index.html`
2. click checkout button from `/checkout.html`
3. complete test payment in Stripe
4. submit audit form from `/audit.html` and complete the $20 checkout
5. confirm rows inserted in:
   - `funnel_leads`
   - `checkout_sessions`
   - `audit_requests`
   - `stripe_webhook_events`
   - `orders`
