import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Headers,
  RawBodyRequest,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { StripeConnectService } from './integrations/stripe-connect.service';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

/**
 * Stripe Connect Controller
 * Handles Stripe Connect OAuth flow and webhook events
 */
@Controller('stripe-connect')
export class StripeConnectController {
  constructor(
    private readonly stripeConnectService: StripeConnectService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Create Stripe Connect account and get onboarding link
   * @route POST /stripe-connect/create-account
   */
  @Post('create-account')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createAccount(
    @Request() req,
    @Body()
    body: {
      country?: string;
      businessType?: 'individual' | 'company';
    }
  ) {
    try {
      const userId = req.user.userId || req.user.id;
      const user = req.user;

      const result = await this.stripeConnectService.createConnectAccount(userId, {
        email: user.email,
        country: body.country || 'US',
        businessType: body.businessType || 'individual',
      });

      return {
        success: true,
        data: {
          accountId: result.accountId,
          onboardingUrl: result.accountLinkUrl,
        },
        message: 'Stripe Connect account created. Please complete onboarding.',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create Stripe Connect account',
      };
    }
  }

  /**
   * Get new onboarding link (if previous one expired)
   * @route POST /stripe-connect/refresh-link
   */
  @Post('refresh-link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async refreshOnboardingLink(@Request() req, @Body() body: { accountId: string }) {
    try {
      const userId = req.user.userId || req.user.id;

      const accountLink = await this.stripeConnectService.createAccountLink(body.accountId, userId);

      return {
        success: true,
        data: {
          onboardingUrl: accountLink.url,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create onboarding link',
      };
    }
  }

  /**
   * Get Stripe Connect account status
   * @route GET /stripe-connect/account/:accountId
   */
  @Get('account/:accountId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAccountStatus(@Param('accountId') accountId: string) {
    try {
      const status = await this.stripeConnectService.getAccountStatus(accountId);

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get account status',
      };
    }
  }

  /**
   * Update account status from Stripe
   * @route POST /stripe-connect/account/:accountId/sync
   */
  @Post('account/:accountId/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async syncAccountStatus(@Param('accountId') accountId: string) {
    try {
      await this.stripeConnectService.updateAccountStatus(accountId);

      return {
        success: true,
        message: 'Account status synchronized',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync account status',
      };
    }
  }

  /**
   * Get Stripe Dashboard login link
   * @route POST /stripe-connect/dashboard-link
   */
  @Post('dashboard-link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getDashboardLink(@Body() body: { accountId: string }) {
    try {
      const url = await this.stripeConnectService.createLoginLink(body.accountId);

      return {
        success: true,
        data: {
          url,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create dashboard link',
      };
    }
  }

  /**
   * Delete Stripe Connect account
   * @route DELETE /stripe-connect/account/:accountId
   */
  @Delete('account/:accountId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteAccount(@Param('accountId') accountId: string) {
    try {
      await this.stripeConnectService.deleteAccount(accountId);

      return {
        success: true,
        message: 'Stripe Connect account deleted',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete account',
      };
    }
  }

  /**
   * Stripe webhook endpoint
   * @route POST /stripe-connect/webhook
   */
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_CONNECT_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      // Get raw body for signature verification
      const rawBody = req.rawBody;

      if (!rawBody) {
        throw new BadRequestException('Missing request body');
      }

      // Verify webhook signature
      const stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || '', {
        apiVersion: '2025-10-29.clover',
      });

      const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

      // Process the event
      await this.stripeConnectService.handleWebhook(event);

      return {
        success: true,
        received: true,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`Webhook Error: ${error.message}`);
      }
      throw new BadRequestException('Webhook processing failed');
    }
  }

  /**
   * Manual payout trigger (Admin only)
   * @route POST /stripe-connect/manual-payout
   */
  @Post('manual-payout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createManualPayout(
    @Body() body: { sellerId: string; amount: number; currency: string; description?: string }
  ) {
    try {
      const result = await this.stripeConnectService.createPayout({
        sellerId: body.sellerId,
        amount: body.amount,
        currency: body.currency,
        description: body.description,
      });

      return {
        success: true,
        data: result,
        message: 'Payout created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create payout',
      };
    }
  }

  /**
   * Get transfer status
   * @route GET /stripe-connect/transfer/:transferId
   */
  @Get('transfer/:transferId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getTransferStatus(@Param('transferId') transferId: string) {
    try {
      const status = await this.stripeConnectService.getTransferStatus(transferId);

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get transfer status',
      };
    }
  }
}
