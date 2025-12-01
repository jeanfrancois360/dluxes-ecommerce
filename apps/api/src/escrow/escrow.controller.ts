import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, EscrowStatus } from '@prisma/client';
import { ConfirmDeliveryDto, RefundEscrowDto } from './dto/confirm-delivery.dto';

@Controller('escrow')
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  // ============================================================================
  // Seller Endpoints
  // ============================================================================

  /**
   * Get seller's escrow summary
   * @route GET /escrow/my-summary
   */
  @Get('my-summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getMyEscrowSummary(@Req() req: any) {
    try {
      const data = await this.escrowService.getSellerEscrowSummary(req.user.id);
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
   * Get seller's escrow transactions
   * @route GET /escrow/my-escrows
   */
  @Get('my-escrows')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getMyEscrows(
    @Req() req: any,
    @Query('status') status?: EscrowStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const data = await this.escrowService.getSellerEscrows(req.user.id, {
        status,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      });
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

  // ============================================================================
  // Buyer Endpoints
  // ============================================================================

  /**
   * Confirm delivery (Buyer confirms they received the order)
   * @route POST /escrow/confirm-delivery/:orderId
   */
  @Post('confirm-delivery/:orderId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirmDelivery(
    @Param('orderId') orderId: string,
    @Req() req: any,
    @Body() dto?: ConfirmDeliveryDto
  ) {
    try {
      const data = await this.escrowService.confirmDelivery(
        orderId,
        req.user.id,
        'BUYER_CONFIRMED'
      );
      return {
        success: true,
        data,
        message: 'Delivery confirmed. Seller payment will be released after hold period.',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get escrow status for an order
   * @route GET /escrow/order/:orderId
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getEscrowByOrder(@Param('orderId') orderId: string) {
    try {
      const data = await this.escrowService.getEscrowByOrderId(orderId);
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

  // ============================================================================
  // Admin Endpoints
  // ============================================================================

  /**
   * Get all escrow transactions
   * @route GET /escrow/admin/all
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllEscrows(
    @Query('status') status?: EscrowStatus,
    @Query('sellerId') sellerId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const data = await this.escrowService.getAllEscrows({
        status,
        sellerId,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      });
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
   * Get escrow statistics
   * @route GET /escrow/admin/stats
   */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getEscrowStats() {
    try {
      const data = await this.escrowService.getEscrowStatistics();
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
   * Manually release escrow to seller
   * @route POST /escrow/admin/:escrowId/release
   */
  @Post('admin/:escrowId/release')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async releaseEscrow(@Param('escrowId') escrowId: string, @Req() req: any) {
    try {
      const data = await this.escrowService.releaseEscrow(escrowId, req.user.id);
      return {
        success: true,
        data,
        message: 'Escrow released successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Refund escrow to buyer
   * @route POST /escrow/admin/:escrowId/refund
   */
  @Post('admin/:escrowId/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async refundEscrow(
    @Param('escrowId') escrowId: string,
    @Body() dto: RefundEscrowDto
  ) {
    try {
      const data = await this.escrowService.refundEscrow(escrowId, dto.reason);
      return {
        success: true,
        data,
        message: 'Escrow refunded successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Manually trigger auto-release for expired escrows
   * @route POST /escrow/admin/auto-release
   */
  @Post('admin/auto-release')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async autoReleaseExpired() {
    try {
      const data = await this.escrowService.autoReleaseExpiredEscrows();
      return {
        success: true,
        data,
        message: `Processed ${data.processed} escrows: ${data.successful} successful, ${data.failed} failed`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }
}
