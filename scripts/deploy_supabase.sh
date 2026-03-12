#!/usr/bin/env bash
set -euo pipefail

# Requires: supabase CLI logged in and linked to target project.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

supabase db push --include-all
supabase functions deploy create-checkout-session --project-ref "$SUPABASE_PROJECT_REF"
supabase functions deploy create-audit-checkout-session --project-ref "$SUPABASE_PROJECT_REF"
supabase functions deploy stripe-webhook --project-ref "$SUPABASE_PROJECT_REF"

echo "Supabase migration + function deploy complete."
