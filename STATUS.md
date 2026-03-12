# Status

## 2026-03-12

Shipped follow-up trust + pricing clarity pass for the Autonomous Ops Studio site.

### Updated
- `site/index.html`
- `site/package.html`
- `site/deployment.html`
- `site/checkout.html`
- `site/audit.html`
- `site/success.html`
- `site/js/main.js`
- `README.md`

### Clarifications added
- made it explicit that the client pays model subscription costs on top of the service fee
- named likely model options: ChatGPT Plus/Pro, Claude Code Pro/Max, or Gemini
- explained that some builds may need only one heavier setup month around $200, then drop closer to ~$20/month later depending on workflow/model
- stated clearly that Earl covers server costs while the client covers model costs
- added local-model option language when the client provides hardware such as a Mac Mini
- made Calendly.com/earlco the primary consult and onboarding path across the site
- clarified that the on-site form is lead capture into Supabase, not a guaranteed direct email inbox flow
- improved copy around what happens after inquiry, audit submission, checkout, and booking
- rewrote core pages for non-technical business owners, especially property managers and real estate investors
- translated infrastructure/security language into owner outcomes: fewer missed messages, faster follow-up, cleaner operations, better visibility, better response times, and less staff overhead
- reviewed the DRIVE source materials and integrated the useful sales structure into AO Studio without copying the original jargon directly
- added a plain-English five-motivator framing across the site: freedom, service, systems, trust, and proof/results

### Funnel / notification status
- inquiry flow is currently **Supabase + Calendly**, not email-based
- no plain email notification route appears wired in the codebase today
- lead form writes to `funnel_leads`
- audit flow writes to Supabase + Storage and then Stripe Checkout
- purchase completion is recorded through Stripe webhook handling

### Remaining opportunities
- add screenshots or architecture diagrams showing the owned deployment model
- add case studies or concrete example workflows by business type
- add explicit operator-side notification automation if immediate email/ping alerts are desired
