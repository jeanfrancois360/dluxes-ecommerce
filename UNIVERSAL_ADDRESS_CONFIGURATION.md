# 📊 Universal Address Configuration - Analysis Report

**Date:** January 31, 2026
**File:** `apps/web/src/lib/data/address-countries.ts`
**Status:** ✅ Complete

---

## Overview

**Total Countries Configured:** 30
**Regions Covered:** 6 (Africa, Americas, Asia, Middle East, Europe, Oceania)
**Popular Countries:** 13

---

## Breakdown by Region

| Region | Countries | Coverage |
|--------|-----------|----------|
| Africa | 7 | RW, NG, KE, ZA, GH, UG, TZ |
| Americas | 4 | US, CA, BR, MX |
| Asia | 5 | SG, IN, JP, CN, KR |
| Middle East | 4 | AE, SA, QA, KW |
| Europe | 6 | GB, FR, DE, IT, ES, NL |
| Oceania | 2 | AU, NZ |

---

## Address Format Scenarios

### 1. **Minimal** (No state, no postal) - 7 countries
**Who:** RW, GH, UG, TZ, AE, QA
**Example:** Rwanda
**Required fields:** Country, Full Name, Phone, Address, City
**Use case:** Countries with simple address systems

### 2. **Full** (State required, postal required) - 8 countries
**Who:** US, CA, BR, MX, IN, CN, AU
**Example:** United States
**Required fields:** All + State + Postal Code
**Use case:** Large countries with structured addressing

### 3. **Postal Only** (No state, postal required) - 11 countries
**Who:** SG, JP, KR, GB, FR, DE, IT, ES, NL, NZ, SA
**Example:** United Kingdom
**Required fields:** All + Postal Code (no state)
**Use case:** Smaller countries, city-states

### 4. **Flexible** (Optional fields) - 4 countries
**Who:** NG (state optional), KE, ZA, KW (postal optional)
**Example:** Nigeria, South Africa
**Required fields:** Base fields only
**Use case:** Transitioning postal systems

---

## Popular Countries Configuration

| Country | Flag | State | Postal | Phone Prefix |
|---------|------|-------|--------|--------------|
| Rwanda | 🇷🇼 | ❌ | ❌ | +250 |
| United States | 🇺🇸 | ✅ Required | ✅ Required | +1 |
| United Kingdom | 🇬🇧 | ❌ | ✅ Required | +44 |
| Nigeria | 🇳🇬 | ~ Optional | ❌ | +234 |
| Singapore | 🇸🇬 | ❌ | ✅ Required | +65 |
| Kenya | 🇰🇪 | ❌ | ~ Optional | +254 |
| UAE | 🇦🇪 | ❌ | ❌ | +971 |
| South Africa | 🇿🇦 | ~ Optional | ~ Optional | +27 |
| Canada | 🇨🇦 | ✅ Required | ✅ Required | +1 |
| France | 🇫🇷 | ❌ | ✅ Required | +33 |
| Germany | 🇩🇪 | ❌ | ✅ Required | +49 |
| India | 🇮🇳 | ✅ Required | ✅ Required | +91 |
| Australia | 🇦🇺 | ✅ Required | ✅ Required | +61 |

---

## Validation Features

### Postal Code Patterns

| Country | Pattern | Example | Validation |
|---------|---------|---------|------------|
| US | `NNNNN` or `NNNNN-NNNN` | 12345-6789 | `/^\d{5}(-\d{4})?$/` |
| UK | `AAN NAA` | SW1A 1AA | `/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i` |
| Canada | `ANA NAN` | K1A 0B1 | `/^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i` |
| France | `NNNNN` | 75001 | `/^\d{5}$/` |
| Singapore | `NNNNNN` | 123456 | `/^\d{6}$/` |
| India | `NNNNNN` | 110001 | `/^\d{6}$/` |
| Japan | `NNN-NNNN` | 100-0001 | `/^\d{3}-?\d{4}$/` |
| Australia | `NNNN` | 2000 | `/^\d{4}$/` |

### Phone Number Formatting

| Country | Format | Example | Pattern |
|---------|--------|---------|---------|
| Rwanda | `+250 NNN NNN NNN` | +250 788 123 456 | 9 digits |
| US/Canada | `+1 (NNN) NNN-NNNN` | +1 (555) 123-4567 | 10 digits |
| UK | `+44 NN NNNN NNNN` | +44 20 1234 5678 | 10-11 digits |
| Singapore | `+65 NNNN NNNN` | +65 1234 5678 | 8 digits |
| India | `+91 NNNNN NNNNN` | +91 12345 67890 | 10 digits |
| Australia | `+61 NNN NNN NNN` | +61 412 345 678 | 9 digits |

