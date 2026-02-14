import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SellerPayoutSettingsService } from './seller-payout-settings.service';

/**
 * Seller Payout Settings Controller
 * Manages seller payout configuration endpoints
 */
@Controller('seller/payout-settings')
@UseGuards(JwtAuthGuard)
export class SellerPayoutSettingsController {
  constructor(private readonly payoutSettingsService: SellerPayoutSettingsService) {}

  /**
   * Get current seller's payout settings
   * @route GET /seller/payout-settings
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getSettings(@Request() req) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.payoutSettingsService.getSettings(userId);

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Create or update seller's payout settings
   * @route POST /seller/payout-settings
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async upsertSettings(
    @Request() req,
    @Body()
    body: {
      paymentMethod: string;
      // Bank Transfer
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
      // Preferences
      payoutCurrency?: string;
    }
  ) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.payoutSettingsService.upsertSettings(userId, body);

      return {
        success: true,
        data,
        message: 'Payout settings saved successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Check if seller can receive payouts
   * @route GET /seller/payout-settings/can-receive
   */
  @Get('can-receive')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async canReceivePayouts(@Request() req) {
    try {
      const userId = req.user.userId || req.user.id;
      const result = await this.payoutSettingsService.canReceivePayouts(userId);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Delete seller's payout settings
   * @route DELETE /seller/payout-settings
   */
  @Delete()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteSettings(@Request() req) {
    try {
      const userId = req.user.userId || req.user.id;
      await this.payoutSettingsService.deleteSettings(userId);

      return {
        success: true,
        message: 'Payout settings deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }
}

/**
 * Admin Payout Settings Controller
 * Admin endpoints for managing seller payout settings
 */
@Controller('admin/payout-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminPayoutSettingsController {
  constructor(private readonly payoutSettingsService: SellerPayoutSettingsService) {}

  /**
   * Get all payout settings
   * @route GET /admin/payout-settings
   */
  @Get()
  async getAllSettings(
    @Query('verified') verified?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const filters = {
        verified: verified !== undefined ? verified === 'true' : undefined,
        paymentMethod,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      };

      const data = await this.payoutSettingsService.getAllSettings(filters);

      return {
        success: true,
        data: data.data,
        pagination: data.pagination,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get specific seller's payout settings
   * @route GET /admin/payout-settings/:sellerId
   */
  @Get(':sellerId')
  async getSellerSettings(@Param('sellerId') sellerId: string) {
    try {
      const data = await this.payoutSettingsService.getSettings(sellerId);

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Verify seller's payout settings
   * @route PATCH /admin/payout-settings/:settingsId/verify
   */
  @Patch(':settingsId/verify')
  async verifySettings(
    @Param('settingsId') settingsId: string,
    @Request() req,
    @Body()
    body: {
      verified: boolean;
      rejectionNotes?: string;
    }
  ) {
    try {
      const adminId = req.user.userId || req.user.id;
      const data = await this.payoutSettingsService.verifySettings(
        settingsId,
        adminId,
        body.verified,
        body.rejectionNotes
      );

      return {
        success: true,
        data,
        message: body.verified
          ? 'Payout settings verified successfully'
          : 'Payout settings rejected',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }
}
