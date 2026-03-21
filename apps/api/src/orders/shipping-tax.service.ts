import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
import { DhlRatesService } from '../integrations/dhl/dhl-rates.service';
import { EasyPostRatesService } from '../integrations/easypost/easypost-rates.service';
import { ShippingService } from '../shipping/shipping.service';
import { GelatoOrdersService } from '../gelato/gelato-orders.service';

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
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
    private readonly dhlRatesService: DhlRatesService,
    private readonly easyPostRatesService: EasyPostRatesService,
    private readonly shippingService: ShippingService,
    private readonly gelatoOrdersService: GelatoOrdersService
  ) {}

  /**
   * Calculate available shipping options based on address and cart
   * CASCADE FALLBACK: Gelato (POD) → Self-Pickup → EasyPost → DHL → Zones → Manual
   *
   * - TIER 0 (Gelato): For POD items, gets real-time shipping quotes
   *   - Pure POD carts: Returns Gelato shipping only
   *   - Mixed carts: Combines Gelato cost + fallback shipping for regular items
   * - TIER 0.5 (Self-Pickup): If store has pickup enabled and customer is within radius
   *   - Returns immediately if available (no need to check other providers)
   *   - Simple radius check: same zip code or city+state match
   * - TIER 1 (EasyPost): PRIMARY/DEFAULT provider - Multi-carrier rates (USPS, UPS, FedEx, DHL, etc.)
   * - TIER 2 (DHL): DHL Express only (if mode is 'dhl_api' or 'hybrid')
   * - TIER 3 (Zones/Manual): Final fallback based on settings
   */
  async calculateShippingOptions(
    address: ShippingAddress,
    items: CartItem[],
    subtotal: number
  ): Promise<ShippingOption[]> {
    // TIER 0: Try Gelato for POD items first (highest priority for POD)
    let gelatoCost = 0;
    let podItems: CartItem[] = [];
    let nonPodItems: CartItem[] = [];

    try {
      const gelatoResult = await this.calculateGelatoShipping(address, items);

      if (gelatoResult && gelatoResult.amount > 0) {
        // Separate POD and non-POD items
        podItems = items.filter(
          (item) => item.fulfillmentType === 'GELATO_POD' && item.gelatoProductUid
        );
        nonPodItems = items.filter((item) => item.fulfillmentType !== 'GELATO_POD');

        const isPurePodCart = podItems.length === items.length;

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
      }
    } catch (error) {
      this.logger.warn(`[Gelato Shipping] Failed to get Gelato quote: ${error.message}`);
      // Continue to next tier with all items
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

    // Get shipping mode from settings
    const shippingMode = await this.settingsService.getShippingMode();

    // Helper function to add Gelato cost to shipping options (for mixed carts)
    const addGelatoCost = (options: ShippingOption[]): ShippingOption[] => {
      if (gelatoCost === 0) return options;

      return options.map((option) => ({
        ...option,
        name: `${option.name} + Gelato POD`,
        description: `${option.description} (includes POD shipping)`,
        price: option.price + gelatoCost,
      }));
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

    // TIER 1: EasyPost (PRIMARY/DEFAULT PROVIDER - enabled by default)
    try {
      const easypostEnabled = await this.settingsService.getSetting('easypost_enabled');
      if (easypostEnabled?.value === true) {
        const easypostOptions = await this.calculateEasyPostShippingOptions(
          address,
          itemsForShipping,
          totalWeightOz
        );

        if (easypostOptions.length > 0) {
          this.logger.log(`[EasyPost] Using EasyPost rates (${easypostOptions.length} options)`);
          return addGelatoCost(easypostOptions);
        }
      }
    } catch (error) {
      this.logger.warn(`[EasyPost] Failed, falling back to DHL/zones: ${error.message}`);
    }

    // TIER 2: Try DHL API if mode is 'dhl_api' or 'hybrid'
    if (shippingMode === 'dhl_api' || shippingMode === 'hybrid') {
      try {
        const dhlOptions = await this.calculateDhlShippingOptions(
          address,
          itemsForShipping,
          subtotal
        );

        if (dhlOptions.length > 0) {
          // DHL API succeeded
          if (shippingMode === 'dhl_api') {
            // DHL-only mode: return DHL rates only
            this.logger.log(`[DHL API] Using DHL Express rates (${dhlOptions.length} options)`);
            return addGelatoCost(dhlOptions);
          } else {
            // Hybrid mode: combine DHL with zones/manual fallback
            const fallbackOptions = await this.getZonesOrManualRates(
              address,
              subtotal,
              totalWeightKg
            );
            this.logger.log(
              `[Hybrid] ${dhlOptions.length} DHL + ${fallbackOptions.length} fallback options`
            );
            return addGelatoCost([...dhlOptions, ...fallbackOptions]);
          }
        } else {
          // DHL returned no options
          if (shippingMode === 'dhl_api') {
            // DHL-only mode: no fallback allowed
            this.logger.error(`[DHL API] No shipping options available for this destination`);
            return []; // Return empty array - frontend should show error to user
          }
          // Hybrid mode: fall through to manual rates
          this.logger.warn(`[Hybrid] DHL returned no options, falling back to zones/manual`);
        }
      } catch (error) {
        if (shippingMode === 'dhl_api') {
          // DHL-only mode: no fallback allowed
          this.logger.error(`[DHL API] Failed with error: ${error.message}`);
          return []; // Return empty array - frontend should show error to user
        }
        // Hybrid mode: fall through to manual rates
        this.logger.warn(`[Hybrid] DHL API failed, falling back to zones/manual: ${error.message}`);
      }
    }

    // STEP 2: Try Shipping Zones or Manual Rates (fallback chain)
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

    // Get origin address from settings
    let fromAddress = {
      street1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US',
    };

    try {
      const street1Setting = await this.settingsService.getSetting('origin_street1');
      const citySetting = await this.settingsService.getSetting('origin_city');
      const stateSetting = await this.settingsService.getSetting('origin_state');
      const postalSetting = await this.settingsService.getSetting('origin_postal_code');
      const countrySetting = await this.settingsService.getSetting('origin_country');

      if (street1Setting?.value) fromAddress.street1 = String(street1Setting.value);
      if (citySetting?.value) fromAddress.city = String(citySetting.value);
      if (stateSetting?.value) fromAddress.state = String(stateSetting.value);
      if (postalSetting?.value) fromAddress.zip = String(postalSetting.value);
      if (countrySetting?.value) fromAddress.country = String(countrySetting.value);
    } catch (error) {
      this.logger.warn('Failed to get origin address from settings, using defaults');
    }

    // Prepare destination address
    const toAddress = {
      street1: '123 Customer St', // Placeholder, not needed for rate shopping
      city: address.city || 'Unknown',
      state: address.state || '',
      zip: address.postalCode || '',
      country: address.country || 'US',
    };

    // Prepare parcel (default dimensions for rate shopping)
    const parcel = {
      length: 10,
      width: 8,
      height: 4,
      weight: Math.max(1, weightOz), // Minimum 1oz
    };

    try {
      // Get rates from EasyPost
      const easypostResult = await this.easyPostRatesService.getLowestRate(
        {
          fromAddress,
          toAddress,
          parcel,
        },
        undefined, // no carrier filter
        undefined // no service filter
      );

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
      }));
    } catch (error) {
      this.logger.error('EasyPost rate fetch failed:', error.message);
      return [];
    }
  }

  /**
   * Calculate shipping options using DHL Express API
   * SECURITY: Uses environment variables only
   */
  private async calculateDhlShippingOptions(
    address: ShippingAddress,
    items: CartItem[],
    subtotal: number
  ): Promise<ShippingOption[]> {
    // Check if DHL API is enabled (checks .env only)
    const isEnabled = this.dhlRatesService.isApiEnabled();
    if (!isEnabled) {
      this.logger.debug('DHL API is not configured in .env');
      return [];
    }

    // Get origin address from settings
    let originCountry = 'US';
    let originPostalCode = '10001';

    try {
      const countrySetting = await this.settingsService.getSetting('origin_country');
      const postalSetting = await this.settingsService.getSetting('origin_postal_code');
      originCountry = String(countrySetting.value) || 'US';
      originPostalCode = String(postalSetting.value) || '10001';
    } catch (error) {
      // Fallback to env variables if settings not found
      originCountry = this.configService.get<string>('ORIGIN_COUNTRY', 'US');
      originPostalCode = this.configService.get<string>('ORIGIN_POSTAL_CODE', '10001');
    }

    // Calculate total weight in KG (items are in grams)
    const totalWeightGrams = items.reduce(
      (sum, item) => sum + (item.weight || 500) * item.quantity,
      0
    );
    const totalWeightKg = totalWeightGrams / 1000;

    // Request DHL rates
    const dhlRates = await this.dhlRatesService.getSimplifiedRates({
      originCountryCode: originCountry,
      originPostalCode: originPostalCode,
      destinationCountryCode: address.country,
      destinationPostalCode: address.postalCode || '',
      destinationCityName: address.city,
      weight: Math.max(0.5, totalWeightKg), // Minimum 0.5kg
    });

    // Convert DHL rates to our ShippingOption format
    return dhlRates.map((rate) => ({
      id: rate.id,
      name: rate.name,
      description: rate.description,
      price: rate.price,
      estimatedDays: rate.estimatedDays,
      carrier: 'DHL Express',
    }));
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
    const isFreeShippingEligible = subtotal >= 200; // TODO: Make this configurable via settings

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
      carrier: 'USPS',
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
      carrier: 'FedEx',
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
        carrier: 'UPS',
      });
    }

    return options;
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
          const store = await this.settingsService.prisma.store.findUnique({
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
              state: true,
              zipCode: true,
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
              state: store.state,
              postalCode: store.zipCode,
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
