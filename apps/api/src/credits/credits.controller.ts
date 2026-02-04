import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreditsService } from './credits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditTransactionType } from '@prisma/client';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  /**
   * Get available credit packages (public)
   */
  @Get('packages')
  async getPackages() {
    const data = await this.creditsService.getPackages();
    return { success: true, data };
  }

  /**
   * Get credit cost for an action (public)
   */
  @Get('cost/:action')
  async getCreditCost(@Param('action') action: string) {
    const cost = await this.creditsService.getCreditCost(action);
    return { success: true, data: { action, cost } };
  }

  /**
   * Get current user's credit balance
   */
  @Get('balance')
  @UseGuards(JwtAuthGuard)
  async getBalance(@Req() req: any) {
    const data = await this.creditsService.getOrCreateBalance(req.user.id);
    return { success: true, data };
  }

  /**
   * Check if user has credits for an action
   */
  @Get('check/:action')
  @UseGuards(JwtAuthGuard)
  async checkCredits(@Req() req: any, @Param('action') action: string) {
    const data = await this.creditsService.hasCredits(req.user.id, action);
    return { success: true, data };
  }

  /**
   * Get transaction history
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    const data = await this.creditsService.getTransactionHistory(req.user.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      type: type as CreditTransactionType | undefined,
    });
    return { success: true, data };
  }

  /**
   * Purchase a credit package via Stripe Checkout
   */
  @Post('purchase/:packageId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async purchasePackage(@Req() req: any, @Param('packageId') packageId: string) {
    const data = await this.creditsService.purchasePackage(
      req.user.id,
      packageId,
    );
    return { success: true, data };
  }
}
