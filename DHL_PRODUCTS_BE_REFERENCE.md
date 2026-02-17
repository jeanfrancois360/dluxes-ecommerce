# DHL Products BE - Official Reference Table

**Source:** DHL Products BE (Screenshot dated 5/15/2019)
**Account:** Belgium (BE) - Country-specific product codes

## ⚠️ Critical Finding

**Belgium uses COUNTRY-SPECIFIC product codes that differ from global codes!**

| Route Type                        | Global Code | **Belgium Code** | Description         |
| --------------------------------- | ----------- | ---------------- | ------------------- |
| European Union                    | U           | **U**            | Same (Universal) ✅ |
| International NON-EU Non-document | P           | **S**            | Different! ⚠️       |
| Domestic Express                  | N           | **N**            | Same (Universal) ✅ |

### Key Insight

When shipping **FROM Belgium**, you MUST use Belgium-specific codes:

- ❌ **DON'T** use global code 'P' for international shipments
- ✅ **DO** use Belgium code 'S' for international NON-EU shipments

---

## Complete Product Code Table

### EXPRESS 9:00

| Destination                | Content Code | BE Code | Global Code |
| -------------------------- | ------------ | ------- | ----------- |
| EU+ International Document | TDK          | **K**   | K           |
| International Non-Document | TDE          | **C**   | E           |

### EXPRESS 10:30 (Only to USA!)

| Destination                | Content Code | BE Code | Global Code |
| -------------------------- | ------------ | ------- | ----------- |
| International Document     | TDL          | **X**   | L           |
| International Non-Document | TDM          | **X**   | M           |

### EXPRESS 12:00

| Destination                 | Content Code | BE Code | Global Code |
| --------------------------- | ------------ | ------- | ----------- |
| EU + International Document | TDT          | **T**   | T           |
| International Non-Document  | TDY          | **Y**   | Y           |

### EXPRESS WORLDWIDE

| Destination                    | Content Code | BE Code  | Global Code |
| ------------------------------ | ------------ | -------- | ----------- |
| **European Union**             | ECX          | **U** ✅ | U           |
| International Document         | DOX          | **D**    | D           |
| **International Non-document** | WPX          | **S** ⚠️ | **P**       |

**NOTE:** This is the key difference! Belgium uses 'S' where global uses 'P'.

### DOMESTIC

| Service       | Content Code | BE Code   | Global Code |
| ------------- | ------------ | --------- | ----------- |
| EXPRESS 9:00  | DOK          | **I** (i) | I           |
| EXPRESS 12:00 | DOT          | **1**     | 1           |
| EXPRESS 18:00 | DOM          | **N** ✅  | N           |

### ECONOMY SELECT

| Destination                | Content Code | BE Code | Global Code |
| -------------------------- | ------------ | ------- | ----------- |
| European Union             | ESU          | **W**   | W           |
| International Non-document | ESI          | **H**   | H           |

### EXPRESS ENVELOPPE

| Destination                    | Content Code | BE Code | Global Code |
| ------------------------------ | ------------ | ------- | ----------- |
| Domestic + EU + Int'l Document | XPD          | **E**   | X           |

### MEDICAL EXPRESS

| Destination                | Content Code | BE Code | Global Code |
| -------------------------- | ------------ | ------- | ----------- |
| EU + International Doc     | CMX          | **O**   | C           |
| International Non-document | WMX          | **Q**   | Q           |

### GLOBAL MAIL BUSINESS

| Destination    | Content Code | BE Code | Global Code |
| -------------- | ------------ | ------- | ----------- |
| European Union | GMB          | **R**   | R           |

---

## Routing Logic for Belgium

### Belgium → Belgium (Domestic)

```
Product Code: N (DHL Express Domestic 18:00)
Alternative: I (EXPRESS 9:00), 1 (EXPRESS 12:00)
```

### Belgium → France (International EU)

```
Product Code: U (DHL Express Worldwide - European Union) ✅
Alternative: W (Economy Select), T (EXPRESS 12:00 Document)
```

### Belgium → USA (International NON-EU)

```
Product Code: S (DHL Express Worldwide Non-document) ✅
NOT 'P' - Belgium-specific code!
Alternative: X (EXPRESS 10:30 to USA only)
```

### Belgium → UK (International NON-EU, post-Brexit)

```
Product Code: S (DHL Express Worldwide Non-document) ✅
NOT 'P' and NOT 'U' (UK left EU)
```

---

## Code Implementation

### Updated Product Code Mappings

```typescript
// Belgium-specific routing
if (originCountry === 'BE') {
  if (destinationCountry === 'BE') {
    return 'N'; // Domestic
  }

  if (euCountries.includes(destinationCountry)) {
    return 'U'; // International EU
  }

  return 'S'; // International NON-EU (Belgium-specific!)
}
```

### Product Code Descriptions

```typescript
const productCodes = {
  // Universal codes
  U: 'DHL Express Worldwide (EU)',
  N: 'DHL Express Domestic',

  // Belgium-specific codes
  S: 'DHL Express Worldwide Non-document (BE)', // Global equivalent: P
  C: 'DHL Express 9:00 Non-document (BE)',
  T: 'DHL Express 12:00 Document (BE)',
  X: 'DHL Express 10:30 to USA (BE)',
  E: 'DHL Express Enveloppe (BE)',
  O: 'DHL Medical Express Document (BE)',
  Q: 'DHL Medical Express Non-document (BE)',
  R: 'DHL Global Mail Business (BE)',

  // Global codes (may not work for Belgium)
  P: 'DHL Express Worldwide (NON-EU)', // Use 'S' for Belgium!
  D: 'DHL Express Worldwide Document',
  K: 'DHL Express 9:00',
  Y: 'DHL Express 12:00',
};
```

---

## Testing Matrix

| Origin | Destination | Expected Code | Reason                               |
| ------ | ----------- | ------------- | ------------------------------------ |
| BE     | BE          | **N**         | Domestic                             |
| BE     | FR          | **U**         | International EU                     |
| BE     | DE          | **U**         | International EU                     |
| BE     | US          | **S**         | International NON-EU (BE-specific)   |
| BE     | GB          | **S**         | International NON-EU (post-Brexit)   |
| BE     | CH          | **S**         | International NON-EU (not EU member) |

---

## Common Mistakes to Avoid

1. ❌ **Using 'P' for Belgium → USA**
   - Global code 'P' → Belgium uses 'S'

2. ❌ **Using 'U' for Belgium → UK**
   - UK left EU, use 'S' not 'U'

3. ❌ **Using 'N' for Belgium → France**
   - 'N' is domestic only (same country)
   - Use 'U' for EU cross-border

4. ❌ **Treating all EU-to-EU as domestic**
   - BE → FR is **International EU**, not domestic
   - Different countries = international, even within EU

---

## Rating API vs Manual Selection

The **DHL Rating API** should return available products for your account.
If Rating API fails, the code falls back to manual product code selection using this table.

**Best Practice:**

1. **Primary:** Use Rating API to get available products ✅
2. **Fallback:** Use country-specific codes from this table
3. **Retry:** Try multiple product codes from Rating API response

---

## References

- **DHL Products BE Table:** Screenshot dated 5/15/2019
- **DHL Support Email:** Clarified BE → FR requires 'U' not 'P'
- **DHL MyDHL API:** https://developer.dhl.com/api-reference/mydhl-api-dhl-express

---

**Last Updated:** February 13, 2026
**Document Version:** 1.0 - Based on official DHL Products BE table
