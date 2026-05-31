# Future Considerations

## 1. External Advertiser Feature (Post-Launch)

**Status:** ⏸️ Deferred until after January 3, 2026 deadline

**Question:** How should external parties (not sellers) advertise on NextPik?

### Scenarios for External Advertisers

| Who                | What They Advertise                        | Example                      |
| ------------------ | ------------------------------------------ | ---------------------------- |
| External Brand     | Their brand/products (not sold on NextPik) | Nike wants banner visibility |
| Partner Business   | Related services                           | Luxury car rental, Insurance |
| Affiliate          | External products with referral links      | Amazon affiliate products    |
| Event Organizer    | Luxury events, auctions                    | Christie's auction promo     |
| Real Estate Agency | Properties (external listings)             | Sotheby's Realty             |

### Options

**Option A: External Advertisers Become SELLERS (No New Role)**

- External Brand → Registers as SELLER → Creates "Ad-Only Store" → Buys Ad Space
- Pros: No schema changes, uses existing ad system
- Cons: Seller dashboard features they don't need, confusing UX

**Option B: Add ADVERTISER Role (New Role)**

- External Brand → Registers as ADVERTISER → Only sees Ad Dashboard → Buys Ad Space
- Pros: Clean separation, focused UX, professional
- Cons: Schema change needed, more code to maintain

**Option C: Admin Creates Ads for External Clients (No New Role)**

- External Brand → Contacts Admin → Admin creates ad on their behalf
- Pros: No changes needed, full control, works now
- Cons: Manual process, doesn't scale

### Recommendation

| Timeline       | Approach                                                    |
| -------------- | ----------------------------------------------------------- |
| Now (deadline) | Option C - Admin creates ads for externals                  |
| Post-launch    | Option A - Externals register as SELLER with "Ad-Only" flag |
| Future scale   | Option B - Add ADVERTISER role                              |

### Decision Needed

- [ ] Decide which option to implement
- [ ] If Option B: Design ADVERTISER role permissions
- [ ] If Option A: Add "Ad-Only" store type

---

_Added: December 26, 2025_
_Review after: January 3, 2026_

---

## 2. 2FA Enforcement — Grace Period Reminder Emails (v2.12.0 follow-up)

**Status:** ⏸️ Deferred — enforcement gate shipped, email scheduler not yet built

**Context:** The mandatory 2FA enforcement feature (v2.12.0, commit 06682e7) enforces
2FA for SELLER, ADMIN, SUPER_ADMIN, and DELIVERY_PARTNER roles after a configurable
grace period (14 days existing / 7 days new accounts). The gate itself is live.

**What's missing:** A scheduled job that sends reminder emails as the grace period
countdown approaches. The original spec called for:

| Day                 | Email                                       |
| ------------------- | ------------------------------------------- |
| Grace start (Day 0) | "Action required: set up 2FA within N days" |
| Day −7              | "7 days left to enable 2FA"                 |
| Day −3              | "3 days left — urgent"                      |
| Day −1              | "Last warning: 2FA required tomorrow"       |
| Day 0 (expiry)      | "Your account has been restricted"          |

**Implementation notes:**

- Query: `SELECT id, email, "twoFactorGracePeriodStartsAt" FROM users WHERE "twoFactorEnabled" = false AND "twoFactorGracePeriodStartsAt" IS NOT NULL AND role IN ('SELLER','ADMIN','SUPER_ADMIN','DELIVERY_PARTNER')`
- Cron runs daily; compute days remaining per user and send the appropriate template
- Add to `SellerCreditsCronService` (already wired) or create `TwoFactorReminderCronService`
- Email templates needed: `two-factor-reminder-N-days.template.ts`
- Must respect `2fa_required_for_*` settings — don't send if enforcement is disabled for that role
- Track sent reminders to avoid duplicate sends on same day (add `twoFactorLastReminderSentAt` column or use Redis key)

**Files to create/modify:**

- `apps/api/src/cron/two-factor-reminder.cron.ts` (new)
- `apps/api/src/email/templates/two-factor-reminder.template.ts` (new)
- `packages/database/prisma/migrations/add_2fa_reminder_tracking/migration.sql` (optional dedup column)

_Added: May 8, 2026_
_Deferred from: v2.12.0 mandatory 2FA enforcement_

---

## 3. 2FA Enforcement — Backend Integration Tests (v2.12.0 follow-up)

**Status:** ⏸️ Deferred — scenarios verified via curl; NestJS integration tests not yet written

**Context:** The five enforcement scenarios (TS1–TS5) were verified manually via curl +
direct DB queries during the v2.12.0 verification run. They were intentionally NOT
promoted to Playwright tests.

**Why not Playwright for TS1–TS5:**
Playwright is scoped to browser UI behavior. TS1–TS5 require a live API + specific
database state (backdated grace period timestamps, manually inserted trusted_devices
rows). Adding that setup/teardown to the browser test suite would create fragile
cross-layer coupling and a heavy CI requirement.

**Recommended layer:** `@nestjs/testing` integration tests with a dedicated test database.

**What to build:**

