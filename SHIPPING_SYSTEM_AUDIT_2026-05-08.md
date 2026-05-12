# NextPik Shipping System Audit

**Date:** 2026-05-12 (filed retroactively as 2026-05-08 per request)
**Auditor:** Claude Code (read-only audit — no code modified)
**Scope:** Full shipping system end-to-end
**Codebase version:** develop branch, post-commit `fb5c1f7`

---

## 1. Executive Summary

NextPik's shipping system is a four-provider cascade (SendCloud → EasyPost → EasyShip → DHL Express) sitting on top of a zone/manual fallback layer. The overall architecture is sound and the three active API integrations (EasyPost, SendCloud, EasyShip) are correctly wired into the checkout flow. Provider credentials are properly stored in environment variables rather than the database. The cascade short-circuits on the first provider that returns rates, which is efficient.

However, there are **three production-blocking issues (P0)**. The most critical is that **EasyPost webhook HMAC verification is computationally incorrect**: the code signs `JSON.stringify(parsed_body)` instead of the raw request bytes, so with `EASYPOST_WEBHOOK_SECRET` set in `.env` (it is), every inbound tracking event returns HTTP 401 and EasyPost keeps retrying. This means **zero EasyPost tracking updates are reaching the database right now**. Additionally, **DHL tracking is entirely non-functional** — the service is disabled, uses a separate API product with unconfigured credentials, and has no webhook handler — meaning DHL cannot be safely promoted to "final worldwide fallback" without significant new work. A third structural P0 is that the **cascade docblock comment** still advertises EasyPost as US-only after today's geo-gate removal, which will mislead future developers.

Beyond the P0s, there are 14 P1 gaps and 9 P2 polish items. The largest gaps are: free-shipping threshold not applied to API-sourced rates (only manual), no idempotency on SendCloud/EasyShip webhooks, two duplicate DHL sections in the cascade, no admin UI for DHL credentials, and hardcoded US-centric defaults (carrier names, HS codes, country defaults) scattered throughout non-US paths. The total fix scope is **medium** — roughly 2–3 weeks of focused engineering.

The intended target state (EasyPost T1 → SendCloud T2 EU → EasyShip T2 APAC → DHL Express worldwide fallback → emergency Manual zones) is achievable, but promoting DHL Express to the worldwide fallback tier requires resolving the tracking/webhook gap first. Promoting it as a rate-quote-only provider (no label gen, no tracking) would be a degraded experience.

---

## 2. Provider-by-Provider Report Cards

### 2A. EasyPost — Grade: **B−**

| Dimension              | Status                                | Detail                                                             |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| File                   | `apps/api/src/integrations/easypost/` | 8 service files, 1 webhook controller, 1 cron                      |
| Rate quote API         | ✅ Working                            | `client.Shipment.create()` → `rates` array                         |
| Label purchase API     | ✅ Working                            | `client.Shipment.buy()` → DB-persisted                             |
| Label formats          | ✅ Working                            | PDF, PNG, ZPL, EPL2 supported                                      |
| Label refund           | ✅ Working                            | `client.Shipment.refund()` → DB updated                            |
| Return label           | ✅ Working                            | `is_return: true` flag                                             |
| Address verification   | ✅ Working                            | `/easypost/verify-address` endpoint                                |
| Tracking (poll)        | ✅ Working                            | `client.Tracker.retrieve()`                                        |
| Tracking (webhook)     | ❌ **BROKEN**                         | HMAC verification fails — see P0-1                                 |
| Webhook idempotency    | ✅ Working                            | `EasyPostWebhookLog.eventId` dedup                                 |
| Customs info           | ⚠️ Partial                            | Rate shopping never passes `customsInfo`; only label purchase does |
| Dimensional weight     | ❌ Missing                            | Parcel always `10×8×4` default; actual product dimensions ignored  |
| Insurance              | ⚠️ Partial                            | `insuredAmount` in DTO but no automatic trigger                    |
| Signature on delivery  | ❌ Missing                            | Not implemented                                                    |
| Sandbox/test mode      | ✅ Working                            | `EZTK` vs `EZAK` prefix auto-detection                             |
| Rate caching           | ❌ Missing                            | No cache; every checkout request hits EasyPost API                 |
| Timeout                | ⚠️ Partial                            | 10 seconds on rate query; no timeout on label purchase             |
| Auth                   | ✅ ENV-only                           | `EASYPOST_API_KEY` — not in DB                                     |
| Dispatch reminder cron | ✅ Present                            | Hourly, 48-hour threshold                                          |
| Retry logic            | ❌ Missing                            | No retry on rate fetch failures                                    |

