import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface DigitalPurchase {
  orderId: string;
  orderNumber: string;
  orderDate: Date;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  digitalFileUrl: string | null;
  digitalFileName: string | null;
  digitalFileSize: bigint | null;
  digitalFileFormat: string | null;
  digitalVersion: string | null;
  digitalLicenseType: string | null;
  digitalInstructions: string | null;
  digitalDownloadLimit: number | null;
  downloadCount: number;
  canDownload: boolean;
}

interface DownloadToken {
  userId: string;
  orderId: string;
  productId: string;
}

const PAID_ORDER_STATUSES = [
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

@Injectable()
export class DownloadsService {
  private readonly logger = new Logger(DownloadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  // ─────────────────────────────────────────────────────────────
  // Download count helpers (raw SQL — no Prisma model for this table)
  // ─────────────────────────────────────────────────────────────

  private async getDownloadCount(
    userId: string,
    orderId: string,
    productId: string
  ): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count
      FROM "download_logs"
      WHERE "user_id" = ${userId}
        AND "order_id" = ${orderId}
        AND "product_id" = ${productId}
    `;
    return Number(result[0]?.count ?? 0);
  }

  private async getDownloadCountsBulk(
    userId: string,
    pairs: Array<{ orderId: string; productId: string }>
  ): Promise<Map<string, number>> {
    if (pairs.length === 0) return new Map();

    // Fetch all download log counts for this user grouped by order+product,
    // then filter to only the pairs we care about (simpler + safer than unnest)
    const result = await this.prisma.$queryRaw<
      Array<{ order_id: string; product_id: string; count: bigint }>
    >`
      SELECT "order_id", "product_id", COUNT(*)::bigint AS count
      FROM "download_logs"
      WHERE "user_id" = ${userId}
      GROUP BY "order_id", "product_id"
    `;

    const pairSet = new Set(pairs.map((p) => `${p.orderId}:${p.productId}`));
    const map = new Map<string, number>();
    for (const row of result) {
      const key = `${row.order_id}:${row.product_id}`;
      if (pairSet.has(key)) {
        map.set(key, Number(row.count));
      }
    }
    return map;
  }

  private async recordDownload(
    userId: string,
    orderId: string,
    productId: string,
    ipAddress?: string
  ): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO "download_logs" ("id", "user_id", "order_id", "product_id", "ip_address")
      VALUES (${uuidv4()}, ${userId}, ${orderId}, ${productId}, ${ipAddress ?? null})
    `;
    this.logger.log(`Download recorded: user=${userId} order=${orderId} product=${productId}`);
  }

  // ─────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────

  /**
   * Get all digital purchases for a user — with real download counts
   */
  async getMyDownloads(userId: string): Promise<DigitalPurchase[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        status: { in: PAID_ORDER_STATUSES },
        paymentStatus: 'PAID',
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                heroImage: true,
                productType: true,
                digitalFileUrl: true,
                digitalFileName: true,
                digitalFileSize: true,
                digitalFileFormat: true,
                digitalVersion: true,
                digitalLicenseType: true,
                digitalInstructions: true,
                digitalDownloadLimit: true,
                images: {
                  take: 1,
                  orderBy: { displayOrder: 'asc' },
                  select: { url: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Collect all (orderId, productId) pairs for a single bulk count query
    const pairs: Array<{ orderId: string; productId: string }> = [];
    for (const order of orders) {
      for (const item of order.items) {
        if (item.product?.productType === 'DIGITAL' && item.product.digitalFileUrl) {
          pairs.push({ orderId: order.id, productId: item.product.id });
        }
      }
    }

    const countMap = await this.getDownloadCountsBulk(userId, pairs);
    const digitalPurchases: DigitalPurchase[] = [];

    for (const order of orders) {
      for (const item of order.items) {
        if (item.product?.productType === 'DIGITAL' && item.product.digitalFileUrl) {
          const downloadCount = countMap.get(`${order.id}:${item.product.id}`) ?? 0;
          const canDownload =
            item.product.digitalDownloadLimit === null ||
            downloadCount < item.product.digitalDownloadLimit;

          digitalPurchases.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            productId: item.product.id,
            productName: item.product.name,
            productSlug: item.product.slug,
            productImage: item.product.heroImage || item.product.images[0]?.url || null,
            digitalFileUrl: null, // never expose raw URL in list view
            digitalFileName: item.product.digitalFileName,
            digitalFileSize: item.product.digitalFileSize,
            digitalFileFormat: item.product.digitalFileFormat,
            digitalVersion: item.product.digitalVersion,
            digitalLicenseType: item.product.digitalLicenseType,
            digitalInstructions: item.product.digitalInstructions,
            digitalDownloadLimit: item.product.digitalDownloadLimit,
            downloadCount,
            canDownload,
          });
        }
      }
    }

    return digitalPurchases;
  }

  /**
   * Issue a short-lived signed download token after validating ownership and limit.
   * Records the download event immediately (count-before-download model).
   */
  async getDownloadUrl(
    userId: string,
    orderId: string,
    productId: string,
    ipAddress?: string
  ): Promise<{
    downloadUrl: string;
    fileName: string;
    fileSize: bigint | null;
    fileFormat: string | null;
  }> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: { in: PAID_ORDER_STATUSES },
        paymentStatus: 'PAID',
      },
      include: {
        items: {
          where: { productId },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productType: true,
                digitalFileUrl: true,
                digitalFileName: true,
                digitalFileSize: true,
                digitalFileFormat: true,
                digitalDownloadLimit: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or not eligible for download');
    }

    const orderItem = order.items[0];
    if (!orderItem?.product) {
      throw new NotFoundException('Product not found in this order');
    }
    if (orderItem.product.productType !== 'DIGITAL') {
      throw new ForbiddenException('This product is not a digital product');
    }
    if (!orderItem.product.digitalFileUrl) {
      throw new NotFoundException('Digital file not available for this product');
    }

    // Enforce download limit
    if (orderItem.product.digitalDownloadLimit !== null) {
      const count = await this.getDownloadCount(userId, orderId, productId);
      if (count >= orderItem.product.digitalDownloadLimit) {
        throw new ForbiddenException(
          `Download limit reached (${orderItem.product.digitalDownloadLimit}/${orderItem.product.digitalDownloadLimit}). ` +
            `Contact the seller to request additional downloads.`
        );
      }
    }

    // Record the download event
    await this.recordDownload(userId, orderId, productId, ipAddress);

    // Issue a signed 1-hour token — frontend navigates to /downloads/secure/:token
    const payload: DownloadToken = { userId, orderId, productId };
    const token = this.jwtService.sign(payload, { expiresIn: '1h' });

    return {
      downloadUrl: `/api/v1/downloads/secure/${token}`,
      fileName: orderItem.product.digitalFileName || 'download',
      fileSize: orderItem.product.digitalFileSize,
      fileFormat: orderItem.product.digitalFileFormat,
    };
  }

  /**
   * Validate a download token and return the file URL.
   * Called by the secure redirect endpoint — no auth guard needed, token IS the proof.
   */
  async redeemDownloadToken(token: string): Promise<string> {
    let payload: DownloadToken;
    try {
      payload = this.jwtService.verify<DownloadToken>(token);
    } catch {
      throw new ForbiddenException('Download link is invalid or has expired');
    }

    // Re-validate ownership (token could be forged if secret leaked)
    const order = await this.prisma.order.findFirst({
      where: {
        id: payload.orderId,
        userId: payload.userId,
        status: { in: PAID_ORDER_STATUSES },
        paymentStatus: 'PAID',
      },
      include: {
        items: {
          where: { productId: payload.productId },
          include: {
            product: { select: { digitalFileUrl: true, productType: true } },
          },
        },
      },
    });

    const fileUrl = order?.items[0]?.product?.digitalFileUrl;
    if (!fileUrl || order.items[0].product.productType !== 'DIGITAL') {
      throw new ForbiddenException('Download link is no longer valid');
    }

    return fileUrl;
  }

  /**
   * Get digital products from a specific order (used on order detail pages)
   */
  async getOrderDigitalProducts(userId: string, orderId: string): Promise<DigitalPurchase[]> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: { in: PAID_ORDER_STATUSES },
        paymentStatus: 'PAID',
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                heroImage: true,
                productType: true,
                digitalFileUrl: true,
                digitalFileName: true,
                digitalFileSize: true,
                digitalFileFormat: true,
                digitalVersion: true,
                digitalLicenseType: true,
                digitalInstructions: true,
                digitalDownloadLimit: true,
                images: {
                  take: 1,
                  orderBy: { displayOrder: 'asc' },
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order) return [];

    const pairs = order.items
      .filter((item) => item.product?.productType === 'DIGITAL' && item.product.digitalFileUrl)
      .map((item) => ({ orderId: order.id, productId: item.product.id }));

    const countMap = await this.getDownloadCountsBulk(userId, pairs);
    const result: DigitalPurchase[] = [];

    for (const item of order.items) {
      if (item.product?.productType === 'DIGITAL' && item.product.digitalFileUrl) {
        const downloadCount = countMap.get(`${order.id}:${item.product.id}`) ?? 0;
        const canDownload =
          item.product.digitalDownloadLimit === null ||
          downloadCount < item.product.digitalDownloadLimit;

        result.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          productId: item.product.id,
          productName: item.product.name,
          productSlug: item.product.slug,
          productImage: item.product.heroImage || item.product.images[0]?.url || null,
          digitalFileUrl: null,
          digitalFileName: item.product.digitalFileName,
          digitalFileSize: item.product.digitalFileSize,
          digitalFileFormat: item.product.digitalFileFormat,
          digitalVersion: item.product.digitalVersion,
          digitalLicenseType: item.product.digitalLicenseType,
          digitalInstructions: item.product.digitalInstructions,
          digitalDownloadLimit: item.product.digitalDownloadLimit,
          downloadCount,
          canDownload,
        });
      }
    }

    return result;
  }
}
