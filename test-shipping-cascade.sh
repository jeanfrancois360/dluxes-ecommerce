#!/bin/bash
# ============================================================
# SHIPPING CASCADE TEST — per-provider rate visibility
# Shows exactly what each provider quotes before cascade picks
# ============================================================

BASE="http://localhost:4000/api/v1"
TOKEN=$(cat /tmp/nextpik_token.txt 2>/dev/null)

CHEAP_PRODUCT="cmm0qkzmb0015osgrb01627kk"      # $16
EXPENSIVE_PRODUCT="cmlxxkl7p0016osnkg2ei5s2x"  # $12,500

read US_ADDR_ID EU_ADDR_ID AU_ADDR_ID < /tmp/nextpik_addrs.txt

PASS=0; FAIL=0; WARN=0

# ─── Colors ──────────────────────────────────────────────────
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; B='\033[0;34m'
C='\033[0;36m'; M='\033[0;35m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

log_pass() { echo -e "  ${G}✅ PASS${NC}  $1"; PASS=$((PASS+1)); }
log_fail() { echo -e "  ${R}❌ FAIL${NC}  $1"; FAIL=$((FAIL+1)); }
log_warn() { echo -e "  ${Y}⚠️  WARN${NC}  $1"; WARN=$((WARN+1)); }
log_info() { echo -e "  ${C}ℹ️ ${NC}  $1"; }

box() {
  echo ""
  echo -e "${B}${BOLD}┌─────────────────────────────────────────────────────────────┐${NC}"
  printf "${B}${BOLD}│${NC}  %-59s${B}${BOLD}│${NC}\n" "$1"
  echo -e "${B}${BOLD}└─────────────────────────────────────────────────────────────┘${NC}"
}

provider_header() {
  echo -e "  ${M}${BOLD}▶ $1${NC}"
}

rate_row() {
  # $1=index $2=name $3=price $4=carrier $5=days $6=service
  local free=""
  [ "$3" = "0" ] || [ "$3" = "0.00" ] && free="${G}  ← FREE${NC}"
  printf "    ${DIM}[%s]${NC} %-32s ${BOLD}%8s${NC}  %-20s  ~%s days%b\n" \
    "$1" "$2" "\$$3" "$4" "$5" "$free"
}

