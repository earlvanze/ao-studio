// Supabase Edge Function: create-checkout-session
// Required secrets:
// STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-04-10"
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey"
};

function toMetadataValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return s.length > 500 ? s.slice(0, 500) : s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
    }

    const body = await req.json();
    const {
      packageSlug,
      packageName,
      amountUsd,
      successUrl,
      cancelUrl,
      customerEmail,
      metadata = {}
    } = body;

    if (!packageSlug || !packageName || !amountUsd || !successUrl || !cancelUrl) {
      return Response.json({ error: "Missing required fields" }, { status: 400, headers: CORS_HEADERS });
    }

    const meta: Record<string, string> = {
      packageSlug: toMetadataValue(packageSlug),
      packageName: toMetadataValue(packageName)
    };

    for (const [k, v] of Object.entries(metadata || {})) {
      if (!k) continue;
      meta[toMetadataValue(k)] = toMetadataValue(v);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Number(amountUsd) * 100,
            product_data: { name: packageName }
          },
          quantity: 1
        }
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: meta
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    await supabase.from("checkout_sessions").insert({
      stripe_checkout_session_id: session.id,
      package_slug: packageSlug,
      package_name: packageName,
      amount_usd: Number(amountUsd),
      currency: "usd",
      customer_email: customerEmail || null,
      status: session.status ?? "created",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: meta
    });

    return Response.json({ url: session.url, sessionId: session.id }, { headers: CORS_HEADERS });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: CORS_HEADERS });
  }
});