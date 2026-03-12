// Supabase Edge Function: create-audit-checkout-session
// Handles real audit intake upload + Stripe checkout creation ($20)
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

    const form = await req.formData();
    const email = String(form.get("email") || "").trim();
    const company = String(form.get("company") || "").trim();
    const notes = String(form.get("notes") || "").trim();
    const successUrl = String(form.get("successUrl") || "").trim();
    const cancelUrl = String(form.get("cancelUrl") || "").trim();
    const file = form.get("export");

    if (!email || !successUrl || !cancelUrl) {
      return Response.json({ error: "Missing required fields" }, { status: 400, headers: CORS_HEADERS });
    }

    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "Missing export file" }, { status: 400, headers: CORS_HEADERS });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const auditRequestId = crypto.randomUUID();
    const sanitizedName = (file.name || "upload.bin").replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${auditRequestId}/${Date.now()}-${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from("audit_uploads")
      .upload(storagePath, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream"
      });

    if (uploadError) {
      return Response.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500, headers: CORS_HEADERS });
    }

    const metadata: Record<string, string> = {
      flow: "audit",
      auditType: "ai_opportunity_audit",
      auditRequestId: toMetadataValue(auditRequestId),
      email: toMetadataValue(email),
      company: toMetadataValue(company || ""),
      fileName: toMetadataValue(file.name),
      fileType: toMetadataValue(file.type || "application/octet-stream"),
      fileSize: toMetadataValue(file.size),
      notes: toMetadataValue(notes || "")
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
              description: "Upload + analysis + recommendations report"
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
      file_name: file.name,
      file_type: file.type || "application/octet-stream",
      file_size: file.size,
      storage_bucket: "audit_uploads",
      storage_path: storagePath,
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