sep()  { echo -e "  ${DIM}─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─${NC}"; }
sep2() { echo -e "  ${DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# ─── DB helpers ──────────────────────────────────────────────
db() { docker exec nextpik-postgres psql -U postgres -d nextpik_ecommerce -tAc "$1" 2>/dev/null | tr -d ' '; }
set_bool() {
  local k=$1 v=$2
  local n=$(db "SELECT COUNT(*) FROM system_settings WHERE key='$k';")
  if [ "$n" -eq "0" ]; then
    db "INSERT INTO system_settings (id,key,category,value,\"defaultValue\",\"valueType\",label,description,\"isPublic\",\"isEditable\",\"requiresRestart\",\"updatedAt\") VALUES (gen_random_uuid(),'$k','shipping','$v','$v','BOOLEAN','$k','$k',false,true,false,NOW());" > /dev/null
  else
    db "UPDATE system_settings SET value='$v',\"updatedAt\"=NOW() WHERE key='$k';" > /dev/null
  fi
}

show_settings() {
  local ep=$(db "SELECT value FROM system_settings WHERE key='easypost_enabled';")
  local es=$(db "SELECT value FROM system_settings WHERE key='easyship_enabled';")
  local sc=$(db "SELECT value FROM system_settings WHERE key='sendcloud_enabled';")
  local dh=$(db "SELECT value FROM system_settings WHERE key='dhl_enabled';")
  local fr=$(db "SELECT value FROM system_settings WHERE key='free_shipping_enabled';")
  local th=$(db "SELECT value FROM system_settings WHERE key='free_shipping_threshold';")
  local on="${G}ON${NC}"; local off="${R}OFF${NC}"
  local ep_s=$off; [ "$ep" = "true" ] && ep_s=$on
  local es_s=$off; [ "$es" = "true" ] && es_s=$on
  local sc_s=$off; [ "$sc" = "true" ] && sc_s=$on
  local dh_s=$off; [ "$dh" = "true" ] && dh_s=$on
  local fr_s=$off; [ "$fr" = "true" ] && fr_s=$on
  echo -e "  ${DIM}Settings:${NC}  EasyPost:$ep_s  EasyShip:$es_s  SendCloud:$sc_s  DHL:$dh_s  FreeShip:$fr_s @ \$$th"
}

# ─── Save originals ──────────────────────────────────────────
ORIG_EP=$(db "SELECT value FROM system_settings WHERE key='easypost_enabled';")
ORIG_ES=$(db "SELECT value FROM system_settings WHERE key='easyship_enabled';")
ORIG_SC=$(db "SELECT value FROM system_settings WHERE key='sendcloud_enabled';")
ORIG_DH=$(db "SELECT value FROM system_settings WHERE key='dhl_enabled';")
ORIG_FR=$(db "SELECT value FROM system_settings WHERE key='free_shipping_enabled';")
ORIG_TH=$(db "SELECT value FROM system_settings WHERE key='free_shipping_threshold';")

restore() {
  set_bool easypost_enabled  "${ORIG_EP:-true}"
  set_bool easyship_enabled  "${ORIG_ES:-true}"
  set_bool sendcloud_enabled "${ORIG_SC:-true}"
  set_bool dhl_enabled       "${ORIG_DH:-false}"
  set_bool free_shipping_enabled "${ORIG_FR:-false}"
  db "UPDATE system_settings SET value='${ORIG_TH:-200}' WHERE key='free_shipping_threshold';" > /dev/null
}

# ─── Provider call helpers ────────────────────────────────────

# EasyPost: POST /easypost/rates (needs SELLER/ADMIN role)
call_easypost() {
  local to_city=$1 to_state=$2 to_zip=$3 to_country=$4 weight_oz=${5:-16}
  curl -s -X POST "$BASE/easypost/rates" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"fromAddress\":{\"name\":\"NextPik\",\"street1\":\"350 5th Ave\",\"city\":\"New York\",\"state\":\"NY\",\"zip\":\"10118\",\"country\":\"US\"},
      \"toAddress\":{\"name\":\"Test Customer\",\"street1\":\"123 Main St\",\"city\":\"$to_city\",\"state\":\"$to_state\",\"zip\":\"$to_zip\",\"country\":\"$to_country\"},
      \"parcel\":{\"weight\":$weight_oz,\"length\":10,\"width\":8,\"height\":4}
    }"
}

# EasyShip: POST /easyship/rates
call_easyship() {
  local from_country=$1 to_country=$2 weight_kg=${3:-0.5}
  curl -s -X POST "$BASE/easyship/rates" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"fromCountry\":\"$from_country\",
      \"toCountry\":\"$to_country\",
      \"weightKg\":$weight_kg,
      \"items\":[{\"quantity\":1,\"value\":16,\"name\":\"Test Item\"}]
    }"
}

# SendCloud: POST /sendcloud/rates
call_sendcloud() {
  local from_country=$1 to_country=$2 weight_grams=${3:-500}
  curl -s -X POST "$BASE/sendcloud/rates" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"fromCountry\":\"$from_country\",
      \"toCountry\":\"$to_country\",
      \"weightGrams\":$weight_grams,
      \"items\":[{\"name\":\"Test Item\",\"quantity\":1,\"value\":16}]
    }"
}

# Full cascade: POST /orders/calculate-totals
call_cascade() {
  local addr_id=$1 product=$2
  curl -s -X POST "$BASE/orders/calculate-totals" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"items\":[{\"productId\":\"$product\",\"quantity\":1,\"price\":16}],\"shippingAddressId\":\"$addr_id\",\"shippingMethod\":\"standard\",\"currency\":\"USD\"}"
}

# ─── Rate display functions ───────────────────────────────────

