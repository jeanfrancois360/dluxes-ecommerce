import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';

/**
 * Seller Payout Settings Service
 * Manages seller payout configuration and payment method setup
 * v2.11.1: Added encryption for sensitive banking data
 */
@Injectable()
export class SellerPayoutSettingsService {
  private readonly logger = new Logger(SellerPayoutSettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService
  ) {}

  /**
   * Get seller's payout settings
   */
  async getSettings(sellerId: string) {
    const settings = await this.prisma.sellerPayoutSettings.findUnique({
      where: { sellerId },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!settings) {
      // Return default settings if none exist
      return this.getDefaultSettings(sellerId);
    }

    // Mask sensitive data (decrypt then mask for display)
    return {
      ...settings,
      accountNumber: this.maskAccountNumberSafe(settings.accountNumber),
      routingNumber: this.maskAccountNumberSafe(settings.routingNumber),
      iban: this.maskIBANSafe(settings.iban),
      swiftCode: settings.swiftCode ? '****' : null, // Mask entirely
    };
  }

  /**
   * Create or update seller payout settings
   */
  async upsertSettings(
    sellerId: string,
    data: {
      paymentMethod: string;
      // Bank Transfer Details
      bankName?: string;
      accountHolderName?: string;
      accountNumber?: string;
      routingNumber?: string;
      iban?: string;
      swiftCode?: string;
      bankAddress?: string;
      bankCountry?: string;
      // Stripe Connect
      stripeAccountId?: string;
      // PayPal
      paypalEmail?: string;
      // Wise
      wiseEmail?: string;
      wiseRecipientId?: string;
      // Tax & Compliance
      taxId?: string;
      taxCountry?: string;
      taxFormType?: string;
      taxFormUrl?: string;
      // Payout Preferences
      payoutCurrency?: string;
    }
  ) {
    // Get seller's store
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: {
        store: true,
      },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (!seller.store) {
      throw new BadRequestException('Seller must have a store to configure payout settings');
    }

    // Validate payment method requirements
    await this.validatePaymentMethod(data.paymentMethod, data);

    // Check if settings already exist
    const existing = await this.prisma.sellerPayoutSettings.findUnique({
      where: { sellerId },
    });

    // Encrypt sensitive banking data before storing
    const encryptedData = {
      paymentMethod: data.paymentMethod,
      bankName: data.bankName,
      accountHolderName: data.accountHolderName,
      accountNumber: this.encryptField(data.accountNumber),
      routingNumber: this.encryptField(data.routingNumber),
      iban: this.encryptField(data.iban),
      swiftCode: this.encryptField(data.swiftCode),
      bankAddress: data.bankAddress,
      bankCountry: data.bankCountry,
      stripeAccountId: data.stripeAccountId,
      paypalEmail: data.paypalEmail,
      wiseEmail: data.wiseEmail,
      wiseRecipientId: data.wiseRecipientId,
      taxId: data.taxId,
      taxCountry: data.taxCountry,
      taxFormType: data.taxFormType,
      taxFormUrl: data.taxFormUrl,
      payoutCurrency: data.payoutCurrency || 'USD',
    };

    if (existing) {
      // Update existing settings
      return this.prisma.sellerPayoutSettings.update({
        where: { sellerId },
        data: {
          ...encryptedData,
          verified: false, // Reset verification on update
        },
      });
    } else {
      // Create new settings
      return this.prisma.sellerPayoutSettings.create({
        data: {
          sellerId,
          storeId: seller.store.id,
          ...encryptedData,
        },
      });
    }
  }

  /**
   * Verify seller payout settings (Admin only)
   */
  async verifySettings(
    settingsId: string,
    adminId: string,
    verified: boolean,
    rejectionNotes?: string
  ) {
    const settings = await this.prisma.sellerPayoutSettings.findUnique({
      where: { id: settingsId },
    });

    if (!settings) {
      throw new NotFoundException('Payout settings not found');
    }

    return this.prisma.sellerPayoutSettings.update({
      where: { id: settingsId },
      data: {
        verified,
        verifiedAt: verified ? new Date() : null,
        verifiedBy: verified ? adminId : null,
        rejectionNotes: verified ? null : rejectionNotes,
      },
    });
  }

  /**
   * Delete seller payout settings
   */
  async deleteSettings(sellerId: string) {
    const settings = await this.prisma.sellerPayoutSettings.findUnique({
      where: { sellerId },
    });

    if (!settings) {
      throw new NotFoundException('Payout settings not found');
    }

    return this.prisma.sellerPayoutSettings.delete({
      where: { sellerId },
    });
  }

  /**
   * Get all payout settings (Admin only)
   */
  async getAllSettings(filters?: {
    verified?: boolean;
    paymentMethod?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.verified !== undefined) {
      where.verified = filters.verified;
    }
    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    const [settings, total] = await Promise.all([
      this.prisma.sellerPayoutSettings.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sellerPayoutSettings.count({ where }),
    ]);

    // Mask sensitive data (decrypt then mask for admin display)
    const maskedSettings = settings.map((s) => ({
      ...s,
      accountNumber: this.maskAccountNumberSafe(s.accountNumber),
      routingNumber: this.maskAccountNumberSafe(s.routingNumber),
      iban: this.maskIBANSafe(s.iban),
      swiftCode: s.swiftCode ? '****' : null,
    }));

    return {
      data: maskedSettings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check if seller can receive payouts
   */
  async canReceivePayouts(sellerId: string): Promise<{
    canReceive: boolean;
    reason?: string;
  }> {
    const settings = await this.prisma.sellerPayoutSettings.findUnique({
      where: { sellerId },
    });

    if (!settings) {
      return {
        canReceive: false,
        reason: 'Payout settings not configured',
      };
    }

    if (!settings.verified) {
      return {
        canReceive: false,
        reason: 'Payout settings pending verification',
      };
    }

    // Check payment method requirements
    switch (settings.paymentMethod) {
      case 'bank_transfer':
        if (!settings.accountNumber || !settings.bankName) {
          return {
            canReceive: false,
            reason: 'Bank account details incomplete',
          };
        }
        break;
      case 'STRIPE_CONNECT':
        if (!settings.stripeAccountId || settings.stripeAccountStatus !== 'active') {
          return {
            canReceive: false,
            reason: 'Stripe Connect account not active',
          };
        }
        break;
      case 'PAYPAL':
        if (!settings.paypalEmail || !settings.paypalVerified) {
          return {
            canReceive: false,
            reason: 'PayPal account not verified',
          };
        }
        break;
      case 'WISE':
        if (!settings.wiseRecipientId) {
          return {
            canReceive: false,
            reason: 'Wise recipient not configured',
          };
        }
        break;
    }

    return {
      canReceive: true,
    };
  }

  /**
   * Validate payment method requirements
   */
  private async validatePaymentMethod(method: string, data: any) {
    switch (method) {
      case 'bank_transfer':
      case 'BANK_TRANSFER':
        if (!data.bankName || !data.accountHolderName || !data.accountNumber) {
          throw new BadRequestException(
            'Bank transfer requires: bankName, accountHolderName, accountNumber'
          );
        }
        break;
      case 'STRIPE_CONNECT':
        // Stripe Connect setup is handled separately via OAuth flow
        break;
      case 'PAYPAL':
        if (!data.paypalEmail) {
          throw new BadRequestException('PayPal requires: paypalEmail');
        }
        break;
      case 'WISE':
        if (!data.wiseEmail) {
          throw new BadRequestException('Wise requires: wiseEmail');
        }
        break;
      default:
        throw new BadRequestException(`Unsupported payment method: ${method}`);
    }
  }

  /**
   * Get default settings for a seller
   */
  private async getDefaultSettings(sellerId: string) {
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      include: {
        store: true,
      },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return {
      id: null,
      sellerId,
      storeId: seller.store?.id || null,
      paymentMethod: 'bank_transfer',
      verified: false,
      payoutCurrency: 'USD',
      seller: {
        id: seller.id,
        email: seller.email,
        firstName: seller.firstName,
        lastName: seller.lastName,
      },
      store: seller.store
        ? {
            id: seller.store.id,
            name: seller.store.name,
          }
        : null,
    };
  }

  /**
   * Encrypt sensitive banking data
   */
  private encryptField(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
      return this.encryptionService.encrypt(value);
    } catch (error) {
      this.logger.error('Failed to encrypt field:', error);
      throw new BadRequestException('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt sensitive banking data
   */
  private decryptField(value: string | null | undefined): string | null {
    if (!value) return null;

    // Check if already encrypted (has : separators)
    if (!this.encryptionService.isEncrypted(value)) {
      // Legacy unencrypted data - return as is but log warning
      this.logger.warn('Found unencrypted banking data in database');
      return value;
    }

    try {
      return this.encryptionService.decrypt(value);
    } catch (error) {
      this.logger.error('Failed to decrypt field:', error);
      return null; // Return null instead of throwing to prevent breaking existing data
    }
  }

  /**
   * Mask account number for display
   * Decrypts if needed, then masks
   */
  private maskAccountNumberSafe(encryptedValue: string | null | undefined): string | null {
    if (!encryptedValue) return null;

    try {
      const decrypted = this.decryptField(encryptedValue);
      if (!decrypted || decrypted.length <= 4) {
        return '****';
      }
      return '****' + decrypted.slice(-4);
    } catch (error) {
      this.logger.error('Failed to mask account number:', error);
      return '****'; // Safe fallback
    }
  }

  /**
   * Mask IBAN for display
   * Decrypts if needed, then masks
   */
  private maskIBANSafe(encryptedValue: string | null | undefined): string | null {
    if (!encryptedValue) return null;

    try {
      const decrypted = this.decryptField(encryptedValue);
      if (!decrypted || decrypted.length <= 4) {
        return '****';
      }
      return decrypted.slice(0, 2) + '*'.repeat(decrypted.length - 6) + decrypted.slice(-4);
    } catch (error) {
      this.logger.error('Failed to mask IBAN:', error);
      return '****'; // Safe fallback
    }
  }
}
