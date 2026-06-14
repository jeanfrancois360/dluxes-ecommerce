import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ---------------------------------------------------------------------------
// Types — Awin Publisher API v2
// Base URL: https://api.awin.com  (OAuth2 Bearer token auth)
// Ref: Awin Developer Centre + awin-py library field introspection
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types — Awin Product Data API (productdata.awin.com)
// Feed list: GET /datafeed/list/apikey/{AWIN_API_TOKEN}/
// Feed download: URL from feed list (gzipped CSV)
// ---------------------------------------------------------------------------

/** One row from the feed-list CSV returned by productdata.awin.com */
export interface AwinFeedMeta {
  feedId: string;
  feedName: string;
  advertiserId: string; // Awin numeric merchant ID (matches AffiliateAdvertiser.awinMerchantId)
  advertiserName: string;
  language: string;
  region: string;
  vertical: string;
  productCount: number;
  lastImported: string; // ISO date string
  downloadUrl: string; // Pre-signed or token-embedded download URL
}

/**
 * Fields extracted from a single Awin product-feed CSV row.
 * All values are raw strings as returned by the feed; callers must coerce types.
 * Only the fields used for product import are listed; the full `raw` map is
 * available for any additional field.
 */
export interface AwinFeedProduct {
  merchantProductId: string; // aw_product_id
  productName: string; // product_name
  awDeepLink: string; // aw_deep_link  ← Awin-tracked URL (awin1.com)
  awImageUrl: string; // aw_image_url
  merchantImageUrl: string; // merchant_image_url
  searchPrice: string; // search_price (current / discounted)
  storePrice: string; // store_price (original / RRP)
  currency: string; // currency
  description: string; // description
  brandName: string; // brand_name
  inStock: string; // in_stock ('yes'/'no' or '1'/'0')
  merchantId: string; // merchant_id
  merchantName: string; // merchant_name
  dataFeedId: string; // data_feed_id
  raw: Record<string, string>;
}

export interface AwinSaleAmount {
  amount: number;
  currency: string;
}

export interface AwinTransaction {
  id: number;
  advertiserId: number;
  publisherId?: number;
  orderRef?: string;
  transactionQueryId?: string;

  // Financial
  // NOTE (Step 4 / orchestrator): The raw Awin API may return amounts as either
  //   (a) nested objects: { amount: 5.50, currency: 'EUR' }   ← awin-py shape
  //   (b) flat values:    commissionAmount: 5.50 + commissionAmountCurrency: 'EUR'
  // fetchTransactions() returns the raw payload typed as (a). The sync
  // orchestrator in AffiliateService.syncCommissionsFromAwin() must apply
  // defensive shape access before writing to the DB.
  saleAmount: AwinSaleAmount;
  commissionAmount: AwinSaleAmount;
  advertiserCost?: AwinSaleAmount;
  networkFee?: AwinSaleAmount;

  // Status
  commissionStatus: 'pending' | 'approved' | 'declined';
  paidToPublisher?: boolean;
  amended?: boolean;
  amendReason?: string;
  declineReason?: string;

  // Dates (ISO 8601)
  clickDate?: string;
  transactionDate: string;
  validationDate?: string;
  paymentDate?: string;

  // Awin echoes back our injected SubID here.
  // clickRefs[0] matches AffiliateClickLog.awinClickRef for click→commission attribution.
  clickRefs?: string[];

  // Device / geo
  clickDevice?: string;
  transactionDevice?: string;
  advertiserCountry?: string;
  customerCountry?: string;

  // Extras
  voucherCode?: string;
  voucherCodeUsed?: boolean;
  url?: string;
  siteName?: string;
  lapseTime?: number;
  ipHash?: string;
  basketProducts?: unknown[];
  transactionParts?: unknown[];
  customParameters?: Record<string, unknown>;
}

export interface AwinTransactionFilters {
  startDate: Date;
  endDate: Date;
  advertiserId?: number;
  status?: 'pending' | 'approved' | 'declined';
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 30_000;
// Page size for pagination loop. Awin's documented max is 1000 per request.
// Using 200 as a conservative default; adjust if Awin rejects it.
const PAGE_SIZE = 200;
// Safety cap: if Awin ignores the page parameter and returns the same data
// on every call, this prevents an infinite loop.
// 50 pages × 200 = 10,000 transactions max per sync call.
const MAX_PAGES = 50;

@Injectable()
export class AwinApiClient {
  private readonly logger = new Logger(AwinApiClient.name);
  private readonly baseUrl = 'https://api.awin.com';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Returns true if both AWIN_PUBLISHER_ID and AWIN_API_TOKEN are configured
   * as non-empty strings. Empty string is treated the same as absent.
   * Sync orchestrator must call this before attempting any API calls.
   */
  isConfigured(): boolean {
    const publisherId = this.configService.get<string>('AWIN_PUBLISHER_ID');
    const apiToken = this.configService.get<string>('AWIN_API_TOKEN');
    return Boolean(publisherId?.trim()) && Boolean(apiToken?.trim());
  }

  getPublisherId(): string {
    return this.configService.get<string>('AWIN_PUBLISHER_ID') ?? '';
  }