print_easypost_rates() {
  local raw="$1"
  echo "$raw" | node -e "
const c=[];process.stdin.on('data',d=>c.push(d));
process.stdin.on('end',()=>{
  try {
    const r=JSON.parse(Buffer.concat(c).toString());
    const rates=(r.data?.rates||r.rates||r.data||[]);
    if(!Array.isArray(rates)||rates.length===0){
      const msg=r.message||r.error||'no rates array';
      console.log('NONE:'+msg.substring(0,120));
      return;
    }
    // Sort by price
    rates.sort((a,b)=>(a.rate||a.price||0)-(b.rate||b.price||0));
    rates.slice(0,6).forEach((r,i)=>{
      const price=Number(r.rate||r.price||0).toFixed(2);
      const carrier=r.carrier||r.carrierCode||'?';
      const service=r.service||r.serviceCode||r.serviceName||'';
      const days=r.deliveryDays||r.estimatedDays||r.transitDays||'?';
      console.log(i+'|'+service+' ('+carrier+')'+'|'+price+'|'+carrier+'|'+days);
    });
    console.log('COUNT:'+rates.length);
  } catch(e){console.log('ERR:'+e.message);}
});"
}

print_easyship_rates() {
  local raw="$1"
  echo "$raw" | node -e "
const c=[];process.stdin.on('data',d=>c.push(d));
process.stdin.on('end',()=>{
  try {
    const r=JSON.parse(Buffer.concat(c).toString());
    const rates=r.data||r.rates||r||[];
    const arr=Array.isArray(rates)?rates:(rates.rates||[]);
    if(!arr.length){
      const msg=r.message||r.error||'no rates';
      console.log('NONE:'+msg.substring(0,120));
      return;
    }
    arr.sort((a,b)=>(a.totalCharge||a.price||a.rate||0)-(b.totalCharge||b.price||b.rate||0));
    arr.slice(0,6).forEach((r,i)=>{
      const price=Number(r.totalCharge||r.minRate||r.price||r.rate||0).toFixed(2);
      const carrier=r.courierName||r.carrier||r.courier_name||'?';
      const service=r.courierServiceName||r.service||r.service_name||carrier;
      const days=r.transitTime||r.deliveryDays||r.min_delivery_time||'?';
      console.log(i+'|'+service+'|'+price+'|'+carrier+'|'+days);
    });
    console.log('COUNT:'+arr.length);
  } catch(e){console.log('ERR:'+e.message);}
});"
}

print_sendcloud_rates() {
  local raw="$1"
  echo "$raw" | node -e "
const c=[];process.stdin.on('data',d=>c.push(d));
process.stdin.on('end',()=>{
  try {
    const r=JSON.parse(Buffer.concat(c).toString());
    const rates=r.data||r.rates||r||[];
    const arr=Array.isArray(rates)?rates:(rates.shippingMethods||rates.shipping_methods||[]);
    if(!arr.length){
      const msg=r.message||r.error||'no rates';
      console.log('NONE:'+msg.substring(0,120));
      return;
    }
    arr.sort((a,b)=>(a.price||a.rate||0)-(b.price||b.rate||0));
    arr.slice(0,6).forEach((r,i)=>{
      const price=Number(r.price||r.rate||0).toFixed(2);
      const carrier=r.carrier||r.carrierCode||r.carrier_code||'SendCloud';
      const service=r.name||r.serviceName||carrier;
      const days=r.leadTimeHours?Math.ceil(r.leadTimeHours/24):(r.deliveryDays||'?');
      console.log(i+'|'+service+'|'+price+'|'+carrier+'|'+days);
    });
    console.log('COUNT:'+arr.length);
  } catch(e){console.log('ERR:'+e.message);}
});"
}

print_cascade_rates() {
  local raw="$1"
  echo "$raw" | node -e "
const c=[];process.stdin.on('data',d=>c.push(d));
process.stdin.on('end',()=>{
  try {
    const r=JSON.parse(Buffer.concat(c).toString());
    const d=r.data||r;
    const opts=d.shippingOptions||[];
    if(!opts.length){console.log('NONE:'+(r.message||'no options'));return;}
    console.log('SUBTOTAL:\$'+d.subtotal+' TAX:\$'+((d.tax&&d.tax.amount)||0)+' TOTAL:\$'+d.total);
    opts.forEach((o,i)=>{
      const free=o.price===0?' ← FREE':'';
      console.log(i+'|'+o.name+'|'+Number(o.price).toFixed(2)+'|'+(o.carrier||'Standard')+'|'+(o.estimatedDays||'?')+'|'+free);
    });
    console.log('COUNT:'+opts.length);
  } catch(e){console.log('ERR:'+e.message);}
});"
}

