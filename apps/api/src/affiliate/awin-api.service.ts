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

  /**
   * Fetches the list of available product feeds from Awin's Product Data API.
   * The Product Data API uses AWIN_API_TOKEN (same UUID) as the URL-embedded key.
   *
   * Returns metadata for every feed this publisher account can access.
   * Callers should filter to feeds whose advertiserId matches a known AffiliateAdvertiser.
   *
   * Throws if the request fails or returns non-2xx.
   */
  async fetchFeedList(): Promise<AwinFeedMeta[]> {
    const apiToken = this.configService.get<string>('AWIN_API_TOKEN');
    if (!apiToken?.trim()) {
      throw new Error('AWIN_API_TOKEN is not configured — cannot fetch feed list.');
    }

    const url = `https://productdata.awin.com/datafeed/list/apikey/${apiToken}/`;
    this.logger.log('Fetching Awin feed list from productdata.awin.com');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const msg =
        err instanceof Error && err.name === 'AbortError'
          ? `Awin feed-list request timed out after ${FETCH_TIMEOUT_MS / 1000}s`
          : `Awin feed-list request failed: ${err instanceof Error ? err.message : String(err)}`;
      this.logger.error(msg);
      throw new Error(msg);
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text();
      const msg = `Awin feed-list API ${response.status}: ${body}`;
      this.logger.error(msg);
      throw new Error(msg);
    }

    const csv = await response.text();
    return this.parseFeedListCsv(csv);
  }

  /**
   * Downloads and parses up to `rowLimit` product rows from a feed CSV URL.
   * Feeds are usually gzip-compressed; this method handles both compressed
   * and uncompressed responses via the Content-Encoding header.
   *
   * rowLimit=0 (default) means no limit — download the full feed.
   * For sampling, pass rowLimit=10.
   */
  async fetchFeedProducts(downloadUrl: string, rowLimit = 0): Promise<AwinFeedProduct[]> {
    this.logger.log(
      `Fetching Awin feed: ${downloadUrl}${rowLimit > 0 ? ` (first ${rowLimit} rows)` : ''}`
    );

    const controller = new AbortController();
    // Feed files can be large — use a generous timeout.
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    let response: Response;
    try {
      response = await fetch(downloadUrl, { signal: controller.signal });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const msg =
        err instanceof Error && err.name === 'AbortError'
          ? 'Awin feed download timed out (120s)'
          : `Awin feed download failed: ${err instanceof Error ? err.message : String(err)}`;
      this.logger.error(msg);
      throw new Error(msg);
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Awin feed download HTTP ${response.status}: ${body.slice(0, 200)}`);
    }

    // Decompress if needed — Node 18+ fetch gives a ReadableStream body.
    // We read the full buffer and then let Node's built-in zlib handle it.
    const encoding = response.headers.get('content-encoding') ?? '';
    const rawBuffer = Buffer.from(await response.arrayBuffer());

    let csvText: string;
    if (encoding === 'gzip' || downloadUrl.endsWith('.gz')) {
      const zlib = await import('zlib');
      csvText = await new Promise<string>((resolve, reject) => {
        zlib.gunzip(rawBuffer, (err, result) => {
          if (err) reject(err);
          else resolve(result.toString('utf8'));
        });
      });
    } else {
      csvText = rawBuffer.toString('utf8');
    }

    return this.parseFeedProductCsv(csvText, rowLimit);
  }

  // ---------------------------------------------------------------------------
  // Private CSV parsers
  // ---------------------------------------------------------------------------

  /**
   * Parses the feed-list CSV from productdata.awin.com/datafeed/list/...
   * Expected header (order may vary):
   *   advertiser_id, advertiser_name, feed_id, feed_name, language, region,
   *   vertical, no_of_products, last_imported, last_checked, url
   */
  private parseFeedListCsv(csv: string): AwinFeedMeta[] {
    const lines = csv.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = this.splitCsvRow(lines[0]!).map((h) => h.trim().toLowerCase());
    const idx = (col: string) => headers.indexOf(col);

    const feeds: AwinFeedMeta[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = this.splitCsvRow(lines[i]!);
      if (cols.length < 3) continue;

      const productCountRaw = cols[idx('no_of_products')] ?? '';
      feeds.push({
        advertiserId: (cols[idx('advertiser_id')] ?? '').trim(),
        advertiserName: (cols[idx('advertiser_name')] ?? '').trim(),
        feedId: (cols[idx('feed_id')] ?? '').trim(),
        feedName: (cols[idx('feed_name')] ?? '').trim(),
        language: (cols[idx('language')] ?? '').trim(),
        region: (cols[idx('region')] ?? '').trim(),
        vertical: (cols[idx('vertical')] ?? '').trim(),
        productCount: parseInt(productCountRaw, 10) || 0,
        lastImported: (cols[idx('last_imported')] ?? '').trim(),
        downloadUrl: (cols[idx('url')] ?? '').trim(),
      });
    }

    this.logger.log(`Parsed ${feeds.length} feed(s) from Awin feed list`);
    return feeds;
  }

  /**
   * Parses a product-feed CSV (full feed or sample).
   * Awin feeds use comma-separated values with quoted fields.
   * Key columns: aw_product_id, product_name, aw_deep_link, aw_image_url,
   *   merchant_image_url, search_price, store_price, currency, description,
   *   brand_name, in_stock, merchant_id, merchant_name, data_feed_id.
   */
  private parseFeedProductCsv(csv: string, rowLimit: number): AwinFeedProduct[] {
    const lines = csv.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = this.splitCsvRow(lines[0]!).map((h) => h.trim().toLowerCase());
    const idx = (col: string): number => headers.indexOf(col);

    const products: AwinFeedProduct[] = [];
    const limit = rowLimit > 0 ? Math.min(lines.length - 1, rowLimit) : lines.length - 1;

    for (let i = 1; i <= limit; i++) {
      const cols = this.splitCsvRow(lines[i]!);
      if (cols.length < 3) continue;

      const raw: Record<string, string> = {};
      headers.forEach((h, j) => {
        raw[h] = cols[j] ?? '';
      });

      products.push({
        merchantProductId: (cols[idx('aw_product_id')] ?? '').trim(),
        productName: (cols[idx('product_name')] ?? '').trim(),
        awDeepLink: (cols[idx('aw_deep_link')] ?? '').trim(),
        awImageUrl: (cols[idx('aw_image_url')] ?? '').trim(),
        merchantImageUrl: (cols[idx('merchant_image_url')] ?? '').trim(),
        searchPrice: (cols[idx('search_price')] ?? '').trim(),
        storePrice: (cols[idx('store_price')] ?? '').trim(),
        currency: (cols[idx('currency')] ?? '').trim(),
        description: (cols[idx('description')] ?? '').trim(),
        brandName: (cols[idx('brand_name')] ?? '').trim(),
        inStock: (cols[idx('in_stock')] ?? '').trim(),
        merchantId: (cols[idx('merchant_id')] ?? '').trim(),
        merchantName: (cols[idx('merchant_name')] ?? '').trim(),
        dataFeedId: (cols[idx('data_feed_id')] ?? '').trim(),
        raw,
      });
    }

    return products;
  }

  /**
   * RFC-4180-compliant CSV row splitter.
   * Handles quoted fields containing commas and escaped quotes ("").
   */
  private splitCsvRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const ch = row[i]!;
      if (ch === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
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
