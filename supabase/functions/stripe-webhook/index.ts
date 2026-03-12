// Supabase Edge Function: stripe-webhook
// Required secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-04-10"
});

Deno.serve(async (req) => {
  try {
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    const payload = await req.text();

    if (!sig || !webhookSecret) {
      return Response.json({ error: "Missing signature or webhook secret" }, { status: 400 });
    }

    const event = await stripe.webhooks.constructEventAsync(payload, sig, webhookSecret);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    await supabase.from("stripe_webhook_events").insert({
      stripe_event_id: event.id,
      stripe_event_type: event.type,
      livemode: event.livemode,
      api_version: event.api_version,
      payload: event,
      processed: false
    });

    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;

      await supabase.from("orders").upsert({
        stripe_checkout_session_id: s.id,
        stripe_payment_intent_id: typeof s.payment_intent === "string" ? s.payment_intent : null,
        amount_total: s.amount_total,
        currency: s.currency,
        customer_email: s.customer_details?.email,
        package_slug: s.metadata?.packageSlug,
        package_name: s.metadata?.packageName,
        payment_status: s.payment_status,
        raw_event: event
      }, { onConflict: "stripe_checkout_session_id" });

      await supabase.from("checkout_sessions")
        .update({ status: "completed", customer_email: s.customer_details?.email })
        .eq("stripe_checkout_session_id", s.id);

      if (s.metadata?.auditType === "ai_opportunity_audit" || s.metadata?.flow === "audit") {
        await supabase.from("audit_requests")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            customer_email: s.customer_details?.email || null,
            stripe_payment_intent_id: typeof s.payment_intent === "string" ? s.payment_intent : null,
            payment_status: s.payment_status || null
          })
          .eq("stripe_checkout_session_id", s.id);
      }
    }

    await supabase.from("stripe_webhook_events")
      .update({ processed: true })
      .eq("stripe_event_id", event.id);

    return Response.json({ received: true });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 400 });
  }
});