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
    const startedAt = new Date();
    this.logger.log(`Syncing enhanced feed for advertiser ${advertiserName} (${awinMerchantId})`);

    let products: AwinFeedProduct[];
    try {
      products = await this.awinClient.fetchEnhancedFeed(awinMerchantId, DEFAULT_FEED_LOCALES);
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error(`Feed download failed for ${advertiserName}: ${detail}`);

      // "No working feed found" means the advertiser has no feed in any locale — treat as skipped.
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

    for (const row of products) {
      if (!row.merchantProductId || !row.awDeepLink) {
        skipped++;
        continue;
      }

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
      `Feed sync for ${advertiserName}: upserted=${upserted} skipped=${skipped} errors=${errors}`
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
      // Products without any image are not surfaceable — skip.
      return;
    }

    const displayPrice = parseFloat(row.searchPrice || row.storePrice) || undefined;
    const originalPrice =
      row.storePrice && row.searchPrice && row.storePrice !== row.searchPrice
        ? parseFloat(row.storePrice) || undefined
        : undefined;
    const inStock = /^(yes|1|true|in_stock)$/i.test(row.inStock);
    const currency = (row.currency || 'EUR').toUpperCase();

    // Slug: slugified product name + last-8 chars of merchantProductId for uniqueness.
    const slug = this.buildSlug(row.productName, row.merchantProductId);

    // Upsert by compound unique (advertiserId, merchantProductId).
    // Prisma compound unique name = advertiserId_merchantProductId.
    const existing = await this.prisma.affiliateProduct.findFirst({
      where: { advertiserId, merchantProductId: row.merchantProductId },
      select: { id: true, slug: true },
    });

    const productData = {
      awinDeepLink: row.awDeepLink,
      imageUrl,
      displayPrice,
      originalPrice,
      displayCurrency: currency,
      brandName: row.brandName || null,
      inStock,
      fulfillmentSource: AffiliateFulfillmentSource.FEED,
      feedId: row.dataFeedId || null,
      lastFeedSync: new Date(),
    };

    if (existing) {
      // Update pricing, stock, deep link — preserve admin overrides on isFeatured/displayOrder/tags.
      // Also restore if soft-deleted: feed is the source of truth for FEED products.
      await this.prisma.affiliateProduct.update({
        where: { id: existing.id },
        data: { ...productData, deletedAt: null, isActive: true },
      });

      // Refresh the EN translation title + description (content update from feed).
      await this.prisma.affiliateProductTranslation.updateMany({
        where: { affiliateProductId: existing.id, locale: 'en' },
        data: {
          title: row.productName.slice(0, 500),
          description: row.description.slice(0, 5000),
          translationStatus: TranslationStatus.ORIGINAL,
        },
      });
    } else {
      // New product from feed.
      const product = await this.prisma.affiliateProduct.create({
        data: {
          slug,
          advertiserId,
          merchantProductId: row.merchantProductId,
          ...productData,
          // createdById is null for feed-imported products (schema: createdById String?)
        },
      });

      // Create English translation as the original.
      await this.prisma.affiliateProductTranslation.create({
        data: {
          affiliateProductId: product.id,
          locale: 'en',
          title: row.productName.slice(0, 500),
          description: row.description.slice(0, 5000),
          translationStatus: TranslationStatus.ORIGINAL,
          isOriginal: true,
        },
      });
    }
  }

  // ============================================================================
  // PRIVATE — helpers
  // ============================================================================

  private buildSlug(productName: string, merchantProductId: string): string {
    const base = productName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
    const suffix = merchantProductId
      .slice(-8)
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase();
    return `${base || 'product'}-${suffix}`;
  }

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