- `apps/api/src/auth/guards/two-factor-enforcement.guard.spec.ts`
  - TS1: first authenticated request → `twoFactorGracePeriodStartsAt` written to DB
  - TS2: backdated grace → `canActivate` throws `ForbiddenException` with `2FA_GRACE_EXPIRED`
  - TS3: trusted device cookie → `canActivate` returns `true` despite expired grace
  - TS4: BUYER role → guard short-circuits before any DB query
  - TS5: `2fa_required_for_seller = false` → guard short-circuits after settings check
- Mock `SettingsService`, `PrismaService.$queryRaw`, `TrustedDeviceService`
- These can run in unit mode (mocked DB) or integration mode (test DB container)

_Added: May 8, 2026_
_Deferred from: v2.12.0 mandatory 2FA enforcement_

---

## i18n & Phase C.1 follow-ups (2026-05-20)

Captured during Phase C.1 (adminReferrals i18n backfill). Address opportunistically as Phase C progresses.

### Localized enum display in table rows

Table bodies on /admin/referrals (and several other admin pages) render raw API enum values like BUYER, SELLER, PENDING, QUALIFIED directly to the screen. The filter dropdowns above them DO use localized labels via status.\* and filters.roleBuyer/roleSeller. To unify display, add:

- roles.\* group (e.g., roles.buyer, roles.seller, roles.deliveryPartner, etc.)
- Extend usage of status.\* to row-body badges, not just the breakdown section and filter dropdown

Pattern to apply uniformly across all admin pages that render UserRole or ReferralStatus enum values.

### Dead imports in other admin pages

During C.1, three unused imports were found and removed from apps/web/src/app/admin/referrals/page.tsx (useEffect, referralApi, Search icon). A quick sweep across other admin pages may surface similar dead code. Suggested command:

```bash
grep -rn "^import.*Search.*lucide" apps/web/src/app/admin/ | head
grep -rn "^import.*useEffect.*react" apps/web/src/app/admin/ | head -20
```

Run during routine cleanup; not blocking for Phase C feature work.

### Translation backlog metric

Phase C.1 introduced [FR-TODO]/[ES-TODO] markers. As of commit 72599c7:

```bash
grep -ro "FR-TODO" apps/web/messages/fr.json | wc -l   # 32
grep -ro "ES-TODO" apps/web/messages/es.json | wc -l   # 32
```

This count grows predictably with each Phase C namespace addition. Useful as a translator handoff metric. Target: count drops to 0 after a translation pass.

### Rich-text patterns in pagination strings

The pagination.showing key was extended in Phase C.1 to use `<b>{x}</b>` markup interpolated via `t.rich()` to restore visual emphasis on numbers. New paginated admin pages (affiliate, blog comments, newsletter subscribers) should adopt this pattern from the start rather than the flat ICU pattern.

## Phase C.3 closeout follow-ups (2026-05-21)

Captured during Phase C.3 affiliate backend module closeout. Address opportunistically.

### Honest integration tests for AffiliateService and AffiliateController

C.3 was built with shallow Prisma-mocked unit tests that were deleted before commit because they verified call shapes rather than downstream effects (violates project principle: "Honest tests are non-negotiable"). The right pattern is `@nestjs/testing` + a real test database (Postgres or in-memory SQLite via Prisma) that lets the test assert e.g. `expect(await prisma.affiliateClickLog.count()).toBe(1)` after calling `affiliateService.logClick(...)`.

Plan: implement in Phase C.17 (E2E tests) as part of the full backend test suite. Will require setting up a test DB infrastructure for `@nestjs/testing` integration tests, which doesn't currently exist in the codebase. Scope:

- Real DB-backed tests for all 19 AffiliateController endpoints
- Honest verification of click log writes, counter increments, commission upserts
- Auth tests (public vs admin endpoints)
- Pagination/filter correctness on list endpoints

### Click handler optimizations for high volume

The C.3 click endpoint is synchronous + best-effort counter:

- AffiliateClickLog write is critical-path (~5-20ms added per click)
- AffiliateProduct.clickCount increment is fire-and-forget after the log write

This is fine for pre-launch and early production. If click volume becomes high (>1,000 clicks/min sustained), consider:

- Background queue (BullMQ) for click log writes — return 302 immediately, queue the log
- Batch counter updates every minute instead of per-click
- Materialize the counter from `COUNT(AffiliateClickLog)` on a schedule rather than incrementing

### GET variant for click handler

C.3 implements `POST /affiliate/products/:id/click`. A GET variant (e.g., `GET /go/:id` or `GET /affiliate/redirect/:id`) would be friendlier for right-click → copy link, link previews, plain `<a href>` usage from emails/social. Worth adding if affiliate links need to work in those contexts. Deferred to keep v1 simple.

### Replace raw SQL in downloads.service.ts and hot-deals.service.ts

Now that `DownloadLog` model and `HotDeal.budget`/`budgetType` fields are properly declared in schema.prisma (Phase A.1.6), the raw SQL workarounds in `apps/api/src/downloads/downloads.service.ts` and `apps/api/src/hot-deals/hot-deals.service.ts` should be replaced with proper Prisma client calls. Cleaner code, type-safety, less surface area for bugs.

