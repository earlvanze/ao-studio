# Autonomous Ops Studio

Client-facing site and funnel for Autonomous Ops Studio, positioned as a done-for-you OpenClaw deployment and business operations integration service.

## Current positioning

The live site now emphasizes:

- OpenClaw as owned digital employee infrastructure, not just a chatbot
- deployment on a dedicated VPS the client owns and controls
- workspace integration across files, memory, docs, and internal operating context
- messaging access through channels like WhatsApp, Discord, Slack, Telegram, and similar surfaces
- security, privacy, and data ownership as part of the offer
- clawsourcing / agency-agents value: one front-door assistant plus specialist subagents
- Earl as implementation lead, systems integrator, and practical AI IT admin for the client
- explicit pricing clarity that the client pays model subscription costs on top of the service fee, while Earl covers server costs
- local-model deployment as an option when the client provides the hardware
- Calendly.com/earlco as the primary consult and onboarding path
- adapted DRIVE-style buyer-motivator positioning into plain-English owner outcomes: freedom, service, systems, trust, and proof/results

## Site files

- `site/index.html` - primary landing page and lead capture
- `site/package.html` - implementation package detail and pricing
- `site/checkout.html` - Stripe checkout entry page
- `site/success.html` - post-purchase onboarding CTA
- `site/audit.html` - low-ticket ownership-minded ops audit offer
- `site/deployment.html` - deployment, security, and ownership explainer

## Funnel behavior

Current inquiry / booking behavior in code:

- Calendly buttons open `https://calendly.com/earlco`
- lead form submissions from `site/index.html` write to Supabase table `funnel_leads`
- audit submissions from `site/audit.html` write metadata to Supabase, upload files to Supabase Storage, and create Stripe checkout via Edge Function
- package checkout is started from `site/checkout.html` via Supabase Edge Function and Stripe Checkout
- successful payments are recorded via Stripe webhook into Supabase tables
- there is currently **no plain email notification path wired in this repo** for leads or purchases

## Stack

- Frontend: static HTML/CSS/JS (GitHub Pages compatible)
- Data: Supabase Postgres + REST + Edge Functions
- Payments: Stripe Checkout (hosted)

## Local preview

```bash
cd site
python3 -m http.server 5173
# open http://localhost:5173
```

## GitHub Pages deploy

Option A (root from `/site`):
1. Push repository to GitHub
2. Settings -> Pages
3. Source: `Deploy from a branch`
4. Branch: `main` folder: `/site`

Option B (GitHub Actions): add a workflow to publish `/site` to Pages.

## Configure public frontend values

Edit `site/js/config.js`:
- `supabaseUrl`
- `supabaseAnonKey`
- `edgeBaseUrl`
- `calendlyUrl`

## Supabase and Stripe setup

See `SETUP_STRIPE_SUPABASE.md`.

## Notes

The active codebase for this project is isolated under:
- `/home/digit/.openclaw/workspace/Projects/zero-human-company`

The Dropbox folder for the same project is treated as context/assets only:
- `/home/digit/.openclaw/workspace/Dropbox/Projects/zero-human-company`
