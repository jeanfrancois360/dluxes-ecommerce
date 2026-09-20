import { Injectable, Logger } from '@nestjs/common';
import { AffiliateFulfillmentSource, TranslationStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AwinApiClient, AwinFeedMeta, AwinFeedProduct } from './awin-api.service';

// Default locales to try when downloading a feed, in order of preference.
const DEFAULT_FEED_LOCALES = ['en_GB', 'en_US', 'en_NL', 'en_DE', 'fr_FR', 'de_DE'];

export interface FeedSyncResult {
  advertiserId: string;
  awinMerchantId: string;
  feedId: string | null;
  productsUpserted: number;
  productsSkipped: number;
  errors: number;
  status: 'success' | 'partial' | 'failed' | 'skipped';
  errorDetail?: string;
}

export interface AllFeedsSyncSummary {
  advertisersWithFeed: number;
  advertisersWithoutFeed: number;
  totalUpserted: number;
  totalSkipped: number;
  totalErrors: number;
  results: FeedSyncResult[];
}

@Injectable()
export class AwinFeedService {
  private readonly logger = new Logger(AwinFeedService.name);
  private readonly syncingAdvertisers = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly awinClient: AwinApiClient
  ) {}

  // ============================================================================
  // PUBLIC ORCHESTRATORS
  // ============================================================================

  /**
   * Sync product feeds for all active, approved AffiliateAdvertisers.
   * Fetches the Awin feed list once, then processes each advertiser that has a feed.
   * Writes an AwinFeedSync audit row for every advertiser (with/without feed).
   */
  async syncAllFeeds(): Promise<AllFeedsSyncSummary> {
    if (!this.awinClient.isConfigured()) {
      this.logger.warn('Awin credentials not configured — feed sync skipped.');
      return {
        advertisersWithFeed: 0,
        advertisersWithoutFeed: 0,
        totalUpserted: 0,
        totalSkipped: 0,
        totalErrors: 0,
        results: [],
      };
    }

    this.logger.log('Starting full Awin feed sync (enhanced JSONL API)');
    const startedAt = new Date();

    // Get all active, approved advertisers from our DB.
    // No Awin "feed list" API call needed — we derive feed URLs from awinMerchantId directly.
    const advertisers = await this.prisma.affiliateAdvertiser.findMany({
      where: { isActive: true, deletedAt: null, approvalStatus: 'APPROVED' },
    });

    const results: FeedSyncResult[] = [];
    let totalUpserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let advertisersWithFeed = 0;
    let advertisersWithoutFeed = 0;

    for (const advertiser of advertisers) {
      const result = await this.syncOneFeed(
        advertiser.id,
        advertiser.awinMerchantId,
        advertiser.name
      );
      results.push(result);

      if (result.status === 'skipped') {
        advertisersWithoutFeed++;
      } else {
        advertisersWithFeed++;
        totalUpserted += result.productsUpserted;
        totalSkipped += result.productsSkipped;
        totalErrors += result.errors;
      }
    }

    this.logger.log(
      `Full feed sync complete: ${advertisersWithFeed} with feed, ` +
        `${advertisersWithoutFeed} without, upserted=${totalUpserted}, errors=${totalErrors}`
    );

    return {
      advertisersWithFeed,
      advertisersWithoutFeed,
      totalUpserted,
      totalSkipped,
      totalErrors,
      results,
    };
  }

  /**
   * Sync the feed for a single advertiser (by awinMerchantId).
   * Used by the manual-trigger admin endpoint.
   */
  async syncFeedForMerchant(awinMerchantId: string): Promise<FeedSyncResult> {
    if (!this.awinClient.isConfigured()) {
      throw new Error('Awin credentials not configured.');
    }

    const advertiser = await this.prisma.affiliateAdvertiser.findUnique({
      where: { awinMerchantId },
    });
    if (!advertiser) {
      throw new Error(`No AffiliateAdvertiser with awinMerchantId="${awinMerchantId}"`);
    }

    return this.syncOneFeed(advertiser.id, awinMerchantId, advertiser.name);
  }

  /**
   * Returns feed metadata derived from active DB advertisers.
   * The Awin enhanced feed API has no "list" endpoint — we construct
   * the metadata from what we know (advertiser ID + fixed URL pattern).
   */
  async listAvailableFeeds(): Promise<AwinFeedMeta[]> {
    const publisherId = this.awinClient.getPublisherId();
    const advertisers = await this.prisma.affiliateAdvertiser.findMany({
      where: { isActive: true, deletedAt: null, approvalStatus: 'APPROVED' },
      orderBy: { name: 'asc' },
    });

    return advertisers.map((adv) => ({
      feedId: `${adv.awinMerchantId}-retail`,
      feedName: `${adv.name} — Retail`,
      advertiserId: adv.awinMerchantId,
      advertiserName: adv.name,
      downloadUrl: publisherId
        ? `https://api.awin.com/publishers/${publisherId}/awinfeeds/download/${adv.awinMerchantId}-retail-en_GB.jsonl`
        : '',
      productCount: 0,
      language: 'en_GB',
      region: '',
      vertical: 'retail',
      lastImported: '',
    }));
  }

  // ============================================================================
  // PRIVATE — core sync logic
  // ============================================================================

  private async syncOneFeed(
    advertiserId: string,
    awinMerchantId: string,
    advertiserName: string
  ): Promise<FeedSyncResult> {
    // Prevent concurrent syncs for the same advertiser
    if (this.syncingAdvertisers.has(advertiserId)) {
      this.logger.warn(`Sync already in progress for ${advertiserName} — skipping`);
      return {
        advertiserId,
        awinMerchantId,
        feedId: null,
        productsUpserted: 0,
        productsSkipped: 0,
        errors: 0,
        status: 'skipped',
        errorDetail: 'Sync already in progress for this advertiser',
      };
    }

    this.syncingAdvertisers.add(advertiserId);
    const startedAt = new Date();
    this.logger.log(`Syncing enhanced feed for advertiser ${advertiserName} (${awinMerchantId})`);

    try {
      return await this.doSyncOneFeed(advertiserId, awinMerchantId, advertiserName, startedAt);
    } finally {
      this.syncingAdvertisers.delete(advertiserId);
    }
  }

  private async doSyncOneFeed(
    advertiserId: string,
    awinMerchantId: string,
    advertiserName: string,
    startedAt: Date
  ): Promise<FeedSyncResult> {
    let products: AwinFeedProduct[];
    try {
      products = await this.awinClient.fetchEnhancedFeed(awinMerchantId, DEFAULT_FEED_LOCALES);
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error(`Feed download failed for ${advertiserName}: ${detail}`);

      const isNoFeed = detail.includes('No working feed found');
      await this.writeSyncAudit({
        advertiserId,
        awinMerchantId,
        feedId: null,
        productsUpserted: 0,
        productsSkipped: 0,
        errors: isNoFeed ? 0 : 1,
        status: isNoFeed ? 'skipped' : 'failed',
        errorDetail: detail,
        startedAt,
        completedAt: new Date(),
      });
      return {
        advertiserId,
        awinMerchantId,
        feedId: null,
        productsUpserted: 0,
        productsSkipped: 0,
        errors: isNoFeed ? 0 : 1,
        status: isNoFeed ? 'skipped' : 'failed',
        errorDetail: detail,
      };
    }

    let upserted = 0;
    let skipped = 0;
    let errors = 0;
    const seenMerchantProductIds = new Set<string>();

    for (const row of products) {
      if (!row.merchantProductId || !row.awDeepLink) {
        skipped++;
        continue;
      }

      // Skip in-feed duplicates (same merchantProductId appearing multiple times in one feed)
      if (seenMerchantProductIds.has(row.merchantProductId)) {
        skipped++;
        continue;
      }
      seenMerchantProductIds.add(row.merchantProductId);

      try {
        await this.upsertFeedProduct(advertiserId, advertiserName, row);
        upserted++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to upsert product ${row.merchantProductId} for ${advertiserName}: ${msg}`
        );
        errors++;
      }
    }

    // Deactivate orphaned products: products from this advertiser's feed
    // that were NOT in the current feed (removed from catalog)
    let orphansDeactivated = 0;
    if (seenMerchantProductIds.size > 0) {
      try {
        const result = await this.prisma.affiliateProduct.updateMany({
          where: {
            advertiserId,
            fulfillmentSource: AffiliateFulfillmentSource.FEED,
            merchantProductId: { notIn: Array.from(seenMerchantProductIds) },
            isActive: true,
            deletedAt: null,
          },
          data: { isActive: false },
        });
        orphansDeactivated = result.count;
        if (orphansDeactivated > 0) {
          this.logger.log(
            `Deactivated ${orphansDeactivated} orphaned feed products for ${advertiserName}`
          );
        }
      } catch (err: unknown) {
        this.logger.warn(
          `Failed to deactivate orphans for ${advertiserName}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    const status: FeedSyncResult['status'] =
      errors === 0 ? 'success' : upserted > 0 ? 'partial' : 'failed';

    await this.writeSyncAudit({
      advertiserId,
      awinMerchantId,
      feedId: null,
      productsUpserted: upserted,
      productsSkipped: skipped,
      errors,
      status,
      startedAt,
      completedAt: new Date(),
    });

    this.logger.log(
      `Feed sync for ${advertiserName}: upserted=${upserted} skipped=${skipped} errors=${errors} orphans=${orphansDeactivated}`
    );

    return {
      advertiserId,
      awinMerchantId,
      feedId: null,
      productsUpserted: upserted,
      productsSkipped: skipped,
      errors,
      status,
    };
  }

  private async upsertFeedProduct(
    advertiserId: string,
    advertiserName: string,
    row: AwinFeedProduct
  ): Promise<void> {
    const imageUrl = row.awImageUrl || row.merchantImageUrl;
    if (!imageUrl) {
      return;
    }

    // Quality gate: skip products where title === description (bad feed data).
    const titleTrimmed = row.productName.trim();
    const descTrimmed = row.description.trim();
    if (titleTrimmed && descTrimmed && titleTrimmed === descTrimmed) {
      this.logger.warn(
        `Skipping product ${row.merchantProductId} for ${advertiserName}: title === description (bad feed data)`
      );
      return;
    }

    const displayPrice = parseFloat(row.searchPrice || row.storePrice) || undefined;
    const originalPrice =
      row.storePrice && row.searchPrice && row.storePrice !== row.searchPrice
        ? parseFloat(row.storePrice) || undefined
        : undefined;
    const inStock = /^(yes|1|true|in_stock)$/i.test(row.inStock);
    const currency = (row.currency || 'EUR').toUpperCase();

    const slug = await this.buildUniqueSlug(row.productName, row.merchantProductId, advertiserId);

    const productData = {
      awinDeepLink: row.awDeepLink,
      imageUrl,
      displayPrice,
      originalPrice,
      displayCurrency: currency,
      brandName: row.brandName || null,
      merchantCategory: row.merchantCategory || null,
      inStock,
      fulfillmentSource: AffiliateFulfillmentSource.FEED,
      feedId: row.dataFeedId || null,
      lastFeedSync: new Date(),
    };

    // Atomic upsert using compound unique (advertiserId, merchantProductId).
    // Eliminates race conditions from the old findFirst → create/update pattern.
    const product = await this.prisma.affiliateProduct.upsert({
      where: {
        advertiserId_merchantProductId: {
          advertiserId,
          merchantProductId: row.merchantProductId,
        },
      },
      update: {
        ...productData,
        deletedAt: null,
        isActive: true,
      },
      create: {
        slug,
        advertiserId,
        merchantProductId: row.merchantProductId,
        ...productData,
      },
    });

    // Upsert the EN translation (atomic — avoids duplicate translation rows too).
    await this.prisma.affiliateProductTranslation.upsert({
      where: {
        affiliateProductId_locale: {
          affiliateProductId: product.id,
          locale: 'en',
        },
      },
      update: {
        title: row.productName.slice(0, 500),
        description: row.description.slice(0, 5000),
        translationStatus: TranslationStatus.ORIGINAL,
      },
      create: {
        affiliateProductId: product.id,
        locale: 'en',
        title: row.productName.slice(0, 500),
        description: row.description.slice(0, 5000),
        translationStatus: TranslationStatus.ORIGINAL,
        isOriginal: true,
      },
    });
  }

  // ============================================================================
  // PRIVATE — helpers
  // ============================================================================

  /**
   * Build a unique slug, retrying with a random suffix on collision.
   */
  private async buildUniqueSlug(
    productName: string,
    merchantProductId: string,
    advertiserId: string
  ): Promise<string> {
    const base = productName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
    const productSuffix = merchantProductId
      .slice(-6)
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase();
    const advertiserSuffix = advertiserId.replace(/-/g, '').slice(-4).toLowerCase();
    const slug = `${base || 'product'}-${productSuffix}${advertiserSuffix}`;

    // Check if this slug already belongs to a DIFFERENT product
    const existing = await this.prisma.affiliateProduct.findUnique({
      where: { slug },
      select: { advertiserId: true, merchantProductId: true },
    });

    if (
      !existing ||
      (existing.advertiserId === advertiserId && existing.merchantProductId === merchantProductId)
    ) {
      return slug; // No collision or same product
    }

    // Collision with a different product — append random suffix
    const rand = Math.random().toString(36).slice(2, 6);
    return `${slug}-${rand}`;
  }

  // ============================================================================
  // PUBLIC — duplicate cleanup (for existing production data)
  // ============================================================================

  /**
   * Find and remove duplicate affiliate products.
   * Keeps the oldest record (first created) for each (advertiserId, merchantProductId) pair.
   * Also deduplicates by matching title + advertiser for products with NULL merchantProductId.
   * Returns count of duplicates removed.
   */
  async cleanupDuplicates(): Promise<{ duplicatesRemoved: number; details: string[] }> {
    const details: string[] = [];
    let totalRemoved = 0;

    // 1. Find duplicates by (advertiserId, merchantProductId) where merchantProductId is NOT NULL
    const feedDuplicates: Array<{ advertiserId: string; merchantProductId: string; cnt: string }> =
      await this.prisma.$queryRaw`
        SELECT "advertiserId", "merchantProductId", COUNT(*)::text as cnt
        FROM affiliate_products
        WHERE "merchantProductId" IS NOT NULL
        GROUP BY "advertiserId", "merchantProductId"
        HAVING COUNT(*) > 1
      `;

    for (const dup of feedDuplicates) {
      const products = await this.prisma.affiliateProduct.findMany({
        where: {
          advertiserId: dup.advertiserId,
          merchantProductId: dup.merchantProductId,
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true, slug: true, createdAt: true },
      });

      // Keep the first (oldest), delete the rest
      const toDelete = products.slice(1);
      for (const product of toDelete) {
        // Delete translations first (FK constraint)
        await this.prisma.affiliateProductTranslation.deleteMany({
          where: { affiliateProductId: product.id },
        });
        await this.prisma.affiliateProduct.delete({
          where: { id: product.id },
        });
        totalRemoved++;
      }

      details.push(
        `merchantProductId="${dup.merchantProductId}": removed ${toDelete.length} duplicate(s), kept oldest`
      );
    }

    // 2. Find duplicates by (advertiserId, title) for products with NULL merchantProductId
    const manualDuplicates: Array<{ advertiserId: string; title: string; cnt: string }> = await this
      .prisma.$queryRaw`
        SELECT ap."advertiserId", t.title, COUNT(*)::text as cnt
        FROM affiliate_products ap
        JOIN affiliate_product_translations t ON t."affiliateProductId" = ap.id AND t.locale = 'en'
        WHERE ap."merchantProductId" IS NULL
        GROUP BY ap."advertiserId", t.title
        HAVING COUNT(*) > 1
      `;

    for (const dup of manualDuplicates) {
      const products = await this.prisma.affiliateProduct.findMany({
        where: {
          advertiserId: dup.advertiserId,
          merchantProductId: null,
          translations: { some: { locale: 'en', title: dup.title } },
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true, slug: true, createdAt: true },
      });

      const toDelete = products.slice(1);
      for (const product of toDelete) {
        await this.prisma.affiliateProductTranslation.deleteMany({
          where: { affiliateProductId: product.id },
        });
        await this.prisma.affiliateProduct.delete({
          where: { id: product.id },
        });
        totalRemoved++;
      }

      if (toDelete.length > 0) {
        details.push(
          `manual product "${dup.title}": removed ${toDelete.length} duplicate(s), kept oldest`
        );
      }
    }

    this.logger.log(`Duplicate cleanup complete: removed ${totalRemoved} duplicates`);

    return { duplicatesRemoved: totalRemoved, details };
  }

  // ============================================================================
  // PRIVATE — helpers
  // ============================================================================

  private async writeSyncAudit(data: {
    advertiserId: string;
    awinMerchantId: string;
    feedId: string | null;
    productsUpserted: number;
    productsSkipped: number;
    errors: number;
    status: string;
    errorDetail?: string;
    startedAt: Date;
    completedAt: Date;
  }): Promise<void> {
    await this.prisma.awinFeedSync
      .create({
        data: {
          advertiserId: data.advertiserId,
          awinMerchantId: data.awinMerchantId,
          feedId: data.feedId,
          productsUpserted: data.productsUpserted,
          productsSkipped: data.productsSkipped,
          errors: data.errors,
          status: data.status,
          errorDetail: data.errorDetail ?? null,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
        },
      })
      .catch((err: Error) =>
        this.logger.warn(`Failed to write AwinFeedSync audit row: ${err.message}`)
      );
  }
}