---

## Localized Labels

### State/Province Labels by Country

| Country | Label | Explanation |
|---------|-------|-------------|
| US | State | US states (CA, NY, TX, etc.) |
| Canada | Province | Canadian provinces (ON, QC, BC, etc.) |
| UK | County | British counties |
| France | Region | French regions |
| India | State | Indian states |
| Australia | State | Australian states (NSW, VIC, etc.) |
| Nigeria | State | Nigerian states |
| South Africa | Province | SA provinces |

### Postal Code Labels by Country

| Country | Label | Explanation |
|---------|-------|-------------|
| US | ZIP Code | Zone Improvement Plan |
| UK | Postcode | British postal code |
| Canada | Postal Code | Canadian postal code |
| France | Code Postal | French postal code |
| Germany | Postleitzahl | German postal code |
| Italy | CAP | Codice di Avviamento Postale |
| Brazil | CEP | Código de Endereçamento Postal |
| India | PIN Code | Postal Index Number |

---

## Helper Functions

### Core Functions

```typescript
getCountryConfig(code: string)          // Get config for a country
getPopularCountries()                   // Get list of popular countries
getAllCountries()                       // Get all countries alphabetically
getCountriesByRegion(region: string)    // Filter by region
searchCountries(query: string)          // Search by name/code
```

### Validation Functions

```typescript
validatePostalCode(postal: string, countryCode: string)  // Validate postal format
validatePhoneNumber(phone: string, countryCode: string)  // Validate phone format
```

### Formatting Functions

```typescript
formatPhoneNumber(phone: string, countryCode: string)    // Format phone with prefix
getPhonePlaceholder(countryCode: string)                 // Get phone placeholder
getAddressFormatHelp(countryCode: string)                // Get format instructions
```

---

## Dynamic Form Behavior

### When Country is Selected/Changed:

1. **Update phone prefix** - Show correct country code
2. **Show/hide state field** - Based on `showState` property
3. **Show/hide postal field** - Based on `showPostalCode` property
4. **Update required indicators** - Show * for required fields
5. **Update field labels** - Use country-specific labels
6. **Clear incompatible values** - Clear state/postal if new country doesn't use them
7. **Update validation rules** - Apply country-specific patterns
8. **Update placeholders** - Show format examples

### Example Flow: Rwanda → United States

**Before (Rwanda 🇷🇼):**
- Full Name * Phone (+250) * Address * City *
- ✅ Submit enabled with just these fields

**After (United States 🇺🇸):**
- Full Name * Phone (+1) * Address * City * **State *** **ZIP Code ***
- ❌ Submit disabled until state and ZIP filled

---

## Default Fallback Config

For unknown country codes, system defaults to:

```typescript
{
  code: 'XX',
  name: 'Unknown Country',
  flag: '🌍',
  phonePrefix: '+1',
  showState: true,           // Show but don't require
  showPostalCode: true,      // Show but don't require
  requiresState: false,      // Optional
  requiresPostalCode: false, // Optional
  stateLabel: 'State/Province',
  postalCodeLabel: 'Postal Code',
}
```

This ensures checkout never breaks for unsupported countries.

---

## Testing Scenarios

### Must Test Countries (Priority):

1. **Rwanda (RW)** - Minimal format
   - No state field should appear
   - No postal code field should appear
   - Only 5 fields required
   - Phone: +250

2. **United States (US)** - Full format
   - State field required
   - ZIP code field required
   - Validate ZIP: 12345 or 12345-6789
   - Phone: +1

3. **United Kingdom (GB)** - Postal only
   - No state field
   - Postcode required
   - Validate: SW1A 1AA format
   - Phone: +44

4. **Nigeria (NG)** - Flexible
   - State field optional
   - No postal code field
   - Phone: +234

5. **Singapore (SG)** - Postal only
   - No state field
   - 6-digit postal required
   - Phone: +65

---

## Next Steps

✅ **Part 1 Complete:** Country configuration done

**Next: Part 2 - Universal Address Form Component**
- Build main form with dynamic fields
- Implement country selector integration
- Add validation logic
- Handle conditional field rendering

**File to create:** `apps/web/src/components/checkout/universal-address-form.tsx`

---

**Status:** ✅ Ready for UI implementation
**Coverage:** 30 countries, 6 continents, 4 address formats
**Validation:** Postal + phone patterns for major markets
**Localization:** Country-specific labels and formats
