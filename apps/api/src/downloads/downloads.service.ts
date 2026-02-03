import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus } from '@prisma/client';

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

@Injectable()
export class DownloadsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all digital purchases for a user
   */
  async getMyDownloads(userId: string): Promise<DigitalPurchase[]> {
    // Find all delivered/paid orders with digital products
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        status: {
          in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
        },
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

    const digitalPurchases: DigitalPurchase[] = [];

    for (const order of orders) {
      for (const item of order.items) {
        if (item.product?.productType === 'DIGITAL' && item.product.digitalFileUrl) {
          // Get download count for this order item (we'll track it in metadata)
          const downloadCount = 0; // In a full implementation, track this in a separate table

          const canDownload = item.product.digitalDownloadLimit === null ||
            downloadCount < item.product.digitalDownloadLimit;

          digitalPurchases.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            productId: item.product.id,
            productName: item.product.name,
            productSlug: item.product.slug,
            productImage: item.product.heroImage || item.product.images[0]?.url || null,
            digitalFileUrl: item.product.digitalFileUrl,
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
   * Get download URL for a specific purchase
   * Validates that user has purchased the product
   */
  async getDownloadUrl(
    userId: string,
    orderId: string,
    productId: string
  ): Promise<{ url: string; fileName: string; fileSize: bigint | null; fileFormat: string | null }> {
    // Find the order and verify ownership
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: {
          in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
        },
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
    if (!orderItem || !orderItem.product) {
      throw new NotFoundException('Product not found in this order');
    }

    if (orderItem.product.productType !== 'DIGITAL') {
      throw new ForbiddenException('This product is not a digital product');
    }

    if (!orderItem.product.digitalFileUrl) {
      throw new NotFoundException('Digital file not available for this product');
    }

    // Check download limit
    // In a full implementation, we would track downloads in a separate table
    // and increment the count here

    return {
      url: orderItem.product.digitalFileUrl,
      fileName: orderItem.product.digitalFileName || 'download',
      fileSize: orderItem.product.digitalFileSize,
      fileFormat: orderItem.product.digitalFileFormat,
    };
  }

  /**
   * Get digital products from a specific order
   */
  async getOrderDigitalProducts(userId: string, orderId: string): Promise<DigitalPurchase[]> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: {
          in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
        },
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

    if (!order) {
      return [];
    }

    const digitalProducts: DigitalPurchase[] = [];

    for (const item of order.items) {
      if (item.product?.productType === 'DIGITAL' && item.product.digitalFileUrl) {
        const downloadCount = 0;
        const canDownload = item.product.digitalDownloadLimit === null ||
          downloadCount < item.product.digitalDownloadLimit;

        digitalProducts.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          productId: item.product.id,
          productName: item.product.name,
          productSlug: item.product.slug,
          productImage: item.product.heroImage || item.product.images[0]?.url || null,
          digitalFileUrl: item.product.digitalFileUrl,
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

    return digitalProducts;
  }
}