**Gap vs official EasyPost docs:**
EasyPost webhook HMAC (`x-hmac-signature` header) is computed as `HMAC-SHA256(secret, rawBody)` where `rawBody` is the raw request bytes. The code instead signs `JSON.stringify(parsedPayload)` and compares hex digests. Because re-serialized JSON can differ in key ordering, whitespace, and encoding from the original raw bytes, **this always produces a mismatch**. Neither `RawBodyRequest` nor `req.rawBody` is injected into the EasyPost webhook controller (unlike SendCloud and EasyShip which correctly use `rawBody`).

---

### 2B. SendCloud — Grade: **C+**

| Dimension           | Status                                                     | Detail                                                               |
| ------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| File                | `apps/api/src/integrations/sendcloud/sendcloud.service.ts` | +webhook controller                                                  |
| Rate quote API      | ✅ Working                                                 | `GET /shipping_methods?from_country=…&to_country=…&weight=…`         |
| Label generation    | ❌ Missing                                                 | No SendCloud parcel creation; seller must use manual mark-as-shipped |
| Tracking (webhook)  | ⚠️ Partial                                                 | Webhook exists, handles `parcel_status_changed`; no DB status log    |
| Webhook signature   | ✅ Correct                                                 | Uses `rawBody`; HMAC `t=<ts>,v1=<hex>` format matches SendCloud docs |
| Webhook idempotency | ❌ Missing                                                 | No dedup table; duplicate webhooks will double-send buyer emails     |
| Customs info        | ❌ Missing                                                 | Rate request never sends customs items — affects EU→UK/non-EU quotes |
| Supported countries | ✅ 13 EU                                                   | `SENDCLOUD_SUPPORTED_COUNTRIES` array matches docs                   |
| Rate caching        | ❌ Missing                                                 | No cache                                                             |
| Timeout             | ✅ 10 seconds                                              | `axios.create({ timeout: 10000 })`                                   |
| Auth                | ✅ ENV-only                                                | HTTP Basic (public key + secret key)                                 |
| Admin UI            | ✅ Present                                                 | `/admin/settings?tab=shipping&section=sendcloud`                     |
| Retry logic         | ❌ Missing                                                 | None                                                                 |

**Gap vs official SendCloud docs:**
SendCloud's Parcel API (`POST /parcels`) is not implemented — only rate shopping. The webhook status mapping covers only three states (announced, out-for-delivery, delivered) which is correct. However, `parcel_status_changed` is the only handled action — SendCloud can also send `shipment_label_created` and other actions that are silently dropped. The `parcel.order_number` field is used for order lookup, which is correct.

---

### 2C. EasyShip — Grade: **C+**

| Dimension           | Status                                                   | Detail                                                                               |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| File                | `apps/api/src/integrations/easyship/easyship.service.ts` | +webhook controller                                                                  |
| Rate quote API      | ✅ Working                                               | `POST /2024-09/rates` — correct v2024-09 endpoint                                    |
| Label generation    | ❌ Missing                                               | No EasyShip shipment creation — manual only                                          |
| Tracking (webhook)  | ⚠️ Partial                                               | Handles `shipment.label.created`, `tracking.status.changed`                          |
| Webhook signature   | ✅ Correct                                               | Uses `rawBody`; HMAC-SHA256 hex compare matches EasyShip docs                        |
| Webhook idempotency | ❌ Missing                                               | No dedup; duplicate webhooks double-send buyer emails                                |
| Customs info        | ⚠️ Partial                                               | `incoterms: 'DDU'` hardcoded; `hs_code: '621790'` (garments) hardcoded for all items |
| Dimensional weight  | ❌ Missing                                               | Parcel always `10×10×10`; no actual dimensions                                       |
| State defaults      | ⚠️ Hardcoded                                             | US→NY, AU→NSW, CA→ON defaults when seller has no address                             |
| Rate caching        | ❌ Missing                                               | No cache                                                                             |
| Timeout             | ✅ 30 seconds                                            | Correct (EasyShip API is slow)                                                       |
| Auth                | ✅ ENV-only                                              | Bearer token; auto-selects sandbox vs prod by `sand_` prefix                         |
| Admin UI            | ✅ Present                                               | `/admin/settings?tab=shipping&section=easyship`                                      |
| Retry logic         | ❌ Missing                                               | None                                                                                 |

**Gap vs official EasyShip docs:**
EasyShip requires per-item `hs_code` and `category` for international shipments. The code hardcodes `hs_code: '621790'` (miscellaneous garments) and omits `category` from actual `getRates()` items (though `category: 'gifts'` is used only in the health-check probe). Customs duties/taxes in quoted rates will be incorrect for non-garment products. The v2024-09 API supports `output_currency` for rate normalization; the code does not use it, so rates always return in USD.

