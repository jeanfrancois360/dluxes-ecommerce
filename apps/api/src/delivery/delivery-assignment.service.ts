import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DeliveryProvider } from '@prisma/client';

interface AssignmentCriteria {
  destinationCountry: string;
  orderValue: number;
  urgency?: 'standard' | 'express' | 'overnight';
  weight?: number;
}

@Injectable()
export class DeliveryAssignmentService {
  private readonly logger = new Logger(DeliveryAssignmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Automatically select the best delivery provider for an order
   * Uses intelligent algorithm based on multiple factors
   */
  async autoAssignProvider(criteria: AssignmentCriteria): Promise<DeliveryProvider | null> {
    const { destinationCountry, orderValue, urgency = 'standard', weight = 0 } = criteria;

    // Get all active and verified providers
    const providers = await this.prisma.deliveryProvider.findMany({
      where: {
        isActive: true,
        verificationStatus: 'VERIFIED',
        // Filter by country coverage
        countries: {
          has: destinationCountry,
        },
      },
      orderBy: {
        // Prefer providers with lower commission rates
        commissionRate: 'asc',
      },
    });

    if (providers.length === 0) {
      this.logger.warn(`No providers available for country: ${destinationCountry}`);
      return null;
    }

    // Score each provider based on multiple factors
    const scoredProviders = providers.map((provider) => {
      let score = 100; // Base score

      // 1. Provider Type Score (API integrated = better)
      if (provider.type === 'API_INTEGRATED') {
        score += 30; // Real-time tracking
      } else if (provider.type === 'PARTNER') {
        score += 20; // Local knowledge
      } else {
        score += 10; // Manual tracking
      }

      // 2. Cost Efficiency Score (lower commission = better)
      const commissionRate = Number(provider.commissionRate);
      if (commissionRate < 10) {
        score += 25;
      } else if (commissionRate < 15) {
        score += 15;
      } else {
        score += 5;
      }

      // 3. API Capability Score
      if (provider.apiEnabled) {
        score += 20; // Can auto-update tracking
      }

      // 4. High-Value Order Handling
      if (orderValue > 1000 && provider.type === 'API_INTEGRATED') {
        score += 15; // Premium providers for high-value orders
      }

      // 5. Urgency Handling
      if (urgency === 'express' && provider.name.toLowerCase().includes('express')) {
        score += 25;
      } else if (urgency === 'overnight' && provider.name.toLowerCase().includes('fedex')) {
        score += 30; // FedEx known for overnight
      }

      // 6. International Reliability (major carriers)
      const majorCarriers = ['fedex', 'dhl', 'ups'];
      if (majorCarriers.some((carrier) => provider.slug.includes(carrier))) {
        score += 20; // Established international reputation
      }

      // 7. Regional Specialists
      const africanCountries = ['RW', 'KE', 'UG', 'TZ', 'BI', 'ET', 'GH', 'NG'];
      if (africanCountries.includes(destinationCountry) && provider.type === 'PARTNER') {
        score += 25; // Local partners better for regional deliveries
      }

      return {
        provider,
        score,
        commissionRate,
      };
    });

    // Sort by score (highest first)
    scoredProviders.sort((a, b) => b.score - a.score);

    // Log the decision
    const selected = scoredProviders[0];
    this.logger.log(
      `Auto-assigned provider: ${selected.provider.name} ` +
        `(Score: ${selected.score}, Commission: ${selected.commissionRate}%) ` +
        `for ${destinationCountry} order`
    );

    // Log top 3 alternatives for transparency
    if (scoredProviders.length > 1) {
      const alternatives = scoredProviders.slice(1, 4).map(
        (p) => `${p.provider.name} (Score: ${p.score})`
      );
      this.logger.debug(`Alternatives: ${alternatives.join(', ')}`);
    }

    return selected.provider;
  }

  /**
   * Get recommended providers with reasons
   * Useful for admin UI to show why a provider was selected
   */
  async getRecommendations(criteria: AssignmentCriteria): Promise<
    Array<{
      provider: DeliveryProvider;
      score: number;
      reasons: string[];
      estimatedCost: number;
    }>
  > {
    const { destinationCountry, orderValue } = criteria;

    const providers = await this.prisma.deliveryProvider.findMany({
      where: {
        isActive: true,
        verificationStatus: 'VERIFIED',
        countries: {
          has: destinationCountry,
        },
      },
    });

    return providers.map((provider) => {
      const reasons: string[] = [];
      let score = 100;

      // Build reasons array while scoring
      if (provider.type === 'API_INTEGRATED') {
        reasons.push('Real-time tracking available');
        score += 30;
      }

      if (provider.apiEnabled) {
        reasons.push('Automated status updates');
        score += 20;
      }

      const commissionRate = Number(provider.commissionRate);
      if (commissionRate < 10) {
        reasons.push('Low commission rate');
        score += 25;
      }

      if (provider.type === 'PARTNER') {
        reasons.push('Local delivery expertise');
        score += 20;
      }

      // Calculate estimated cost
      const baseDeliveryFee = 15.0; // Base fee
      const commissionAmount = (baseDeliveryFee * commissionRate) / 100;
      const estimatedCost = baseDeliveryFee + commissionAmount;

      return {
        provider,
        score,
        reasons,
        estimatedCost,
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Assign delivery partner based on location and availability
   */
  async autoAssignPartner(deliveryId: string): Promise<any> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        provider: true,
      },
    });

    if (!delivery || !delivery.provider) {
      return null;
    }

    // Find available delivery partners for this provider
    const partners = await this.prisma.user.findMany({
      where: {
        role: 'DELIVERY_PARTNER',
        deliveryProviderId: delivery.providerId,
        isActive: true,
      },
    });

    if (partners.length === 0) {
      this.logger.warn(`No delivery partners available for provider: ${delivery.provider.name}`);
      return null;
    }

    // TODO: Implement intelligent partner selection based on:
    // - Current workload
    // - Location proximity
    // - Performance rating
    // - Availability status

    // For now, round-robin or random selection
    const selectedPartner = partners[Math.floor(Math.random() * partners.length)];

    this.logger.log(`Auto-assigned delivery partner: ${selectedPartner.email} for delivery ${delivery.trackingNumber}`);

    return selectedPartner;
  }

  /**
   * Calculate estimated delivery date based on provider and destination
   */
  calculateExpectedDelivery(
    provider: DeliveryProvider,
    destinationCountry: string,
    urgency: 'standard' | 'express' | 'overnight' = 'standard'
  ): Date {
    const baseDate = new Date();
    let daysToAdd = 5; // Default standard delivery

    // Adjust based on urgency
    if (urgency === 'express') {
      daysToAdd = 2;
    } else if (urgency === 'overnight') {
      daysToAdd = 1;
    }

    // Adjust based on provider type
    if (provider.type === 'API_INTEGRATED') {
      daysToAdd -= 1; // Major carriers are faster
    }

    // Adjust based on destination (example: local vs international)
    const localCountries = ['RW', 'KE', 'UG', 'TZ']; // East Africa
    if (!localCountries.includes(destinationCountry)) {
      daysToAdd += 3; // International takes longer
    }

    baseDate.setDate(baseDate.getDate() + daysToAdd);
    return baseDate;
  }
}
