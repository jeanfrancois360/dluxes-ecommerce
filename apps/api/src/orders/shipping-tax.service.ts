import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { DhlRatesService } from '../integrations/dhl/dhl-rates.service';
import { EasyPostRatesService } from '../integrations/easypost/easypost-rates.service';
import { SendcloudService } from '../integrations/sendcloud/sendcloud.service';
import { EasyshipService } from '../integrations/easyship/easyship.service';
import { ShippingService } from '../shipping/shipping.service';
import { ShippingCacheService } from '../shipping/shipping-cache.service';
import { estimateParcelInches } from '../shipping/parcel-estimator';
import { withRetry } from '../shipping/retry';
import { GelatoOrdersService } from '../gelato/gelato-orders.service';
import { PrismaService } from '../database/prisma.service';

// Map full country names → ISO 2-letter codes (for stores that store full names)
const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  Afghanistan: 'AF',
  Albania: 'AL',
  Algeria: 'DZ',
  Australia: 'AU',
  Austria: 'AT',
  Belgium: 'BE',
  Brazil: 'BR',
  Canada: 'CA',
  China: 'CN',
  'Czech Republic': 'CZ',
  Denmark: 'DK',
  Finland: 'FI',
  France: 'FR',
  Germany: 'DE',
  Ghana: 'GH',
  Greece: 'GR',
  'Hong Kong': 'HK',
  India: 'IN',
  Indonesia: 'ID',
  Ireland: 'IE',
  Israel: 'IL',
  Italy: 'IT',
  Japan: 'JP',
  Kenya: 'KE',
  Mexico: 'MX',
  Morocco: 'MA',
  Netherlands: 'NL',
  'New Zealand': 'NZ',
  Nigeria: 'NG',
  Norway: 'NO',
  Pakistan: 'PK',
  Poland: 'PL',
  Portugal: 'PT',
  Romania: 'RO',
  Russia: 'RU',
  Rwanda: 'RW',
  'Saudi Arabia': 'SA',
  Singapore: 'SG',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  Spain: 'ES',
  Sweden: 'SE',
  Switzerland: 'CH',
  Turkey: 'TR',
  Uganda: 'UG',
  Ukraine: 'UA',
  'United Arab Emirates': 'AE',
  'United Kingdom': 'GB',
  'United States': 'US',
  Vietnam: 'VN',
};

function normalizeCountryCode(country: string): string {
  if (!country) return country;
  // Already a 2-letter code
  if (country.length === 2) return country.toUpperCase();
  // Try exact match in map
  const iso = COUNTRY_NAME_TO_ISO[country];
  if (iso) return iso;
  // Try case-insensitive
  const lower = country.toLowerCase();
  const found = Object.entries(COUNTRY_NAME_TO_ISO).find(([k]) => k.toLowerCase() === lower);
  return found ? found[1] : country;
}

export interface ShippingAddress {
  country: string;
  state?: string;
  postalCode?: string;
  city?: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: number;
  carrier?: string;
  /** Which provider tier supplied this rate (easypost | sendcloud | easyship | dhl | zone | manual | gelato) */
  source?: string;
  /** True when the method requires the customer to select a service point (e.g. DPD Shop) */
  requiresServicePoint?: boolean;
  /** Native currency the provider returned this rate in (e.g. 'EUR' for SendCloud/DHL, 'USD' for EasyPost/EasyShip/Manual) */
  sourceCurrency?: string;
  /**
   * For mixed carts (Gelato POD + physical items): the Gelato portion of the shipping cost,
   * always in USD. Kept separate so it can be converted independently from the physical
   * shipping rate (which may be in a different source currency such as EUR).
   */
  gelatoCostUsd?: number;
}

export interface TaxCalculation {
  rate: number;
  amount: number;
  jurisdiction: string;
  breakdown?: {
    state?: number;
    county?: number;
    city?: number;
    special?: number;
  };
}

/** businessType values that indicate the seller handles their own tax obligations */
const REGISTERED_BUSINESS_TYPES = ['corporation', 'registered_business'];

export type SellerTaxHandling = 'NEXTPIK_COLLECTS' | 'PRICE_INCLUSIVE';

export interface SellerTaxBreakdown {
  storeId: string;
  storeName: string;
  businessType: string | null;
  taxHandling: SellerTaxHandling;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  jurisdiction: string;
}

export interface TaxCalculationWithBreakdown extends TaxCalculation {
  sellerBreakdown: SellerTaxBreakdown[];
  hasTaxInclusiveItems: boolean;
  hasTaxableItems: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  weight?: number; // in grams
  fulfillmentType?: 'SELF_FULFILLED' | 'GELATO_POD';
  gelatoProductUid?: string;
  storeId?: string; // Required for Gelato quotes (seller-specific)
}

@Injectable()
export class ShippingTaxService {
  private readonly logger = new Logger(ShippingTaxService.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly dhlRatesService: DhlRatesService,
    private readonly easyPostRatesService: EasyPostRatesService,
    private readonly sendcloudService: SendcloudService,
    private readonly easyshipService: EasyshipService,
    private readonly shippingService: ShippingService,
    private readonly shippingCache: ShippingCacheService,
    private readonly gelatoOrdersService: GelatoOrdersService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Get seller's origin address from Store
   * CRITICAL: This fixes EasyPost to use actual seller address instead of platform default
   */
  private async getSellerOriginAddress(items: CartItem[]): Promise<{
    street1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null> {
    try {
      // Get first item's store ID
      const firstItem = items?.[0];
      const storeId = firstItem?.storeId;

      if (!storeId) {
        this.logger.warn('[Seller Address] No storeId found in items, using platform default');
        return null;
      }

      // Fetch store with embedded address fields
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: {
          address1: true,
          city: true,
          province: true,
          country: true,
          postalCode: true,
        },
      });

      if (!store || !store.address1 || !store.city || !store.country) {
        this.logger.warn(
          `[Seller Address] Store ${storeId} has incomplete address, using platform default`
        );
        return null;
      }

      return {
        street1: store.address1,
        city: store.city,
        state: store.province || '',
        zip: store.postalCode || '',
        country: normalizeCountryCode(store.country),
      };
    } catch (err) {
      this.logger.warn(
        `[Seller Address] Could not get seller address: ${err.message}, using platform default`
      );
      return null;
    }
  }

  /**
   * Get seller country code from items
   * Used for geo-routing logic (Sendcloud/Easyship/EasyPost)
   */
  private async getSellerCountry(items: CartItem[]): Promise<string | null> {
    const address = await this.getSellerOriginAddress(items);
    return address?.country || null;
  }

