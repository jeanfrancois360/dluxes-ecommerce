import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SellerCreditTransactionType } from '@prisma/client';
import { CreateSellerPromotionDto, UpdateSellerPromotionDto } from './dto/seller-promotion.dto';

@Injectable()
export class SellerPromotionsService {
  private readonly logger = new Logger(SellerPromotionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Admin CRUD ────────────────────────────────────────────────────────────

  async findAll() {
    return this.prisma.sellerPromotion.findMany({
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const promo = await this.prisma.sellerPromotion.findUnique({
      where: { id },
      include: {
        applications: {
          orderBy: { appliedAt: 'desc' },
          take: 50,
        },
        _count: { select: { applications: true } },
      },
    });
    if (!promo) throw new NotFoundException('Promotion not found');
    return promo;
  }

  async create(dto: CreateSellerPromotionDto, adminId: string) {
    const validFrom = new Date(dto.validFrom);
    const validTo = new Date(dto.validTo);
    if (validTo <= validFrom) {
      throw new BadRequestException('"Valid To" must be after "Valid From"');
    }
    return this.prisma.sellerPromotion.create({
      data: {
        name: dto.name,
        description: dto.description,
        creditsAmount: dto.creditsAmount,
        validFrom,
        validTo,
        maxUses: dto.maxUses ?? null,
        isActive: dto.isActive ?? true,
        createdBy: adminId,
      },
    });
  }

  async update(id: string, dto: UpdateSellerPromotionDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.validFrom) data.validFrom = new Date(dto.validFrom);
    if (dto.validTo) data.validTo = new Date(dto.validTo);

    return this.prisma.sellerPromotion.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.sellerPromotion.delete({ where: { id } });
  }

  // ─── Auto-apply on seller registration ─────────────────────────────────────

  /**
   * Called right after a new seller store is created.
   * Finds the first active promotion valid today, grants credits, records the application.
   * Non-throwing — any error is logged.
   */
  async applyPromotionToNewStore(storeId: string, userId: string): Promise<void> {
    try {
      const now = new Date();

      const promotion = await this.prisma.sellerPromotion.findFirst({
        where: {
          isActive: true,
          validFrom: { lte: now },
          validTo: { gte: now },
          applications: { none: { storeId } },
        },
        orderBy: { validFrom: 'asc' },
      });

      if (!promotion) return;

      // Enforce maxUses cap
      if (promotion.maxUses !== null && promotion.usedCount >= promotion.maxUses) return;

      await this.grantPromotionCredits(promotion.id, storeId, userId);
    } catch (err) {
      this.logger.warn(
        `applyPromotionToNewStore failed for store ${storeId}: ${(err as Error).message}`
      );
    }
  }

  /**
   * Admin-triggered: manually apply a specific promotion to a specific store.
   */
  async applyPromotionToStore(promotionId: string, storeId: string) {
    const promotion = await this.findOne(promotionId);

    const alreadyApplied = await this.prisma.sellerPromotionApplication.findUnique({
      where: { promotionId_storeId: { promotionId, storeId } },
    });
    if (alreadyApplied) {
      throw new BadRequestException('This promotion has already been applied to this store');
    }

    if (promotion.maxUses !== null && promotion.usedCount >= promotion.maxUses) {
      throw new BadRequestException('This promotion has reached its usage limit');
    }

    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    return this.grantPromotionCredits(promotionId, storeId, store.userId);
  }

  // ─── Internal helpers ───────────────────────────────────────────────────────

  private async grantPromotionCredits(promotionId: string, storeId: string, userId: string) {
    const promotion = await this.prisma.sellerPromotion.findUniqueOrThrow({
      where: { id: promotionId },
    });
    const store = await this.prisma.store.findUniqueOrThrow({ where: { id: storeId } });

    const months = promotion.creditsAmount;
    const balanceBefore = store.creditsBalance;
    const balanceAfter = balanceBefore + months;

    // Compute new expiry date
    const now = new Date();
    let newExpiry: Date;
    if (store.creditsExpiresAt && store.creditsExpiresAt > now) {
      newExpiry = new Date(store.creditsExpiresAt);
    } else {
      newExpiry = new Date(now);
    }
    newExpiry.setMonth(newExpiry.getMonth() + months);

    const creditTx = await this.prisma.$transaction(async (tx) => {
      await tx.store.update({
        where: { id: storeId },
        data: {
          creditsBalance: balanceAfter,
          creditsExpiresAt: newExpiry,
          creditsGraceEndsAt: null,
        },
      });

      const creditTx = await tx.sellerCreditTransaction.create({
        data: {
          userId,
          storeId,
          type: SellerCreditTransactionType.PROMOTION,
          amount: months,
          balanceBefore,
          balanceAfter,
          description: `Promotional credits: ${promotion.name}`,
          notes: promotion.description ?? undefined,
        },
      });

      await tx.sellerPromotionApplication.create({
        data: {
          promotionId,
          storeId,
          userId,
          transactionId: creditTx.id,
        },
      });

      await tx.sellerPromotion.update({
        where: { id: promotionId },
        data: { usedCount: { increment: 1 } },
      });

      return creditTx;
    });

    this.logger.log(
      `Promotion "${promotion.name}" applied to store ${storeId}: +${months} month(s)`
    );

    return creditTx;
  }
}
