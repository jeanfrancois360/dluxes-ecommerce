import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, CommissionStatus } from '@prisma/client';
import { CommissionService } from './commission.service';
import { PayoutService } from './payout.service';
import { CreateCommissionRuleDto } from './dto/create-commission-rule.dto';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { ProcessPayoutDto } from './dto/process-payout.dto';

@Controller('commission')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionController {
  constructor(
    private readonly commissionService: CommissionService,
    private readonly payoutService: PayoutService,
  ) {}

  // ============================================================================
  // Seller Endpoints
  // ============================================================================

  @Get('my-summary')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async getMyCommissionSummary(@Request() req: any) {
    return this.commissionService.getSellerCommissionSummary(req.user.id);
  }

  @Get('my-commissions')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async getMyCommissions(
    @Request() req: any,
    @Query('status') status?: CommissionStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commissionService.getSellerCommissions(req.user.id, {
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('my-payouts')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async getMyPayouts(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.payoutService.getSellerPayouts(req.user.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('payout/:id')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async getPayoutDetails(@Request() req: any, @Param('id') id: string) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.payoutService.getPayoutDetails(id, isAdmin ? undefined : req.user.id);
  }

  // ============================================================================
  // Admin Endpoints - Commission Rules
  // ============================================================================

  @Get('rules')
  @Roles(UserRole.ADMIN)
  async getAllRules(
    @Query('isActive') isActive?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.commissionService.getAllRules({
      isActive: isActive === 'true',
      categoryId,
      sellerId,
    });
  }

  @Post('rules')
  @Roles(UserRole.ADMIN)
  async createRule(@Body() dto: CreateCommissionRuleDto) {
    return this.commissionService.createRule(dto);
  }

  @Put('rules/:id')
  @Roles(UserRole.ADMIN)
  async updateRule(@Param('id') id: string, @Body() dto: Partial<CreateCommissionRuleDto>) {
    return this.commissionService.updateRule(id, dto);
  }

  @Delete('rules/:id')
  @Roles(UserRole.ADMIN)
  async deleteRule(@Param('id') id: string) {
    return this.commissionService.deleteRule(id);
  }

  // ============================================================================
  // Admin Endpoints - Payouts
  // ============================================================================

  @Get('payouts')
  @Roles(UserRole.ADMIN)
  async getAllPayouts(
    @Query('status') status?: string,
    @Query('sellerId') sellerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.payoutService.getAllPayouts({
      status: status as any,
      sellerId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post('payouts')
  @Roles(UserRole.ADMIN)
  async createPayout(@Body() dto: CreatePayoutDto) {
    return this.payoutService.createPayout(dto);
  }

  @Post('payouts/:id/process')
  @Roles(UserRole.ADMIN)
  async processPayout(@Param('id') id: string, @Body() dto: ProcessPayoutDto) {
    return this.payoutService.processPayout(id, dto);
  }

  @Post('payouts/:id/complete')
  @Roles(UserRole.ADMIN)
  async completePayout(@Param('id') id: string) {
    return this.payoutService.completePayout(id);
  }

  @Post('payouts/:id/fail')
  @Roles(UserRole.ADMIN)
  async failPayout(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.payoutService.failPayout(id, reason);
  }

  @Delete('payouts/:id')
  @Roles(UserRole.ADMIN)
  async cancelPayout(@Param('id') id: string) {
    return this.payoutService.cancelPayout(id);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN)
  async getPayoutStatistics(
    @Query('sellerId') sellerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.payoutService.getPayoutStatistics({
      sellerId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  // ============================================================================
  // Admin Dashboard Endpoint
  // ============================================================================

  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  async getDashboardStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateFilters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    // Get commission statistics
    const commissionStats = await this.commissionService.getCommissionStatistics(dateFilters);

    // Get payout statistics
    const payoutStats = await this.payoutService.getPayoutStatistics(dateFilters);

    // Get top sellers by commission
    const topSellers = await this.commissionService.getTopSellersByCommission(dateFilters);

    // Get recent commissions
    const recentCommissions = await this.commissionService.getRecentCommissions(10);

    // Get pending payouts
    const pendingPayouts = await this.payoutService.getPendingPayouts();

    return {
      overview: {
        ...commissionStats,
        ...payoutStats,
      },
      topSellers,
      recentCommissions,
      pendingPayouts,
    };
  }

  @Get('commissions')
  @Roles(UserRole.ADMIN)
  async getAllCommissions(
    @Query('status') status?: CommissionStatus,
    @Query('sellerId') sellerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commissionService.getAllCommissions({
      status,
      sellerId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }
}
