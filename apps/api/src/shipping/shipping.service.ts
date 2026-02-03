import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Shipping Service
 * Handles shipping zones, rates, and delivery fee calculations
 * NON-DESTRUCTIVE: Extends existing shipping logic
 */
@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Create shipping zone (Admin only)
   */
  async createZone(data: {
    name: string;
    code: string;
    description?: string;
    countries: string[];
    states?: string[];
    cities?: string[];
    postalCodes?: string[];
    baseFee: number;
    perKgFee?: number;
    freeShippingThreshold?: number;
    minDeliveryDays?: number;
    maxDeliveryDays?: number;
    priority?: number;
  }) {
    // Check for duplicate code
    const existing = await this.prisma.shippingZone.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new BadRequestException(`Shipping zone with code '${data.code}' already exists`);
    }

    const zone = await this.prisma.shippingZone.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        countries: data.countries,
        states: data.states || [],
        cities: data.cities || [],
        postalCodes: data.postalCodes || [],
        baseFee: new Decimal(data.baseFee),
        perKgFee: data.perKgFee ? new Decimal(data.perKgFee) : null,
        freeShippingThreshold: data.freeShippingThreshold
          ? new Decimal(data.freeShippingThreshold)
          : null,
        minDeliveryDays: data.minDeliveryDays || 3,
        maxDeliveryDays: data.maxDeliveryDays || 7,
        priority: data.priority || 0,
        isActive: true,
      },
    });

    this.logger.log(`Shipping zone created: ${zone.name} (${zone.code})`);
    return zone;
  }

  /**
   * Get all shipping zones
   */
  async getAllZones(filters?: { isActive?: boolean }) {
    return this.prisma.shippingZone.findMany({
      where: {
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      include: {
        rates: {
          where: { isActive: true },
          orderBy: { minDeliveryDays: 'asc' },
        },
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Get shipping zone by code
   */
  async getZoneByCode(code: string) {
    const zone = await this.prisma.shippingZone.findUnique({
      where: { code },
      include: {
        rates: {
          where: { isActive: true },
          orderBy: { minDeliveryDays: 'asc' },
        },
      },
    });

    if (!zone) {
      throw new NotFoundException(`Shipping zone '${code}' not found`);
    }

    return zone;
  }

  /**
   * Update shipping zone
   */
  async updateZone(
    code: string,
    data: Partial<{
      name: string;
      description: string;
      countries: string[];
      states: string[];
      cities: string[];
      postalCodes: string[];
      baseFee: number;
      perKgFee: number;
      freeShippingThreshold: number;
      minDeliveryDays: number;
      maxDeliveryDays: number;
      isActive: boolean;
      priority: number;
    }>
  ) {
    const zone = await this.prisma.shippingZone.findUnique({
      where: { code },
    });

    if (!zone) {
      throw new NotFoundException(`Shipping zone '${code}' not found`);
    }

    const updateData: any = { ...data };
    if (data.baseFee !== undefined) {
      updateData.baseFee = new Decimal(data.baseFee);
    }
    if (data.perKgFee !== undefined) {
      updateData.perKgFee = new Decimal(data.perKgFee);
    }
    if (data.freeShippingThreshold !== undefined) {
      updateData.freeShippingThreshold = new Decimal(data.freeShippingThreshold);
    }

    return this.prisma.shippingZone.update({
      where: { code },
      data: updateData,
    });
  }

  /**
   * Delete shipping zone
   */
  async deleteZone(code: string) {
    return this.prisma.shippingZone.delete({
      where: { code },
    });
  }

  /**
   * Create shipping rate for a zone
   */
  async createRate(data: {
    zoneId: string;
    name: string;
    minOrderValue?: number;
    maxOrderValue?: number;
    rate: number;
    perKgRate?: number;
    minDeliveryDays?: number;
    maxDeliveryDays?: number;
  }) {
    const rate = await this.prisma.shippingRate.create({
      data: {
        zoneId: data.zoneId,
        name: data.name,
        minOrderValue: data.minOrderValue ? new Decimal(data.minOrderValue) : null,
        maxOrderValue: data.maxOrderValue ? new Decimal(data.maxOrderValue) : null,
        rate: new Decimal(data.rate),
        perKgRate: data.perKgRate ? new Decimal(data.perKgRate) : null,
        minDeliveryDays: data.minDeliveryDays || 3,
        maxDeliveryDays: data.maxDeliveryDays || 7,
        isActive: true,
      },
    });

    this.logger.log(`Shipping rate created: ${rate.name} for zone ${data.zoneId}`);
    return rate;
  }

  /**
   * Get shipping rates for a zone
   */
  async getZoneRates(zoneId: string) {
    return this.prisma.shippingRate.findMany({
      where: { zoneId, isActive: true },
      orderBy: [{ minDeliveryDays: 'asc' }, { rate: 'asc' }],
    });
  }

  /**
   * Calculate shipping fee based on destination
   * NON-DESTRUCTIVE: Returns null if no zone found, allowing fallback to existing logic
   */
  async calculateShippingFee(destination: {
    country: string;
    state?: string;
    city?: string;
    postalCode?: string;
  }, orderTotal: number, weight?: number): Promise<{
    fee: number;
    zone?: any;
    freeShipping: boolean;
    estimatedDays: { min: number; max: number };
  } | null> {
    // Find matching zone (most specific match wins based on priority)
    const zones = await this.prisma.shippingZone.findMany({
      where: {
        isActive: true,
        countries: { has: destination.country },
      },
      orderBy: { priority: 'desc' },
    });

    if (zones.length === 0) {
      return null; // No zone found - fallback to existing shipping logic
    }

    // Find best matching zone
    let bestMatch = zones[0];
    for (const zone of zones) {
      // Check for state match if provided
      if (destination.state && zone.states.includes(destination.state)) {
        bestMatch = zone;
        break;
      }
      // Check for city match if provided
      if (destination.city && zone.cities.includes(destination.city)) {
        bestMatch = zone;
        break;
      }
      // Check for postal code pattern match
      if (destination.postalCode && zone.postalCodes.some(pattern =>
        destination.postalCode!.startsWith(pattern))) {
        bestMatch = zone;
        break;
      }
    }

    // Check for free shipping threshold (only if free shipping is enabled)
    const isFreeShippingEnabled = await this.isFreeShippingEnabled();
    const threshold = bestMatch.freeShippingThreshold?.toNumber();
    if (isFreeShippingEnabled && threshold && orderTotal >= threshold) {
      return {
        fee: 0,
        zone: bestMatch,
        freeShipping: true,
        estimatedDays: {
          min: bestMatch.minDeliveryDays,
          max: bestMatch.maxDeliveryDays,
        },
      };
    }

    // Calculate fee
    let fee = bestMatch.baseFee.toNumber();

    // Add per-kg fee if applicable
    if (weight && bestMatch.perKgFee) {
      fee += bestMatch.perKgFee.toNumber() * weight;
    }

    return {
      fee,
      zone: bestMatch,
      freeShipping: false,
      estimatedDays: {
        min: bestMatch.minDeliveryDays,
        max: bestMatch.maxDeliveryDays,
      },
    };
  }

  /**
   * Get shipping options for checkout (with zone-based rates if available)
   */
  async getShippingOptions(destination: {
    country: string;
    state?: string;
    city?: string;
    postalCode?: string;
  }, orderTotal: number, weight?: number) {
    const zoneBasedShipping = await this.calculateShippingFee(destination, orderTotal, weight);

    if (!zoneBasedShipping) {
      // No zone found - return default options
      return await this.getDefaultShippingOptions(orderTotal);
    }

    // Get zone rates if available
    const rates = await this.getZoneRates(zoneBasedShipping.zone.id);

    if (rates.length === 0) {
      // No custom rates - use base zone fee
      return [{
        id: 'zone-standard',
        name: 'Standard Shipping',
        price: zoneBasedShipping.fee,
        estimatedDays: zoneBasedShipping.estimatedDays,
        zone: zoneBasedShipping.zone.name,
      }];
    }

    // Return rates filtered by order value
    return rates
      .filter(rate => {
        const minOk = !rate.minOrderValue || orderTotal >= rate.minOrderValue.toNumber();
        const maxOk = !rate.maxOrderValue || orderTotal <= rate.maxOrderValue.toNumber();
        return minOk && maxOk;
      })
      .map(rate => ({
        id: rate.id,
        name: rate.name,
        price: rate.rate.toNumber(),
        estimatedDays: {
          min: rate.minDeliveryDays,
          max: rate.maxDeliveryDays,
        },
        zone: zoneBasedShipping.zone.name,
      }));
  }

  /**
   * Default shipping options (fallback when no zones configured)
   */
  private async getDefaultShippingOptions(orderTotal: number) {
    const isFreeShippingEnabled = await this.isFreeShippingEnabled();
    let isFreeShipping = false;

    if (isFreeShippingEnabled) {
      const freeShippingThreshold = await this.getFreeShippingThreshold();
      isFreeShipping = orderTotal >= freeShippingThreshold;

      if (isFreeShipping) {
        this.logger.log(`Free shipping applied (order: ${orderTotal} >= threshold: ${freeShippingThreshold})`);
      }
    }

    return [
      {
        id: 'standard',
        name: 'Standard Shipping',
        price: isFreeShipping ? 0 : 15,
        estimatedDays: { min: 5, max: 7 },
      },
      {
        id: 'express',
        name: 'Express Shipping',
        price: isFreeShipping ? 25 : 40,
        estimatedDays: { min: 2, max: 3 },
      },
      {
        id: 'overnight',
        name: 'Overnight Shipping',
        price: 75,
        estimatedDays: { min: 1, max: 1 },
      },
    ];
  }

  /**
   * Check if free shipping is enabled
   */
  async isFreeShippingEnabled(): Promise<boolean> {
    try {
      const setting = await this.settingsService.getSetting('free_shipping_enabled');
      return setting.value === 'true' || setting.value === true;
    } catch (error) {
      this.logger.warn('Free shipping enabled setting not found, defaulting to true');
      return true;
    }
  }

  /**
   * Get free shipping threshold from settings
   */
  async getFreeShippingThreshold(): Promise<number> {
    try {
      const setting = await this.settingsService.getSetting('free_shipping_threshold');
      return Number(setting.value) || 200;
    } catch (error) {
      this.logger.warn('Free shipping threshold not found, using $200');
      return 200;
    }
  }

  /**
   * Calculate shipping cost based on order total
   */
  async calculateShipping(orderTotal: Decimal, baseShippingCost: Decimal): Promise<Decimal> {
    const isFreeShippingEnabled = await this.isFreeShippingEnabled();

    if (!isFreeShippingEnabled) {
      this.logger.log('Free shipping is disabled');
      return baseShippingCost;
    }

    const threshold = await this.getFreeShippingThreshold();

    if (orderTotal.greaterThanOrEqualTo(threshold)) {
      this.logger.log(`Free shipping applied (order: ${orderTotal} >= threshold: ${threshold})`);
      return new Decimal(0);
    }

    return baseShippingCost;
  }

  /**
   * Get shipping statistics (Admin)
   */
  async getShippingStatistics() {
    const [totalZones, activeZones, totalRates] = await Promise.all([
      this.prisma.shippingZone.count(),
      this.prisma.shippingZone.count({ where: { isActive: true } }),
      this.prisma.shippingRate.count({ where: { isActive: true } }),
    ]);

    return {
      totalZones,
      activeZones,
      totalRates,
    };
  }
}
