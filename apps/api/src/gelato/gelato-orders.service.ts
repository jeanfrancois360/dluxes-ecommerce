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
import { GelatoCreateOrderRequest, GelatoWebhookPayload } from './interfaces';
import { GELATO_CONSTANTS } from './constants/gelato.constants';

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
        product: true,
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
    if (!orderItem.product.designFileUrl) {
      throw new BadRequestException(
        `Product "${orderItem.product.name}" is missing a design file — upload one before submitting to Gelato`
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

    const gelatoOrderRequest: GelatoCreateOrderRequest = {
      orderReferenceId: `${orderId}-${orderItemId}`,
      customerReferenceId: order.userId,
      currency: order.currency || 'USD',
      items: [
        {
          productUid: orderItem.product.gelatoProductUid,
          quantity: orderItem.quantity,
          files: orderItem.product.designFileUrl
            ? [{ type: 'default', url: orderItem.product.designFileUrl }]
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
        country: addr.country,
        email: order.user.email,
        phone: addr.phone || undefined,
      },
      metadata: {
        nextpikOrderId: orderId,
        nextpikOrderItemId: orderItemId,
      },
    };

    this.logger.log(`Submitting order ${orderId} to Gelato...`);
    const gelatoOrder = await this.gelatoService.createOrder(gelatoOrderRequest);

    const podOrder = await this.prisma.gelatoPodOrder.create({
      data: {
        orderId,
        orderItemId,
        productId: orderItem.productId,
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
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    const podItems = order.items.filter(
      (item) => item.product.fulfillmentType === FulfillmentType.GELATO_POD
    );
    if (podItems.length === 0) return { submitted: 0, results: [] };

    const results = [];
    for (const item of podItems) {
      try {
        const result = await this.submitOrderToGelato(orderId, item.id);
        results.push({ itemId: item.id, success: true, podOrderId: result.podOrder.id });
      } catch (error) {
        this.logger.error(`Failed to submit item ${item.id}: ${error.message}`);
        results.push({ itemId: item.id, success: false, error: error.message });
      }
    }

    return { submitted: results.filter((r) => r.success).length, results };
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

  async processWebhook(payload: GelatoWebhookPayload) {
    const { event, id: eventId, data } = payload;

    const existingEvent = await this.prisma.gelatoWebhookEvent.findUnique({
      where: { eventId },
    });
    if (existingEvent?.status === 'PROCESSED') {
      this.logger.log(`Duplicate webhook event ${eventId} - skipping`);
      return { processed: false, reason: 'duplicate' };
    }

    const gelatoOrderId = data.orderId || data.order?.id;
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
    const { WEBHOOK_EVENTS } = GELATO_CONSTANTS;

    switch (eventType) {
      case WEBHOOK_EVENTS.ORDER_CREATED:
      case WEBHOOK_EVENTS.ORDER_CONFIRMED:
        await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.SUBMITTED);
        break;
      case WEBHOOK_EVENTS.ORDER_IN_PRODUCTION:
        await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.IN_PRODUCTION);
        break;
      case WEBHOOK_EVENTS.ORDER_PRODUCED:
        await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.PRODUCED, {
          producedAt: new Date(),
        });
        break;
      case WEBHOOK_EVENTS.ORDER_SHIPPED: {
        const shipment = data.shipment || data.order?.shipments?.[0];
        await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.SHIPPED, {
          shippedAt: new Date(),
          trackingNumber: shipment?.trackingCode,
          trackingUrl: shipment?.trackingUrl,
          carrier: shipment?.carrier,
        });
        await this.updateMainOrderShipped(podOrderId, shipment);
        break;
      }
      case WEBHOOK_EVENTS.ORDER_DELIVERED:
        await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.DELIVERED, {
          deliveredAt: new Date(),
        });
        await this.updateMainOrderDelivered(podOrderId);
        break;
      case WEBHOOK_EVENTS.ORDER_CANCELLED:
        await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.CANCELLED, {
          cancelledAt: new Date(),
          failureReason: data.reason || 'Cancelled by Gelato',
        });
        break;
      case WEBHOOK_EVENTS.ORDER_FAILED:
        await this.updatePodOrderStatus(podOrderId, GelatoPodStatus.FAILED, {
          failureReason: data.reason || data.message || 'Production failed',
        });
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
}
