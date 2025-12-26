# Future Considerations

## 1. External Advertiser Feature (Post-Launch)

**Status:** ⏸️ Deferred until after January 3, 2026 deadline

**Question:** How should external parties (not sellers) advertise on NextPik?

### Scenarios for External Advertisers
| Who | What They Advertise | Example |
|-----|---------------------|---------|
| External Brand | Their brand/products (not sold on NextPik) | Nike wants banner visibility |
| Partner Business | Related services | Luxury car rental, Insurance |
| Affiliate | External products with referral links | Amazon affiliate products |
| Event Organizer | Luxury events, auctions | Christie's auction promo |
| Real Estate Agency | Properties (external listings) | Sotheby's Realty |

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
| Timeline | Approach |
|----------|----------|
| Now (deadline) | Option C - Admin creates ads for externals |
| Post-launch | Option A - Externals register as SELLER with "Ad-Only" flag |
| Future scale | Option B - Add ADVERTISER role |

### Decision Needed
- [ ] Decide which option to implement
- [ ] If Option B: Design ADVERTISER role permissions
- [ ] If Option A: Add "Ad-Only" store type

---

*Added: December 26, 2025*
*Review after: January 3, 2026*
