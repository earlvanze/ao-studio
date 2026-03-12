# Launch Checklist

## Frontend
- [ ] Update `site/js/config.js` with production Supabase + Edge Function URLs
- [ ] Verify CTA links: Calendly + package + checkout
- [ ] Confirm mobile layout on index/package/checkout/success

## Supabase
- [ ] Dedicated project created (not EarlCoin)
- [ ] Migration applied (`supabase db push`)
- [ ] RLS and policies verified

## Stripe
- [ ] `create-checkout-session` function deployed
- [ ] `stripe-webhook` function deployed
- [ ] Secrets set in Supabase
- [ ] Webhook endpoint registered in Stripe
- [ ] Test mode purchase completed successfully

## QA
- [ ] Lead form writes to `funnel_leads`
- [ ] Checkout session writes to `checkout_sessions`
- [ ] Successful payment writes to `orders`
- [ ] Thank-you page renders and CTA works

## GitHub Pages
- [ ] Site files in publish root (`site/`)
- [ ] GitHub Pages configured to serve `/site`
- [ ] `.nojekyll` present if needed
