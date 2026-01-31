import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
import { DhlRatesService } from '../integrations/dhl/dhl-rates.service';
import { ShippingService } from '../shipping/shipping.service';

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
}

@Injectable()
export class ShippingTaxService {
  private readonly logger = new Logger(ShippingTaxService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
    private readonly dhlRatesService: DhlRatesService,
    private readonly shippingService: ShippingService
  ) {}

  /**
   * Calculate available shipping options based on address and cart
   * CASCADE FALLBACK: DHL → Zones → Manual
   */
  async calculateShippingOptions(
    address: ShippingAddress,
    items: CartItem[],
    subtotal: number
  ): Promise<ShippingOption[]> {
    // Calculate total weight for zone/DHL calculations
    const totalWeightGrams = items.reduce((sum, item) => sum + (item.weight || 500) * item.quantity, 0);
    const totalWeightKg = totalWeightGrams / 1000;

    // Get shipping mode from settings
    const shippingMode = await this.settingsService.getShippingMode();

    // STEP 1: Try DHL API if mode is 'dhl_api' or 'hybrid'
    if (shippingMode === 'dhl_api' || shippingMode === 'hybrid') {
      try {
        const dhlOptions = await this.calculateDhlShippingOptions(address, items, subtotal);

        if (dhlOptions.length > 0) {
          // DHL API succeeded
          if (shippingMode === 'dhl_api') {
            // DHL-only mode: return DHL rates only
            this.logger.log(`[DHL API] Using DHL Express rates (${dhlOptions.length} options)`);
            return dhlOptions;
          } else {
            // Hybrid mode: combine DHL with zones/manual fallback
            const fallbackOptions = await this.getZonesOrManualRates(address, subtotal, totalWeightKg);
            this.logger.log(`[Hybrid] ${dhlOptions.length} DHL + ${fallbackOptions.length} fallback options`);
            return [...dhlOptions, ...fallbackOptions];
          }
        }
      } catch (error) {
        this.logger.warn(`[DHL API] Failed, falling back to zones/manual: ${error.message}`);
        // Continue to fallback chain
      }
    }

    // STEP 2: Try Shipping Zones or Manual Rates (fallback chain)
    return this.getZonesOrManualRates(address, subtotal, totalWeightKg);
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
        return zoneOptions.map(zone => ({
          id: zone.id,
          name: zone.name,
          description: typeof zone.estimatedDays === 'object'
            ? `${zone.estimatedDays.min}-${zone.estimatedDays.max} business days`
            : `${zone.estimatedDays} business days`,
          price: zone.price,
          estimatedDays: typeof zone.estimatedDays === 'object'
            ? zone.estimatedDays.max
            : zone.estimatedDays,
          carrier: (zone as any).zone || 'Standard',
        }));
      }
    } catch (error) {
      this.logger.warn(`[Zones] Failed or no zones configured: ${error.message}`);
    }

    // STEP 3: Fall back to manual rates
    this.logger.log('[Manual] Using manual/settings-based rates (final fallback)');
    // Manual rates need items array for weight-based pricing
    const items: CartItem[] = [{
      productId: 'checkout',
      quantity: 1,
      price: subtotal,
      weight: (weightKg || 1) * 1000 // Convert back to grams
    }];
    return this.calculateManualShippingOptions(address, items, subtotal);
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
    const totalWeightGrams = items.reduce((sum, item) => sum + (item.weight || 500) * item.quantity, 0);
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
    return dhlRates.map(rate => ({
      id: rate.id,
      name: rate.name,
      description: rate.description,
      price: rate.price,
      estimatedDays: rate.estimatedDays,
      carrier: 'DHL Express',
    }));
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
        'AL': 0.04, 'AZ': 0.056, 'AR': 0.065, 'CA': 0.0725, 'CO': 0.029,
        'CT': 0.0635, 'FL': 0.06, 'GA': 0.04, 'HI': 0.04, 'ID': 0.06,
        'IL': 0.0625, 'IN': 0.07, 'IA': 0.06, 'KS': 0.065, 'KY': 0.06,
        'LA': 0.0445, 'ME': 0.055, 'MD': 0.06, 'MA': 0.0625, 'MI': 0.06,
        'MN': 0.06875, 'MS': 0.07, 'MO': 0.04225, 'NE': 0.055, 'NV': 0.0685,
        'NJ': 0.06625, 'NM': 0.05125, 'NY': 0.04, 'NC': 0.0475, 'ND': 0.05,
        'OH': 0.0575, 'OK': 0.045, 'PA': 0.06, 'RI': 0.07, 'SC': 0.06,
        'SD': 0.045, 'TN': 0.07, 'TX': 0.0625, 'UT': 0.0595, 'VT': 0.06,
        'VA': 0.053, 'WA': 0.065, 'WV': 0.06, 'WI': 0.05, 'WY': 0.04,
        // No sales tax states
        'AK': 0, 'DE': 0, 'MT': 0, 'NH': 0, 'OR': 0,
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
    return options.find(opt => opt.id === optionId) || null;
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
