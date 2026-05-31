#!/usr/bin/env bash
# test-p3-cancellation.sh — P3 Order Cancellation Test Suite (Tests A–G + Phase 2 regression)
#
# Tests:
#   A — Cancel PENDING order (no payment) → status=CANCELLED, paymentStatus=CANCELLED
#   B — Cancel requires_capture order (auth-only PI, before capture) → PI cancelled, status=CANCELLED
#   C — Cancel PAID order (captured) → Stripe refund, status=CANCELLED, paymentStatus=REFUNDED
#   D — Cancel PARTIALLY_REFUNDED order → remainder refunded, status=CANCELLED
#   E — Buyer tries to cancel SHIPPED order → blocked (400)
#   F — Admin force-cancels SHIPPED order → status=CANCELLED
#   G — Admin cancels another user's order (ownership bypass) → status=CANCELLED
#   R — Phase 2 regression: happy-path order creation + verify state

set -uo pipefail

API="http://localhost:4000/api/v1"
# Read from .env file if env vars not already set
ENV_FILE="$(dirname "$0")/apps/api/.env"
DB_URL="${DATABASE_URL:-$(grep '^DATABASE_URL=' "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"')}"
STRIPE_SK="${STRIPE_SECRET_KEY:-$(grep '^\s*STRIPE_SECRET_KEY=' "$ENV_FILE" 2>/dev/null | head -1 | sed 's/.*STRIPE_SECRET_KEY=//' | tr -d ' "')}"
TS=$(date +%s)

# ── colour helpers ──────────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
PASS=0; FAIL=0
declare -a RESULTS

pass() { echo -e "${GREEN}✅ PASS${NC} $1"; PASS=$((PASS+1)); RESULTS+=("PASS | $1"); }
fail() { echo -e "${RED}❌ FAIL${NC} $1"; FAIL=$((FAIL+1)); RESULTS+=("FAIL | $1"); }
info() { echo -e "${YELLOW}ℹ${NC}  $1"; }

# ── helpers ─────────────────────────────────────────────────────────────────
api() { curl -sf "$@"; }

login() {
  local email="$1" pass="$2"
  api -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$pass\"}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken') or d.get('data',{}).get('accessToken',''))"
}

order_state() {
  local token="$1" oid="$2"
  api -H "Authorization: Bearer $token" "$API/orders/$oid" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); o=d.get('data',d); print(o.get('status','?'), o.get('paymentStatus','?'))"
}

db_exec() {
  # Run SQL against the DB directly (requires psql on PATH)
  psql "$DB_URL" -t -c "$1" 2>/dev/null | xargs
}

stripe_api() {
  curl -sf "https://api.stripe.com/v1/$1" \
    -u "${STRIPE_SK}:" \
    "${@:2}"
}

# ── wait for API ─────────────────────────────────────────────────────────────
info "Waiting for API..."
for i in $(seq 1 30); do
  if curl -sf "$API/health" &>/dev/null; then break; fi
  sleep 2
  if [[ $i -eq 30 ]]; then echo "API did not start" >&2; exit 1; fi
done
info "API ready."

# ── pre-test cleanup ──────────────────────────────────────────────────────────
info "Pre-test: clearing login rate limits..."
db_exec "DELETE FROM login_attempts WHERE success = false;"
info "Pre-test: resetting product inventory to 50..."
db_exec "UPDATE products SET inventory = 50 WHERE id = 'cmo7r7cp7002nosxf7sqylg2z';"

# ── shared setup ─────────────────────────────────────────────────────────────
BUYER_EMAIL="p3-buyer-${TS}@test.com"
BUYER_PASS="TestPassword123!"
BUYER2_EMAIL="p3-buyer2-${TS}@test.com"
BUYER2_PASS="TestPassword123!"
ADMIN_EMAIL="admin@nextpik.com"
ADMIN_PASS="Password123!"

info "Registering test buyer..."
api -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$BUYER_EMAIL\",\"password\":\"$BUYER_PASS\",\"firstName\":\"P3\",\"lastName\":\"Buyer\",\"role\":\"BUYER\"}" > /dev/null || true

