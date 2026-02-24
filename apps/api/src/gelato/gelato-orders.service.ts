import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GelatoService } from './gelato.service';
import { SettingsService } from '../settings/settings.service';
import {
  GelatoPodStatus,
  FulfillmentType,
  OrderStatus,
  EscrowStatus,
  DeliveryConfirmationType,
} from '@prisma/client';
import { GelatoCreateOrderRequest } from './interfaces';
import { GELATO_CONSTANTS } from './constants/gelato.constants';
import { convertCountryNameToISO2 } from './utils/country-codes.util';

@Injectable()
export class GelatoOrdersService {
  private readonly logger = new Logger(GelatoOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gelatoService: GelatoService,
    private readonly settingsService: SettingsService
  ) {}

  async submitOrderToGelato(orderId: string, orderItemId: string, shippingMethod?: string) {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          include: {
            user: true,
            shippingAddress: true,
          },
        },
        product: {
          include: {
            store: true, // v2.9.0: Include store for seller Gelato credentials
          },
        },
        variant: true,
      },
    });

    if (!orderItem) throw new NotFoundException('Order item not found');
    if (orderItem.product.fulfillmentType !== FulfillmentType.GELATO_POD) {
      throw new BadRequestException('Product is not a POD product');
    }
    if (!orderItem.product.gelatoProductUid) {
      throw new BadRequestException(
        `Product "${orderItem.product.name}" is missing a Gelato product template — configure it in the product settings`
      );
    }
    // Design file is optional for standard products without customization
    // Only log a warning if missing
    if (!orderItem.product.designFileUrl) {
      this.logger.warn(
        `Product "${orderItem.product.name}" has no design file — using Gelato's default product design`
      );
    }

    // Get seller's store ID for Gelato credentials
    const storeId = orderItem.product.storeId;
    if (!storeId) {
      throw new BadRequestException(
        'POD product must be associated with a store. Please assign this product to a seller.'
      );
    }

    // Resolve the actual catalog productUid from the store product UUID
    let catalogProductUid = orderItem.product.gelatoProductUid;

    // If the stored productUid is a UUID (store product ID), fetch the actual catalog productUid
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      catalogProductUid
    );

    if (isUUID) {
      this.logger.log(
        `Detected store product UUID "${catalogProductUid}" - fetching catalog productUid from Gelato...`
      );

      try {
        // Get seller's Gelato credentials to fetch from their store
        const sellerCreds = await this.gelatoService.getSellerCredentials(storeId);

        // Fetch store product using seller's credentials
        const ecommerceUrl = `https://ecommerce.gelatoapis.com/v1/stores/${sellerCreds.storeId}/products/${catalogProductUid}`;

        const response = await fetch(ecommerceUrl, {
          method: 'GET',
          headers: {
            'X-API-KEY': sellerCreds.apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Gelato API returned ${response.status}`);
        }

        const storeProduct: any = await response.json();

        if (storeProduct.variants && storeProduct.variants.length > 0) {
          // Get the first variant's productUid (catalog productUid)
          const variantProductUid = storeProduct.variants[0].productUid;

          if (variantProductUid) {
            catalogProductUid = variantProductUid;
            this.logger.log(
              `✅ Resolved catalog productUid: ${catalogProductUid.substring(0, 60)}...`
            );
          } else {
            throw new BadRequestException(
              `Store product "${orderItem.product.name}" has no valid catalog productUid in variants`
            );
          }
        } else {
          throw new BadRequestException(
            `Store product "${orderItem.product.name}" has no variants configured`
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to fetch catalog productUid for store product ${catalogProductUid}: ${error.message}`
        );
        throw new BadRequestException(
          `Could not resolve Gelato product. Please check the product configuration in your Gelato dashboard.`
        );
      }
    } else {
      this.logger.debug(
        `Using stored catalog productUid: ${catalogProductUid.substring(0, 60)}...`
      );
    }

    const existingPodOrder = await this.prisma.gelatoPodOrder.findFirst({
      where: { orderId, orderItemId, status: { not: GelatoPodStatus.FAILED } },
    });
    if (existingPodOrder) {
      throw new BadRequestException('Order item already submitted to Gelato');
    }

    const defaultShipping = await this.settingsService.getSetting('gelato_default_shipping_method');
    const selectedShipping = shippingMethod || defaultShipping?.value || 'standard';

    const order = orderItem.order;
    const addr = order.shippingAddress;

    // Convert country name to ISO 2-letter code for Gelato API
    const countryISO2 = convertCountryNameToISO2(addr.country);

    this.logger.debug(`Country conversion: "${addr.country}" -> "${countryISO2}"`);

    // Determine file type based on product type
    type FileType =
      | 'default'
      | 'preview'
      | 'mockup'
      | 'front-embroidery'
      | 'chest-center-embroidery';
    let fileType: FileType = 'default';

    // Check if this is an embroidered product by examining the productUid
    const isEmbroideredProduct =
      catalogProductUid.includes('_emb_') || catalogProductUid.includes('_gpr_');

    if (isEmbroideredProduct && orderItem.product.designFileUrl) {
      // For embroidered products, determine the embroidery area based on product category
      // For beanies/hats: front-embroidery is most common
      // For apparel: chest-left-embroidery, chest-center-embroidery, back-embroidery, etc.

      if (catalogProductUid.includes('_gsc_beanie_') || catalogProductUid.includes('_gsc_hat_')) {
        fileType = 'front-embroidery';
      } else if (
        catalogProductUid.includes('_gsc_tshirt_') ||
        catalogProductUid.includes('_gsc_hoodie_')
      ) {
        fileType = 'chest-center-embroidery';
      } else {
        // Default embroidery location for other products
        fileType = 'front-embroidery';
      }

      this.logger.debug(`Detected embroidered product - using file type: ${fileType}`);
    }

    const gelatoOrderRequest: GelatoCreateOrderRequest = {
      orderReferenceId: `${orderId}-${orderItemId}`,
      customerReferenceId: order.userId,
      currency: order.currency || 'USD',
      items: [
        {
          itemReferenceId: orderItemId, // Required by Gelato API
          productUid: catalogProductUid, // Use resolved catalog productUid, not store UUID
          quantity: orderItem.quantity,
          files: orderItem.product.designFileUrl
            ? [{ type: fileType, url: orderItem.product.designFileUrl }]
            : undefined,
        },
      ],
      shippingAddress: {
        firstName: addr.firstName,
        lastName: addr.lastName,
        addressLine1: addr.address1,
        addressLine2: addr.address2 || undefined,
        city: addr.city,
        state: addr.province || undefined,
        postCode: addr.postalCode || '',
        country: countryISO2, // Use ISO 2-letter code instead of full country name
        email: order.user.email,
        phone: addr.phone || undefined,
      },
      metadata: {
        nextpikOrderId: orderId,
        nextpikOrderItemId: orderItemId,
      },
    };

    this.logger.log(`Submitting order ${orderId} to Gelato using store ${storeId} credentials...`);
    this.logger.debug(
      `Order details: Product="${orderItem.product.name}", ` +
        `CatalogProductUid="${catalogProductUid.substring(0, 60)}...", ` +
        `Quantity=${orderItem.quantity}, ` +
        `Currency=${order.currency || 'USD'}`
    );

    // Submit to Gelato using seller's account (or platform fallback)
    const gelatoOrder = await this.gelatoService.createOrder(gelatoOrderRequest, storeId);

    // Check if platform fallback was used
    const credentials = await this.gelatoService.getSellerCredentials(storeId);
    const usedPlatformAccount = credentials.isPlatformFallback;

    if (usedPlatformAccount) {
      this.logger.warn(
        `Order ${orderId} submitted using platform Gelato account (seller has not configured their own account)`
      );
    }

    const podOrder = await this.prisma.gelatoPodOrder.create({
      data: {
        orderId,
        orderItemId,
        productId: orderItem.productId,
        storeId, // v2.9.0: Track which seller's store
        usedPlatformAccount, // v2.9.0: Track if platform fallback was used
        gelatoOrderId: gelatoOrder.id,
        gelatoOrderReference: gelatoOrderRequest.orderReferenceId,
        status: GelatoPodStatus.SUBMITTED,
        shippingMethod: String(selectedShipping),
        currency: order.currency || 'USD',
        submittedAt: new Date(),
      },
    });

    this.logger.log(`Order ${orderId} submitted to Gelato: ${gelatoOrder.id}`);
    return { podOrder, gelatoOrder };
  }

  async submitAllPodItems(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: {
                  include: {
                    user: {
                      include: {
                        gelatoSettings: true, // Load seller's Gelato settings
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const podItems = order.items.filter(
      (item) => item.product.fulfillmentType === FulfillmentType.GELATO_POD
    );
    if (podItems.length === 0) return { submitted: 0, results: [] };

    const results = [];
    for (const item of podItems) {
      try {
        const sellerGelatoSettings = item.product.store?.user?.gelatoSettings;

        // Check if seller has Gelato enabled
        if (!sellerGelatoSettings?.isEnabled) {
          this.logger.warn(
            `Skipping item ${item.id} - Seller has not enabled Gelato integration. ` +
              `Product: "${item.product.name}", Store: "${item.product.store?.name || 'Unknown'}"`
          );
          results.push({
            itemId: item.id,
            success: false,
            error: 'Seller has not enabled Gelato integration',
            skipped: true,
          });
          continue;
        }

        // Submit to Gelato using seller's credentials
        const result = await this.submitOrderToGelato(orderId, item.id);
        results.push({ itemId: item.id, success: true, podOrderId: result.podOrder.id });
        this.logger.log(
          `Submitted item ${item.id} to Gelato for seller "${item.product.store?.name}"`
        );
      } catch (error) {
        this.logger.error(`Failed to submit item ${item.id}: ${error.message}`);
        results.push({ itemId: item.id, success: false, error: error.message });
      }
    }

    const submitted = results.filter((r) => r.success).length;
    const skipped = results.filter((r) => r.skipped).length;

    if (skipped > 0) {
      this.logger.warn(
        `Order ${orderId}: ${skipped} POD item(s) skipped because seller(s) have not configured Gelato`
      );
    }

    return { submitted, skipped, results };
  }

  async cancelPodOrder(podOrderId: string, reason?: string) {
    const podOrder = await this.prisma.gelatoPodOrder.findUnique({ where: { id: podOrderId } });
    if (!podOrder) throw new NotFoundException('POD order not found');

    const cancellableStatuses: GelatoPodStatus[] = [
      GelatoPodStatus.PENDING,
      GelatoPodStatus.SUBMITTED,
    ];
    if (!cancellableStatuses.includes(podOrder.status)) {
      throw new BadRequestException(
        `Cannot cancel order in ${podOrder.status} status - may already be in production`
      );
    }

    if (podOrder.gelatoOrderId) {
      const cancelResult = await this.gelatoService.cancelOrder(podOrder.gelatoOrderId);
      if (!cancelResult.success) {
        throw new BadRequestException(cancelResult.message || 'Failed to cancel order in Gelato');
      }
    }

    return this.prisma.gelatoPodOrder.update({
      where: { id: podOrderId },
      data: { status: GelatoPodStatus.CANCELLED, failureReason: reason, cancelledAt: new Date() },
    });
  }

  async getPodOrder(podOrderId: string) {
    const podOrder = await this.prisma.gelatoPodOrder.findUnique({
      where: { id: podOrderId },
      include: {
        order: true,
        orderItem: true,
        product: true,
        webhookEvents: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!podOrder) throw new NotFoundException('POD order not found');

    let gelatoStatus = null;
    if (
      podOrder.gelatoOrderId &&
      !(
        [
          GelatoPodStatus.DELIVERED,
          GelatoPodStatus.CANCELLED,
          GelatoPodStatus.FAILED,
        ] as GelatoPodStatus[]
      ).includes(podOrder.status)
    ) {
      try {
        gelatoStatus = await this.gelatoService.getOrder(podOrder.gelatoOrderId);
      } catch (error) {
        this.logger.warn(`Failed to fetch Gelato status: ${error.message}`);
      }
    }

    return { ...podOrder, gelatoStatus };
  }

  async getPodOrders(params?: {
    status?: GelatoPodStatus;
    orderId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.orderId) where.orderId = params.orderId;

    const [orders, total] = await Promise.all([
      this.prisma.gelatoPodOrder.findMany({
        where,
        include: {
          order: { select: { orderNumber: true, userId: true } },
          product: { select: { name: true, images: { take: 1 } } },
        },
        orderBy: { createdAt: 'desc' },
        take: params?.limit || 50,
        skip: params?.offset || 0,
      }),
      this.prisma.gelatoPodOrder.count({ where }),
    ]);

    return { orders, total };
  }

  async syncOrderStatus(podOrderId: string) {
    const podOrder = await this.prisma.gelatoPodOrder.findUnique({ where: { id: podOrderId } });
    if (!podOrder?.gelatoOrderId) throw new NotFoundException('POD order not found');

    const gelatoOrder = await this.gelatoService.getOrder(podOrder.gelatoOrderId);

    const statusMap: Record<string, GelatoPodStatus> = {
      created: GelatoPodStatus.SUBMITTED,
      confirmed: GelatoPodStatus.SUBMITTED,
      production_ready: GelatoPodStatus.IN_PRODUCTION,
      production_finished: GelatoPodStatus.PRODUCED,
      shipped: GelatoPodStatus.SHIPPED,
      delivered: GelatoPodStatus.DELIVERED,
      cancelled: GelatoPodStatus.CANCELLED,
      failed: GelatoPodStatus.FAILED,
    };

    const newStatus = statusMap[gelatoOrder.fulfillmentStatus] || podOrder.status;
    const shipment = gelatoOrder.shipments?.[0];

    return this.prisma.gelatoPodOrder.update({
      where: { id: podOrderId },
      data: {
        status: newStatus,
        productionStatus: gelatoOrder.fulfillmentStatus,
        trackingNumber: shipment?.trackingCode,
        trackingUrl: shipment?.trackingUrl,
        carrier: shipment?.carrier,
        shippedAt: shipment?.shippedAt ? new Date(shipment.shippedAt) : undefined,
        deliveredAt: shipment?.deliveredAt ? new Date(shipment.deliveredAt) : undefined,
      },
    });
  }

  async processWebhook(payload: any) {
    const { event, id: eventId, data } = payload;

    const existingEvent = await this.prisma.gelatoWebhookEvent.findUnique({
      where: { eventId },
    });
    if (existingEvent?.status === 'PROCESSED') {
      this.logger.log(`Duplicate webhook event ${eventId} - skipping`);
      return { processed: false, reason: 'duplicate' };
    }

    // Gelato sends order_status_updated with data.id = gelato order id
    // Other events (item status, tracking) use data.orderId
    const gelatoOrderId = data?.orderId || data?.id;
    if (!gelatoOrderId) {
      this.logger.warn(`Webhook ${eventId} missing order ID`);
      return { processed: false, reason: 'missing_order_id' };
    }

    const podOrder = await this.prisma.gelatoPodOrder.findUnique({
      where: { gelatoOrderId },
    });

    const webhookEvent = await this.prisma.gelatoWebhookEvent.upsert({
      where: { eventId },
      create: {
        eventId,
        eventType: event,
        podOrderId: podOrder?.id,
        data: payload as any,
        status: 'PROCESSING',
      },
      update: { status: 'PROCESSING' },
    });

    if (!podOrder) {
      await this.prisma.gelatoWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: 'FAILED', errorMessage: 'POD order not found' },
      });
      return { processed: false, reason: 'order_not_found' };
    }

    try {
      await this.handleWebhookEvent(event, data, podOrder.id);
      await this.prisma.gelatoWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: 'PROCESSED', processedAt: new Date() },
      });
      return { processed: true, podOrderId: podOrder.id };
    } catch (error) {
      this.logger.error(`Failed to process webhook ${eventId}: ${error.message}`);
      await this.prisma.gelatoWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: 'FAILED', errorMessage: error.message },
      });
      throw error;
    }
  }

  private async handleWebhookEvent(eventType: string, data: any, podOrderId: string) {
    const { WEBHOOK_EVENTS, ORDER_STATUS } = GELATO_CONSTANTS;

    switch (eventType) {
      // order_status_updated — map Gelato status string to our enum
      case WEBHOOK_EVENTS.ORDER_STATUS_UPDATED: {
        const status: string = data.status || '';
        if (status === ORDER_STATUS.CREATED || status === ORDER_STATUS.PASSED) {
          await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.SUBMITTED, {
            productionStatus: status,
          });
        } else if (status === ORDER_STATUS.IN_PRODUCTION) {
          await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.IN_PRODUCTION, {
            productionStatus: status,
          });
        } else if (status === ORDER_STATUS.PRINTED) {
          await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.PRODUCED, {
            producedAt: new Date(),
            productionStatus: status,
          });
        } else if (status === ORDER_STATUS.SHIPPED) {
          await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.SHIPPED, {
            shippedAt: new Date(),
            productionStatus: status,
          });
          await this.updateMainOrderShipped(podOrderId, null);
        } else if (status === ORDER_STATUS.DELIVERED) {
          await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.DELIVERED, {
            deliveredAt: new Date(),
            productionStatus: status,
          });
          await this.updateMainOrderDelivered(podOrderId);
        } else if (status === ORDER_STATUS.CANCELLED) {
          await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.CANCELLED, {
            cancelledAt: new Date(),
            failureReason: data.comment || 'Cancelled by Gelato',
          });
        } else if (status === ORDER_STATUS.FAILED) {
          await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.FAILED, {
            failureReason: data.comment || 'Production failed',
          });
        }
        break;
      }

      // order_item_status_updated — same status mapping for individual items
      case WEBHOOK_EVENTS.ORDER_ITEM_STATUS_UPDATED: {
        const itemStatus: string = data.status || '';
        if (itemStatus === ORDER_STATUS.DELIVERED) {
          await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.DELIVERED, {
            deliveredAt: new Date(),
          });
          await this.updateMainOrderDelivered(podOrderId);
        } else if (itemStatus === ORDER_STATUS.SHIPPED) {
          await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.SHIPPED, {
            shippedAt: new Date(),
          });
        } else if (itemStatus === ORDER_STATUS.IN_PRODUCTION) {
          await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.IN_PRODUCTION);
        }
        break;
      }

      // order_item_tracking_code_updated — update tracking info
      case WEBHOOK_EVENTS.ORDER_ITEM_TRACKING_UPDATED: {
        const shipment = {
          trackingCode: data.trackingCode,
          trackingUrl: data.trackingUrl,
          carrier: data.carrier,
        };
        await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.SHIPPED, {
          shippedAt: new Date(),
          trackingNumber: shipment.trackingCode,
          trackingUrl: shipment.trackingUrl,
          carrier: shipment.carrier,
        });
        await this.updateMainOrderShipped(podOrderId, shipment);
        break;
      }

      // order_delivery_estimate_updated — informational only, no status change needed
      case WEBHOOK_EVENTS.ORDER_DELIVERY_ESTIMATE_UPDATED:
        this.logger.log(`Delivery estimate updated for POD order ${podOrderId}`);
        break;

      default:
        this.logger.warn(`Unknown webhook event type: ${eventType}`);
    }
  }

  private async updatePodOrderStatus(
    podOrderId: string,
    status: GelatoPodStatus,
    additionalData?: Partial<{
      producedAt: Date;
      shippedAt: Date;
      deliveredAt: Date;
      cancelledAt: Date;
      trackingNumber: string;
      trackingUrl: string;
      carrier: string;
      failureReason: string;
      productionStatus: string;
    }>
  ) {
    await this.prisma.gelatoPodOrder.update({
      where: { id: podOrderId },
      data: { status, ...additionalData, updatedAt: new Date() },
    });
    this.logger.log(`POD order ${podOrderId} status updated to ${status}`);
  }

  private async updateMainOrderShipped(podOrderId: string, shipment: any) {
    const podOrder = await this.prisma.gelatoPodOrder.findUnique({ where: { id: podOrderId } });
    if (!podOrder) return;

    await this.prisma.order.update({
      where: { id: podOrder.orderId },
      data: { status: OrderStatus.SHIPPED },
    });

    await this.prisma.orderTimeline.create({
      data: {
        orderId: podOrder.orderId,
        status: OrderStatus.SHIPPED,
        title: 'Order Shipped',
        description: `Order shipped via ${shipment?.carrier || 'carrier'}`,
        metadata: {
          trackingNumber: shipment?.trackingCode,
          trackingUrl: shipment?.trackingUrl,
          carrier: shipment?.carrier,
          source: 'gelato',
        },
      },
    });
  }

  private async updateMainOrderDelivered(podOrderId: string) {
    const podOrder = await this.prisma.gelatoPodOrder.findUnique({ where: { id: podOrderId } });
    if (!podOrder) return;

    const allPodOrders = await this.prisma.gelatoPodOrder.findMany({
      where: { orderId: podOrder.orderId },
    });
    const allDelivered = allPodOrders.every((o) => o.status === GelatoPodStatus.DELIVERED);

    if (allDelivered) {
      await this.prisma.order.update({
        where: { id: podOrder.orderId },
        data: { status: OrderStatus.DELIVERED },
      });

      await this.prisma.orderTimeline.create({
        data: {
          orderId: podOrder.orderId,
          status: OrderStatus.DELIVERED,
          title: 'Order Delivered',
          description: 'All items delivered',
          metadata: { source: 'gelato' },
        },
      });

      // Trigger escrow release for POD-fulfilled orders
      try {
        const holdDaysSetting = await this.settingsService.getSetting('escrow_default_hold_days');
        const holdDays = Number(holdDaysSetting?.value) || 7;
        const autoReleaseAt = new Date();
        autoReleaseAt.setDate(autoReleaseAt.getDate() + holdDays);

        // Transition escrow to PENDING_RELEASE (cron job will release after hold period)
        const escrow = await this.prisma.escrowTransaction.findUnique({
          where: { orderId: podOrder.orderId },
        });

        if (escrow && escrow.status === EscrowStatus.HELD) {
          await this.prisma.escrowTransaction.update({
            where: { id: escrow.id },
            data: {
              status: EscrowStatus.PENDING_RELEASE,
              deliveryConfirmed: true,
              deliveryConfirmedAt: new Date(),
              deliveryConfirmedBy: 'GELATO_WEBHOOK',
              autoReleaseAt,
            },
          });

          // Create DeliveryConfirmation so escrow release audit trail is complete
          const existing = await this.prisma.deliveryConfirmation.findUnique({
            where: { orderId: podOrder.orderId },
          });
          if (!existing) {
            await this.prisma.deliveryConfirmation.create({
              data: {
                orderId: podOrder.orderId,
                confirmedBy: 'GELATO_WEBHOOK',
                confirmationType: DeliveryConfirmationType.COURIER_CONFIRMED,
                actualDeliveryDate: new Date(),
                notes: 'Auto-confirmed via Gelato delivery webhook',
              },
            });
          }

          this.logger.log(
            `Escrow ${escrow.id} set to PENDING_RELEASE for order ${podOrder.orderId} (releases in ${holdDays} days)`
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to trigger escrow release for order ${podOrder.orderId}: ${error.message}`
        );
        // Don't throw — order is still marked delivered; admin can release escrow manually
      }
    }
  }

  /**
   * Get Gelato shipping quote for checkout
   * Used by OrdersService to get real-time shipping costs
   */
  async getQuote(params: {
    items: Array<{ productUid: string; quantity: number }>;
    country: string;
    state?: string;
    city?: string;
    postalCode?: string;
    storeId?: string;
  }) {
    try {
      // Convert country name to ISO-2 code if needed
      const countryCode = convertCountryNameToISO2(params.country);

      this.logger.log(
        `Fetching Gelato quote: ${params.items.length} items, ${countryCode}${params.state ? `, ${params.state}` : ''}`
      );

      // Use GelatoService.calculatePrice which calls /orders/quote
      const quote = await this.gelatoService.calculatePrice(
        {
          items: params.items,
          country: countryCode,
        },
        params.storeId
      );

      return quote;
    } catch (error) {
      this.logger.error(`Failed to get Gelato quote: ${error.message}`);
      throw error;
    }
  }
}
