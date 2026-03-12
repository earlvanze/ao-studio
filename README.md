# Autonomous Ops Studio

Static marketing site and funnel for Autonomous Ops Studio.

## Deployment model

- Frontend: static HTML/CSS/JS under `site/`
- Hosting: GitHub Pages via GitHub Actions
- Backend: Supabase REST + Edge Functions where needed
- Payments: Stripe Checkout (hosted)

This repo is intentionally kept GitHub Pages-compatible. No VPS is required for the public site.

## Site structure

- `site/index.html` - primary landing page and lead capture
- `site/package.html` - implementation package detail and pricing
- `site/checkout.html` - Stripe checkout entry page
- `site/success.html` - post-purchase / next-step page
- `site/audit.html` - low-ticket audit offer
- `site/deployment.html` - deployment, security, and ownership explainer
- `site/js/config.js` - public frontend config only
- `.github/workflows/deploy-pages.yml` - GitHub Pages deployment workflow

## Funnel behavior

- Calendly buttons open `https://calendly.com/earlco`
- lead form submissions from `site/index.html` write to Supabase table `funnel_leads`
- package checkout is started from `site/checkout.html` via Supabase Edge Function and Stripe Checkout
- audit checkout is payment-first: the public site captures intake details and creates Stripe checkout, but does **not** accept anonymous file uploads before payment
- successful payments are recorded via Stripe webhook into Supabase tables
- there is currently **no plain email notification path wired in this repo** for leads or purchases

## GitHub Pages

This repo now includes a GitHub Actions workflow that deploys `site/` to GitHub Pages on pushes to `main`.

Expected project-site URL pattern:

`https://earlvanze.github.io/ao-studio/`

Because this is a project Pages site, client-side checkout/success/cancel links use page-relative URLs so they continue to work under the `/ao-studio/` path.

## Local preview

```bash
cd site
python3 -m http.server 4173
# open http://localhost:4173
```

## Configure public frontend values

Edit `site/js/config.js` only with public values:
- `supabaseUrl`
- `supabaseAnonKey`
- `edgeBaseUrl`
- `calendlyUrl`

The Supabase anon key is treated as public client config. Do not place Stripe secrets, service-role keys, or other private credentials in the static site.

## Supabase and Stripe setup

See `SETUP_STRIPE_SUPABASE.md`.