api -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$BUYER2_EMAIL\",\"password\":\"$BUYER2_PASS\",\"firstName\":\"P3\",\"lastName\":\"Buyer2\",\"role\":\"BUYER\"}" > /dev/null || true

BUYER_TOKEN=$(login "$BUYER_EMAIL" "$BUYER_PASS")
BUYER2_TOKEN=$(login "$BUYER2_EMAIL" "$BUYER2_PASS")
ADMIN_TOKEN=$(login "$ADMIN_EMAIL" "$ADMIN_PASS")

if [[ -z "$BUYER_TOKEN" || -z "$ADMIN_TOKEN" ]]; then
  echo "❌ Auth failed — cannot proceed" >&2; exit 1
fi

BUYER_ID=$(api -H "Authorization: Bearer $BUYER_TOKEN" "$API/auth/me" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',d).get('id',''))")
BUYER2_ID=$(api -H "Authorization: Bearer $BUYER2_TOKEN" "$API/auth/me" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',d).get('id',''))")

info "Buyer ID: $BUYER_ID"
info "Buyer2 ID: $BUYER2_ID"

# Find a product to use in orders
PRODUCTS_RESP=$(api "$API/products?limit=1" 2>/dev/null || echo "{}")
PRODUCT_ID=$(echo "$PRODUCTS_RESP" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); dd=d.get('data',d); items=dd.get('products',dd.get('items',dd if isinstance(dd,list) else [])); print(items[0]['id'] if items else '')" 2>/dev/null || echo "")
PRODUCT_PRICE=$(echo "$PRODUCTS_RESP" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); dd=d.get('data',d); items=dd.get('products',dd.get('items',dd if isinstance(dd,list) else [])); print(items[0].get('price',10) if items else 10)" 2>/dev/null || echo "10")

if [[ -z "$PRODUCT_ID" ]]; then
  echo "❌ No product found — seed your DB" >&2; exit 1
fi
info "Using product: $PRODUCT_ID @ \$$PRODUCT_PRICE"

# Find/create an address for buyer
ADDRESS_ID=$(api -H "Authorization: Bearer $BUYER_TOKEN" "$API/addresses" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); addrs=d.get('data',[]); print(addrs[0]['id'] if addrs else '')" 2>/dev/null || echo "")

if [[ -z "$ADDRESS_ID" ]]; then
  ADDRESS_ID=$(api -X POST "$API/addresses" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"firstName\":\"P3\",\"lastName\":\"Buyer\",\"address1\":\"123 Test St\",\"city\":\"New York\",\"province\":\"NY\",\"postalCode\":\"10001\",\"country\":\"US\",\"phone\":\"+12125551234\",\"isDefault\":true}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',d).get('id',''))" 2>/dev/null || echo "")
fi
info "Address ID: $ADDRESS_ID"

# Helper: get or create an address for a given token, returns address ID
get_or_create_address() {
  local token="$1"
  local addr_id
  addr_id=$(curl -s -H "Authorization: Bearer $token" "$API/addresses" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); a=d.get('data',[]); print(a[0]['id'] if a else '')" 2>/dev/null || echo "")
  if [[ -z "$addr_id" ]]; then
    addr_id=$(curl -sf -X POST "$API/addresses" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d "{\"firstName\":\"P3\",\"lastName\":\"Test\",\"address1\":\"123 Test St\",\"city\":\"New York\",\"province\":\"NY\",\"postalCode\":\"10001\",\"country\":\"US\",\"phone\":\"+12125551234\",\"isDefault\":true}" \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',d).get('id',''))" 2>/dev/null || echo "")
  fi
  echo "$addr_id"
}

# Helper: create a minimal order and return its ID
create_order() {
  local token="$1"
  local addr
  addr=$(get_or_create_address "$token")
  curl -sf -X POST "$API/orders" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "{
      \"items\": [{\"productId\":\"$PRODUCT_ID\",\"quantity\":1,\"price\":$PRODUCT_PRICE}],
      \"shippingAddressId\": \"$addr\",
      \"shippingMethodId\": \"standard\",
      \"currency\": \"USD\"
    }" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',d).get('id',''))" 2>/dev/null || echo ""
}

# Helper: inject PAID state directly into DB + create PaymentTransaction
# Requires the order owner's userId for NOT NULL constraint
inject_paid_state() {
  local order_id="$1"
  local pi_id="$2"
  local amount="${3:-10.00}"
  local user_id
  user_id=$(db_exec "SELECT \"userId\" FROM orders WHERE id='$order_id';")
  db_exec "INSERT INTO payment_transactions (id, \"orderId\", \"userId\", \"stripePaymentIntentId\", amount, \"refundedAmount\", status, \"paymentMethod\", currency, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), '$order_id', '$user_id', '$pi_id', $amount, 0, 'SUCCEEDED', 'CREDIT_CARD', 'USD', NOW(), NOW()) ON CONFLICT DO NOTHING;"
  db_exec "UPDATE orders SET \"paymentStatus\"='PAID', \"updatedAt\"=NOW() WHERE id='$order_id';"
}

inject_partially_refunded_state() {
  local order_id="$1"
  local pi_id="$2"
  local amount="${3:-10.00}"
  local refunded="${4:-3.00}"
  local user_id
  user_id=$(db_exec "SELECT \"userId\" FROM orders WHERE id='$order_id';")
  db_exec "INSERT INTO payment_transactions (id, \"orderId\", \"userId\", \"stripePaymentIntentId\", amount, \"refundedAmount\", status, \"paymentMethod\", currency, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), '$order_id', '$user_id', '$pi_id', $amount, $refunded, 'PARTIALLY_REFUNDED', 'CREDIT_CARD', 'USD', NOW(), NOW()) ON CONFLICT DO NOTHING;"
  db_exec "UPDATE orders SET \"paymentStatus\"='PARTIALLY_REFUNDED', \"updatedAt\"=NOW() WHERE id='$order_id';"
}

inject_shipped_state() {
  local order_id="$1"
  db_exec "UPDATE orders SET status='SHIPPED', \"updatedAt\"=NOW() WHERE id='$order_id';"
  # Verify
  local s
  s=$(db_exec "SELECT status FROM orders WHERE id='$order_id';")
  info "  inject_shipped: DB status=$s"
}

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  P3 CANCELLATION TESTS"
echo "═══════════════════════════════════════════════════════"

# ═══════════════════════════════════════════════════════════
# TEST A — Cancel PENDING order
# ═══════════════════════════════════════════════════════════
echo ""
info "TEST A: Cancel PENDING order"

ORDER_A=$(create_order "$BUYER_TOKEN")
if [[ -z "$ORDER_A" ]]; then fail "A — could not create order"; else
  RESP_A=$(api -sf -X POST "$API/orders/$ORDER_A/cancel" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -H "Content-Type: application/json" 2>/dev/null || echo "ERROR")

  STATE_A=$(order_state "$BUYER_TOKEN" "$ORDER_A")
  STATUS_A=$(echo "$STATE_A" | awk '{print $1}')
  PAY_A=$(echo "$STATE_A" | awk '{print $2}')

  info "  order.status=$STATUS_A  order.paymentStatus=$PAY_A"

  if [[ "$STATUS_A" == "CANCELLED" && "$PAY_A" == "CANCELLED" ]]; then
    pass "A — PENDING cancel → status=CANCELLED paymentStatus=CANCELLED"
  else
    fail "A — expected CANCELLED/CANCELLED, got $STATUS_A/$PAY_A"
  fi
fi

# ═══════════════════════════════════════════════════════════
# TEST B — Cancel requires_capture order (real Stripe PI in test mode)
# ═══════════════════════════════════════════════════════════
echo ""
info "TEST B: Cancel requires_capture order (auth-only PI)"

# Create a real Stripe PI with capture_method=manual in test mode
PI_B=$(stripe_api "payment_intents" \
  -d "amount=1000" \
  -d "currency=usd" \
  -d "capture_method=manual" \
  -d "confirm=true" \
  -d "payment_method=pm_card_visa" \
  -d "return_url=https://nextpik.com/checkout/cancel" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || echo "")

if [[ -z "$PI_B" ]]; then
  fail "B — Stripe PI creation failed (check Stripe key)"
else
  PI_B_STATUS=$(stripe_api "payment_intents/$PI_B" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
  info "  Stripe PI=$PI_B  PI.status=$PI_B_STATUS"

  ORDER_B=$(create_order "$BUYER_TOKEN")
  if [[ -z "$ORDER_B" ]]; then fail "B — could not create order"; else
    # Inject PAID state using the real requires_capture PI
    inject_paid_state "$ORDER_B" "$PI_B" "10.00"

    RESP_B=$(api -sf -X POST "$API/orders/$ORDER_B/cancel" \
      -H "Authorization: Bearer $BUYER_TOKEN" \
      -H "Content-Type: application/json" 2>/dev/null || echo "ERROR")

    STATE_B=$(order_state "$BUYER_TOKEN" "$ORDER_B")
    STATUS_B=$(echo "$STATE_B" | awk '{print $1}')
    PAY_B=$(echo "$STATE_B" | awk '{print $2}')

    # Check PI was actually cancelled in Stripe
    PI_B_FINAL=$(stripe_api "payment_intents/$PI_B" \
      | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "unknown")

    info "  order.status=$STATUS_B  order.paymentStatus=$PAY_B  Stripe PI.status=$PI_B_FINAL"

    if [[ "$STATUS_B" == "CANCELLED" && "$PAY_B" == "REFUNDED" && "$PI_B_FINAL" == "canceled" ]]; then
      pass "B — requires_capture cancel → status=CANCELLED paymentStatus=REFUNDED Stripe PI=canceled"
    else
      fail "B — expected CANCELLED/REFUNDED/canceled, got $STATUS_B/$PAY_B/$PI_B_FINAL"
    fi
  fi
fi

# ═══════════════════════════════════════════════════════════
# TEST C — Cancel PAID order (captured/succeeded)
# ═══════════════════════════════════════════════════════════
echo ""
info "TEST C: Cancel PAID order (captured)"

# Create a real succeeded PI for an authentic refund
PI_C=$(stripe_api "payment_intents" \
  -d "amount=1000" \
  -d "currency=usd" \
  -d "confirm=true" \
  -d "payment_method=pm_card_visa" \
  -d "return_url=https://nextpik.com/checkout/cancel" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || echo "")

if [[ -z "$PI_C" ]]; then
  fail "C — Stripe PI creation failed"
else
  PI_C_STATUS=$(stripe_api "payment_intents/$PI_C" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
  info "  Stripe PI=$PI_C  PI.status=$PI_C_STATUS"

  ORDER_C=$(create_order "$BUYER_TOKEN")
  if [[ -z "$ORDER_C" ]]; then fail "C — could not create order"; else
    # Get inventory before cancel
    INV_BEFORE=$(db_exec "SELECT inventory FROM products WHERE id='$PRODUCT_ID';")
    inject_paid_state "$ORDER_C" "$PI_C" "10.00"

    RESP_C=$(api -sf -X POST "$API/orders/$ORDER_C/cancel" \
      -H "Authorization: Bearer $BUYER_TOKEN" \
      -H "Content-Type: application/json" 2>/dev/null || echo "ERROR")

    STATE_C=$(order_state "$BUYER_TOKEN" "$ORDER_C")
    STATUS_C=$(echo "$STATE_C" | awk '{print $1}')
    PAY_C=$(echo "$STATE_C" | awk '{print $2}')
    INV_AFTER=$(db_exec "SELECT inventory FROM products WHERE id='$PRODUCT_ID';")

    # Verify Stripe refund was created
    REFUND_COUNT=$(stripe_api "refunds?payment_intent=$PI_C" \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])))" 2>/dev/null || echo "0")

    info "  order.status=$STATUS_C  order.paymentStatus=$PAY_C  Stripe refunds=$REFUND_COUNT  inventory: ${INV_BEFORE}->${INV_AFTER}"

    if [[ "$STATUS_C" == "CANCELLED" && "$PAY_C" == "REFUNDED" && "$REFUND_COUNT" -ge 1 ]]; then
      pass "C — PAID cancel → status=CANCELLED paymentStatus=REFUNDED Stripe refund issued"
    else
      fail "C — expected CANCELLED/REFUNDED + refund, got $STATUS_C/$PAY_C refunds=$REFUND_COUNT"
    fi
  fi
fi

# ═══════════════════════════════════════════════════════════
# TEST D — Cancel PARTIALLY_REFUNDED order
# ═══════════════════════════════════════════════════════════
echo ""
info "TEST D: Cancel PARTIALLY_REFUNDED order"

PI_D=$(stripe_api "payment_intents" \
  -d "amount=1000" \
  -d "currency=usd" \
  -d "confirm=true" \
  -d "payment_method=pm_card_visa" \
  -d "return_url=https://nextpik.com/checkout/cancel" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || echo "")

if [[ -z "$PI_D" ]]; then
  fail "D — Stripe PI creation failed"
else
  ORDER_D=$(create_order "$BUYER_TOKEN")
  if [[ -z "$ORDER_D" ]]; then fail "D — could not create order"; else
    inject_partially_refunded_state "$ORDER_D" "$PI_D" "10.00" "3.00"

    RESP_D=$(api -sf -X POST "$API/orders/$ORDER_D/cancel" \
      -H "Authorization: Bearer $BUYER_TOKEN" \
      -H "Content-Type: application/json" 2>/dev/null || echo "ERROR")

    STATE_D=$(order_state "$BUYER_TOKEN" "$ORDER_D")
    STATUS_D=$(echo "$STATE_D" | awk '{print $1}')
    PAY_D=$(echo "$STATE_D" | awk '{print $2}')

    # Should have issued a refund for the remaining $7.00
    REFUND_COUNT_D=$(stripe_api "refunds?payment_intent=$PI_D" \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])))" 2>/dev/null || echo "0")

    info "  order.status=$STATUS_D  order.paymentStatus=$PAY_D  Stripe refunds=$REFUND_COUNT_D"

    if [[ "$STATUS_D" == "CANCELLED" && "$PAY_D" == "REFUNDED" && "$REFUND_COUNT_D" -ge 1 ]]; then
      pass "D — PARTIALLY_REFUNDED cancel → status=CANCELLED paymentStatus=REFUNDED remainder refunded"
    else
      fail "D — expected CANCELLED/REFUNDED + refund, got $STATUS_D/$PAY_D refunds=$REFUND_COUNT_D"
    fi
  fi
