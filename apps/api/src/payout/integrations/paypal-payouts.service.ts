import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

/**
 * PayPal Payouts API v1 Service
 *
 * Implements the PayPal Payouts Batch API for disbursing funds to sellers.
 * Requires a PayPal Business account with Payouts API capability approved.
 *
 * API Reference:
 *   - Auth:   POST /v1/oauth2/token
 *   - Create: POST /v1/payments/payouts
 *   - Status: GET  /v1/payments/payouts/:batch_id
 *   - Item:   GET  /v1/payments/payouts-item/:item_id
 *
 * Environment variables required:
 *   PAYPAL_CLIENT_ID     — PayPal app client ID
 *   PAYPAL_CLIENT_SECRET — PayPal app client secret
 *   PAYPAL_MODE          — 'sandbox' | 'live' (default: 'sandbox')
 */

interface PayPalToken {
  access_token: string;
  expires_at: number; // epoch ms
}

export interface PayPalPayoutResult {
  batchId: string;
  batchStatus: string;
  itemId?: string;
  senderBatchId: string;
}

export interface PayPalBatchStatus {
  batchId: string;
  batchStatus: 'DENIED' | 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'CANCELED';
  totalItems: number;
  successCount: number;
  failedCount: number;
  items: PayPalItemStatus[];
}

export interface PayPalItemStatus {
  itemId: string;
  transactionId: string | null;
  transactionStatus:
    | 'SUCCESS'
    | 'FAILED'
    | 'PENDING'
    | 'UNCLAIMED'
    | 'RETURNED'
    | 'ONHOLD'
    | 'BLOCKED'
    | 'REFUNDED'
    | 'REVERSED'
    | null;
  amount: number;
  currency: string;
  receiver: string;
  errors?: { name: string; message: string }[];
}

@Injectable()
export class PayPalPayoutsService {
  private readonly logger = new Logger(PayPalPayoutsService.name);

  private cachedToken: PayPalToken | null = null;

  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly isConfigured: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const mode = this.configService.get<string>('PAYPAL_MODE') || 'sandbox';
    this.baseUrl =
      mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET') || '';

    this.isConfigured =
      Boolean(this.clientId) &&
      Boolean(this.clientSecret) &&
      this.clientId !== 'your-paypal-client-id';