  /**
   * Calculate available shipping options based on address and cart
   * CASCADE FALLBACK: Gelato (POD) → Self-Pickup → SendCloud → EasyPost → EasyShip → DHL → Zones → Manual
   *
   * - TIER 0 (Gelato): For POD items, gets real-time shipping quotes
   *   - Pure POD carts: Returns Gelato shipping only
   *   - Mixed carts: Combines Gelato cost + fallback shipping for regular items
   * - TIER 0.5 (Self-Pickup): If store has pickup enabled and customer is within radius
   *   - Returns immediately if available (no need to check other providers)
   *   - Simple radius check: same zip code or city+state match
   * - TIER 1 (SendCloud): EU-origin sellers (AT,BE,CZ,DK,FR,DE,IT,NL,PL,PT,ES,SE,GB)
   *   - Geo-gated: only fires when seller country is in SendCloud's supported list
   * - TIER 2 (EasyPost): Global multi-carrier (USPS, UPS, FedEx, DHL, Canada Post, etc.)
   *   - No geo-gate: fires for all seller origins, falls back gracefully if no rates returned
   * - TIER 3 (EasyShip): Global fallback for remaining seller countries (AU,BE,CA,FR,DE,HK,NL,SG,US,GB)
   * - TIER 4 (DHL): DHL Express only (if dhl_enabled setting is true)
   * - TIER 5 (Zones/Manual): Final fallback based on settings
   */
  async calculateShippingOptions(
    address: ShippingAddress,
    items: CartItem[],
    subtotal: number
  ): Promise<ShippingOption[]> {
    // Normalize destination country to ISO 2-letter code (addresses may store full names)
    address = { ...address, country: normalizeCountryCode(address.country) };

    // TIER 0: Try Gelato for POD items first (highest priority for POD)
    let gelatoCost = 0;
    let podItems: CartItem[] = [];
    let nonPodItems: CartItem[] = [];

    try {
      const gelatoResult = await this.calculateGelatoShipping(address, items);

      // Separate POD and non-POD items (needed for both success and null-result paths)
      podItems = items.filter(
        (item) => item.fulfillmentType === 'GELATO_POD' && item.gelatoProductUid
      );
      nonPodItems = items.filter((item) => item.fulfillmentType !== 'GELATO_POD');
      const isPurePodCart = podItems.length > 0 && nonPodItems.length === 0;

      if (gelatoResult && gelatoResult.amount > 0) {
        if (isPurePodCart) {
          // Pure POD cart: Return only Gelato shipping options
          this.logger.log(
            `[Gelato Shipping] Pure POD cart detected. Using Gelato rates: $${gelatoResult.amount.toFixed(2)}`
          );

          return [
            {
              id: 'gelato-standard',
              name: 'Gelato POD Shipping',
              description: '5-7 business days (Print-on-Demand)',
              price: gelatoResult.amount,
              estimatedDays: 7,
              carrier: 'Gelato',
              source: 'gelato',
            },
          ];
        } else {
          // Mixed cart: Store Gelato cost to add to fallback options later
          gelatoCost = gelatoResult.amount;
          this.logger.log(
            `[Gelato Shipping] Mixed cart detected. Gelato portion: $${gelatoCost.toFixed(2)}, ` +
              `calculating fallback shipping for ${nonPodItems.length} non-POD items...`
          );
        }
      } else if (gelatoResult === null && isPurePodCart) {
        // Pure POD cart but Gelato API unavailable (seller unconfigured or API error):
        // Return a Gelato-branded fallback estimate instead of EU/global carrier rates.
        this.logger.warn(
          '[Gelato Shipping] Pure POD cart — no Gelato quote available, returning POD fallback estimate'
        );
        return [
          {
            id: 'gelato-fallback-standard',
            name: 'Gelato POD Shipping',
            description: '5-7 business days (Print-on-Demand) — estimated rate',
            price: 9.99,
            estimatedDays: 7,
            carrier: 'Gelato',
            source: 'gelato',
          },
          {
            id: 'gelato-fallback-express',
            name: 'Gelato POD Express',
            description: '3-5 business days (Print-on-Demand) — estimated rate',
            price: 19.99,
            estimatedDays: 5,
            carrier: 'Gelato',
            source: 'gelato',
          },
        ];
      }
    } catch (error) {
      this.logger.warn(`[Gelato Shipping] Failed to get Gelato quote: ${error.message}`);

      // If ALL items are POD items, returning EU/global carrier rates would be misleading.
      // Use a hardcoded Gelato POD fallback estimate instead of cascading to SendCloud/EasyPost.
      const allArePod = items.every(
        (item) => item.fulfillmentType === 'GELATO_POD' && item.gelatoProductUid
      );
      if (allArePod) {
        this.logger.warn(
          '[Gelato Shipping] Pure POD cart — Gelato API unavailable, returning POD fallback estimate'
        );
        return [
          {
            id: 'gelato-fallback-standard',
            name: 'Gelato POD Shipping',
            description: '5-7 business days (Print-on-Demand) — estimated rate',
            price: 9.99,
            estimatedDays: 7,
            carrier: 'Gelato',
            source: 'gelato',
          },
          {
            id: 'gelato-fallback-express',
            name: 'Gelato POD Express',
            description: '3-5 business days (Print-on-Demand) — estimated rate',
            price: 19.99,
            estimatedDays: 5,
            carrier: 'Gelato',
            source: 'gelato',
          },
        ];
      }

      // Mixed cart or non-POD cart: continue cascade with all items
      nonPodItems = items;
    }

    // For mixed carts, calculate weight of non-POD items only
    // For non-POD carts, use all items
    const itemsForShipping = gelatoCost > 0 ? nonPodItems : items;
    const totalWeightGrams = itemsForShipping.reduce(
      (sum, item) => sum + (item.weight || 500) * item.quantity,
      0
    );
    const totalWeightKg = totalWeightGrams / 1000;
    const totalWeightOz = totalWeightGrams / 28.35; // Convert to ounces for EasyPost

    // Helper function to tag shipping options with the Gelato POD cost for mixed carts.
    // The Gelato cost is always in USD, so we store it separately (gelatoCostUsd) instead of
    // baking it into price — this lets calculateTotals convert the two amounts independently
    // before summing (avoids adding USD to EUR when the carrier rate is EUR-denominated).
    const addGelatoCost = (options: ShippingOption[]): ShippingOption[] => {
      if (gelatoCost === 0) return options;

      return options.map((option) => ({
        ...option,
        name: `${option.name} + Gelato POD`,
        description: `${option.description} (includes POD shipping)`,
        // price stays in its native sourceCurrency; gelatoCostUsd is always USD
        gelatoCostUsd: (option.gelatoCostUsd || 0) + gelatoCost,
      }));
    };

    // Helper: apply free-shipping threshold to API-sourced rates.
    // When the order qualifies, the cheapest option is set to $0 (standard tier).
    // Express / premium options remain at cost — same behaviour as manual rates.
    const isFreeShippingEnabled = await this.shippingService.isFreeShippingEnabled();
    const freeShippingThreshold = isFreeShippingEnabled
      ? await this.shippingService.getFreeShippingThreshold()
      : Infinity;
    const isFreeShippingEligible = isFreeShippingEnabled && subtotal >= freeShippingThreshold;

    const applyFreeShipping = (options: ShippingOption[]): ShippingOption[] => {
      if (!isFreeShippingEligible || options.length === 0) return options;
      const minPrice = Math.min(...options.map((o) => o.price));
      return options.map((o) => (o.price === minPrice ? { ...o, price: 0 } : o));
    };

    // TIER 0.5: Try Self-Pickup (if stores have pickup enabled)
    try {
      const pickupOptions = await this.calculatePickupOptions(address, items, subtotal);

      if (pickupOptions.length > 0) {
        this.logger.log(`[Pickup] Found ${pickupOptions.length} pickup option(s)`);
        // Return pickup options BEFORE other shipping options
        // Pickup doesn't combine with Gelato (pickup is for physical stores only)
        return pickupOptions;
      }
    } catch (error) {
      this.logger.warn(`[Pickup] Failed, continuing to shipping providers: ${error.message}`);
    }

    // Helper: normalize setting value to boolean (handles both JS boolean and string "true"/"false")
    const isEnabled = (value: any): boolean =>
      value === true || value === 'true' || value === 1 || value === '1';

    // Helper: safely get a setting — returns null instead of throwing if key doesn't exist
    const getSetting = async (key: string) => {
      try {
        return await this.settingsService.getSetting(key);
      } catch {
        this.logger.warn(`[Cascade] Setting '${key}' not found in DB — treating as disabled`);
        return null;
      }
    };

    // Get seller country ONCE for geo-routing decisions
    const sellerCountry = await this.getSellerCountry(itemsForShipping);
    this.logger.log(`[Geo-Routing] Seller country detected: ${sellerCountry || 'unknown'}`);

    // TIER 1: SendCloud (EU sellers: AT,BE,CZ,DK,FR,DE,IT,NL,PL,PT,ES,SE,GB)
    const sendcloudEnabled = await getSetting('sendcloud_enabled');
    if (
      isEnabled(sendcloudEnabled?.value) &&
      sellerCountry &&
      this.sendcloudService.isCountrySupported(sellerCountry)
    ) {
      this.logger.log(`[SendCloud] Seller country ${sellerCountry} supported, attempting rates...`);
      try {
        const scCacheKey = this.shippingCache.buildKey(
          'sendcloud',
          sellerCountry,
          address.country,
          address.postalCode || '',
          totalWeightOz
        );
        let sendcloudOptions = await this.shippingCache.get<ShippingOption[]>(scCacheKey);
        if (sendcloudOptions) {
          this.logger.log('[SendCloud] Cache hit — skipping API call');
        } else {
          sendcloudOptions = await this.calculateSendcloudShippingOptions(
            address,
            itemsForShipping,
            totalWeightGrams
          );
          if (sendcloudOptions.length > 0)
            await this.shippingCache.set(scCacheKey, sendcloudOptions);
        }

        if (sendcloudOptions.length > 0) {
          this.logger.log(
            `[SendCloud] ✅ SUCCESS - Using SendCloud rates (${sendcloudOptions.length} options)`
          );
          return addGelatoCost(applyFreeShipping(sendcloudOptions));
        } else {
          this.logger.warn('[SendCloud] No rates returned, falling back to next provider...');
        }
      } catch (error) {
        this.logger.warn(`[SendCloud] Failed: ${error.message}. Falling back to next provider...`);
      }
    } else {
      if (!isEnabled(sendcloudEnabled?.value)) {
        this.logger.log('[SendCloud] Disabled, skipping...');
      } else {
        this.logger.log(
          `[SendCloud] Skipping - seller country ${sellerCountry} not in EU supported list`
        );
      }
    }

    // TIER 2: EasyPost (global multi-carrier — USPS, UPS, FedEx, DHL, Canada Post, etc.)
    // Works for any origin country served by EasyPost carriers. Falls back gracefully if no rates.
    const easypostEnabled = await getSetting('easypost_enabled');
    if (isEnabled(easypostEnabled?.value)) {
      this.logger.log(
        `[EasyPost] Seller country ${sellerCountry || 'unknown'} — attempting to fetch rates...`
      );
      try {
        const epCacheKey = this.shippingCache.buildKey(
          'easypost',
          sellerCountry || 'unknown',
          address.country,
          address.postalCode || '',
          totalWeightOz
        );
        let easypostOptions = await this.shippingCache.get<ShippingOption[]>(epCacheKey);
        if (easypostOptions) {
          this.logger.log('[EasyPost] Cache hit — skipping API call');
        } else {
          easypostOptions = await this.calculateEasyPostShippingOptions(
            address,
            itemsForShipping,
            totalWeightOz
          );
          if (easypostOptions.length > 0) await this.shippingCache.set(epCacheKey, easypostOptions);
        }

        if (easypostOptions.length > 0) {
          this.logger.log(
            `[EasyPost] ✅ SUCCESS - Using EasyPost rates (${easypostOptions.length} options)`
          );
          return addGelatoCost(applyFreeShipping(easypostOptions));
        } else {
          this.logger.warn('[EasyPost] No rates returned, falling back to next provider...');
        }
      } catch (error) {
        this.logger.warn(`[EasyPost] Failed: ${error.message}. Falling back to next provider...`);
      }
    } else {
      this.logger.log('[EasyPost] Disabled, skipping to next provider...');
    }

    // TIER 3: EasyShip (Regional fallback for APAC markets: AU,BE,CA,FR,DE,HK,NL,SG,US,GB)
    const easyshipEnabled = await getSetting('easyship_enabled');
    if (
      isEnabled(easyshipEnabled?.value) &&
      sellerCountry &&
      this.easyshipService.isCountrySupported(sellerCountry)
    ) {
      this.logger.log(`[EasyShip] Seller country ${sellerCountry} supported, attempting rates...`);
      try {
        const esCacheKey = this.shippingCache.buildKey(
          'easyship',
          sellerCountry,
          address.country,
          address.postalCode || '',
          totalWeightOz
        );
        let easyshipOptions = await this.shippingCache.get<ShippingOption[]>(esCacheKey);
        if (easyshipOptions) {
          this.logger.log('[EasyShip] Cache hit — skipping API call');
        } else {
          easyshipOptions = await this.calculateEasyshipShippingOptions(
            address,
            itemsForShipping,
            totalWeightKg
          );
          if (easyshipOptions.length > 0) await this.shippingCache.set(esCacheKey, easyshipOptions);
        }

        if (easyshipOptions.length > 0) {
          this.logger.log(
            `[EasyShip] ✅ SUCCESS - Using EasyShip rates (${easyshipOptions.length} options)`
          );
          return addGelatoCost(applyFreeShipping(easyshipOptions));
        } else {
          this.logger.warn('[EasyShip] No rates returned, falling back to next provider...');
        }
      } catch (error) {
        this.logger.warn(`[EasyShip] Failed: ${error.message}. Falling back to next provider...`);
      }
    } else {
      if (!isEnabled(easyshipEnabled?.value)) {
        this.logger.log('[EasyShip] Disabled, skipping...');
      } else {
        this.logger.log(
          `[EasyShip] Skipping - seller country ${sellerCountry} not in supported APAC list`
        );
      }
    }

    // TIER 4: DHL Express — worldwide via Express Worldwide Export (BE origin) or Third Country service (all other origins)
    const dhlEnabled = await getSetting('dhl_enabled');
    const dhlKey = process.env.DHL_EXPRESS_API_KEY;
    if (isEnabled(dhlEnabled?.value) && dhlKey) {
      this.logger.log(
        `[DHL] Seller country is ${sellerCountry || 'unknown'} — attempting to fetch rates...`
      );
      try {
        // Use seller's actual origin address; fall back to platform settings if unavailable
        let originCountry = sellerCountry || 'BE';
        let originPostalCode = '';
        let originCity = '';

        const sellerAddr = await this.getSellerOriginAddress(itemsForShipping);
        if (sellerAddr) {
          originCountry = sellerAddr.country || originCountry;
          originPostalCode = sellerAddr.zip || '';
          originCity = sellerAddr.city || '';
        } else {
          try {
            const postalSetting = await this.settingsService.getSetting('origin_postal_code');
            const citySetting = await this.settingsService.getSetting('origin_city');
            originPostalCode = String(postalSetting.value) || '';
            originCity = String(citySetting.value) || '';
          } catch (error) {
            this.logger.warn(
              '[DHL] Failed to get origin address from settings, using empty defaults'
            );
          }
        }

        const dhlCacheKey = this.shippingCache.buildKey(
          'dhl',
          originCountry,
          address.country,
          address.postalCode || '',
          totalWeightOz
        );
        let dhlMapped = await this.shippingCache.get<ShippingOption[]>(dhlCacheKey);
        if (dhlMapped) {
          this.logger.log('[DHL] Cache hit — skipping API call');
        } else {
          const dhlRates = await withRetry(
            () =>
              this.dhlRatesService.getSimplifiedRates({
                originCountryCode: originCountry,
                originPostalCode: originPostalCode,
                originCityName: originCity,
                destinationCountryCode: address.country,
                destinationPostalCode: address.postalCode || '',
                destinationCityName: address.city,
                weight: Math.max(0.5, totalWeightKg), // Minimum 0.5kg
              }),
            { label: 'DHL' }
          );
          dhlMapped =
            dhlRates?.map((rate) => ({
              id: rate.id,
              name: rate.name,
              description: rate.description,
              price: rate.price,
              estimatedDays: rate.estimatedDays,
              carrier: 'DHL Express',
              source: 'dhl',
              sourceCurrency: rate.currency || 'EUR',
            })) ?? [];
          if (dhlMapped.length > 0) await this.shippingCache.set(dhlCacheKey, dhlMapped);
        }

        if (dhlMapped.length > 0) {
          this.logger.log(
            `[DHL] ✅ SUCCESS - Using DHL Express rates (${dhlMapped.length} options)`
          );
          return addGelatoCost(applyFreeShipping(dhlMapped));
        } else {
          this.logger.warn('[DHL] No rates available, falling back to next provider...');
        }
      } catch (err) {
        this.logger.warn(
          `[DHL] Failed to fetch rates: ${err.message}. Falling back to next provider...`
        );
      }
    } else {
      if (!dhlKey) {
        this.logger.log('[DHL] Not configured (missing DHL_EXPRESS_API_KEY), skipping...');
      } else {
        this.logger.log('[DHL] Disabled, skipping to next provider...');
      }
    }

    // TIER 5: Zones / Manual (final fallback)
    // Only reaches here if: mode is 'manual', OR mode is 'hybrid' and DHL failed
    const fallbackOptions = await this.getZonesOrManualRates(address, subtotal, totalWeightKg);
    return addGelatoCost(fallbackOptions);
  }