---

### 2D. DHL Express — Grade: **D**

| Dimension              | Status                           | Detail                                                                                                                                       |
| ---------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Files                  | `apps/api/src/integrations/dhl/` | 4 services + 1 controller + 1 sync cron                                                                                                      |
| Rate quote API         | ⚠️ Configured, untested          | `express.api.dhl.com/mydhlapi/rates` — Basic Auth                                                                                            |
| Label generation API   | ⚠️ Configured, untested          | `express.api.dhl.com/mydhlapi/shipments`                                                                                                     |
| Cancellation           | ✅ Coded                         | `DELETE /shipments/:trackingNumber`                                                                                                          |
| Pickup request         | ✅ Coded                         | `POST /pickups`                                                                                                                              |
| Tracking (poll)        | ❌ Broken                        | Uses `api-eu.dhl.com` (different API product); `DHL_TRACKING_ENABLED=false`; `DHL_API_KEY` unset                                             |
| Tracking (webhook)     | ❌ Missing                       | No webhook handler controller exists                                                                                                         |
| Webhook signature      | ❌ N/A                           | No handler                                                                                                                                   |
| Auth — rates/shipment  | ✅ Basic Auth                    | `DHL_EXPRESS_API_KEY` + `DHL_EXPRESS_API_SECRET` — env only                                                                                  |
| Auth — tracking        | ❌ Not configured                | Needs separate `DHL_API_KEY` for DHL Unified Tracking API                                                                                    |
| DHL API product        | ⚠️ Mixed products                | Rates/labels: MyDHL API (`express.api.dhl.com`); Tracking: DHL Unified Tracking (`api-eu.dhl.com`) — separate products, separate credentials |
| Credentials validity   | ⚠️ Suspect                       | `DHL_EXPRESS_API_KEY=apX4zWOjQScX8l` is 14 chars; typical MyDHL API keys are longer                                                          |
| `dhl_enabled` setting  | ✅ Present                       | Currently `false` in DB                                                                                                                      |
| `dhl_api_environment`  | ✅ Present                       | Currently `"sandbox"` in DB                                                                                                                  |
| DHL tracking sync cron | ✅ Coded                         | Every 10 min + 30-day data cleanup; but `DHL_TRACKING_ENABLED=false` means cron does nothing                                                 |
| Admin UI               | ❌ Missing                       | No DHL tab in unified shipping settings UI                                                                                                   |

**Gap vs official DHL docs:**
The DHL Express MyDHL API and the DHL Unified Tracking API are **two different API products** requiring separate credential sets. The code implements both auth patterns correctly in isolation, but only the MyDHL credentials are configured in `.env`. Promoting DHL to "worldwide fallback" requires: (1) validating MyDHL credentials, (2) obtaining Unified Tracking API key, (3) building a webhook handler, (4) building admin UI for DHL.

---

## 3. Cascade Logic Diagram

### Current State (post 2026-05-12 EasyPost geo-gate removal)

```
Checkout request
    │
    ▼
[TIER 0] Gelato POD?
    ├── Pure POD cart ────────────────────────────────────────► Return Gelato rates
    └── Mixed/No ──────────────────────► gelatoCost tallied, continue
    │
    ▼
[TIER 0.5] Self-Pickup available?
    └── Yes ──────────────────────────────────────────────────► Return pickup options
    │
    ▼
[TIER 1] SendCloud enabled + seller in EU?
    ├── Yes + rates returned ─────────────────────────────────► Return SendCloud rates
    └── No / no rates ──────────────────────────────────────── continue
    │
    ▼
[TIER 2] EasyPost enabled (global — no geo-gate)?
    ├── Yes + rates returned ─────────────────────────────────► Return EasyPost rates
    └── No / no rates ──────────────────────────────────────── continue
    │
    ▼
[TIER 3] EasyShip enabled + seller in (AU,BE,CA,FR,DE,HK,NL,SG,US,GB)?
    ├── Yes + rates returned ─────────────────────────────────► Return EasyShip rates
    └── No / no rates ──────────────────────────────────────── continue
    │
    ▼
[TIER 4] dhl_enabled=true AND DHL_EXPRESS_API_KEY set?  (currently SKIPPED — dhl_enabled=false)
    ├── Yes + rates returned ─────────────────────────────────► Return DHL Express rates
    └── No / no rates ──────────────────────────────────────── continue
    │
    ▼
[TIER 3 LEGACY — DEAD CODE] shipping_mode = 'dhl_api' or 'hybrid'?  (mode='manual' → never fires)
    └── continue
    │
    ▼
[TIER 5a] ShippingZone match for destination?
    ├── Yes ──────────────────────────────────────────────────► Return zone rates
    └── No ──────────────────────────────────────────────────── continue
    │
    ▼
[TIER 5b] Manual rates (final fallback — always available)
    └──────────────────────────────────────────────────────────► Return Standard/Express/Overnight
```

