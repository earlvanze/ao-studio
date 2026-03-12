// Supabase Edge Function: create-audit-checkout-session
// Safe public audit intake: creates checkout only.
// No anonymous file upload is accepted before payment.
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
  const s = String(v).trim();
  return s.length > 500 ? s.slice(0, 500) : s;
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
    const email = toMetadataValue(body.email);
    const company = toMetadataValue(body.company);
    const notes = toMetadataValue(body.notes);
    const successUrl = String(body.successUrl || "").trim();
    const cancelUrl = String(body.cancelUrl || "").trim();

    if (!email || !notes || !successUrl || !cancelUrl) {
      return Response.json({ error: "Missing required fields" }, { status: 400, headers: CORS_HEADERS });
    }

    if (!isSafeHttpUrl(successUrl) || !isSafeHttpUrl(cancelUrl)) {
      return Response.json({ error: "Invalid redirect URL" }, { status: 400, headers: CORS_HEADERS });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const auditRequestId = crypto.randomUUID();
    const metadata: Record<string, string> = {
      flow: "audit",
      auditType: "ai_opportunity_audit",
      auditRequestId: toMetadataValue(auditRequestId),
      email,
      company,
      notes,
      materialsCollection: "after_payment"
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 2000,
            product_data: {
              name: "AI Opportunity Audit",
              description: "Payment-first audit intake with materials collected after checkout"
            }
          },
          quantity: 1
        }
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata
    });

    const { error: insertErr } = await supabase.from("audit_requests").insert({
      id: auditRequestId,
      email,
      company: company || null,
      notes: notes || null,
      file_name: "pending-after-payment",
      file_type: null,
      file_size: null,
      storage_bucket: "audit_uploads",
      storage_path: `${auditRequestId}/pending-after-payment`,
      stripe_checkout_session_id: session.id,
      amount_usd: 20,
      currency: "usd",
      status: "checkout_created",
      delivery_window: "1-2 business days",
      metadata
    });

    if (insertErr) {
      return Response.json({ error: `DB insert failed: ${insertErr.message}` }, { status: 500, headers: CORS_HEADERS });
    }

    return Response.json(
      {
        url: session.url,
        sessionId: session.id,
        auditRequestId
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: CORS_HEADERS });
  }
});