fi

# ═══════════════════════════════════════════════════════════
# TEST E — Buyer tries to cancel SHIPPED order (must be blocked)
# ═══════════════════════════════════════════════════════════
echo ""
info "TEST E: Buyer tries to cancel SHIPPED order (should be blocked)"

ORDER_E=$(create_order "$BUYER_TOKEN")
if [[ -z "$ORDER_E" ]]; then fail "E — could not create order"; else
  inject_shipped_state "$ORDER_E"

  curl -s -o /tmp/cancel_e_body.json -w "%{http_code}" -X POST "$API/orders/$ORDER_E/cancel" \
    -H "Authorization: Bearer $BUYER_TOKEN" \
    -H "Content-Type: application/json" > /tmp/cancel_e_http.txt 2>/dev/null || echo "000" > /tmp/cancel_e_http.txt
  HTTP_E=$(cat /tmp/cancel_e_http.txt)
  CANCEL_MSG_E=$(python3 -c "import json; d=json.load(open('/tmp/cancel_e_body.json')); print(d.get('message',''))" 2>/dev/null || echo "")

  STATE_E=$(order_state "$BUYER_TOKEN" "$ORDER_E")
  STATUS_E=$(echo "$STATE_E" | awk '{print $1}')

  info "  HTTP=$HTTP_E  cancel_msg='$CANCEL_MSG_E'  order.status=$STATUS_E"

  # The cancel controller wraps all exceptions in try-catch and returns {success:false, message}
  # as HTTP 201 (NestJS @Post default). The block is enforced: success=false and status unchanged.
  if [[ "$CANCEL_MSG_E" == *"Cannot cancel shipped order"* && "$STATUS_E" == "SHIPPED" ]]; then
    pass "E — buyer SHIPPED cancel blocked (success=false + status unchanged=SHIPPED)"
  else
    fail "E — expected success=false + status=SHIPPED, got msg='$CANCEL_MSG_E' status=$STATUS_E"
  fi
