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
