import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ---------------------------------------------------------------------------
// Types — Awin Publisher API v2
// Base URL: https://api.awin.com  (OAuth2 Bearer token auth)
// Ref: Awin Developer Centre + awin-py library field introspection
// ---------------------------------------------------------------------------

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

  // Click refs — used to correlate back to our AffiliateClickLog.
  // Note: AffiliateClickLog does not yet have an awinClickRef column;
  // clickRefs[0] is stored on AffiliateCommission.awinClickRef for future linking.
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