display_rates() {
  # $1 = label, $2 = parsed output lines
  local label="$1"; shift; local lines="$@"
  local count=$(echo "$lines" | grep "^COUNT:" | cut -d: -f2)
  local none=$(echo "$lines" | grep "^NONE:")
  local err=$(echo "$lines" | grep "^ERR:")

  if [ -n "$err" ]; then
    echo -e "    ${R}Parse error:${NC} $(echo $err | sed 's/ERR://')"
    return 1
  elif [ -n "$none" ]; then
    echo -e "    ${Y}No rates:${NC} $(echo $none | sed 's/NONE://')"
    return 1
  fi

  local subtotal_line=$(echo "$lines" | grep "^SUBTOTAL:")
  [ -n "$subtotal_line" ] && echo -e "    ${DIM}$subtotal_line${NC}"

  echo "$lines" | grep -v "^COUNT:\|^NONE:\|^ERR:\|^SUBTOTAL:" | while IFS='|' read idx name price carrier days extra; do
    local free_marker=""
    [ -n "$extra" ] && free_marker="${G}${extra}${NC}"
    printf "    ${DIM}[%s]${NC} %-34s ${BOLD}%8s${NC}  %-22s  ~%s days%b\n" \
      "$((idx+1))" "$name" "\$$price" "$carrier" "$days" "$free_marker"
  done

  echo -e "    ${DIM}Total: ${count} rate(s)${NC}"
  return 0
}

# ════════════════════════════════════════════════════════════════
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║    NEXTPIK SHIPPING CASCADE — PER-PROVIDER RATE VISIBILITY   ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo -e "  Token: ${TOKEN:0:30}...  (SELLER role)"
echo -e "  US addr: $US_ADDR_ID  |  EU: $EU_ADDR_ID  |  AU: $AU_ADDR_ID"

# ════════════════════════════════════════════════════════════════
box "SCENARIO 1 │ US → US shipment — all providers on"
show_settings
set_bool easypost_enabled true; set_bool easyship_enabled true
set_bool sendcloud_enabled true; set_bool dhl_enabled false
set_bool free_shipping_enabled false
db "UPDATE system_settings SET value='200' WHERE key='free_shipping_threshold';" > /dev/null

sep2
provider_header "EasyPost  (Tier 2 · Primary global · 100+ carriers)  US→US"
EP1=$(call_easypost "Los Angeles" "CA" "90001" "US" 16)
PARSED=$(print_easypost_rates "$EP1")
display_rates "easypost" "$PARSED"
if echo "$PARSED" | grep -q "^COUNT:"; then
  COUNT=$(echo "$PARSED" | grep "^COUNT:" | cut -d: -f2)
  [ "$COUNT" -gt 0 ] && log_pass "EasyPost returned $COUNT live carrier rates" || log_warn "EasyPost returned 0 rates (test mode)"
else log_warn "EasyPost unavailable"; fi

sep
provider_header "EasyShip  (Tier 3 · APAC regional · 10 countries)  US→US"
ES1=$(call_easyship "US" "US" 0.5)
PARSED=$(print_easyship_rates "$ES1")
display_rates "easyship" "$PARSED"
if echo "$PARSED" | grep -q "^COUNT:"; then
  COUNT=$(echo "$PARSED" | grep "^COUNT:" | cut -d: -f2)
  [ "$COUNT" -gt 0 ] && log_pass "EasyShip returned $COUNT rates" || log_warn "EasyShip returned 0 rates"
else log_warn "EasyShip unavailable ($(echo $ES1 | head -c 80))"; fi

sep
provider_header "SendCloud (Tier 1 · EU only · 13 countries)  US→US"
log_info "SendCloud only supports EU origin — US→US will be rejected by design"
SC1=$(call_sendcloud "US" "US" 500)
PARSED=$(print_sendcloud_rates "$SC1")
display_rates "sendcloud" "$PARSED"
log_info "Expected: rejected (US not an EU origin country)"

sep
provider_header "Manual/Zone rates  (final fallback — always available)"
log_info "Shown via cascade with all real providers disabled"
set_bool easypost_enabled false; set_bool easyship_enabled false; set_bool sendcloud_enabled false
MAN1=$(call_cascade "$US_ADDR_ID" "$CHEAP_PRODUCT")
PARSED=$(print_cascade_rates "$MAN1")
display_rates "manual" "$PARSED"
if echo "$PARSED" | grep -q "^COUNT:"; then
  COUNT=$(echo "$PARSED" | grep "^COUNT:" | cut -d: -f2)
  [ "$COUNT" -gt 0 ] && log_pass "Manual/Zone fallback returned $COUNT rates" || log_fail "Manual fallback returned 0 rates"
