import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, CreditTransactionType } from '@prisma/client';

@Controller('admin/credits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class CreditsAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creditsService: CreditsService,
  ) {}

  // ============================================================================
  // CREDIT PACKAGES MANAGEMENT
  // ============================================================================

  /**
   * Get all credit packages
   * @route GET /admin/credits/packages
   */
  @Get('packages')
  async getAllPackages() {
    const data = await this.prisma.creditPackage.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return { success: true, data };
  }

  /**
   * Create a new credit package
   * @route POST /admin/credits/packages
   */
  @Post('packages')
  async createPackage(@Body() createData: any) {
    const data = await this.prisma.creditPackage.create({
      data: createData,
    });
    return { success: true, data, message: 'Package created successfully' };
  }

  /**
   * Update a credit package
   * @route PATCH /admin/credits/packages/:id
   */
  @Patch('packages/:id')
  async updatePackage(@Param('id') id: string, @Body() updateData: any) {
    const data = await this.prisma.creditPackage.update({
      where: { id },
      data: updateData,
    });
    return { success: true, data, message: 'Package updated successfully' };
  }

  /**
   * Delete a credit package
   * @route DELETE /admin/credits/packages/:id
   */
  @Delete('packages/:id')
  async deletePackage(@Param('id') id: string) {
    await this.prisma.creditPackage.delete({ where: { id } });
    return { success: true, message: 'Package deleted successfully' };
  }

  // ============================================================================
  // SELLER CREDITS MANAGEMENT
  // ============================================================================

  /**
   * Get seller's credit balance
   * @route GET /admin/credits/sellers/:userId/balance
   */
  @Get('sellers/:userId/balance')
  async getSellerBalance(@Param('userId') userId: string) {
    const data = await this.creditsService.getOrCreateBalance(userId);
    return { success: true, data };
  }

  /**
   * Get seller's credit transaction history
   * @route GET /admin/credits/sellers/:userId/history
   */
  @Get('sellers/:userId/history')
  async getSellerHistory(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.creditsService.getTransactionHistory(userId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return { success: true, data };
  }

  /**
   * Adjust seller's credits (add or deduct)
   * @route POST /admin/credits/sellers/:userId/adjust
   */
  @Post('sellers/:userId/adjust')
  @HttpCode(HttpStatus.OK)
  async adjustCredits(
    @Param('userId') userId: string,
    @Body() body: { amount: number; reason: string },
    @Req() req: any,
  ) {
    const { amount, reason } = body;

    if (!amount || amount === 0) {
      throw new BadRequestException('Amount cannot be zero');
    }

    if (!reason) {
      throw new BadRequestException('Reason is required');
    }

    const type = amount > 0 ? 'BONUS' : 'ADJUSTMENT';
    const action = amount > 0 ? 'admin_bonus' : 'admin_adjustment';

    if (amount < 0) {
      // For deductions, use the debit logic
      const balance = await this.creditsService.getOrCreateBalance(userId);
      const deductAmount = Math.abs(amount);

      if (balance.availableCredits < deductAmount) {
        throw new BadRequestException(
          `Insufficient credits. User has ${balance.availableCredits}, attempting to deduct ${deductAmount}`,
        );
      }

      const newBalance = balance.availableCredits - deductAmount;

      await this.prisma.$transaction(async (tx) => {
        await tx.creditBalance.update({
          where: { id: balance.id },
          data: {
            availableCredits: newBalance,
            lifetimeUsed: { increment: deductAmount },
          },
        });

        await tx.creditTransaction.create({
          data: {
            balanceId: balance.id,
            type: 'DEBIT',
            amount: -deductAmount,
            balanceBefore: balance.availableCredits,
            balanceAfter: newBalance,
            action,
            description: reason,
            performedBy: req.user.id,
          },
        });
      });

      return {
        success: true,
        data: { deducted: deductAmount, newBalance },
        message: 'Credits deducted successfully',
      };
    } else {
      // For additions, use the addCredits service
      const result = await this.creditsService.addCredits(
        userId,
        amount,
        type as any,
        action,
        reason,
        undefined,
        req.user.id,
      );

      return {
        success: true,
        data: result,
        message: 'Credits added successfully',
      };
    }
  }

  // ============================================================================
  // USER CREDITS OVERVIEW
  // ============================================================================

  /**
   * Get all user credit balances with pagination
   * @route GET /admin/credits/balances
   */
  @Get('balances')
  async getAllBalances(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '20', 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [balances, total] = await Promise.all([
      this.prisma.creditBalance.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.creditBalance.count({ where }),
    ]);

    return {
      success: true,
      data: balances,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    };
  }

  /**
   * Get specific user's credit balance and recent transactions
   * @route GET /admin/credits/users/:userId
   */
  @Get('users/:userId')
  async getUserCredits(
    @Param('userId') userId: string,
    @Query('transactionPage') transactionPage?: string,
    @Query('transactionLimit') transactionLimit?: string,
  ) {
    const balance = await this.creditsService.getOrCreateBalance(userId);

    const transHistory = await this.creditsService.getTransactionHistory(
      userId,
      {
        page: parseInt(transactionPage || '1', 10),
        limit: parseInt(transactionLimit || '10', 10),
      },
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    return {
      success: true,
      data: {
        user,
        balance,
        transactions: transHistory,
      },
    };
  }

  // ============================================================================
  // CREDIT GRANTING & DEDUCTION
  // ============================================================================

  /**
   * Grant credits to a user (admin action)
   * @route POST /admin/credits/grant
   */
  @Post('grant')
  @HttpCode(HttpStatus.OK)
  async grantCredits(
    @Body()
    body: {
      userId: string;
      amount: number;
      description?: string;
      type?: 'BONUS' | 'REFUND' | 'ADJUSTMENT';
    },
    @Req() req,
  ) {
    const admin = req.user;
    if (!body.userId || !body.amount) {
      throw new BadRequestException('userId and amount are required');
    }

    if (body.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const type = (body.type || 'BONUS') as CreditTransactionType;
    const description =
      body.description ||
      `Admin ${admin.email} granted ${body.amount} credits`;

    const result = await this.creditsService.addCredits(
      body.userId,
      body.amount,
      type,
      'admin_grant',
      description,
      undefined,
      admin.id,
    );

    return {
      success: true,
      data: result,
      message: `Successfully granted ${body.amount} credits to user`,
    };
  }

  /**
   * Deduct credits from a user (admin action)
   * @route POST /admin/credits/deduct
   */
  @Post('deduct')
  @HttpCode(HttpStatus.OK)
  async deductCredits(
    @Body()
    body: {
      userId: string;
      amount: number;
      description?: string;
    },
    @Req() req,
  ) {
    const admin = req.user;
    if (!body.userId || !body.amount) {
      throw new BadRequestException('userId and amount are required');
    }

    if (body.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const balance = await this.creditsService.getOrCreateBalance(body.userId);

    if (balance.availableCredits < body.amount) {
      throw new BadRequestException(
        `Insufficient credits. User has ${balance.availableCredits}, attempting to deduct ${body.amount}`,
      );
    }

    const description =
      body.description ||
      `Admin ${admin.email} deducted ${body.amount} credits`;

    const newBalance = balance.availableCredits - body.amount;

    await this.prisma.$transaction(async (tx) => {
      await tx.creditBalance.update({
        where: { id: balance.id },
        data: {
          availableCredits: newBalance,
          lifetimeUsed: { increment: body.amount },
        },
      });

      await tx.creditTransaction.create({
        data: {
          balanceId: balance.id,
          type: 'DEBIT',
          amount: -body.amount,
          balanceBefore: balance.availableCredits,
          balanceAfter: newBalance,
          action: 'admin_deduct',
          description,
          performedBy: admin.id,
        },
      });
    });

    return {
      success: true,
      data: {
        deducted: body.amount,
        newBalance,
      },
      message: `Successfully deducted ${body.amount} credits from user`,
    };
  }

  // ============================================================================
  // TRANSACTIONS & STATISTICS
  // ============================================================================

  /**
   * Get all credit transactions across the platform
   * @route GET /admin/credits/transactions
   */
  @Get('transactions')
  async getAllTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: CreditTransactionType,
    @Query('userId') userId?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '50', 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (userId) {
      const balance = await this.prisma.creditBalance.findUnique({
        where: { userId },
      });
      if (balance) {
        where.balanceId = balance.id;
      }
    }

    const [transactions, total] = await Promise.all([
      this.prisma.creditTransaction.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          balance: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.creditTransaction.count({ where }),
    ]);

    return {
      success: true,
      data: transactions,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    };
  }

  /**
   * Get credit statistics
   * @route GET /admin/credits/stats
   */
  @Get('stats')
  async getStats() {
    const [totalBalances, totalTransactions, stats] = await Promise.all([
      this.prisma.creditBalance.count(),
      this.prisma.creditTransaction.count(),
      this.prisma.creditBalance.aggregate({
        _sum: {
          availableCredits: true,
          lifetimeCredits: true,
          purchasedCredits: true,
          lifetimeUsed: true,
        },
        _avg: {
          availableCredits: true,
        },
      }),
    ]);

    const recentTransactions = await this.prisma.creditTransaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        balance: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: {
        totalUsers: totalBalances,
        totalTransactions,
        totalAvailableCredits: stats._sum.availableCredits || 0,
        totalLifetimeCredits: stats._sum.lifetimeCredits || 0,
        totalPurchasedCredits: stats._sum.purchasedCredits || 0,
        totalUsedCredits: stats._sum.lifetimeUsed || 0,
        averageCreditsPerUser: Math.round(stats._avg.availableCredits || 0),
        recentTransactions,
      },
    };
  }
}