  /**
   * Get shipping rates from Zones, falling back to Manual if no zones match
   * CASCADE: Zones → Manual
   */
  private async getZonesOrManualRates(
    address: ShippingAddress,
    subtotal: number,
    weightKg?: number
  ): Promise<ShippingOption[]> {
    try {
      // Try zone-based shipping
      const zoneOptions = await this.shippingService.getShippingOptions(
        {
          country: address.country,
          state: address.state,
          city: address.city,
          postalCode: address.postalCode,
        },
        subtotal,
        weightKg
      );

      if (zoneOptions && zoneOptions.length > 0) {
        this.logger.log(`[Zones] Using zone-based rates (${zoneOptions.length} options)`);
        // Convert zone options to our ShippingOption format
        return zoneOptions.map((zone) => ({
          id: zone.id,
          name: zone.name,
          description:
            typeof zone.estimatedDays === 'object'
              ? `${zone.estimatedDays.min}-${zone.estimatedDays.max} business days`
              : `${zone.estimatedDays} business days`,
          price: zone.price,
          estimatedDays:
            typeof zone.estimatedDays === 'object' ? zone.estimatedDays.max : zone.estimatedDays,
          carrier: (zone as any).zone || 'Standard',
          source: 'zone',
        }));
      }
    } catch (error) {
      this.logger.warn(`[Zones] Failed or no zones configured: ${error.message}`);
    }

    // STEP 3: Fall back to manual rates
    this.logger.log('[Manual] Using manual/settings-based rates (final fallback)');
    // Manual rates need items array for weight-based pricing
    const items: CartItem[] = [
      {
        productId: 'checkout',
        quantity: 1,
        price: subtotal,
        weight: (weightKg || 1) * 1000, // Convert back to grams
      },
    ];
    return this.calculateManualShippingOptions(address, items, subtotal);
  }