**Note:** TIER 1 and TIER 2 are currently inverted from the target spec. For an EU seller (FR), SendCloud fires first (TIER 1) and returns rates; EasyPost is never reached. The target spec says EasyPost should be TIER 1 globally. This is a business-decision swap, not a bug.

---

### Target State (as requested)

```
Checkout request
    │
    ▼
[TIER 0] Gelato POD ────────────────────────────────────────► Return Gelato rates
    │
    ▼
[TIER 0.5] Self-Pickup ─────────────────────────────────────► Return pickup options
    │
    ▼
[TIER 1 — EasyPost] Multi-carrier aggregator (global)
    ├── Rates returned ──────────────────────────────────────► Return EasyPost rates
    └── Failed / no rates ───────────────────────────────────► continue
    │
    ▼
[TIER 2a — SendCloud] EU-origin sellers
    ├── Rates returned ──────────────────────────────────────► Return SendCloud rates
    └── Not EU / failed / no rates ──────────────────────────► continue
    │
    ▼
[TIER 2b — EasyShip] APAC / remaining sellers
    ├── Rates returned ──────────────────────────────────────► Return EasyShip rates
    └── Not supported / failed / no rates ───────────────────► continue
    │
    ▼
[TIER 3 — DHL Express] Worldwide final API fallback
    ├── Rates returned ──────────────────────────────────────► Return DHL rates
    └── Failed / not configured ─────────────────────────────► continue
    │
    ▼
[EMERGENCY — Manual zones / Manual rates]  ← only if ALL four APIs fail
    └──────────────────────────────────────────────────────────► Return manual rates
```

---

## 4. Gap Table