else log_fail "Manual fallback failed"; fi

sep2
provider_header "CASCADE WINNER — all providers enabled — US→US"
set_bool easypost_enabled true; set_bool easyship_enabled true; set_bool sendcloud_enabled true
CASC1=$(call_cascade "$US_ADDR_ID" "$CHEAP_PRODUCT")
PARSED=$(print_cascade_rates "$CASC1")
display_rates "cascade" "$PARSED"
if echo "$PARSED" | grep -q "^COUNT:"; then
  COUNT=$(echo "$PARSED" | grep "^COUNT:" | cut -d: -f2)
  [ "$COUNT" -gt 0 ] && log_pass "Cascade returned $COUNT option(s) to customer" || log_fail "Cascade returned nothing"
else log_fail "Cascade failed"; fi

# ════════════════════════════════════════════════════════════════
box "SCENARIO 2 │ US → EU (Paris FR) — per provider rates"
show_settings

sep2
provider_header "EasyPost  →  France"
EP2=$(call_easypost "Paris" "" "75001" "FR" 16)
PARSED=$(print_easypost_rates "$EP2")
display_rates "easypost" "$PARSED"
echo "$PARSED" | grep -q "^COUNT:" && { COUNT=$(echo "$PARSED"|grep "^COUNT:"|cut -d: -f2); [ "$COUNT" -gt 0 ] && log_pass "EasyPost $COUNT rates for France" || log_warn "EasyPost 0 rates for France"; } || log_warn "EasyPost error"

sep
provider_header "EasyShip  →  France (FR supported origin only)"
log_info "EasyShip supports shipping FROM: AU,BE,CA,FR,DE,HK,NL,SG,US,GB — shipping TO FR from US"
ES2=$(call_easyship "US" "FR" 0.5)
PARSED=$(print_easyship_rates "$ES2")
display_rates "easyship" "$PARSED"
echo "$PARSED" | grep -q "^COUNT:" && { COUNT=$(echo "$PARSED"|grep "^COUNT:"|cut -d: -f2); [ "$COUNT" -gt 0 ] && log_pass "EasyShip $COUNT rates US→FR" || log_warn "EasyShip 0 rates US→FR"; } || log_warn "EasyShip error"

sep
provider_header "SendCloud →  France (FROM France, TO France — EU domestic)"
log_info "SendCloud requires EU origin — testing FR→FR (EU domestic)"
SC2=$(call_sendcloud "FR" "FR" 500)
PARSED=$(print_sendcloud_rates "$SC2")
display_rates "sendcloud" "$PARSED"
echo "$PARSED" | grep -q "^COUNT:" && { COUNT=$(echo "$PARSED"|grep "^COUNT:"|cut -d: -f2); [ "$COUNT" -gt 0 ] && log_pass "SendCloud $COUNT rates FR→FR" || log_warn "SendCloud 0 rates (may need live account)"; } || log_warn "SendCloud unavailable"

sep
provider_header "SendCloud →  Germany (FROM France, TO Germany — EU cross-border)"
SC2b=$(call_sendcloud "FR" "DE" 500)
PARSED=$(print_sendcloud_rates "$SC2b")
display_rates "sendcloud" "$PARSED"
echo "$PARSED" | grep -q "^COUNT:" && { COUNT=$(echo "$PARSED"|grep "^COUNT:"|cut -d: -f2); [ "$COUNT" -gt 0 ] && log_pass "SendCloud $COUNT rates FR→DE" || log_warn "SendCloud 0 rates FR→DE"; } || log_warn "SendCloud unavailable"

sep2
provider_header "CASCADE WINNER — US→EU (Paris)"
CASC2=$(call_cascade "$EU_ADDR_ID" "$CHEAP_PRODUCT")
PARSED=$(print_cascade_rates "$CASC2")
display_rates "cascade" "$PARSED"
echo "$PARSED" | grep -q "^COUNT:" && { COUNT=$(echo "$PARSED"|grep "^COUNT:"|cut -d: -f2); [ "$COUNT" -gt 0 ] && log_pass "Cascade $COUNT option(s) for EU destination" || log_fail "Cascade 0 options for EU"; } || log_fail "Cascade failed"