    if (this.isConfigured) {
      this.logger.log(`PayPal Payouts initialized [mode: ${mode}]`);
    } else {
      this.logger.warn(
        'PayPal Payouts not configured — set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET'
      );
    }
  }

  /**
   * Returns true if PayPal credentials are configured
   */
  get configured(): boolean {
    return this.isConfigured;
  }

  /**
   * Fetch or return a cached OAuth2 access token
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid (with 60s buffer)
    if (this.cachedToken && this.cachedToken.expires_at > now + 60_000) {
      return this.cachedToken.access_token;
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`PayPal OAuth2 failed [${response.status}]: ${body}`);
      throw new BadRequestException('Failed to authenticate with PayPal. Check credentials.');
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

    this.cachedToken = {
      access_token: data.access_token,
      expires_at: now + data.expires_in * 1000,
    };

    this.logger.debug('PayPal access token obtained');
    return this.cachedToken.access_token;
  }

  /**
   * Create a PayPal Payouts batch with a single item for one seller.
   *
   * PayPal Payouts amounts are in major currency units as strings ("100.00"),
   * NOT cents. Minimum is $1.00 USD.
   *
   * @param params.payoutId   Internal payout record ID (used as idempotency key)
   * @param params.receiver   Recipient PayPal email address
   * @param params.amount     Amount in major units (e.g. 150.00)
   * @param params.currency   ISO 4217 currency code (e.g. "USD")
   * @param params.note       Optional note shown to recipient
   */
  async createPayout(params: {
    payoutId: string;
    receiver: string;
    amount: number;
    currency: string;
    note?: string;
  }): Promise<PayPalPayoutResult> {
    if (!this.isConfigured) {
      throw new BadRequestException(
        'PayPal Payouts is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.'
      );
    }

    if (!params.receiver || !params.receiver.includes('@')) {
      throw new BadRequestException(
        'Invalid PayPal receiver email. Seller must configure a valid PayPal email in payout settings.'
      );
    }

    if (params.amount < 1) {
      throw new BadRequestException('PayPal payout minimum amount is 1.00');
    }

    const token = await this.getAccessToken();

    // sender_batch_id must be unique per batch — use payoutId as idempotency key
    const senderBatchId = `nextpik-${params.payoutId}`;

    const body = {
      sender_batch_header: {
        sender_batch_id: senderBatchId,
        recipient_type: 'EMAIL',
        email_subject: 'You have a payout from NextPik',
        email_message:
          params.note || 'Your seller payout has been processed. Thank you for selling on NextPik.',
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            value: params.amount.toFixed(2),
            currency: params.currency.toUpperCase(),
          },
          receiver: params.receiver,
          note: params.note || 'NextPik seller payout',
          sender_item_id: params.payoutId, // one-to-one, same as batch for traceability
        },
      ],
    };

    this.logger.log(
      `Creating PayPal payout batch [${senderBatchId}] -> ${params.receiver} ${params.amount} ${params.currency}`
    );

    const response = await fetch(`${this.baseUrl}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'PayPal-Request-Id': senderBatchId, // idempotency header
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `PayPal create payout failed [${response.status}]: ${errorBody} | params: ${JSON.stringify({ payoutId: params.payoutId, receiver: params.receiver, amount: params.amount, currency: params.currency })}`
      );

      let friendlyMessage = 'PayPal payout creation failed';
      try {
        const parsed = JSON.parse(errorBody);
        friendlyMessage = parsed.message || parsed.name || friendlyMessage;
      } catch {}

      throw new BadRequestException(`PayPal payout failed: ${friendlyMessage}`);
    }

    const data = (await response.json()) as {
      batch_header: {
        payout_batch_id: string;
        batch_status: string;
        sender_batch_header: { sender_batch_id: string };
      };
    };

    const batchId = data.batch_header.payout_batch_id;
    this.logger.log(
      `PayPal payout batch created: ${batchId} (status: ${data.batch_header.batch_status})`
    );

    return {
      batchId,
      batchStatus: data.batch_header.batch_status,
      senderBatchId,
    };
  }

  /**
   * Get the status of a PayPal Payouts batch.
   * Call this to poll or reconcile payout status after creation.
   */
  async getBatchStatus(batchId: string): Promise<PayPalBatchStatus> {
    if (!this.isConfigured) {
      throw new BadRequestException('PayPal Payouts is not configured');
    }

    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v1/payments/payouts/${batchId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`PayPal get batch status failed [${response.status}]: ${errorBody}`);
      throw new BadRequestException(`Failed to get PayPal batch status: ${response.status}`);
    }

    const data = (await response.json()) as {
      batch_header: {
        payout_batch_id: string;
        batch_status: string;
        batch_total_amount?: { value: string; currency: string };
        errors?: { name: string; message: string }[];
      };
      items?: Array<{
        payout_item_id: string;
        transaction_id?: string;
        transaction_status?: string;
        payout_item: {
          amount: { value: string; currency: string };
          receiver: string;
        };
        errors?: Array<{ name: string; message: string }>;
      }>;
      total_items?: number;
    };

    const items = (data.items || []).map((item) => ({
      itemId: item.payout_item_id,
      transactionId: item.transaction_id || null,
      transactionStatus: (item.transaction_status as PayPalItemStatus['transactionStatus']) || null,
      amount: parseFloat(item.payout_item.amount.value),
      currency: item.payout_item.amount.currency,
      receiver: item.payout_item.receiver,
      errors: item.errors,
    }));

    return {
      batchId,
      batchStatus: data.batch_header.batch_status as PayPalBatchStatus['batchStatus'],
      totalItems: data.total_items || items.length,
      successCount: items.filter((i) => i.transactionStatus === 'SUCCESS').length,
      failedCount: items.filter((i) =>
        ['FAILED', 'BLOCKED', 'DENIED', 'RETURNED'].includes(i.transactionStatus || '')
      ).length,
      items,
    };
  }

  /**
   * Get status of a single payout item by item ID.
   */
  async getItemStatus(itemId: string): Promise<PayPalItemStatus> {
    if (!this.isConfigured) {
      throw new BadRequestException('PayPal Payouts is not configured');
    }

    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v1/payments/payouts-item/${itemId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`PayPal get item status failed [${response.status}]: ${errorBody}`);
      throw new BadRequestException(`Failed to get PayPal item status: ${response.status}`);
    }

    const data = (await response.json()) as {
      payout_item_id: string;
      transaction_id?: string;
      transaction_status?: string;
      payout_item: {
        amount: { value: string; currency: string };
        receiver: string;
      };
      errors?: Array<{ name: string; message: string }>;
    };

    return {
      itemId: data.payout_item_id,
      transactionId: data.transaction_id || null,
      transactionStatus: (data.transaction_status as PayPalItemStatus['transactionStatus']) || null,
      amount: parseFloat(data.payout_item.amount.value),
      currency: data.payout_item.amount.currency,
      receiver: data.payout_item.receiver,
      errors: data.errors,
    };
  }

  /**
   * Cancel an UNCLAIMED payout item (before recipient claims it).
   * Only works if item is in UNCLAIMED status.
   */
  async cancelUnclaimedItem(itemId: string): Promise<void> {
    if (!this.isConfigured) {
      throw new BadRequestException('PayPal Payouts is not configured');
    }

    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v1/payments/payouts-item/${itemId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`PayPal cancel item failed [${response.status}]: ${errorBody}`);
      throw new BadRequestException(`Failed to cancel PayPal payout item: ${response.status}`);
    }

    this.logger.log(`PayPal payout item cancelled: ${itemId}`);
  }

  /**
   * Resolve our internal payout status from a PayPal batch status.
   * Maps PayPal terminal states to internal COMPLETED/FAILED.
   */
  resolveInternalStatus(
    batchStatus: string,
    items: PayPalItemStatus[]
  ): 'COMPLETED' | 'FAILED' | 'PROCESSING' | null {
    // If batch is still pending/processing, no resolution yet
    if (['PENDING', 'PROCESSING'].includes(batchStatus)) {
      return 'PROCESSING';
    }

    if (['DENIED', 'CANCELED'].includes(batchStatus)) {
      return 'FAILED';
    }

    if (batchStatus === 'SUCCESS') {
      // All items succeeded
      const allSuccess = items.every((i) =>
        ['SUCCESS', 'CLAIMED'].includes(i.transactionStatus || '')
      );
      const anyFailed = items.some((i) =>
        ['FAILED', 'BLOCKED', 'RETURNED', 'REVERSED'].includes(i.transactionStatus || '')
      );

      if (anyFailed) return 'FAILED';
      if (allSuccess) return 'COMPLETED';
      // UNCLAIMED — sent but not yet claimed (treat as processing)
      return 'PROCESSING';
    }

    return null;
  }
}