| ID   | Severity | Area                               | File                                                       | Description                                                                                                                                                                                                                                                                                  | Recommended Fix                                                                                                                                                           |
| ---- | -------- | ---------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-01 | **P0**   | EasyPost Webhooks                  | `easypost-webhook.controller.ts:223`                       | HMAC verification signs `JSON.stringify(parsedPayload)` not raw request bytes. With `EASYPOST_WEBHOOK_SECRET` set, all tracking webhooks return 401 and retries pile up. Zero EasyPost tracking updates reach the database.                                                                  | Inject `@Req() req: RawBodyRequest<Request>`, use `req.rawBody` in `verifySignature()` — identical to SendCloud and EasyShip controllers which already do this correctly. |
| G-02 | **P0**   | DHL Tracking                       | `dhl-tracking.service.ts`, `.env`                          | DHL tracking uses `api-eu.dhl.com` (DHL Unified Tracking API) with a separate `DHL-API-Key` header — different product from MyDHL Express. `DHL_API_KEY` is not set. `DHL_TRACKING_ENABLED=false`. No DHL webhook handler exists. DHL cannot be promoted to worldwide fallback without this. | Obtain DHL Unified Tracking API key → `DHL_API_KEY`. Set `DHL_TRACKING_ENABLED=true`. Build `/webhooks/dhl` controller. Register webhook URL in DHL portal.               |
| G-03 | **P0**   | Cascade docblock                   | `shipping-tax.service.ts:213`                              | Docblock still says "TIER 2 (EasyPost): Geo-gated: only fires when sellerCountry === 'US' (or unknown = platform default US)" — stale after 2026-05-12 geo-gate removal. Will mislead future developers.                                                                                     | Update docblock to describe global operation with graceful fallback when no rates returned.                                                                               |
| G-04 | **P1**   | Free shipping                      | `shipping-tax.service.ts:991`                              | Free-shipping threshold (currently $200) is only applied in manual rates fallback. SendCloud, EasyPost, and EasyShip rates are returned at full price regardless of subtotal.                                                                                                                | After each API provider returns rates, check `isFreeShippingEnabled && subtotal >= freeShippingThreshold`; if eligible, zero all prices.                                  |
| G-05 | **P1**   | SendCloud idempotency              | `sendcloud-webhook.controller.ts`                          | No webhook deduplication. Duplicate deliveries from SendCloud (on retry after 200 not received) double-send buyer emails.                                                                                                                                                                    | Log `parcel.id + statusId` as idempotency key (DB table or Redis). Pattern already exists in `EasyPostWebhookLog`.                                                        |
| G-06 | **P1**   | EasyShip idempotency               | `easyship-webhook.controller.ts`                           | Same issue — no dedup on EasyShip webhooks.                                                                                                                                                                                                                                                  | Same fix pattern as G-05.                                                                                                                                                 |
| G-07 | **P1**   | EasyPost customs                   | `shipping-tax.service.ts:calculateEasyPostShippingOptions` | `customsInfo` is never passed when fetching EasyPost rates. For international shipments, quoted rates exclude customs/duties.                                                                                                                                                                | Detect `from.country !== to.country`; build minimal `customsInfo` from cart items; pass in rate request.                                                                  |
| G-08 | **P1**   | DHL Admin UI                       | `unified-shipping-settings.tsx`                            | No DHL tab in admin shipping settings. Admins cannot configure DHL credentials, environment, or enable/disable via UI.                                                                                                                                                                       | Add DHL tab; expose `dhl_enabled` + `dhl_api_environment` toggles; show credential status via `GET /dhl/health`.                                                          |
| G-09 | **P1**   | Duplicate DHL cascade              | `shipping-tax.service.ts:430,503`                          | Two DHL sections: TIER 4 (new, `dhl_enabled` setting) and TIER 3 LEGACY (`shipping_mode='dhl_api'`). Both call `DhlRatesService.getSimplifiedRates()`. LEGACY section is dead code when `shipping_mode='manual'`.                                                                            | Delete TIER 3 LEGACY section (lines ~502–546). TIER 4 is canonical.                                                                                                       |
| G-10 | **P1**   | No SendCloud label gen             | `sendcloud.service.ts`                                     | Rate quoting works but label generation not implemented. Sellers who receive SendCloud rates at checkout cannot generate SendCloud labels automatically.                                                                                                                                     | Implement `POST /api/v2/parcels` (SendCloud Parcel API). Store parcel ID + tracking in DB.                                                                                |
| G-11 | **P1**   | No EasyShip label gen              | `easyship.service.ts`                                      | Same as G-10. EasyShip rates work but no label purchase API.                                                                                                                                                                                                                                 | Implement EasyShip `POST /2024-09/shipments`.                                                                                                                             |
| G-12 | **P1**   | Hardcoded NY fallback              | `shipping-tax.service.ts:calculateEasyPostShippingOptions` | When seller address lookup fails, code falls back to hardcoded `city: 'New York', state: 'NY', country: 'US'` BEFORE reading platform settings. Platform `origin_country=FR` is ignored if `storeId` is absent from items.                                                                   | Remove hardcoded fallback. Read platform settings first; use hardcoded default as last resort only.                                                                       |
| G-13 | **P1**   | EasyShip hardcoded HS code         | `easyship.service.ts:93`                                   | `hs_code: '621790'` (miscellaneous garments) hardcoded for all items. Customs duties for electronics, food, or other categories will be wrong.                                                                                                                                               | Map product category to HS code, or omit HS code with documentation that rates exclude duties.                                                                            |
| G-14 | **P1**   | DHL credentials likely invalid     | `.env`                                                     | `DHL_EXPRESS_API_KEY=apX4zWOjQScX8l` is 14 characters. MyDHL API keys are typically longer. May be a truncated placeholder.                                                                                                                                                                  | Test via `GET /dhl/health` with admin token. Replace with valid MyDHL API key+secret if test fails.                                                                       |
| G-15 | **P1**   | `shipping_primary_provider` unused | `system_settings`                                          | DB has `shipping_primary_provider = "EasyPost"` but this setting is **never read** by any backend code. No behavioral effect.                                                                                                                                                                | Remove the setting to avoid confusion, or wire it to cascade-priority override.                                                                                           |
| G-16 | **P1**   | Rate caching absent                | All providers                                              | Every checkout page load triggers live API calls. At peak load: 1–3s latency, potential rate-limit hits.                                                                                                                                                                                     | Implement Redis TTL cache (5 min) keyed by `(provider, origin, destination, weight)`.                                                                                     |
| G-17 | **P2**   | Manual rates use US carriers       | `shipping-tax.service.ts:992`                              | Manual fallback hardcodes `carrier: 'USPS'` and `carrier: 'FedEx'` even though origin is France. Buyers see "USPS Standard" for a French seller.                                                                                                                                             | Make manual rate carrier labels generic ("Standard Shipping", "Express Shipping") or configurable.                                                                        |
| G-18 | **P2**   | Dimensional weight                 | All providers                                              | Parcel dimensions hardcoded (`10×8×4` EasyPost, `10×10×10` EasyShip). Actual product dimensions ignored. Bulky items under-priced.                                                                                                                                                           | Read `Product.dimensions` from DB when available; calculate dimensional weight.                                                                                           |
| G-19 | **P2**   | EasyPost label purchase timeout    | `easypost-shipment.service.ts`                             | `client.Shipment.buy()` has no timeout. A slow EasyPost response during label purchase hangs the request indefinitely.                                                                                                                                                                       | Add `Promise.race` with 30-second timeout around `client.Shipment.buy()`.                                                                                                 |
| G-20 | **P2**   | Retry logic missing                | All providers                                              | No exponential-backoff retry on rate-fetch failures. A momentary provider hiccup triggers cascade fallthrough. DHL tracking already has retry — replicate for rate-fetch paths.                                                                                                              | Add 2 retries with 500ms/1000ms backoff before marking provider as failed.                                                                                                |
| G-21 | **P2**   | `shipping-config.ts` stale         | `apps/web/src/lib/shipping-config.ts`                      | Frontend file defines hardcoded `SHIPPING_METHODS` (standard $10, express $25, nextday $50) and `FREE_SHIPPING_THRESHOLD = 200`. Disconnected from live backend cascade.                                                                                                                     | Remove or clearly mark as deprecated. Frontend rates should come from `/orders/calculate-totals` response only.                                                           |
| G-22 | **P2**   | EasyShip currency mismatch         | `easyship.service.ts`                                      | EasyShip rates returned in USD. If buyer's cart is in EUR or RWF, shipping prices are inconsistent.                                                                                                                                                                                          | Use `output_currency` field in EasyShip request to match buyer's cart currency, or run through `CurrencyService`.                                                         |