# ════════════════════════════════════════════════════════════════
box "SCENARIO 3 │ US → APAC (Melbourne AU) — per provider rates"
show_settings

sep2
provider_header "EasyPost  →  Australia"
EP3=$(call_easypost "Melbourne" "VIC" "3000" "AU" 16)
PARSED=$(print_easypost_rates "$EP3")
display_rates "easypost" "$PARSED"
echo "$PARSED" | grep -q "^COUNT:" && { COUNT=$(echo "$PARSED"|grep "^COUNT:"|cut -d: -f2); [ "$COUNT" -gt 0 ] && log_pass "EasyPost $COUNT rates for AU" || log_warn "EasyPost 0 rates for AU"; } || log_warn "EasyPost error"

sep
provider_header "EasyShip  →  Australia (US→AU)"
ES3=$(call_easyship "US" "AU" 0.5)
PARSED=$(print_easyship_rates "$ES3")
display_rates "easyship" "$PARSED"
echo "$PARSED" | grep -q "^COUNT:" && { COUNT=$(echo "$PARSED"|grep "^COUNT:"|cut -d: -f2); [ "$COUNT" -gt 0 ] && log_pass "EasyShip $COUNT rates US→AU" || log_warn "EasyShip 0 rates US→AU"; } || log_warn "EasyShip error"

sep2
provider_header "CASCADE WINNER — US→AU (Melbourne)"
CASC3=$(call_cascade "$AU_ADDR_ID" "$CHEAP_PRODUCT")
PARSED=$(print_cascade_rates "$CASC3")
display_rates "cascade" "$PARSED"
echo "$PARSED" | grep -q "^COUNT:" && { COUNT=$(echo "$PARSED"|grep "^COUNT:"|cut -d: -f2); [ "$COUNT" -gt 0 ] && log_pass "Cascade $COUNT option(s) for AU destination" || log_fail "Cascade 0 options for AU"; } || log_fail "Cascade failed"

# ════════════════════════════════════════════════════════════════
box "SCENARIO 4 │ Free shipping — EasyPost rates with \$12,500 order"
set_bool free_shipping_enabled true
db "UPDATE system_settings SET value='200' WHERE key='free_shipping_threshold';" > /dev/null
show_settings

sep2
provider_header "CASCADE — \$12,500 order (above \$200 free threshold)"
CASC4=$(call_cascade "$US_ADDR_ID" "$EXPENSIVE_PRODUCT")
PARSED=$(print_cascade_rates "$CASC4")
display_rates "cascade" "$PARSED"
echo "$PARSED" | grep -q "^COUNT:" && {
  COUNT=$(echo "$PARSED"|grep "^COUNT:"|cut -d: -f2)
  HAS_FREE=$(echo "$PARSED" | grep "← FREE" | wc -l | tr -d ' ')
  if [ "$COUNT" -gt 0 ] && [ "$HAS_FREE" -gt 0 ]; then
    log_pass "Free shipping correctly applied — \$0 option present ($HAS_FREE free option(s) of $COUNT)"
  elif [ "$COUNT" -gt 0 ]; then
    log_warn "Got $COUNT rates but none are free (threshold may not be applied by provider)"
  else
    log_fail "0 rates returned"
  fi
} || log_fail "Cascade failed"

sep
provider_header "CASCADE — \$16 order (below \$200 free threshold)"
set_bool free_shipping_enabled true
CASC4b=$(call_cascade "$US_ADDR_ID" "$CHEAP_PRODUCT")
PARSED=$(print_cascade_rates "$CASC4b")
display_rates "cascade" "$PARSED"
echo "$PARSED" | grep -q "^COUNT:" && {
  COUNT=$(echo "$PARSED"|grep "^COUNT:"|cut -d: -f2)
  HAS_FREE=$(echo "$PARSED" | grep "← FREE" | wc -l | tr -d ' ')
  if [ "$COUNT" -gt 0 ] && [ "$HAS_FREE" -eq 0 ]; then
    log_pass "Correct — \$16 below \$200 threshold, no free options"
  elif [ "$HAS_FREE" -gt 0 ]; then
    log_fail "BUG — \$16 order shows free shipping (threshold not enforced)"
  else
    log_fail "0 rates returned"
  fi
} || log_fail "Cascade failed"

