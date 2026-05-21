import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  Prisma,
  AffiliateAdvertiserStatus,
  AffiliateCommissionStatus,
  TranslationStatus,
} from '@prisma/client';
import {
  CreateAdvertiserDto,
  UpdateAdvertiserDto,
  ListAdvertisersQueryDto,
  CreateAffiliateProductDto,
  UpdateAffiliateProductDto,
  ListProductsQueryDto,
  AdminListProductsQueryDto,
  CreateTranslationDto,
  UpdateTranslationDto,
  SyncCommissionDto,
  ListCommissionsQueryDto,
  ClickAnalyticsQueryDto,
} from './dto/affiliate.dto';

/**
 * Affiliate Service (Phase C.3)
 * Manages Awin affiliate advertisers, products, translations, click tracking,
 * and commission sync for the NextPik affiliate integration.
 */
@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // ADVERTISERS
  // ============================================================================

  async createAdvertiser(dto: CreateAdvertiserDto) {
    this.logger.log(`Creating advertiser: awinMerchantId=${dto.awinMerchantId}`);

    const existing = await this.prisma.affiliateAdvertiser.findUnique({
      where: { awinMerchantId: dto.awinMerchantId },
    });
    if (existing) {
      throw new ConflictException(
        `Advertiser with awinMerchantId '${dto.awinMerchantId}' already exists`
      );
    }

    const advertiser = await this.prisma.affiliateAdvertiser.create({
      data: {
        awinMerchantId: dto.awinMerchantId,
        name: dto.name,
        websiteUrl: dto.websiteUrl,
        logoUrl: dto.logoUrl,
        approvalStatus: dto.approvalStatus ?? AffiliateAdvertiserStatus.PENDING,
        defaultCommissionRate: dto.defaultCommissionRate,
        notes: dto.notes,
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Created advertiser: ${advertiser.id}`);
    return advertiser;
  }

  async listAdvertisers(query: ListAdvertisersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AffiliateAdvertiserWhereInput = {
      deletedAt: null,
      ...(query.approvalStatus && { approvalStatus: query.approvalStatus }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    };

    const [advertisers, total] = await Promise.all([
      this.prisma.affiliateAdvertiser.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.affiliateAdvertiser.count({ where }),
    ]);

    return {
      data: advertisers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAdvertiser(id: string) {
    const advertiser = await this.prisma.affiliateAdvertiser.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!advertiser) {
      throw new NotFoundException(`Advertiser ${id} not found`);
    }

    return advertiser;
  }

  async updateAdvertiser(id: string, dto: UpdateAdvertiserDto) {
    await this.getAdvertiser(id); // throws NotFoundException if not found

    const advertiser = await this.prisma.affiliateAdvertiser.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.websiteUrl !== undefined && { websiteUrl: dto.websiteUrl }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.approvalStatus !== undefined && { approvalStatus: dto.approvalStatus }),
        ...(dto.defaultCommissionRate !== undefined && {
          defaultCommissionRate: dto.defaultCommissionRate,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.logger.log(`Updated advertiser: ${id}`);
    return advertiser;
  }

  async deleteAdvertiser(id: string) {
    await this.getAdvertiser(id); // throws NotFoundException if not found

    await this.prisma.affiliateAdvertiser.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.logger.log(`Soft-deleted advertiser: ${id}`);
  }

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  async createProduct(dto: CreateAffiliateProductDto, createdById: string) {
    this.logger.log(`Creating affiliate product: slug=${dto.slug}`);

    // Verify slug uniqueness
    const existing = await this.prisma.affiliateProduct.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Affiliate product with slug '${dto.slug}' already exists`);
    }

    // Verify advertiser exists
    await this.getAdvertiser(dto.advertiserId);

    const product = await this.prisma.affiliateProduct.create({
      data: {
        slug: dto.slug,
        advertiserId: dto.advertiserId,
        awinDeepLink: dto.awinDeepLink,
        imageUrl: dto.imageUrl,
        galleryUrls: dto.galleryUrls ?? [],
        displayPrice: dto.displayPrice,
        displayCurrency: dto.displayCurrency ?? 'EUR',
        originalPrice: dto.originalPrice,
        productCategoryIds: dto.productCategoryIds ?? [],
        tags: dto.tags ?? [],
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        displayOrder: dto.displayOrder ?? 0,
        createdById,
      },
      include: {
        advertiser: { select: { id: true, name: true, awinMerchantId: true } },
        translations: true,
      },
    });

    this.logger.log(`Created affiliate product: ${product.id}`);
    return product;
  }

  /**
   * Public listing: only active, non-deleted products with optional translation
   */
  async listProducts(query: ListProductsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AffiliateProductWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(query.advertiserId && { advertiserId: query.advertiserId }),
      ...(query.isFeatured !== undefined && { isFeatured: query.isFeatured }),
      ...(query.tag && { tags: { has: query.tag } }),
    };

    const [products, total] = await Promise.all([
      this.prisma.affiliateProduct.findMany({
        where,
        include: {
          advertiser: { select: { id: true, name: true, logoUrl: true } },
          translations: query.locale
            ? { where: { locale: query.locale } }
            : { where: { isOriginal: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.affiliateProduct.count({ where }),
    ]);

    return {
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Admin listing: includes inactive + soft-deleted
   */
  async adminListProducts(query: AdminListProductsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AffiliateProductWhereInput = {
      ...(query.advertiserId && { advertiserId: query.advertiserId }),
      ...(query.isFeatured !== undefined && { isFeatured: query.isFeatured }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.tag && { tags: { has: query.tag } }),
      ...(!query.includeDeleted && { deletedAt: null }),
    };

    const [products, total] = await Promise.all([
      this.prisma.affiliateProduct.findMany({
        where,
        include: {
          advertiser: { select: { id: true, name: true, awinMerchantId: true } },
          _count: { select: { translations: true, clickLogs: true } },
        },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.affiliateProduct.count({ where }),
    ]);

    return {
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getProductBySlug(slug: string, locale?: string) {
    const product = await this.prisma.affiliateProduct.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      include: {
        advertiser: { select: { id: true, name: true, logoUrl: true, websiteUrl: true } },
        translations: locale ? { where: { locale } } : { where: { isOriginal: true } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Affiliate product '${slug}' not found`);
    }

    return product;
  }

  async getProductById(id: string) {
    const product = await this.prisma.affiliateProduct.findFirst({
      where: { id, deletedAt: null },
      include: {
        advertiser: { select: { id: true, name: true, awinMerchantId: true } },
        translations: true,
        _count: { select: { clickLogs: true } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Affiliate product ${id} not found`);
    }

    return product;
  }

  async updateProduct(id: string, dto: UpdateAffiliateProductDto) {
    await this.getProductById(id);

    const product = await this.prisma.affiliateProduct.update({
      where: { id },
      data: {
        ...(dto.awinDeepLink !== undefined && { awinDeepLink: dto.awinDeepLink }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.galleryUrls !== undefined && { galleryUrls: dto.galleryUrls }),
        ...(dto.displayPrice !== undefined && { displayPrice: dto.displayPrice }),
        ...(dto.displayCurrency !== undefined && { displayCurrency: dto.displayCurrency }),
        ...(dto.originalPrice !== undefined && { originalPrice: dto.originalPrice }),
        ...(dto.productCategoryIds !== undefined && { productCategoryIds: dto.productCategoryIds }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
        ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
      },
    });

    this.logger.log(`Updated affiliate product: ${id}`);
    return product;
  }

  async deleteProduct(id: string) {
    await this.getProductById(id);

    await this.prisma.affiliateProduct.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.logger.log(`Soft-deleted affiliate product: ${id}`);
  }

  // ============================================================================
  // TRANSLATIONS
  // ============================================================================

  async upsertTranslation(productId: string, dto: CreateTranslationDto, reviewedById?: string) {
    await this.getProductById(productId);

    const translation = await this.prisma.affiliateProductTranslation.upsert({
      where: {
        affiliateProductId_locale: { affiliateProductId: productId, locale: dto.locale },
      },
      create: {
        affiliateProductId: productId,
        locale: dto.locale,
        title: dto.title,
        description: dto.description,
        longDescription: dto.longDescription,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        translationStatus: dto.translationStatus ?? TranslationStatus.ORIGINAL,
        isOriginal: dto.isOriginal ?? false,
        reviewedById: reviewedById ?? null,
        reviewedAt: reviewedById ? new Date() : null,
      },
      update: {
        title: dto.title,
        description: dto.description,
        longDescription: dto.longDescription,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        translationStatus: dto.translationStatus,
        isOriginal: dto.isOriginal,
        ...(reviewedById && { reviewedById, reviewedAt: new Date() }),
      },
    });

    this.logger.log(`Upserted translation locale=${dto.locale} for product=${productId}`);
    return translation;
  }

  async updateTranslation(
    productId: string,
    locale: string,
    dto: UpdateTranslationDto,
    reviewedById?: string
  ) {
    const existing = await this.prisma.affiliateProductTranslation.findUnique({
      where: { affiliateProductId_locale: { affiliateProductId: productId, locale } },
    });

    if (!existing) {
      throw new NotFoundException(
        `Translation for locale '${locale}' not found on product ${productId}`
      );
    }

    return this.prisma.affiliateProductTranslation.update({
      where: { affiliateProductId_locale: { affiliateProductId: productId, locale } },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.longDescription !== undefined && { longDescription: dto.longDescription }),
        ...(dto.seoTitle !== undefined && { seoTitle: dto.seoTitle }),
        ...(dto.seoDescription !== undefined && { seoDescription: dto.seoDescription }),
        ...(dto.translationStatus !== undefined && { translationStatus: dto.translationStatus }),
        ...(dto.isOriginal !== undefined && { isOriginal: dto.isOriginal }),
        ...(reviewedById && { reviewedById, reviewedAt: new Date() }),
      },
    });
  }

  async listTranslations(productId: string) {
    await this.getProductById(productId);

    return this.prisma.affiliateProductTranslation.findMany({
      where: { affiliateProductId: productId },
      orderBy: { locale: 'asc' },
    });
  }

  // ============================================================================
  // CLICK TRACKING
  // ============================================================================

  async logClick(
    productId: string,
    context: {
      userId?: string;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      referrer?: string;
      locale?: string;
    }
  ): Promise<{ clickId: string; deepLink: string }> {
    const product = await this.prisma.affiliateProduct.findFirst({
      where: { id: productId, isActive: true, deletedAt: null },
      select: { id: true, advertiserId: true, awinDeepLink: true },
    });

    if (!product) {
      throw new NotFoundException(`Affiliate product ${productId} not found`);
    }

    // Critical path: audit log must succeed. If this throws, the caller sees 500.
    const clickLog = await this.prisma.affiliateClickLog.create({
      data: {
        affiliateProductId: productId,
        advertiserId: product.advertiserId,
        userId: context.userId ?? null,
        sessionId: context.sessionId ?? null,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
        referrer: context.referrer ?? null,
        locale: context.locale ?? null,
      },
    });

    // Best-effort: denormalized counter increment.
    // AffiliateProduct.clickCount is approximate analytics convenience data.
    // Source of truth is COUNT(AffiliateClickLog) WHERE affiliateProductId = ?.
    // Counter may diverge under transient failures; that is acceptable.
    this.prisma.affiliateProduct
      .update({ where: { id: productId }, data: { clickCount: { increment: 1 } } })
      .catch((err: Error) =>
        this.logger.warn(
          `Failed to increment clickCount for affiliate product ${productId}: ${err.message}. ` +
            `Audit log ${clickLog.id} was written successfully. Counter reconcilable from AffiliateClickLog.`
        )
      );

    return { clickId: clickLog.id, deepLink: product.awinDeepLink };
  }

  // ============================================================================
  // COMMISSIONS
  // ============================================================================

  /**
   * Upsert an Awin commission record. Idempotent by awinTransactionId.
   */
  async syncCommission(dto: SyncCommissionDto) {
    this.logger.log(`Syncing commission: awinTransactionId=${dto.awinTransactionId}`);

    const commission = await this.prisma.affiliateCommission.upsert({
      where: { awinTransactionId: dto.awinTransactionId },
      create: {
        awinTransactionId: dto.awinTransactionId,
        affiliateProductId: dto.affiliateProductId ?? null,
        advertiserId: dto.advertiserId ?? null,
        awinClickRef: dto.awinClickRef ?? null,
        saleAmount: dto.saleAmount,
        commissionAmount: dto.commissionAmount,
        currency: dto.currency,
        status: dto.status,
        transactionDate: new Date(dto.transactionDate),
        validationDate: dto.validationDate ? new Date(dto.validationDate) : null,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : null,
        rawPayload: dto.rawPayload as Prisma.InputJsonValue,
        syncedAt: new Date(),
      },
      update: {
        status: dto.status,
        commissionAmount: dto.commissionAmount,
        saleAmount: dto.saleAmount,
        validationDate: dto.validationDate ? new Date(dto.validationDate) : undefined,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        rawPayload: dto.rawPayload as Prisma.InputJsonValue,
        syncedAt: new Date(),
      },
    });

    this.logger.log(`Synced commission: ${commission.id} (status=${commission.status})`);
    return commission;
  }

  async batchSyncCommissions(dtos: SyncCommissionDto[]) {
    if (dtos.length === 0) {
      throw new BadRequestException('No commissions provided');
    }
    if (dtos.length > 500) {
      throw new BadRequestException('Batch size exceeds 500');
    }

    const results = await Promise.allSettled(dtos.map((dto) => this.syncCommission(dto)));

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(`Batch commission sync: ${succeeded} succeeded, ${failed} failed`);

    return { succeeded, failed, total: dtos.length };
  }

  async listCommissions(query: ListCommissionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AffiliateCommissionWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.advertiserId && { advertiserId: query.advertiserId }),
      ...(query.affiliateProductId && { affiliateProductId: query.affiliateProductId }),
      ...(query.startDate &&
        query.endDate && {
          transactionDate: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
          },
        }),
    };

    const [commissions, total] = await Promise.all([
      this.prisma.affiliateCommission.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.affiliateCommission.count({ where }),
    ]);

    return {
      data: commissions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCommissionStats(advertiserId?: string) {
    const where: Prisma.AffiliateCommissionWhereInput = {
      ...(advertiserId && { advertiserId }),
    };

    const [byStatus, totals] = await Promise.all([
      this.prisma.affiliateCommission.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { commissionAmount: true, saleAmount: true },
      }),
      this.prisma.affiliateCommission.aggregate({
        where,
        _count: true,
        _sum: { commissionAmount: true, saleAmount: true },
      }),
    ]);

    const statusMap: Record<
      string,
      { count: number; commissionAmount: number; saleAmount: number }
    > = {};
    for (const stat of byStatus) {
      statusMap[stat.status] = {
        count: stat._count,
        commissionAmount: stat._sum.commissionAmount ?? 0,
        saleAmount: stat._sum.saleAmount ?? 0,
      };
    }

    return {
      total: {
        count: totals._count,
        commissionAmount: totals._sum.commissionAmount ?? 0,
        saleAmount: totals._sum.saleAmount ?? 0,
      },
      byStatus: statusMap,
    };
  }

  // ============================================================================
  // CLICK ANALYTICS
  // ============================================================================

  async listClickLogs(query: ClickAnalyticsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.AffiliateClickLogWhereInput = {
      ...(query.affiliateProductId && { affiliateProductId: query.affiliateProductId }),
      ...(query.advertiserId && { advertiserId: query.advertiserId }),
      ...(query.startDate &&
        query.endDate && {
          createdAt: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate),
          },
        }),
    };

    const [logs, total] = await Promise.all([
      this.prisma.affiliateClickLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.affiliateClickLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