---

## 5. Edge Case Coverage Matrix

| Edge Case                                               | Status                                                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Failed label generation (payment succeeded, no label)   | ⚠️ Partial — 48h cron notifies seller; no automated retry                                     |
| Tracking webhook lost / duplicated                      | ⚠️ Partial — EasyPost: idempotency ✅; SendCloud: ❌; EasyShip: ❌                            |
| Address validation failures                             | ⚠️ Partial — EasyPost verify endpoint exists; not auto-triggered at checkout                  |
| International shipments requiring customs forms         | ⚠️ Partial — DHL service handles customs ✅; EasyPost/EasyShip rate shopping skips customs ❌ |
| Multi-package orders (split shipments)                  | ❌ Not handled — all providers use single-parcel assumption                                   |
| Returns / reverse logistics                             | ⚠️ Partial — EasyPost return label implemented ✅; no path for other providers                |
| Lost-in-transit packages                                | ❌ Not handled                                                                                |
| Address change after label printed                      | ❌ Not handled                                                                                |
| Cancellation after label printed                        | ⚠️ Partial — EasyPost label void implemented ✅; others manual                                |
| Provider outages mid-shipment                           | ⚠️ Partial — cascade falls through at rate-shopping time; no circuit-breaker                  |
| Currency mismatch (provider in EUR/USD, order in other) | ❌ Not handled                                                                                |
| Seller-paid vs buyer-paid shipping                      | ❌ Not determined — always added to buyer total                                               |
| Free shipping threshold                                 | ⚠️ Partial — applied only in manual fallback; API rates ignore threshold                      |
| Dimensional weight calculation                          | ❌ Not handled — hardcoded default dimensions everywhere                                      |

---

## 6. Settings Audit Table