fi

# ═══════════════════════════════════════════════════════════
# TEST F — Admin force-cancels SHIPPED order
# ═══════════════════════════════════════════════════════════
echo ""
info "TEST F: Admin force-cancels SHIPPED order"

ORDER_F=$(create_order "$BUYER_TOKEN")
if [[ -z "$ORDER_F" ]]; then fail "F — could not create order"; else
  inject_shipped_state "$ORDER_F"

  RESP_F=$(api -sf -X POST "$API/orders/$ORDER_F/cancel" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" 2>/dev/null || echo "ERROR")

  STATE_F=$(order_state "$ADMIN_TOKEN" "$ORDER_F")
  STATUS_F=$(echo "$STATE_F" | awk '{print $1}')

  info "  order.status=$STATUS_F"

  if [[ "$STATUS_F" == "CANCELLED" ]]; then
    pass "F — admin force-cancel SHIPPED → status=CANCELLED"
  else
    fail "F — expected CANCELLED, got $STATUS_F"
  fi
fi

# ═══════════════════════════════════════════════════════════
# TEST G — Admin cancels another user's order (P3-03 ownership)
# ═══════════════════════════════════════════════════════════
echo ""
info "TEST G: Admin cancels another user's order (ownership bypass)"

# Create order as buyer2
ORDER_G=$(create_order "$BUYER2_TOKEN")
if [[ -z "$ORDER_G" ]]; then fail "G — could not create order as buyer2"; else
  # Cancel as admin (different user)
  RESP_G=$(api -sf -X POST "$API/orders/$ORDER_G/cancel" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" 2>/dev/null || echo "ERROR")

  # Admin can see the order
  STATE_G=$(order_state "$ADMIN_TOKEN" "$ORDER_G")
  STATUS_G=$(echo "$STATE_G" | awk '{print $1}')
  PAY_G=$(echo "$STATE_G" | awk '{print $2}')

  info "  order.status=$STATUS_G  order.paymentStatus=$PAY_G"

  if [[ "$STATUS_G" == "CANCELLED" ]]; then
    pass "G — admin cancels buyer2's order → status=CANCELLED (ownership bypass works)"
  else
    fail "G — expected CANCELLED, got $STATUS_G (admin may have received 'Order not found')"
  fi
fi

# ═══════════════════════════════════════════════════════════
# TEST R — Phase 2 regression: happy-path order
# ═══════════════════════════════════════════════════════════
echo ""
info "TEST R: Phase 2 regression — create order and verify initial state"

ORDER_R=$(create_order "$BUYER_TOKEN")
if [[ -z "$ORDER_R" ]]; then
  fail "R — could not create order"
else
  STATE_R=$(order_state "$BUYER_TOKEN" "$ORDER_R")
  STATUS_R=$(echo "$STATE_R" | awk '{print $1}')
  PAY_R=$(echo "$STATE_R" | awk '{print $2}')

  info "  order.status=$STATUS_R  order.paymentStatus=$PAY_R"

  if [[ "$STATUS_R" == "PENDING" && "$PAY_R" == "PENDING" ]]; then
    pass "R — Phase 2 regression: new order correctly has status=PENDING paymentStatus=PENDING"
  else
    fail "R — expected PENDING/PENDING, got $STATUS_R/$PAY_R"
  fi
fi

# ═══════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  RESULTS"
echo "═══════════════════════════════════════════════════════"
for r in "${RESULTS[@]}"; do
  if [[ "$r" == PASS* ]]; then
    echo -e "  ${GREEN}${r}${NC}"
  else
    echo -e "  ${RED}${r}${NC}"
  fi
done
echo ""
echo "  Total: $((PASS+FAIL))  PASS: $PASS  FAIL: $FAIL"
echo "═══════════════════════════════════════════════════════"

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
