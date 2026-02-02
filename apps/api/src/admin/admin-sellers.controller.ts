import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, StoreStatus, SellerCreditTransactionType } from '@prisma/client';
import { SellerApprovalService } from '../seller/seller-approval.service';
import { SellerCreditsService } from '../seller/seller-credits.service';

/**
 * Admin controller for managing seller applications and credits
 */
@Controller('admin/sellers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminSellersController {
  constructor(
    private readonly sellerApprovalService: SellerApprovalService,
    private readonly sellerCreditsService: SellerCreditsService,
  ) {}

  /**
   * Get seller statistics for admin dashboard
   * GET /admin/sellers/stats
   */
  @Get('stats')
  async getSellerStats() {
    return this.sellerApprovalService.getSellerStats();
  }

  /**
   * Get pending seller applications
   * GET /admin/sellers/pending?page=1&limit=20
   */
  @Get('pending')
  async getPendingApplications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.sellerApprovalService.getPendingApplications(pageNum, limitNum);
  }

  /**
   * Get all sellers with optional filters
   * GET /admin/sellers?status=ACTIVE&search=store&page=1&limit=20
   */
  @Get()
  async getAllSellers(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    const filters: any = {};

    if (status) {
      filters.status = status as StoreStatus;
    }

    if (search) {
      filters.search = search;
    }

    return this.sellerApprovalService.getAllSellers(filters, pageNum, limitNum);
  }

  /**
   * Get stores needing attention (low credits, grace period)
   * GET /admin/sellers/attention-needed
   */
  @Get('attention-needed')
  async getStoresNeedingAttention() {
    return this.sellerCreditsService.getStoresNeedingAttention();
  }

  /**
   * Get detailed information about a seller
   * GET /admin/sellers/:storeId
   */
  @Get(':storeId')
  async getApplicationDetails(@Param('storeId') storeId: string) {
    return this.sellerApprovalService.getApplicationDetails(storeId);
  }

  /**
   * Approve a seller application
   * POST /admin/sellers/:storeId/approve
   */
  @Post(':storeId/approve')
  @HttpCode(HttpStatus.OK)
  async approveSeller(@Param('storeId') storeId: string, @Req() req: any) {
    const adminId = req.user.id;
    return this.sellerApprovalService.approveSeller(storeId, adminId);
  }

  /**
   * Reject a seller application
   * POST /admin/sellers/:storeId/reject
   * Body: { rejectionNote: string }
   */
  @Post(':storeId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectSeller(
    @Param('storeId') storeId: string,
    @Body() body: { rejectionNote: string },
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    const { rejectionNote } = body;

    return this.sellerApprovalService.rejectSeller(
      storeId,
      adminId,
      rejectionNote,
    );
  }

  /**
   * Suspend a seller
   * POST /admin/sellers/:storeId/suspend
   * Body: { suspensionNote: string }
   */
  @Post(':storeId/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendSeller(
    @Param('storeId') storeId: string,
    @Body() body: { suspensionNote: string },
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    const { suspensionNote } = body;

    return this.sellerApprovalService.suspendSeller(
      storeId,
      adminId,
      suspensionNote,
    );
  }

  /**
   * Reactivate a suspended seller
   * POST /admin/sellers/:storeId/reactivate
   */
  @Post(':storeId/reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivateSeller(@Param('storeId') storeId: string, @Req() req: any) {
    const adminId = req.user.id;
    return this.sellerApprovalService.reactivateSeller(storeId, adminId);
  }

  /**
   * Adjust seller credits manually
   * POST /admin/sellers/:storeId/credits/adjust
   * Body: { amount: number, notes: string, type?: string }
   */
  @Post(':storeId/credits/adjust')
  @HttpCode(HttpStatus.OK)
  async adjustCredits(
    @Param('storeId') storeId: string,
    @Body()
    body: {
      amount: number;
      notes: string;
      type?: 'ADJUSTMENT' | 'BONUS' | 'REFUND';
    },
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    const { amount, notes, type = 'ADJUSTMENT' } = body;

    // Map string to enum
    const transactionType =
      type === 'BONUS'
        ? SellerCreditTransactionType.BONUS
        : type === 'REFUND'
          ? SellerCreditTransactionType.REFUND
          : SellerCreditTransactionType.ADJUSTMENT;

    return this.sellerCreditsService.adjustCredits(
      storeId,
      amount,
      adminId,
      notes,
      transactionType,
    );
  }

  /**
   * Get credit history for a seller
   * GET /admin/sellers/:storeId/credits/history?page=1&limit=20
   */
  @Get(':storeId/credits/history')
  async getCreditHistory(
    @Param('storeId') storeId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    // Get store to find userId
    const store = await this.sellerApprovalService.getApplicationDetails(
      storeId,
    );

    if (!store.success) {
      return store;
    }

    return this.sellerCreditsService.getCreditHistory(
      store.data.owner.id,
      pageNum,
      limitNum,
    );
  }
}