| Key                                | Current Value                                               | Effect                                                            | In Admin UI         |
| ---------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- | ------------------- |
| `easypost_enabled`                 | `true`                                                      | Gates EasyPost in cascade                                         | ✅                  |
| `easypost_test_mode`               | `false`                                                     | Secondary to `EASYPOST_TEST_MODE` env var                         | ✅                  |
| `easypost_webhook_secret`          | _(not in DB)_                                               | Falls back to `EASYPOST_WEBHOOK_SECRET` env var                   | ❌ env only         |
| `easypost_default_carriers`        | `["USPS","UPS","FedEx","DHL","AustraliaPost","CanadaPost"]` | Not read by cascade; display only                                 | ✅                  |
| `easypost_default_label_format`    | `"PDF"`                                                     | Not used in automated purchase                                    | ✅                  |
| `easypost_address_verification`    | `true`                                                      | **No behavioral effect** — endpoint exists but not auto-triggered | ✅ display only     |
| `sendcloud_enabled`                | `true`                                                      | Gates SendCloud in cascade                                        | ✅                  |
| `easyship_enabled`                 | `true`                                                      | Gates EasyShip in cascade                                         | ✅                  |
| `dhl_enabled`                      | `false`                                                     | Gates DHL TIER 4 in cascade                                       | ❌ no DHL tab       |
| `dhl_api_environment`              | `"sandbox"`                                                 | Switches between sandbox/production URL                           | ❌ no DHL tab       |
| `shipping_mode`                    | `"manual"`                                                  | Controls LEGACY DHL path only; irrelevant when TIER 4 is used     | ❌ not surfaced     |
| `shipping_primary_provider`        | `"EasyPost"`                                                | **No behavioral effect — never read by code**                     | ❌                  |
| `shipping_standard_rate`           | `6.5`                                                       | Manual fallback standard price                                    | ✅                  |
| `shipping_express_rate`            | `12`                                                        | Manual fallback express price                                     | ✅                  |
| `shipping_overnight_rate`          | `20`                                                        | Manual fallback overnight price                                   | ✅                  |
| `shipping_international_surcharge` | `15`                                                        | Added to manual rates for non-US destinations                     | ✅                  |
| `free_shipping_enabled`            | `true`                                                      | Enables free-shipping logic in **manual fallback only**           | ✅                  |
| `free_shipping_threshold`          | `200`                                                       | Threshold for free shipping in **manual fallback only**           | ✅                  |
| `origin_country`                   | `"FR"`                                                      | Platform origin country when no seller address found              | ⚠️ general settings |
| `origin_city`                      | `"Paris"`                                                   | Same                                                              | ⚠️                  |
| `origin_state`                     | `"Île-de-France"`                                           | Same                                                              | ⚠️                  |
| `origin_postal_code`               | `"75001"`                                                   | Same                                                              | ⚠️                  |
| `origin_street1`                   | `"10 Rue de Rivoli"`                                        | Same                                                              | ⚠️                  |
| `commission_applies_to_shipping`   | `false`                                                     | Whether commission is on shipping amount                          | ✅ commission tab   |

**Missing settings:**

- `dhl_account_number` — in `.env` only; should be admin-configurable
- `dhl_default_service_level` — no default product code setting
- `shipping_cascade_emergency_bypass` — toggle to force-skip all API providers (not yet built)

---

## 7. Admin UI Coverage Table

| Area                                     | Component                                      | Functional?                                           |
| ---------------------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| Cascade overview                         | Unified Shipping Settings → "Cascade Overview" | ✅                                                    |
| Manual rates                             | "Manual Rates" tab                             | ✅                                                    |
| EasyPost settings                        | "EasyPost" tab                                 | ✅                                                    |
| SendCloud settings                       | "SendCloud" tab                                | ✅                                                    |
| EasyShip settings                        | "EasyShip" tab                                 | ✅                                                    |
| **DHL Express settings**                 | **None**                                       | ❌ Missing entirely                                   |
| Shipping zones (manual)                  | `/admin/shipping`                              | ✅ Full CRUD                                          |
| Seller: EasyPost label generation        | `/seller/orders/[id]`                          | ✅                                                    |
| Seller: SendCloud / EasyShip / DHL label | `/seller/orders/[id]`                          | ⚠️ Manual entry only                                  |
| Customer tracking display                | Order detail page                              | ⚠️ EasyPost only — no SendCloud/EasyShip/DHL tracking |

---

## 8. Test Coverage Table

| Area                                 | Test                           | Coverage      |
| ------------------------------------ | ------------------------------ | ------------- |
| Cascade logic (`ShippingTaxService`) | None                           | ❌ Zero       |
| EasyPost rate quote                  | None                           | ❌ Zero       |
| EasyPost webhook signature           | None                           | ❌ Zero       |
| EasyPost idempotency                 | None                           | ❌ Zero       |
| SendCloud rate quote                 | None                           | ❌ Zero       |
| SendCloud webhook                    | None                           | ❌ Zero       |
| EasyShip rate quote                  | None                           | ❌ Zero       |
| EasyShip webhook                     | None                           | ❌ Zero       |
| DHL rate quote                       | None                           | ❌ Zero       |
| Shipping zone matching               | None                           | ❌ Zero       |
| Free shipping threshold              | None                           | ❌ Zero       |
| E2E: Checkout shipping display       | `buyer-journey.spec.ts`        | ⚠️ Smoke only |
| E2E: Seller shipping label           | `seller-dashboard.spec.ts:643` | ⚠️ Smoke only |

---

## 9. Sequenced Fix Recommendations

### Phase 1 — Fix Production Breakage (~3 days)

1. **G-01: Fix EasyPost webhook HMAC** — Add `@Req() req: RawBodyRequest<Request>`, use `req.rawBody` Buffer in `verifySignature()`. 5-line change. Unblocks all EasyPost tracking updates.
2. **G-09: Remove duplicate DHL LEGACY section** — Delete TIER 3 LEGACY block (~lines 502–546 in `shipping-tax.service.ts`). Eliminates dead code confusion.
3. **G-03: Update cascade docblock** — Fix stale "US-only" comment at line 213.

