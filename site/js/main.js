const cfg = window.__ZHC_CONFIG__ || {};

function qs(id) { return document.querySelector(id); }

async function captureLead(payload) {
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    return { ok: false, skipped: true, reason: "Supabase public config missing" };
  }

  const body = {
    source_page: payload.source_page || window.location.pathname,
    name: payload.name || null,
    email: payload.email || null,
    company: payload.company || null,
    notes: payload.notes || null,
    cta_type: payload.cta_type || null,
    metadata: payload.metadata || {}
  };

  const resp = await fetch(`${cfg.supabaseUrl}/rest/v1/funnel_leads`, {
    method: "POST",
    headers: {
      apikey: cfg.supabaseAnonKey,
      Authorization: `Bearer ${cfg.supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(body)
  });

  return { ok: resp.ok, status: resp.status };
}

async function createCheckoutSession({
  packageSlug,
  packageName,
  amountUsd,
  successUrl,
  cancelUrl,
  customerEmail,
  metadata
}) {
  const resp = await fetch(`${cfg.edgeBaseUrl}/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      packageSlug,
      packageName,
      amountUsd,
      successUrl,
      cancelUrl,
      customerEmail,
      metadata: metadata || {}
    })
  });

  const data = await resp.json();
  if (!resp.ok || !data.url) {
    throw new Error(data.error || `HTTP ${resp.status}`);
  }

  return data;
}

function wireCalendlyButtons() {
  document.querySelectorAll('[data-calendly-btn="true"]').forEach((a) => {
    a.href = cfg.calendlyUrl;
    a.target = "_blank";
    a.rel = "noopener";
    a.addEventListener("click", async () => {
      try {
        await captureLead({ cta_type: "calendly_click", metadata: { href: cfg.calendlyUrl } });
      } catch {}
    });
  });
}

function wireLeadForm() {
  const form = qs("#lead-form");
  if (!form) return;

  const status = qs("#lead-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = {
      name: data.get("name"),
      email: data.get("email"),
      company: data.get("company"),
      notes: data.get("notes"),
      cta_type: "lead_form"
    };

    status.textContent = "Submitting...";

    try {
      const r = await captureLead(payload);
      if (r.ok || r.skipped) {
        status.textContent = r.skipped
          ? "Saved locally only (Supabase not configured yet)."
          : "Inquiry saved. Fastest next step: book directly via Calendly.";
        form.reset();
      } else {
        status.textContent = `Submission failed (HTTP ${r.status}).`;
      }
    } catch (err) {
      status.textContent = "Submission failed. Please use Calendly now.";
    }
  });
}

function wireCheckoutStart() {
  const btn = qs("#start-checkout");
  const status = qs("#checkout-status");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!cfg.edgeBaseUrl) {
      status.textContent = "Checkout API not configured. Follow SETUP_STRIPE_SUPABASE.md.";
      return;
    }

    btn.disabled = true;
    status.textContent = "Creating secure checkout session...";

    try {
      await captureLead({ cta_type: "checkout_click", metadata: { packageSlug: cfg.packageSlug } });
      const data = await createCheckoutSession({
        packageSlug: cfg.packageSlug,
        packageName: cfg.packageName,
        amountUsd: cfg.packagePriceUsd,
        successUrl: `${window.location.origin}/success.html`,
        cancelUrl: `${window.location.origin}/checkout.html`,
        metadata: { flow: "main_package" }
      });

      window.location.href = data.url;
    } catch (e) {
      status.textContent = `Checkout failed: ${e.message || "Try again."}`;
      btn.disabled = false;
    }
  });
}

function wireAuditForm() {
  const form = qs("#audit-upload-form");
  const status = qs("#audit-status");
  if (!form || !status) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const file = data.get("export");
    const email = (data.get("email") || "").toString().trim();
    const company = (data.get("company") || "").toString().trim();
    const notes = (data.get("notes") || "").toString().trim();

    if (!(file instanceof File) || !file.size) {
      status.textContent = "Please attach an export file.";
      return;
    }

    if (!cfg.edgeBaseUrl) {
      status.textContent = "Audit backend not configured. Set edgeBaseUrl first.";
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    status.textContent = `Uploading export and creating $${cfg.auditPriceUsd} checkout...`;

    try {
      await captureLead({
        email,
        company,
        notes,
        cta_type: "audit_intake",
        metadata: {
          fileName: file.name,
          fileType: file.type || null,
          fileSize: file.size,
          auditSlug: cfg.auditSlug,
          auditDeliveryWindow: cfg.auditDeliveryWindow
        }
      });

      const auditPayload = new FormData();
      auditPayload.append("email", email);
      if (company) auditPayload.append("company", company);
      if (notes) auditPayload.append("notes", notes);
      auditPayload.append("export", file);
      auditPayload.append("successUrl", `${window.location.origin}/success.html`);
      auditPayload.append("cancelUrl", `${window.location.origin}/audit.html`);

      const auditResp = await fetch(`${cfg.edgeBaseUrl}/create-audit-checkout-session`, {
        method: "POST",
        body: auditPayload
      });

      const auditData = await auditResp.json();
      if (!auditResp.ok || !auditData.url) {
        throw new Error(auditData.error || `HTTP ${auditResp.status}`);
      }

      window.location.href = auditData.url;
    } catch (err) {
      status.textContent = `Audit checkout failed: ${err.message || "Try again."}`;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

wireCalendlyButtons();
wireLeadForm();
wireCheckoutStart();
wireAuditForm();