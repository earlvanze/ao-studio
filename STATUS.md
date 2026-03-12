# Status

## 2026-03-12

Shipped the GitHub Pages static deployment path and hardened the public audit flow.

### Updated
- `.github/workflows/deploy-pages.yml`
- `site/audit.html`
- `site/checkout.html`
- `site/success.html`
- `site/js/main.js`
- `supabase/functions/create-audit-checkout-session/index.ts`
- `README.md`

### What changed
- added a GitHub Actions workflow to deploy `site/` to GitHub Pages
- kept the site fully static and Pages-compatible
- fixed checkout/success/cancel URL generation so it works on a GitHub Pages project path like `/ao-studio/`
- changed the audit funnel to a payment-first flow
- removed anonymous file upload from the public audit page before payment
- hardened the audit edge function so it no longer accepts file uploads and only creates checkout + audit request metadata
- updated the success page to explain that audit materials are shared only after payment
- cleaned stale repo documentation so it matches this repo and deployment model

### Funnel / security status
- inquiry flow is still **Supabase + Calendly**, not email-based
- lead form still writes directly to `funnel_leads` using the public anon key
- package checkout still uses the public edge function + Stripe Checkout
- audit flow no longer allows anonymous upload-before-payment
- purchase completion is still recorded through Stripe webhook handling

### Remaining opportunities / residual risk
- `funnel_leads` still allows public anonymous inserts, so spam/noise is still possible unless that flow is moved behind an edge function or bot protection later
- `create-checkout-session` remains publicly callable for legitimate checkout creation, so additional origin allowlisting, CAPTCHA, rate limiting, or signed request checks would be the next hardening layer if abuse appears
- GitHub Pages may still require the repository Pages setting to use **GitHub Actions** if it is not already enabled in repo settings
