#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CFG="$ROOT_DIR/site/js/config.js"

: "${PUBLIC_SUPABASE_URL:?set PUBLIC_SUPABASE_URL}"
: "${PUBLIC_SUPABASE_ANON_KEY:?set PUBLIC_SUPABASE_ANON_KEY}"
: "${PUBLIC_EDGE_BASE_URL:?set PUBLIC_EDGE_BASE_URL}"

cat > "$CFG" <<EOF
window.__ZHC_CONFIG__ = {
  calendlyUrl: "${PUBLIC_CALENDLY_URL:-https://calendly.com/earlco}",
  supabaseUrl: "${PUBLIC_SUPABASE_URL}",
  supabaseAnonKey: "${PUBLIC_SUPABASE_ANON_KEY}",
  edgeBaseUrl: "${PUBLIC_EDGE_BASE_URL}",
  packageSlug: "autonomous-ops-consulting-mvp",
  packageName: "Autonomous Ops Studio - Done-for-You MVP",
  packagePriceUsd: 2997,
  auditSlug: "ai-opportunity-audit",
  auditName: "AI Opportunity Audit",
  auditPriceUsd: ${PUBLIC_AUDIT_PRICE_USD:-20},
  auditDeliveryWindow: "${PUBLIC_AUDIT_DELIVERY_WINDOW:-1-2 business days}"
};
EOF

echo "Rendered $CFG"