# ════════════════════════════════════════════════════════════════
box "SCENARIO 5 │ Cascade fallthrough — disable one tier at a time"

sep2
provider_header "Step 1: All ON  →  EasyPost should win (Tier 2)"
set_bool easypost_enabled true; set_bool easyship_enabled true
set_bool sendcloud_enabled true; set_bool free_shipping_enabled false
db "UPDATE system_settings SET value='200' WHERE key='free_shipping_threshold';" > /dev/null
show_settings
CASC5a=$(call_cascade "$US_ADDR_ID" "$CHEAP_PRODUCT")
PARSED=$(print_cascade_rates "$CASC5a")
display_rates "cascade" "$PARSED"
echo "$PARSED" | grep -q "^COUNT:" && { COUNT=$(echo "$PARSED"|grep "^COUNT:"|cut -d: -f2); [ "$COUNT" -gt 0 ] && log_pass "All ON → $COUNT options" || log_warn "Got 0 options"; } || log_fail "Failed"

sep
provider_header "Step 2: EasyPost OFF  →  EasyShip/Manual should take over"
set_bool easypost_enabled false
show_settings
CASC5b=$(call_cascade "$US_ADDR_ID" "$CHEAP_PRODUCT")
PARSED=$(print_cascade_rates "$CASC5b")
display_rates "cascade" "$PARSED"
echo "$PARSED" | grep -q "^COUNT:" && { COUNT=$(echo "$PARSED"|grep "^COUNT:"|cut -d: -f2); [ "$COUNT" -gt 0 ] && log_pass "EasyPost OFF → fallthrough OK, $COUNT options" || log_fail "Fallthrough gave 0 options"; } || log_fail "Failed"

sep
provider_header "Step 3: EasyPost + EasyShip OFF  →  Manual/Zone rates"
set_bool easypost_enabled false; set_bool easyship_enabled false
show_settings
CASC5c=$(call_cascade "$US_ADDR_ID" "$CHEAP_PRODUCT")
PARSED=$(print_cascade_rates "$CASC5c")
display_rates "cascade" "$PARSED"
echo "$PARSED" | grep -q "^COUNT:" && { COUNT=$(echo "$PARSED"|grep "^COUNT:"|cut -d: -f2); [ "$COUNT" -gt 0 ] && log_pass "Both OFF → Manual/Zone rates, $COUNT options" || log_fail "Manual fallback gave 0"; } || log_fail "Failed"

sep
provider_header "Step 4: ALL OFF  →  Hardcoded safety net"
set_bool easypost_enabled false; set_bool easyship_enabled false
set_bool sendcloud_enabled false
show_settings
CASC5d=$(call_cascade "$US_ADDR_ID" "$CHEAP_PRODUCT")
PARSED=$(print_cascade_rates "$CASC5d")
display_rates "cascade" "$PARSED"
echo "$PARSED" | grep -q "^COUNT:" && { COUNT=$(echo "$PARSED"|grep "^COUNT:"|cut -d: -f2); [ "$COUNT" -gt 0 ] && log_pass "ALL OFF → Safety net fires, $COUNT hardcoded options" || log_fail "Safety net returned 0 — checkout is broken"; } || log_fail "Safety net failed"

# ════════════════════════════════════════════════════════════════
# Restore
restore
echo ""
sep2

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                       FINAL RESULTS                         ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════════╣${NC}"
TOTAL=$((PASS+FAIL+WARN))
printf "${BOLD}║  ${G}✅ PASS: %-3s${NC}${BOLD}   ${R}❌ FAIL: %-3s${NC}${BOLD}   ${Y}⚠️  WARN: %-3s${NC}${BOLD}   Total: %s   ║\n" "$PASS" "$FAIL" "$WARN" "$TOTAL"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo -e "${G}${BOLD}All cascade tests passed.${NC}"
  exit 0
else
  echo -e "${R}${BOLD}$FAIL failure(s) — see above.${NC}"
  exit 1
fi