  /**
   * Downloads and parses the enhanced (Google-format) JSONL feed for a single
   * advertiser from the Awin Publisher API.
   *
   * Endpoint: GET https://api.awin.com/publishers/{PID}/awinfeeds/download/{AID}-retail-{locale}.jsonl
   * Auth: Bearer token (AWIN_API_TOKEN).
   *
   * Tries each locale in order and returns the first successful response.
   * Throws only if all locales fail.
   *
   * Awin rate limit: 5 req/min per endpoint. Caller must not exceed this.
   */
  async fetchEnhancedFeed(
    awinAdvertiserId: string,
    locales: string[] = ['en_GB', 'en_US', 'en_NL', 'en_DE', 'fr_FR', 'de_DE']
  ): Promise<AwinFeedProduct[]> {
    const publisherId = this.configService.get<string>('AWIN_PUBLISHER_ID');
    const apiToken = this.configService.get<string>('AWIN_API_TOKEN');

    let lastError = '';
    for (const locale of locales) {
      const url = `${this.baseUrl}/publishers/${publisherId}/awinfeeds/download/${awinAdvertiserId}-retail-${locale}.jsonl`;
      this.logger.log(`Trying Awin enhanced feed: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120_000);

      let response: Response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${apiToken}` },
        });
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        lastError =
          err instanceof Error && err.name === 'AbortError'
            ? `Awin feed request timed out (120s) for locale ${locale}`
            : `Awin feed request failed for locale ${locale}: ${err instanceof Error ? err.message : String(err)}`;
        this.logger.warn(lastError);
        continue;
      }
      clearTimeout(timeoutId);

      if (response.status === 404) {
        // This locale / feed doesn't exist — try the next one.
        this.logger.log(`No feed for advertiser ${awinAdvertiserId} locale ${locale} (404)`);
        continue;
      }

      if (!response.ok) {
        const body = await response.text();
        lastError = `Awin feed HTTP ${response.status} for locale ${locale}: ${this.stripHtml(body)}`;
        this.logger.warn(lastError);
        continue;
      }

