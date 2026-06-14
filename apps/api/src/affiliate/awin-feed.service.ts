import { Injectable, Logger } from '@nestjs/common';
import { AffiliateFulfillmentSource, TranslationStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AwinApiClient, AwinFeedMeta, AwinFeedProduct } from './awin-api.service';

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

    this.logger.log('Starting full Awin feed sync');
    const startedAt = new Date();

    // Fetch live feed list once
    let feedList: AwinFeedMeta[];
    try {
      feedList = await this.awinClient.fetchFeedList();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to fetch Awin feed list: ${msg}`);
      throw err;
    }

    // Build a lookup: awinMerchantId → best feed (most products)
    const feedByMerchant = new Map<string, AwinFeedMeta>();
    for (const feed of feedList) {
      const existing = feedByMerchant.get(feed.advertiserId);
      if (!existing || feed.productCount > existing.productCount) {
        feedByMerchant.set(feed.advertiserId, feed);
      }
    }

    // Get all active advertisers from our DB
    const advertisers = await this.prisma.affiliateAdvertiser.findMany({
      where: { isActive: true, deletedAt: null },
    });

    const results: FeedSyncResult[] = [];
    let totalUpserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let advertisersWithFeed = 0;
    let advertisersWithoutFeed = 0;

    for (const advertiser of advertisers) {
      const feedMeta = feedByMerchant.get(advertiser.awinMerchantId);

      if (!feedMeta) {
        advertisersWithoutFeed++;
        this.logger.log(
          `No feed available for advertiser ${advertiser.name} (${advertiser.awinMerchantId})`
        );
        await this.writeSyncAudit({
          advertiserId: advertiser.id,
          awinMerchantId: advertiser.awinMerchantId,
          feedId: null,
          productsUpserted: 0,
          productsSkipped: 0,
          errors: 0,
          status: 'skipped',
          startedAt,
          completedAt: new Date(),
        });
        results.push({
          advertiserId: advertiser.id,
          awinMerchantId: advertiser.awinMerchantId,
          feedId: null,
          productsUpserted: 0,
          productsSkipped: 0,
          errors: 0,
          status: 'skipped',
        });
        continue;
      }

      advertisersWithFeed++;
      const result = await this.syncOneFeed(advertiser.id, advertiser.awinMerchantId, feedMeta);
      results.push(result);
      totalUpserted += result.productsUpserted;
      totalSkipped += result.productsSkipped;
      totalErrors += result.errors;
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

    const feedList = await this.awinClient.fetchFeedList();
    const feedMeta = feedList
      .filter((f) => f.advertiserId === awinMerchantId)
      .sort((a, b) => b.productCount - a.productCount)[0];

    if (!feedMeta) {
      await this.writeSyncAudit({
        advertiserId: advertiser.id,
        awinMerchantId,
        feedId: null,
        productsUpserted: 0,
        productsSkipped: 0,
        errors: 0,
        status: 'skipped',
        startedAt: new Date(),
        completedAt: new Date(),
      });
      return {
        advertiserId: advertiser.id,
        awinMerchantId,
        feedId: null,
        productsUpserted: 0,
        productsSkipped: 0,
        errors: 0,
        status: 'skipped',
      };
    }

    return this.syncOneFeed(advertiser.id, awinMerchantId, feedMeta);
  }

  /**
   * Expose the live feed list (for the admin /feeds endpoint).
   */
  async listAvailableFeeds(): Promise<AwinFeedMeta[]> {
    if (!this.awinClient.isConfigured()) return [];
    return this.awinClient.fetchFeedList();
  }

  // ============================================================================
  // PRIVATE — core sync logic
  // ============================================================================

  private async syncOneFeed(
    advertiserId: string,
    awinMerchantId: string,
    feedMeta: AwinFeedMeta
  ): Promise<FeedSyncResult> {
    const startedAt = new Date();
    this.logger.log(
      `Syncing feed ${feedMeta.feedId} for advertiser ${feedMeta.advertiserName} ` +
        `(${feedMeta.productCount} products)`
    );

    let products: AwinFeedProduct[];
    try {
      products = await this.awinClient.fetchFeedProducts(feedMeta.downloadUrl);
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.error(`Feed download failed for ${feedMeta.advertiserName}: ${detail}`);
      await this.writeSyncAudit({
        advertiserId,
        awinMerchantId,
        feedId: feedMeta.feedId,
        productsUpserted: 0,
        productsSkipped: 0,
        errors: 1,
        status: 'failed',
        errorDetail: detail,
        startedAt,
        completedAt: new Date(),
      });
      return {
        advertiserId,
        awinMerchantId,
        feedId: feedMeta.feedId,
        productsUpserted: 0,
        productsSkipped: 0,
        errors: 1,
        status: 'failed',
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
        await this.upsertFeedProduct(advertiserId, feedMeta, row);
        upserted++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to upsert product ${row.merchantProductId} for ${feedMeta.advertiserName}: ${msg}`
        );
        errors++;
      }
    }

    const status: FeedSyncResult['status'] =
      errors === 0 ? 'success' : upserted > 0 ? 'partial' : 'failed';

    await this.writeSyncAudit({
      advertiserId,
      awinMerchantId,
      feedId: feedMeta.feedId,
      productsUpserted: upserted,
      productsSkipped: skipped,
      errors,
      status,
      startedAt,
      completedAt: new Date(),
    });

    this.logger.log(
      `Feed sync for ${feedMeta.advertiserName}: upserted=${upserted} skipped=${skipped} errors=${errors}`
    );

    return {
      advertiserId,
      awinMerchantId,
      feedId: feedMeta.feedId,
      productsUpserted: upserted,
      productsSkipped: skipped,
      errors,
      status,
    };
  }

  private async upsertFeedProduct(
    advertiserId: string,
    feedMeta: AwinFeedMeta,
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
    const inStock = /^(yes|1|true)$/i.test(row.inStock);
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
      feedId: row.dataFeedId || feedMeta.feedId,
      lastFeedSync: new Date(),
    };

    if (existing) {
      // Update pricing, stock, deep link — preserve admin overrides on isFeatured/displayOrder/tags.
      await this.prisma.affiliateProduct.update({
        where: { id: existing.id },
        data: productData,
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
