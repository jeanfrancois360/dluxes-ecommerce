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
import { AwinApiClient, AwinTransaction, AwinTransactionFilters } from './awin-api.service';
import { AwinFeedService, AllFeedsSyncSummary, FeedSyncResult } from './awin-feed.service';
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly awinClient: AwinApiClient,
    private readonly awinFeedService: AwinFeedService
  ) {}

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
      ...(query.fulfillmentSource && { fulfillmentSource: query.fulfillmentSource }),
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
        // awinClickRef written below after we know clickLog.id
      },
    });

    // Inject our click-log ID as the Awin SubID (?clickref=…).
    // Awin echoes this value back in AffiliateCommission.awinClickRef, enabling
    // click→commission attribution. The separator depends on whether the stored
    // deep link already carries a query string.
    const separator = product.awinDeepLink.includes('?') ? '&' : '?';
    const trackedLink = `${product.awinDeepLink}${separator}clickref=${clickLog.id}`;

    // Best-effort: write back the injected clickRef and increment the denormalized counter.
    // Both are approximate convenience data — source of truth is AffiliateClickLog.
    Promise.all([
      this.prisma.affiliateClickLog.update({
        where: { id: clickLog.id },
        data: { awinClickRef: clickLog.id },
      }),
      this.prisma.affiliateProduct.update({
        where: { id: productId },
        data: { clickCount: { increment: 1 } },
      }),
    ]).catch((err: Error) =>
      this.logger.warn(
        `Best-effort post-click update failed for click ${clickLog.id}: ${err.message}`
      )
    );

    return { clickId: clickLog.id, deepLink: trackedLink };
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
  // FEED SYNC (delegates to AwinFeedService)
  // ============================================================================

  async syncAllFeeds(): Promise<AllFeedsSyncSummary> {
    return this.awinFeedService.syncAllFeeds();
  }

  async syncFeedForMerchant(awinMerchantId: string): Promise<FeedSyncResult> {
    return this.awinFeedService.syncFeedForMerchant(awinMerchantId);
  }

  async listAvailableFeeds() {
    return this.awinFeedService.listAvailableFeeds();
  }

  async listFeedSyncs(query: { advertiserId?: string; limit?: number; page?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = query.advertiserId ? { advertiserId: query.advertiserId } : {};
    const [syncs, total] = await Promise.all([
      this.prisma.awinFeedSync.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.awinFeedSync.count({ where }),
    ]);

    return {
      data: syncs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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

  // ============================================================================
  // AWIN COMMISSION SYNC (Phase C.4)
  // ============================================================================

  /**
   * Sync commissions from the Awin Publisher API for the given date range.
   * Idempotent on awinTransactionId — upserts existing records.
   *
   * Called by:
   *   - AwinCronService (nightly at 3am, syncs last 48h)
   *   - POST /affiliate/admin/commissions/awin-sync (manual trigger)
   *
   * Attribution: affiliateProductId is resolved via AffiliateClickLog.awinClickRef
   *   when the SubID we inject at click time matches tx.clickRefs[0].
   *   When APPROVED for the first time, AffiliateProduct.conversionCount is incremented.
   *   insert vs update are not distinguished; updated is always 0 in returned counts.
   */
  async syncCommissionsFromAwin(filters: AwinTransactionFilters): Promise<{
    fetched: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: number;
  }> {
    if (!this.awinClient.isConfigured()) {
      this.logger.warn('Awin credentials not configured — sync skipped.');
      return { fetched: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 };
    }

    let transactions: AwinTransaction[];
    try {
      transactions = await this.awinClient.fetchTransactions(filters);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Awin API call failed: ${msg}`,
        err instanceof Error ? err.stack : undefined
      );
      throw err;
    }

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const tx of transactions) {
      try {
        // Look up our AffiliateAdvertiser by Awin's numeric advertiserId
        const advertiser = await this.prisma.affiliateAdvertiser.findUnique({
          where: { awinMerchantId: String(tx.advertiserId) },
        });

        if (!advertiser) {
          this.logger.warn(
            `No AffiliateAdvertiser found for Awin advertiserId=${tx.advertiserId} — ` +
              `commission ${tx.id} skipped. Create the advertiser via POST /affiliate/admin/advertisers ` +
              `with awinMerchantId="${tx.advertiserId}".`
          );
          skipped++;
          continue;
        }

        const commissionAmt = this.extractAmount(tx.commissionAmount);
        const saleAmt = this.extractAmount(tx.saleAmount);
        const status = this.mapAwinStatus(tx.commissionStatus);
        const awinClickRef = tx.clickRefs?.[0] ?? null;

        // Resolve affiliateProductId via the SubID we injected at click time.
        // AffiliateClickLog.awinClickRef = our clickLog.id = Awin's clickRefs[0].
        let affiliateProductId: string | null = null;
        if (awinClickRef) {
          const clickLog = await this.prisma.affiliateClickLog.findFirst({
            where: { awinClickRef },
            select: { affiliateProductId: true },
          });
          affiliateProductId = clickLog?.affiliateProductId ?? null;
        }

        const prevCommission = await this.prisma.affiliateCommission.findUnique({
          where: { awinTransactionId: String(tx.id) },
          select: { status: true, affiliateProductId: true },
        });

        await this.prisma.affiliateCommission.upsert({
          where: { awinTransactionId: String(tx.id) },
          create: {
            awinTransactionId: String(tx.id),
            awinClickRef,
            advertiserId: advertiser.id,
            affiliateProductId,
            saleAmount: saleAmt.amount,
            commissionAmount: commissionAmt.amount,
            currency: commissionAmt.currency,
            status,
            transactionDate: new Date(tx.transactionDate),
            validationDate: tx.validationDate ? new Date(tx.validationDate) : null,
            paymentDate: tx.paymentDate ? new Date(tx.paymentDate) : null,
            rawPayload: tx as unknown as Prisma.InputJsonValue,
            syncedAt: new Date(),
          },
          update: {
            status,
            // Backfill affiliateProductId if we can now resolve it (e.g. on re-sync)
            ...(affiliateProductId &&
              !prevCommission?.affiliateProductId && { affiliateProductId }),
            saleAmount: saleAmt.amount,
            commissionAmount: commissionAmt.amount,
            currency: commissionAmt.currency,
            validationDate: tx.validationDate ? new Date(tx.validationDate) : undefined,
            paymentDate: tx.paymentDate ? new Date(tx.paymentDate) : undefined,
            rawPayload: tx as unknown as Prisma.InputJsonValue,
            syncedAt: new Date(),
          },
        });

        // Increment conversionCount when a commission transitions to APPROVED
        // for the first time (previous status was not APPROVED).
        if (
          status === AffiliateCommissionStatus.APPROVED &&
          prevCommission?.status !== AffiliateCommissionStatus.APPROVED &&
          affiliateProductId
        ) {
          this.prisma.affiliateProduct
            .update({
              where: { id: affiliateProductId },
              data: { conversionCount: { increment: 1 } },
            })
            .catch((err: Error) =>
              this.logger.warn(
                `Failed to increment conversionCount for product ${affiliateProductId}: ${err.message}`
              )
            );
        }

        inserted++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to upsert Awin commission ${tx.id}: ${msg}`);
        errors++;
      }
    }

    this.logger.log(
      `Awin sync complete: fetched=${transactions.length}, processed=${inserted}, skipped=${skipped}, errors=${errors}`
    );

    return { fetched: transactions.length, inserted, updated: 0, skipped, errors };
  }

  /**
   * Defensive amount extractor.
   * Handles both the nested { amount, currency } shape (awin-py / expected)
   * and a flat numeric value (fallback if the live API differs from documented shape).
   * If the live API returns a flat shape, extend this helper — do not change the interface.
   */
  private extractAmount(raw: unknown): { amount: number; currency: string } {
    if (raw !== null && typeof raw === 'object' && 'amount' in (raw as object)) {
      const obj = raw as { amount: unknown; currency?: unknown };
      return {
        amount: Number(obj.amount) || 0,
        currency: typeof obj.currency === 'string' ? obj.currency : 'EUR',
      };
    }
    // Flat shape: raw is a bare number
    return { amount: Number(raw) || 0, currency: 'EUR' };
  }

  /**
   * Maps Awin's commissionStatus string to our AffiliateCommissionStatus enum.
   * Note: Awin's 'PAID' is a separate payment event, not a transaction status —
   * it does not appear in the transactions endpoint response.
   */
  private mapAwinStatus(awinStatus: string): AffiliateCommissionStatus {
    switch (awinStatus.toLowerCase()) {
      case 'pending':
        return AffiliateCommissionStatus.PENDING;
      case 'approved':
        return AffiliateCommissionStatus.APPROVED;
      case 'declined':
        return AffiliateCommissionStatus.DECLINED;
      default:
        this.logger.warn(`Unknown Awin commissionStatus: "${awinStatus}" — defaulting to PENDING.`);
        return AffiliateCommissionStatus.PENDING;
    }
  }
}