  /**
   * Calculate shipping options using EasyPost API
   * UPDATED: Now uses actual seller address instead of platform settings
   */
  private async calculateEasyPostShippingOptions(
    address: ShippingAddress,
    items: CartItem[],
    weightOz: number
  ): Promise<ShippingOption[]> {
    // Check if EasyPost is enabled
    if (!this.easyPostRatesService) {
      return [];
    }

    // Build fromAddress — priority: seller address → platform settings → emergency fallback
    const sellerAddress = await this.getSellerOriginAddress(items);

    let fromAddress: { street1: string; city: string; state: string; zip: string; country: string };

    if (sellerAddress) {
      fromAddress = sellerAddress;
      this.logger.log(
        `[EasyPost] Using seller address: ${sellerAddress.city}, ${sellerAddress.country}`
      );
    } else {
      // Try platform origin settings (configured in System Settings → Shipping)
      this.logger.log('[EasyPost] No seller address — reading platform origin settings...');
      try {
        const [street1S, cityS, stateS, postalS, countryS] = await Promise.all([
          this.settingsService.getSetting('origin_street1'),
          this.settingsService.getSetting('origin_city'),
          this.settingsService.getSetting('origin_state'),
          this.settingsService.getSetting('origin_postal_code'),
          this.settingsService.getSetting('origin_country'),
        ]);

        if (countryS?.value) {
          fromAddress = {
            street1: String(street1S?.value || '1 Platform St'),
            city: String(cityS?.value || ''),
            state: String(stateS?.value || ''),
            zip: String(postalS?.value || ''),
            country: String(countryS.value),
          };
          this.logger.log(
            `[EasyPost] Using platform origin: ${fromAddress.city}, ${fromAddress.country}`
          );
        } else {
          // Absolute last resort — log prominently so ops can fix settings
          this.logger.warn(
            '[EasyPost] origin_country not configured in System Settings. ' +
              'Rate quotes will use US as origin — configure origin_country to fix this.'
          );
          fromAddress = { street1: '1 Platform St', city: '', state: '', zip: '', country: 'US' };
        }
      } catch (error) {
        this.logger.warn(
          `[EasyPost] Could not read platform origin settings: ${error.message}. Using US fallback.`
        );
        fromAddress = { street1: '1 Platform St', city: '', state: '', zip: '', country: 'US' };
      }
    }

    // Prepare destination address
    const toAddress = {
      street1: '123 Customer St', // Placeholder, not needed for rate shopping
      city: address.city || 'Unknown',
      state: address.state || '',
      zip: address.postalCode || '',
      country: address.country || 'US',
    };

    // Estimate parcel dimensions from total weight.
    // Using realistic tier-based box sizes prevents carriers from applying
    // dimensional weight penalties silently when the flat 10×8×4 default
    // is smaller than what the actual weight implies.
    const parcelDims = estimateParcelInches(weightOz);
    const parcel = {
      ...parcelDims,
      weight: Math.max(1, weightOz), // Minimum 1oz
    };

    // For international shipments, pass customs info so EasyPost returns accurate
    // rates and doesn't drop carriers that require it (e.g. DHL International).
    // We use generic descriptions — product names are not available in CartItem.
    const isInternational = fromAddress.country !== toAddress.country;
    const customsInfo = isInternational
      ? {
          contentsType: 'merchandise' as const,
          eelPfc: 'NOEEI 30.37(a)',
          nonDeliveryOption: 'return',
          items: items.map((item) => ({
            description: 'Merchandise',
            quantity: item.quantity,
            value: item.price,
            // EasyPost expects weight in ounces; CartItem stores grams
            weight: Math.max(1, Math.round((item.weight || 500) / 28.35)),
            originCountry: fromAddress.country || 'US',
          })),
        }
      : undefined;

    try {
      // Get rates from EasyPost with 10-second timeout + 1 retry on transient errors.
      // The timeout applies per-attempt so a single hung connection can add at most
      // 10s + 300ms backoff + 10s = ~20.3s before falling through to the next tier.
      const fetchWithTimeout = () => {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('EasyPost request timed out after 10 seconds')), 10000);
        });
        return Promise.race([
          this.easyPostRatesService.getLowestRate(
            { fromAddress, toAddress, parcel, customsInfo },
            undefined, // no carrier filter
            undefined // no service filter
          ),
          timeoutPromise,
        ]);
      };

      const easypostResult = await withRetry(fetchWithTimeout, { label: 'EasyPost' });

      // Return top 3 rates (cheapest to most expensive)
      const topRates = easypostResult.allRates.slice(0, 3);

      return topRates.map((rate) => ({
        id: rate.id,
        name: `${rate.carrier} ${rate.service}`,
        description: rate.deliveryDays
          ? `${rate.deliveryDays} business days`
          : 'Estimated delivery time varies',
        price: rate.rate,
        estimatedDays: rate.deliveryDays || 7,
        carrier: rate.carrier,
        source: 'easypost',
        sourceCurrency: 'USD',
      }));
    } catch (error) {
      this.logger.error('EasyPost rate fetch failed:', error.message);
      // Throw the actual error so it can be caught and reported properly
      throw new Error(`Failed to fetch EasyPost rates: ${error.message}`);
    }
  }

  /**
   * Calculate shipping options using Sendcloud API (EU sellers)
   * Supports: AT,BE,FR,DE,IT,NL,ES,GB,CZ,DK,PL,PT,SE
   */
  private async calculateSendcloudShippingOptions(
    address: ShippingAddress,
    items: CartItem[],
    weightGrams: number
  ): Promise<ShippingOption[]> {
    if (!this.sendcloudService.isConfigured()) {
      throw new Error('Sendcloud is not configured');
    }

    // Get seller country
    const sellerCountry = await this.getSellerCountry(items);
    if (!sellerCountry) {
      throw new Error('Cannot determine seller country for Sendcloud');
    }

    try {
      const rates = await withRetry(
        () =>
          this.sendcloudService.getRates({
            fromCountry: sellerCountry,
            toCountry: address.country,
            weightGrams: Math.max(100, weightGrams), // Minimum 100g
            items: items.map((item) => ({
              name: `Item ${item.productId}`,
              quantity: item.quantity,
              value: item.price,
            })),
          }),
        { label: 'SendCloud' }
      );

      // Map Sendcloud rates to ShippingOption format
      return rates.map((rate) => ({
        id: rate.serviceCode,
        name: `${rate.carrierName} - ${rate.serviceName}`,
        description: `${rate.minDeliveryDays}-${rate.maxDeliveryDays} business days`,
        price: rate.totalCharge,
        estimatedDays: rate.maxDeliveryDays,
        carrier: rate.carrierName,
        source: 'sendcloud',
        requiresServicePoint: rate.requiresServicePoint,
        sourceCurrency: 'EUR',
      }));
    } catch (error) {
      this.logger.error('Sendcloud rate fetch failed:', error.message);
      throw new Error(`Failed to fetch Sendcloud rates: ${error.message}`);
    }
  }

  /**
   * Calculate shipping options using Easyship API
   * Supports: AU,BE,CA,FR,DE,HK,NL,SG,US,GB
   */
  private async calculateEasyshipShippingOptions(
    address: ShippingAddress,
    items: CartItem[],
    weightKg: number
  ): Promise<ShippingOption[]> {
    if (!this.easyshipService.isConfigured()) {
      throw new Error('Easyship is not configured');
    }

    // Get seller country
    const sellerCountry = await this.getSellerCountry(items);
    if (!sellerCountry) {
      throw new Error('Cannot determine seller country for Easyship');
    }

    try {
      const rates = await withRetry(
        () =>
          this.easyshipService.getRates({
            fromCountry: sellerCountry,
            toCountry: address.country,
            weightKg: Math.max(0.1, weightKg), // Minimum 0.1kg
            items: items.map((item) => ({
              quantity: item.quantity,
              value: item.price,
              name: `Item ${item.productId}`,
              weightGrams: item.weight ?? 500, // carry weight for dimension estimation
            })),
          }),
        { label: 'EasyShip' }
      );

      // Map Easyship rates to ShippingOption format
      return rates.map((rate) => ({
        id: rate.serviceCode,
        name: `${rate.carrierName} - ${rate.serviceName}`,
        description: `${rate.minDeliveryDays}-${rate.maxDeliveryDays} business days`,
        price: rate.totalCharge,
        estimatedDays: rate.maxDeliveryDays,
        carrier: rate.carrierName,
        source: 'easyship',
        sourceCurrency: rate.currency || 'USD',
      }));
    } catch (error) {
      this.logger.error('Easyship rate fetch failed:', error.message);
      throw new Error(`Failed to fetch Easyship rates: ${error.message}`);
    }
  }

  /**
   * Calculate Gelato shipping quote for POD items
   * Returns null if no POD items or quote fails
   * Handles multi-seller carts by getting quotes per seller
   */
  private async calculateGelatoShipping(
    address: ShippingAddress,
    items: CartItem[]
  ): Promise<{ amount: number; storeBreakdown: Map<string, number> } | null> {
    // Filter POD items
    const podItems = items.filter(
      (item) => item.fulfillmentType === 'GELATO_POD' && item.gelatoProductUid
    );

    if (podItems.length === 0) {
      return null;
    }

    this.logger.log(`[Gelato Shipping] Found ${podItems.length} POD items in cart`);

    // Group by store (seller) to get per-seller quotes
    const storeGroups = new Map<string, CartItem[]>();
    for (const item of podItems) {
      const storeId = item.storeId || 'platform';
      if (!storeGroups.has(storeId)) {
        storeGroups.set(storeId, []);
      }
      storeGroups.get(storeId)!.push(item);
    }

    let totalShipping = 0;
    const storeBreakdown = new Map<string, number>();
    const unconfiguredStores: string[] = [];

    // Get quote for each seller's items
    for (const [storeId, storeItems] of storeGroups) {
      try {
        const gelatoQuote = await this.gelatoOrdersService.getQuote({
          items: storeItems.map((item) => ({
            productUid: item.gelatoProductUid!,
            quantity: item.quantity,
          })),
          country: address.country,
          state: address.state,
          city: address.city,
          postalCode: address.postalCode,
          storeId: storeId !== 'platform' ? storeId : undefined,
        });

        // Handle null quote (seller hasn't configured Gelato)
        if (gelatoQuote === null) {
          unconfiguredStores.push(storeId);
          this.logger.warn(
            `[Gelato Shipping] Store ${storeId} has POD items but no Gelato configuration. ` +
              `Will use fallback shipping rates.`
          );
          continue;
        }

        if (gelatoQuote?.shippingCost?.amount) {
          const shippingCost = parseFloat(gelatoQuote.shippingCost.amount);
          totalShipping += shippingCost;
          storeBreakdown.set(storeId, shippingCost);

          this.logger.log(
            `[Gelato Shipping] Quote for store ${storeId}: $${shippingCost.toFixed(2)} ` +
              `(${storeItems.length} items)`
          );
        }
      } catch (error) {
        this.logger.warn(
          `[Gelato Shipping] Failed to get quote for store ${storeId}: ${error.message}. ` +
            `Will use fallback rates.`
        );
        // Continue with other stores
      }
    }

    // If all stores failed/unconfigured, return null to use fallback
    if (storeBreakdown.size === 0) {
      this.logger.warn(
        `[Gelato Shipping] No valid Gelato quotes obtained. Using fallback shipping rates.`
      );
      return null;
    }

    // Log warning if some stores are unconfigured
    if (unconfiguredStores.length > 0) {
      this.logger.warn(
        `[Gelato Shipping] ${unconfiguredStores.length} store(s) with POD items have no Gelato config: ` +
          `${unconfiguredStores.join(', ')}. Their items use fallback rates.`
      );
    }

    return {
      amount: totalShipping,
      storeBreakdown,
    };
  }

  /**
   * Calculate manual shipping options (original logic)
   */
  private async calculateManualShippingOptions(
    address: ShippingAddress,
    items: CartItem[],
    subtotal: number
  ): Promise<ShippingOption[]> {
    // Get shipping rates from settings
    const rates = await this.settingsService.getShippingRates();

    // Calculate total weight
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 500) * item.quantity, 0);
    const isInternational = address.country !== 'US' && address.country !== 'USA';

    // Read free shipping threshold from settings (respects admin configuration)
    const isFreeShippingEnabled = await this.shippingService.isFreeShippingEnabled();
    const freeShippingThreshold = await this.shippingService.getFreeShippingThreshold();
    const isFreeShippingEligible = isFreeShippingEnabled && subtotal >= freeShippingThreshold;

    const options: ShippingOption[] = [];

    // Standard Shipping
    let standardPrice = rates.standard;
    if (totalWeight > 2000) standardPrice += 5;
    if (totalWeight > 5000) standardPrice += 10;
    if (isInternational) standardPrice += rates.internationalSurcharge;

    options.push({
      id: 'standard',
      name: 'Standard Shipping',
      description: isInternational ? '10-15 business days' : '5-7 business days',
      price: isFreeShippingEligible ? 0 : standardPrice,
      estimatedDays: isInternational ? 15 : 7,
      carrier: 'Standard',
      source: 'manual',
    });

    // Express Shipping
    let expressPrice = rates.express;
    if (totalWeight > 2000) expressPrice += 10;
    if (totalWeight > 5000) expressPrice += 20;
    if (isInternational) expressPrice += rates.internationalSurcharge;

    options.push({
      id: 'express',
      name: 'Express Shipping',
      description: isInternational ? '5-7 business days' : '2-3 business days',
      price: expressPrice,
      estimatedDays: isInternational ? 7 : 3,
      carrier: 'Express',
      source: 'manual',
    });

    // Overnight/Premium (domestic only)
    if (!isInternational) {
      let overnightPrice = rates.overnight;
      if (totalWeight > 2000) overnightPrice += 15;
      if (totalWeight > 5000) overnightPrice += 30;

      options.push({
        id: 'overnight',
        name: 'Overnight Delivery',
        description: 'Next business day',
        price: overnightPrice,
        estimatedDays: 1,
        carrier: 'Premium',
        source: 'manual',
      });
    }

    return options;
  }

  /**
   * Calculate tax per seller based on their businessType.
   *
   * - corporation / registered_business → PRICE_INCLUSIVE (seller remits their own tax, $0 extra)
   * - individual / sole_proprietor / llc / null → NEXTPIK_COLLECTS (platform applies configured tax rate)
   */
  async calculateTaxPerSeller(
    address: ShippingAddress,
    items: CartItem[],
    subtotal: number
  ): Promise<TaxCalculationWithBreakdown> {
    // Group items by storeId
    const storeGroups = new Map<string, { items: CartItem[]; subtotal: number }>();
    const unknownStoreItems: CartItem[] = [];

    for (const item of items) {
      if (!item.storeId) {
        unknownStoreItems.push(item);
        continue;
      }
      const group = storeGroups.get(item.storeId) ?? { items: [], subtotal: 0 };
      group.items.push(item);
      group.subtotal += item.price * item.quantity;
      storeGroups.set(item.storeId, group);
    }

    // Handle items with no storeId as taxable (safe fallback)
    if (unknownStoreItems.length > 0) {
      const unknownSubtotal = unknownStoreItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const group = storeGroups.get('__unknown__') ?? { items: [], subtotal: 0 };
      group.items.push(...unknownStoreItems);
      group.subtotal += unknownSubtotal;
      storeGroups.set('__unknown__', group);
    }

    // Fetch store info for all storeIds
    const storeIds = [...storeGroups.keys()].filter((id) => id !== '__unknown__');
    const stores = storeIds.length
      ? await this.prisma.store.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, name: true, businessType: true },
        })
      : [];

    const storeMap = new Map(stores.map((s) => [s.id, s]));

    const sellerBreakdown: SellerTaxBreakdown[] = [];
    let totalTaxAmount = 0;
    let hasTaxInclusiveItems = false;
    let hasTaxableItems = false;

    for (const [storeId, group] of storeGroups) {
      const store = storeMap.get(storeId);
      const businessType = store?.businessType ?? null;
      const storeName = store?.name ?? (storeId === '__unknown__' ? 'Unknown Store' : storeId);

      const isRegistered =
        businessType !== null && REGISTERED_BUSINESS_TYPES.includes(businessType);

      if (isRegistered) {
        hasTaxInclusiveItems = true;
        sellerBreakdown.push({
          storeId,
          storeName,
          businessType,
          taxHandling: 'PRICE_INCLUSIVE',
          subtotal: group.subtotal,
          taxRate: 0,
          taxAmount: 0,
          jurisdiction: 'Tax included in price',
        });
      } else {
        hasTaxableItems = true;
        const taxCalc = await this.calculateTax(address, group.subtotal);
        totalTaxAmount += taxCalc.amount;
        sellerBreakdown.push({
          storeId,
          storeName,
          businessType,
          taxHandling: 'NEXTPIK_COLLECTS',
          subtotal: group.subtotal,
          taxRate: taxCalc.rate,
          taxAmount: taxCalc.amount,
          jurisdiction: taxCalc.jurisdiction,
        });
      }
    }

    // Build overall TaxCalculation (for backward compat)
    const overallRate = hasTaxableItems && subtotal > 0 ? totalTaxAmount / subtotal : 0;

    return {
      rate: overallRate,
      amount: Math.round(totalTaxAmount * 100) / 100,
      jurisdiction:
        hasTaxInclusiveItems && hasTaxableItems
          ? 'Mixed (platform + inclusive)'
          : hasTaxInclusiveItems
            ? 'Tax included by sellers'
            : (sellerBreakdown[0]?.jurisdiction ?? 'N/A'),
      breakdown: {},
      sellerBreakdown,
      hasTaxInclusiveItems,
      hasTaxableItems,
    };
  }

  /**
   * Calculate tax based on shipping address
   */
  async calculateTax(address: ShippingAddress, subtotal: number): Promise<TaxCalculation> {
    // Get tax calculation mode from settings
    const mode = await this.settingsService.getTaxCalculationMode();

    // Mode: disabled - no tax applied
    if (mode === 'disabled') {
      return {
        rate: 0,
        amount: 0,
        jurisdiction: 'Tax Disabled',
        breakdown: {},
      };
    }

    // Mode: simple - use default tax rate
    if (mode === 'simple') {
      const rate = await this.settingsService.getTaxDefaultRate();
      const amount = subtotal * rate;

      return {
        rate,
        amount: Math.round(amount * 100) / 100,
        jurisdiction: 'Default Tax Rate',
        breakdown: {},
      };
    }

    // Mode: by_state - use US state-specific rates
    if (mode === 'by_state') {
      // US state tax rates (simplified)
      const stateTaxRates: Record<string, number> = {
        AL: 0.04,
        AZ: 0.056,
        AR: 0.065,
        CA: 0.0725,
        CO: 0.029,
        CT: 0.0635,
        FL: 0.06,
        GA: 0.04,
        HI: 0.04,
        ID: 0.06,
        IL: 0.0625,
        IN: 0.07,
        IA: 0.06,
        KS: 0.065,
        KY: 0.06,
        LA: 0.0445,
        ME: 0.055,
        MD: 0.06,
        MA: 0.0625,
        MI: 0.06,
        MN: 0.06875,
        MS: 0.07,
        MO: 0.04225,
        NE: 0.055,
        NV: 0.0685,
        NJ: 0.06625,
        NM: 0.05125,
        NY: 0.04,
        NC: 0.0475,
        ND: 0.05,
        OH: 0.0575,
        OK: 0.045,
        PA: 0.06,
        RI: 0.07,
        SC: 0.06,
        SD: 0.045,
        TN: 0.07,
        TX: 0.0625,
        UT: 0.0595,
        VT: 0.06,
        VA: 0.053,
        WA: 0.065,
        WV: 0.06,
        WI: 0.05,
        WY: 0.04,
        // No sales tax states
        AK: 0,
        DE: 0,
        MT: 0,
        NH: 0,
        OR: 0,
      };

      // Only calculate tax for US addresses
      if (address.country !== 'US' && address.country !== 'USA') {
        return {
          rate: 0,
          amount: 0,
          jurisdiction: 'No Tax (International)',
          breakdown: {},
        };
      }

      const stateCode = address.state?.toUpperCase() || '';
      let rate = stateTaxRates[stateCode] || 0;
      let jurisdiction = 'No Tax';

      if (rate > 0) {
        jurisdiction = `${stateCode} State Tax`;

        // Add estimated local tax (average 2%)
        // In production, use a proper tax API like TaxJar or Avalara
        const localTax = 0.02;
        rate += localTax;
        jurisdiction = `${stateCode} State + Local Tax`;
      }

      const amount = subtotal * rate;

      return {
        rate,
        amount: Math.round(amount * 100) / 100,
        jurisdiction,
        breakdown: {
          state: stateTaxRates[stateCode] || 0,
          city: 0.01,
          county: 0.01,
        },
      };
    }

    // Fallback (should never reach here)
    return {
      rate: 0,
      amount: 0,
      jurisdiction: 'Unknown Tax Mode',
      breakdown: {},
    };
  }

  /**
   * Get shipping rate for a specific option
   */
  async getShippingRate(
    optionId: string,
    address: ShippingAddress,
    items: CartItem[],
    subtotal: number
  ): Promise<ShippingOption | null> {
    const options = await this.calculateShippingOptions(address, items, subtotal);
    return options.find((opt) => opt.id === optionId) || null;
  }

  /**
   * Calculate order totals including shipping and tax
   */
  calculateOrderTotals(
    subtotal: number,
    shippingOption: ShippingOption,
    taxCalculation: TaxCalculation,
    discount: number = 0
  ) {
    const shipping = shippingOption.price;
    const tax = taxCalculation.amount;
    const total = subtotal - discount + shipping + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Estimate delivery date based on shipping option
   */
  estimateDeliveryDate(shippingOption: ShippingOption): Date {
    const today = new Date();
    const deliveryDate = new Date(today);

    // Add estimated days (skip weekends for business days)
    let daysToAdd = shippingOption.estimatedDays;
    while (daysToAdd > 0) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      const dayOfWeek = deliveryDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysToAdd--;
      }
    }

    return deliveryDate;
  }

  /**
   * Calculate self-pickup options (TIER 0.5)
   * Returns pickup options from stores that have pickup enabled and are within radius
   */
  private async calculatePickupOptions(
    address: ShippingAddress,
    items: CartItem[],
    subtotal: number
  ): Promise<ShippingOption[]> {
    try {
      // Check if pickup is enabled platform-wide
      const pickupEnabled = await this.settingsService.isPickupEnabled();
      if (!pickupEnabled) {
        this.logger.log('[Pickup] Self-pickup is disabled platform-wide');
        return [];
      }
      // Group items by storeId
      const storeGroups = new Map<string, CartItem[]>();
      for (const item of items) {
        const storeId = item.storeId || 'platform';
        if (!storeGroups.has(storeId)) {
          storeGroups.set(storeId, []);
        }
        storeGroups.get(storeId)!.push(item);
      }

      const pickupOptions: ShippingOption[] = [];

      // Check each store for pickup availability
      for (const [storeId, storeItems] of storeGroups) {
        try {
          // Get store pickup settings from database
          const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: {
              id: true,
              name: true,
              pickupEnabled: true,
              pickupAddress: true,
              pickupInstructions: true,
              pickupHours: true,
              pickupRadius: true,
              pickupFee: true,
              pickupEstimatedMinutes: true,
              city: true,
              province: true,
              postalCode: true,
            },
          });

          if (!store || !store.pickupEnabled) {
            continue; // Store doesn't have pickup enabled
          }

          // Check if customer is within pickup radius (simple MVP: same zip or city+state)
          const isWithinRadius = this.isWithinPickupRadius(
            address,
            {
              city: store.city,
              state: store.province,
              postalCode: store.postalCode,
            },
            store.pickupRadius || 50
          );

          if (!isWithinRadius) {
            this.logger.log(`[Pickup] Store ${store.name} (${storeId}) is outside pickup radius`);
            continue;
          }

          // Calculate total items for this store
          const itemCount = storeItems.reduce((sum, item) => sum + item.quantity, 0);

          // Add pickup option
          const pickupFee = store.pickupFee ? parseFloat(store.pickupFee.toString()) : 0;
          const estimatedMinutes = store.pickupEstimatedMinutes || 30;

          pickupOptions.push({
            id: `pickup-${storeId}`,
            name: `Self-Pickup from ${store.name}`,
            description: `Ready in ~${estimatedMinutes} mins • ${itemCount} item(s) • ${store.pickupAddress || store.city}`,
            price: pickupFee,
            estimatedDays: 0, // Same day pickup
            carrier: 'SELF_PICKUP',
          });

          this.logger.log(
            `[Pickup] Option available for ${store.name}: $${pickupFee.toFixed(2)} ` +
              `(${itemCount} items, ready in ${estimatedMinutes} mins)`
          );
        } catch (error) {
          this.logger.warn(
            `[Pickup] Failed to check pickup for store ${storeId}: ${error.message}`
          );
          continue;
        }
      }

      return pickupOptions;
    } catch (error) {
      this.logger.error(`[Pickup] Failed to calculate pickup options: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if customer address is within pickup radius
   * MVP: Simple check using zip code or city+state match
   */
  private isWithinPickupRadius(
    customerAddress: ShippingAddress,
    storeAddress: { city?: string | null; state?: string | null; postalCode?: string | null },
    radiusKm: number
  ): boolean {
    // Same postal code = within radius
    if (
      customerAddress.postalCode &&
      storeAddress.postalCode &&
      customerAddress.postalCode === storeAddress.postalCode
    ) {
      return true;
    }

    // Same city + state = within radius
    if (
      customerAddress.city &&
      storeAddress.city &&
      customerAddress.state &&
      storeAddress.state &&
      customerAddress.city.toLowerCase() === storeAddress.city.toLowerCase() &&
      customerAddress.state.toUpperCase() === storeAddress.state.toUpperCase()
    ) {
      return true;
    }

    // For future: Integrate geocoding API (Google Maps, Mapbox) to calculate actual distance
    return false;
  }

  /**
   * Validate address for shipping
   */
  validateShippingAddress(address: ShippingAddress): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!address.country) {
      errors.push('Country is required');
    }

    if (address.country === 'US' || address.country === 'USA') {
      if (!address.state) {
        errors.push('State is required for US addresses');
      }
      if (!address.postalCode) {
        errors.push('Postal code is required for US addresses');
      } else if (!/^\d{5}(-\d{4})?$/.test(address.postalCode)) {
        errors.push('Invalid US postal code format');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