### Promote HotDeal.budgetType to a Prisma enum

Currently declared as `String? @db.VarChar(20) @map("budget_type")` with documented values `'HOURLY' | 'FIXED' | 'NEGOTIABLE'`. The DTO layer already has a `BudgetType` enum. Promoting to a database-level enum (`enum BudgetType { HOURLY FIXED NEGOTIABLE }`) would add type-safety and constraint enforcement. Requires a small ALTER COLUMN migration.

### Historical backfill orchestration (Phase C.4 closeout — 2026-05-21)

Awin's `/transactions/` endpoint enforces a 31-day maximum date range per
request. The current commission sync (Phase C.4) handles ranges ≤31 days
cleanly via server-side validation on the manual sync endpoint, but does not
auto-chunk larger ranges.

When historical backfill is needed (e.g., importing 12 months of past
commissions after first connecting to Awin), build a chunked orchestrator
that:

- Splits the date range into 31-day windows
- Calls `syncCommissionsFromAwin` per window sequentially
- Spaces requests to respect Awin's 20 req/min rate limit
- Accumulates and returns combined counts

Estimated work: ~30 lines in `AffiliateService`, no schema changes. Can be
added as a separate admin endpoint `POST /affiliate/admin/commissions/awin-backfill`
to keep the simple sync endpoint focused on normal operations.

## Phase C.5 closeout follow-ups (affiliate admin UI)

Captured during the Phase C.5 build. None blocking; address opportunistically.

### 1. i18n backfill for affiliate admin UI

C.5 shipped all 5 affiliate admin pages (Advertisers, Products, Translations, Clicks, Commissions) with English-inline text. Only the sidebar nav got i18n keys. Per the project i18n pattern (Phase C.1 adminReferrals), FR/ES need backfilling.

Scope: ~2.5 hours. Define namespaces (adminAffiliateAdvertisers, adminAffiliateProducts, adminAffiliateTranslations, adminAffiliateClicks, adminAffiliateCommissions), add English master keys, add [FR-TODO]/[ES-TODO] placeholders, wrap all UI strings in t(). Note: this is UI-chrome i18n only — the affiliate product _content_ translations are a separate, already-built feature (AffiliateProductTranslation + the Translations sub-page).

### 2. Product category picker (productCategoryIds)

The affiliate Products create/edit form does not set productCategoryIds — there's no category-picker component readily available, so products are created with an empty category array. If affiliate products need categorization (for public-facing filtering in C.6), add a category multi-select to the product form.

### 3. Server-side relation includes on click-log and commission lists

Both listClickLogs and listCommissions return bare FK IDs (no advertiser/product relations). The admin UI resolves names via client-side lookup maps capped at 100 advertisers + 100 products. For large catalogs this cap would miss items (falls back to showing raw IDs). Fix: add advertiser + product includes to these two service queries so names resolve server-side, uncapped. Small backend change (select clauses), deferred because backend was locked during C.5.

### 4. Advertiser search filter

ListAdvertisersQueryDto supports approvalStatus + isActive but no text search. The Advertisers admin page has no search box as a result. If admins need to find advertisers by name/merchantId in a large list, add a search param to the DTO + service where-clause, then a search input to the page.

### 5. Translation original-language designation (isOriginal / ORIGINAL)

The Translations sub-page defaults manual saves to HUMAN_REVIEWED (preserving PUBLISHED if already published). It does not manage the isOriginal flag or the ORIGINAL status — there's no UI to designate which locale is the source-language master. If that distinction matters operationally, add a way to mark one locale as original. Related: the future DeepL integration (Phase C.15) will produce MACHINE_TRANSLATED entries that the "Mark as Human Reviewed" button is designed to promote.

### 6. Commissions page modal extraction (minor refactor)

apps/web/src/app/admin/affiliate/commissions/page.tsx is ~900 lines — the largest page file in C.5 — because it holds the list, stats cards, and two inline modals (Sync Now, Manual Entry). If this page needs future maintenance, extract the two modals into separate component files for readability. Not urgent; the page builds and works.

### 7. Logged-in affiliate click attribution (C.6 known limitation)

**Verified (2026-05-22):** Anonymous click logging works end-to-end. Logged-in clicks land correctly on the deep link but `userId` is always NULL.

**Why:** The CTA is a plain `<a target="_blank">` anchor. Browser navigation does not attach an `Authorization: Bearer` header — that only travels on explicit `fetch()`/XHR calls. The JWT lives in `localStorage` (inaccessible server-side). The route handler at `apps/web/src/app/api/affiliate/redirect/[id]/route.ts` forwards whatever `Authorization` header arrives; for anchor navigations, none arrives.

**Fix:** In the route handler, read the auth cookie (`nextpik_ecommerce_access_token`) as a fallback when no `Authorization` header is present:

```ts
const authHeader =
  request.headers.get('authorization') ||
  (request.cookies.get('nextpik_ecommerce_access_token')?.value
    ? `Bearer ${request.cookies.get('nextpik_ecommerce_access_token')!.value}`
    : '');
```

This requires no schema change — the backend already accepts the JWT in the `Authorization` header and attributes the click to `req.user?.id`.
