#!/usr/bin/env bash
# dev-api.sh — Start the NestJS API + Stripe webhook listener together.
# Automatically syncs the Stripe CLI webhook secret into apps/api/.env
# before starting, so signature verification always works.

set -e

ENV_FILE="$(dirname "$0")/../apps/api/.env"
WEBHOOK_FORWARD="localhost:4000/api/v1/payment/webhook"

# ── 1. Require Stripe CLI ────────────────────────────────────────────────────
if ! command -v stripe &>/dev/null; then
  echo "[stripe] Stripe CLI not found. Install it:"
  echo "  brew install stripe/stripe-cli/stripe"
  echo "Continuing without webhook forwarding."
  pnpm --filter=@nextpik/api dev
  exit 0
fi

# ── 2. Sync webhook secret into .env ────────────────────────────────────────
echo "[stripe] Fetching webhook signing secret..."
WEBHOOK_SECRET=$(stripe listen --print-secret 2>/dev/null)

if [ -n "$WEBHOOK_SECRET" ]; then
  if grep -q "STRIPE_WEBHOOK_SECRET=" "$ENV_FILE"; then
    # Replace existing line (works on macOS and Linux)
    sed -i.bak "s|  STRIPE_WEBHOOK_SECRET=.*|  STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET|" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
  else
    echo "  STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET" >> "$ENV_FILE"
  fi
  echo "[stripe] Webhook secret synced -> $WEBHOOK_SECRET"
else
  echo "[stripe] Could not fetch secret (not logged in?). Run: stripe login"
fi

# ── 3. Start Stripe listener in background ──────────────────────────────────
echo "[stripe] Starting webhook forwarder -> $WEBHOOK_FORWARD"
stripe listen --forward-to "$WEBHOOK_FORWARD" &
STRIPE_PID=$!

# Kill the listener when this script exits
trap 'echo "[stripe] Stopping listener..."; kill $STRIPE_PID 2>/dev/null' EXIT INT TERM

# ── 4. Start the API (foreground) ───────────────────────────────────────────
echo "[api] Starting NestJS..."
pnpm --filter=@nextpik/api dev