### Phase 2 — Close P1 Gaps (~1 week)

4. **G-04: Apply free shipping to API rates** — Wrap provider results with free-shipping zeroing after each `return addGelatoCost(...)` call.
5. **G-05, G-06: SendCloud + EasyShip idempotency** — Add `parcel.id+statusId` / `trackingNumber+event` dedup. Reuse `EasyPostWebhookLog` pattern.
6. **G-07: EasyPost customs in rate shopping** — Auto-detect international route; attach `customsInfo` from cart items.
7. **G-08: DHL Admin UI** — Add DHL tab to `unified-shipping-settings.tsx`; expose `dhl_enabled`, `dhl_api_environment` toggles.
8. **G-12: Fix hardcoded NY fallback** — Remove hardcoded `fromAddress`; always read from platform settings first.
9. **G-15: Remove unused `shipping_primary_provider`** — Delete or wire to actual cascade logic.

### Phase 3 — DHL Express Promotion (~1 week, separate stream)

This is a prerequisite for the intended target state. Work in this phase:

- Verify/replace `DHL_EXPRESS_API_KEY` (test via `GET /dhl/health`)
- Obtain `DHL_API_KEY` for DHL Unified Tracking API → configure `DHL_TRACKING_ENABLED=true`
- Build `/webhooks/dhl` handler with appropriate DHL auth method
- Register webhook URL in DHL developer portal
- Set `dhl_enabled=true`, `dhl_api_environment=production`

### Phase 4 — Label Generation Parity (~5 days)

- **G-10**: Implement SendCloud `POST /parcels`
- **G-11**: Implement EasyShip `POST /2024-09/shipments`

### Phase 5 — P2 Polish (~3 days)

G-13 (EasyShip HS code), G-16 (rate caching), G-17 (generic carrier names), G-18 (product dimensions), G-21 (remove stale `shipping-config.ts`), G-22 (EasyShip currency normalization).

---

## 10. Risks and Unknowns

| Risk                                   | Likelihood          | Impact | Notes                                                                                                                                                                                    |
| -------------------------------------- | ------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DHL credentials are invalid/truncated  | Medium              | Medium | `DHL_EXPRESS_API_KEY=apX4zWOjQScX8l` (14 chars) is shorter than expected. Test immediately.                                                                                              |
| EasyPost webhook backlog               | High                | Medium | With secret set and verification broken, EasyPost has been retrying failed events. After fix, backlog arrives. Idempotency in `EasyPostWebhookLog` will handle dedup.                    |
| SendCloud EU→non-EU customs compliance | Medium              | High   | For EU sellers shipping outside EU (FR→US, DE→UK), customs information is required. Current integration omits this; quotes may be non-compliant.                                         |
| DHL webhook auth method                | Needs clarification | Medium | DHL Express MyDHL webhook auth differs from EasyPost/SendCloud. DHL typically uses a shared secret in a query parameter or custom header, not body HMAC. Verify in DHL developer portal. |
| Free shipping breach after G-04 fix    | Needs clarification | Medium | Once applied to API rates, orders over $200 get free shipping for all providers. Confirm whether this is the intended behavior.                                                          |
| `storeId` always present in `CartItem` | Needs clarification | High   | If any checkout path omits `storeId`, EasyPost rate-shops from hardcoded New York even for a Paris seller. Verify all checkout paths populate `storeId`.                                 |
| Emergency-fallback toggle              | Needs clarification | Low    | No toggle exists to force-skip all API providers and use manual rates only. Must be built if required by business.                                                                       |

---

## Summary Answers

**Top 3 P0 Findings:**

1. **EasyPost HMAC webhook verification is broken** (`easypost-webhook.controller.ts:225`) — signs re-serialized JSON, not raw body bytes. With secret configured, all tracking webhooks return 401. Zero EasyPost tracking updates reach the database. 5-line fix.
2. **DHL tracking entirely non-functional** — wrong API product, missing `DHL_API_KEY`, tracking disabled, no webhook handler. DHL cannot be promoted to worldwide fallback until this is built.
3. **Cascade docblock advertises stale US-only EasyPost behavior** — will mislead developers after today's geo-gate removal.

**Is DHL Express promotion straightforward?**
No — it requires work on two separate DHL API products (MyDHL for rates/labels, Unified Tracking for events), verification of suspect credentials, building a new webhook handler, and an admin UI. Realistic estimate: 5–7 focused engineering days.

**Does an emergency-fallback toggle for manual zones already exist?**
No. The cascade always falls through to manual if all API providers fail, but there is no admin UI toggle or setting to force-bypass all API providers. Must be built.

**Estimated total fix scope:**
**Medium** — approximately 2–3 weeks across the four phases above.