      const jsonlText = await response.text();
      const products = this.parseEnhancedFeedJsonl(jsonlText);
      this.logger.log(
        `Fetched ${products.length} products for advertiser ${awinAdvertiserId} (locale ${locale})`
      );
      return products;
    }

    throw new Error(
      `No working feed found for Awin advertiser ${awinAdvertiserId}. Last error: ${lastError}`
    );
  }

  // ---------------------------------------------------------------------------
  // Private parsers
  // ---------------------------------------------------------------------------

  /**
   * Parses Awin's enhanced (Google-format) JSONL feed response.
   * Each non-empty line is a JSON object following Google's product data spec.
   * The last line may be an error sentinel — it's ignored if it lacks an `id`.
   *
   * Google feed → AwinFeedProduct field mapping:
   *   id                    → merchantProductId
   *   title                 → productName
   *   description           → description
   *   link                  → awDeepLink  (Awin-tracked URL)
   *   image_link            → awImageUrl
   *   additional_image_link → merchantImageUrl (first item)
   *   sale_price            → searchPrice (current/discounted, e.g. "9.99 GBP")
   *   price                 → storePrice  (original/RRP)
   *   availability          → inStock     ("in_stock" | "out_of_stock" | "preorder")
   *   brand                 → brandName
   */
  private parseEnhancedFeedJsonl(jsonl: string): AwinFeedProduct[] {
    const products: AwinFeedProduct[] = [];

    for (const line of jsonl.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let obj: Record<string, unknown>;
      try {
        obj = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        continue;
      }

      // Skip error sentinel lines (last line may be { "error": 500, "message": "..." })
      const id = (obj['id'] as string | undefined)?.trim();
      if (!id) continue;

      const additionalImages = Array.isArray(obj['additional_image_link'])
        ? (obj['additional_image_link'] as string[])
        : typeof obj['additional_image_link'] === 'string'
          ? [obj['additional_image_link'] as string]
          : [];

      // Prices come as "9.99 GBP" — extract numeric and currency portions.
      const extractPrice = (val: unknown): string => {
        if (typeof val !== 'string') return '';
        return val.split(' ')[0] ?? '';
      };
      const extractCurrency = (val: unknown): string => {
        if (typeof val !== 'string') return '';
        return val.split(' ')[1] ?? '';
      };

      const rawPrice = obj['price'] as string | undefined;
      const rawSalePrice = obj['sale_price'] as string | undefined;

      // aw_deep_link is the Awin-tracked URL (awin1.com); `link` is the raw merchant URL.
      // We always use aw_deep_link so Awin can attribute clicks correctly.
      const awDeepLink =
        ((obj['aw_deep_link'] as string | undefined) ?? '').trim() ||
        ((obj['link'] as string | undefined) ?? '').trim();

      products.push({
        merchantProductId: id,
        productName: ((obj['title'] as string | undefined) ?? '').trim(),
        awDeepLink,
        awImageUrl: ((obj['image_link'] as string | undefined) ?? '').trim(),
        merchantImageUrl: (additionalImages[0] ?? '').trim(),
        searchPrice: extractPrice(rawSalePrice || rawPrice),
        storePrice: extractPrice(rawPrice),
        currency: extractCurrency(rawPrice || rawSalePrice),
        description: ((obj['description'] as string | undefined) ?? '').trim(),
        brandName: ((obj['brand'] as string | undefined) ?? '').trim(),
        inStock: ((obj['availability'] as string | undefined) ?? '').trim(),
        merchantId: '',
        merchantName: '',
        dataFeedId: '',
        raw: Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
        ),
      });
    }

    return products;
  }

  /** Strips HTML tags and decodes basic entities; truncates to 300 chars. */
  private stripHtml(text: string): string {
    return text
      .replace(/<[^>]*>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 300);
  }

  /**
   * Fetches transactions from Awin for the given date range.
   *
   * Pagination strategy: loop with page (1-based) + pageSize until the page
   * returns fewer results than PAGE_SIZE (indicating the last page). This
   * handles both the paginated case and the no-pagination case (page 1
   * returns all results, page 2 returns [], loop exits).
   *
   * Returns the full flattened array across all pages.
   * Throws if the API returns a non-2xx response or times out.
   * Caller must call isConfigured() first.
   *
   * Awin rate limit: 20 req/min/user. For the nightly cron syncing 48h this
   * is well within budget (typically 1–3 pages). For multi-page backfill of
   * large historical ranges, add request spacing — deferred to future iteration.
   * See FUTURE_CONSIDERATIONS.md: "backfill orchestration with rate-limit-aware pagination".
   */
  async fetchTransactions(filters: AwinTransactionFilters): Promise<AwinTransaction[]> {
    const publisherId = this.configService.get<string>('AWIN_PUBLISHER_ID');
    const apiToken = this.configService.get<string>('AWIN_API_TOKEN');

    // Format dates as ISO 8601 without milliseconds — Awin may reject them.
    const startDate = filters.startDate.toISOString().split('.')[0];
    const endDate = filters.endDate.toISOString().split('.')[0];

    this.logger.log(
      `Fetching Awin transactions: startDate=${startDate} endDate=${endDate}` +
        (filters.advertiserId ? ` advertiserId=${filters.advertiserId}` : '') +
        (filters.status ? ` status=${filters.status}` : '')
    );

    const allTransactions: AwinTransaction[] = [];
    let page = 1;
    let previousPageFirstId: number | undefined;

    while (true) {
      // Hard cap — prevents infinite loop if Awin ignores the page parameter.
      if (page > MAX_PAGES) {
        this.logger.error(
          `Awin pagination cap hit (${MAX_PAGES} pages, ${allTransactions.length} transactions). ` +
            `Either Awin's API is not honoring the page parameter, or the date range is too large. ` +
            `Aborting fetch — partial results returned.`
        );
        break;
      }

      const params = new URLSearchParams({
        startDate,
        endDate,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (filters.advertiserId) {
        params.set('advertiserId', String(filters.advertiserId));
      }
      if (filters.status) {
        params.set('status', filters.status);
      }

      const url = `${this.baseUrl}/publishers/${publisherId}/transactions/?${params.toString()}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiToken}`,
            Accept: 'application/json',
          },
        });
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const msg =
          err instanceof Error && err.name === 'AbortError'
            ? `Awin API request timed out after ${FETCH_TIMEOUT_MS / 1000}s`
            : `Awin API request failed: ${err instanceof Error ? err.message : String(err)}`;
        this.logger.error(msg);
        throw new Error(msg);
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        const responseText = await response.text();
        const msg = `Awin API ${response.status}: ${responseText}`;
        this.logger.error(
          `Awin API returned non-2xx (page=${page}): status=${response.status} body=${responseText}`
        );
        throw new Error(msg);
      }

      const raw: unknown = await response.json();

      // Defensive response shape: Awin may return [] directly or { data: [] }.
      const page_results: AwinTransaction[] = Array.isArray(raw)
        ? (raw as AwinTransaction[])
        : Array.isArray((raw as { data?: unknown }).data)
          ? (raw as { data: AwinTransaction[] }).data
          : [];

      // Overlap sentinel: if Awin ignores the page param, consecutive pages
      // will start with the same transaction ID.
      if (page > 1 && page_results.length > 0 && page_results[0]?.id === previousPageFirstId) {
        this.logger.warn(
          `Awin returned identical first transaction across pages ${page - 1} and ${page} ` +
            `(id=${previousPageFirstId}). Likely the page parameter is being ignored. ` +
            `Stopping pagination to avoid duplicates.`
        );
        break;
      }
      previousPageFirstId = page_results[0]?.id;

      allTransactions.push(...page_results);

      this.logger.log(
        `Awin page ${page}: received ${page_results.length} transactions (total so far: ${allTransactions.length})`
      );

      // If this page returned fewer results than PAGE_SIZE, it's the last page.
      if (page_results.length < PAGE_SIZE) {
        break;
      }
      page++;
    }

    this.logger.log(
      `Awin fetch complete: ${allTransactions.length} total transactions across ${page} page(s)`
    );

    return allTransactions;
  }
}
