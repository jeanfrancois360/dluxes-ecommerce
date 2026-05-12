import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SellerShipment, ShipmentStatus, OrderStatus, UserRole, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { SendcloudService } from '../integrations/sendcloud/sendcloud.service';
import { EasyshipService } from '../integrations/easyship/easyship.service';
import { DhlShipmentService } from '../integrations/dhl/dhl-shipment.service';
import { EasyPostShipmentService } from '../integrations/easypost/easypost-shipment.service';
import { EasyPostService } from '../integrations/easypost/easypost.service';

interface CreateShipmentDto {
  orderId: string;
  storeId: string;
  itemIds: string[]; // OrderItem IDs to include in shipment
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  shippingCost?: number;
  weight?: number;
  notes?: string;
  // Auto-generation flags
  autoGenerate?: boolean; // trigger provider API to create label
}

interface UpdateShipmentDto {
  status?: ShipmentStatus;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  shippingCost?: number;
  weight?: number;
  notes?: string;
}

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(
    private prisma: PrismaService,
    private readonly sendcloudService: SendcloudService,
    private readonly easyshipService: EasyshipService,
    private readonly dhlShipmentService: DhlShipmentService,
    private readonly easyPostShipmentService: EasyPostShipmentService,
    private readonly easyPostService: EasyPostService
  ) {}

  /**
   * Create a new shipment for seller's order items
   */
  async createShipment(dto: CreateShipmentDto, sellerId: string): Promise<SellerShipment> {
    // Verify seller owns the store
    const store = await this.prisma.store.findFirst({
      where: {
        id: dto.storeId,
        userId: sellerId,
      },
    });

    if (!store) {
      throw new ForbiddenException('You do not own this store');
    }

    // Verify all items belong to this seller and this order
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        id: { in: dto.itemIds },
        orderId: dto.orderId,
        product: {
          storeId: dto.storeId,
        },
      },
      include: {
        product: true,
      },
    });

    if (orderItems.length !== dto.itemIds.length) {
      throw new BadRequestException('Some items do not belong to your store or this order');
    }

    // Check if items are already in another shipment
    const existingShipmentItems = await this.prisma.shipmentItem.findMany({
      where: {
        orderItemId: { in: dto.itemIds },
      },
      include: {
        shipment: true,
      },
    });

    if (existingShipmentItems.length > 0) {
      const duplicateItems = existingShipmentItems.map((si) => si.orderItemId).join(', ');
      throw new BadRequestException(`Items already in shipment: ${duplicateItems}`);
    }

    // ── Auto-generate label via shipping provider API ──────────────────────────
    // If autoGenerate=true, delegate to the provider that was used at checkout.
    // The provider's createLabel/createShipment method persists the SellerShipment
    // itself and returns the tracking info, so we return early here.
    if (dto.autoGenerate) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        include: {
          shippingAddress: true,
          items: { include: { product: true } },
          user: true,
        },
      });

      if (!order) throw new NotFoundException('Order not found');

      const provider = order.shippingProvider as string | null;
      const providerData = order.shippingProviderData as any;
      const addr = order.shippingAddress as any;

      if (provider === 'SENDCLOUD') {
        const weightGrams = order.items.reduce((sum: number, item: any) => {
          const kg = item.product?.weight ? Number(item.product.weight) : 0.5;
          return sum + item.quantity * kg * 1000;
        }, 0);

        const serviceCode = providerData?.serviceCode || providerData?.rateId || providerData?.id;
        if (!serviceCode) {
          throw new BadRequestException(
            'Cannot auto-generate: SendCloud service code not recorded on this order. Use manual tracking entry instead.'
          );
        }

        const result = await this.sendcloudService.createLabel({
          orderId: dto.orderId,
          storeId: dto.storeId,
          serviceCode: String(serviceCode),
          toAddress: {
            name:
              `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Customer',
            address: addr?.address1 || addr?.street || '',
            city: addr?.city || '',
            postalCode: addr?.postalCode || addr?.zipCode || '',
            country: addr?.country || 'BE',
            phone: addr?.phone || undefined,
          },
          fromAddress: {
            name: store.name || 'NextPik',
            address: '',
            city: '',
            postalCode: '',
            country: 'BE',
          },
          weightGrams: Math.max(10, Math.round(weightGrams)),
          orderNumber: order.orderNumber,
        });

        // Add shipment items to the created shipment
        await this.prisma.shipmentItem.createMany({
          data: orderItems.map((item) => ({
            shipmentId: result.sellerShipmentId,
            orderItemId: item.id,
            quantity: item.quantity,
          })),
          skipDuplicates: true,
        });

        await this.updateOrderStatusAfterShipmentChange(dto.orderId);
        return this.prisma.sellerShipment.findUniqueOrThrow({
          where: { id: result.sellerShipmentId },
          include: { order: true, store: true },
        });
      }

      if (provider === 'EASYSHIP') {
        const totalWeightKg = order.items.reduce((sum: number, item: any) => {
          const kg = item.product?.weight ? Number(item.product.weight) : 0.5;
          return sum + item.quantity * kg;
        }, 0);

        const courierId =
          providerData?.serviceCode ||
          providerData?.courierId ||
          providerData?.rateId ||
          providerData?.id;
        if (!courierId) {
          throw new BadRequestException(
            'Cannot auto-generate: EasyShip courier ID not recorded on this order. Use manual tracking entry instead.'
          );
        }

        const result = await this.easyshipService.createShipment({
          orderId: dto.orderId,
          storeId: dto.storeId,
          courierId: String(courierId),
          toAddress: {
            name:
              `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Customer',
            street: addr?.address1 || addr?.street || '',
            city: addr?.city || '',
            postalCode: addr?.postalCode || addr?.zipCode || '',
            country: addr?.country || 'US',
            phone: addr?.phone || undefined,
          },
          fromAddress: {
            name: store.name || 'NextPik',
            street: '',
            city: '',
            postalCode: '',
            country: 'US',
          },
          items: order.items.map((item: any) => ({
            description: item.product?.name || 'Item',
            quantity: item.quantity,
            value: Number(item.price),
            weightKg: item.product?.weight ? Number(item.product.weight) : 0.5,
          })),
          totalWeightKg: Math.max(0.01, totalWeightKg),
          orderNumber: order.orderNumber,
        });

        await this.prisma.shipmentItem.createMany({
          data: orderItems.map((item) => ({
            shipmentId: result.sellerShipmentId,
            orderItemId: item.id,
            quantity: item.quantity,
          })),
          skipDuplicates: true,
        });

        await this.updateOrderStatusAfterShipmentChange(dto.orderId);
        return this.prisma.sellerShipment.findUniqueOrThrow({
          where: { id: result.sellerShipmentId },
          include: { order: true, store: true },
        });
      }

      if (provider === 'EASYPOST') {
        const totalWeightOz = order.items.reduce((sum: number, item: any) => {
          const kg = item.product?.weight ? Number(item.product.weight) : 0.5;
          return sum + item.quantity * kg * 35.274; // kg → oz
        }, 0);

        // Build fromAddress from store or platform settings
        // Use platform-configured shipping origin (not store's physical address,
        // which may be in a country unsupported by the EasyPost account)
        const originSettings = await this.prisma.systemSetting.findMany({
          where: {
            key: {
              in: [
                'origin_street1',
                'origin_city',
                'origin_state',
                'origin_postal_code',
                'origin_country',
                'origin_company_name',
              ],
            },
          },
        });
        const originMap = Object.fromEntries(
          originSettings.map((s) => [s.key, (s.value as string)?.replace(/^"|"$/g, '')])
        );
        const platformFrom = {
          name: originMap['origin_company_name'] || store.name || 'NextPik',
          street1: originMap['origin_street1'] || '417 Montgomery St',
          city: originMap['origin_city'] || 'San Francisco',
          state: originMap['origin_state'] || 'CA',
          zip: originMap['origin_postal_code'] || '94104',
          country: originMap['origin_country'] || 'US',
          phone: '+14155550100', // Required by DHL and some other carriers
        };

        const toCountry = addr?.country || 'US';
        const toAddress = {
          name: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Customer',
          street1: addr?.address1 || addr?.street || '',
          city: addr?.city || '',
          // EasyPost only uses state codes for US/CA; omit for other countries to avoid 0-rate responses
          state: ['US', 'CA'].includes(toCountry) ? addr?.province || addr?.state || '' : undefined,
          zip: addr?.postalCode || addr?.zipCode || '',
          country: toCountry,
          phone: addr?.phone || undefined,
        };

        // Get fresh rates from EasyPost
        const client = this.easyPostService.getClient();
        const isInternational = toCountry !== platformFrom.country;
        const customsInfo = isInternational
          ? {
              contents_type: 'merchandise',
              customs_certify: true,
              customs_signer: platformFrom.name,
              eel_pfc: 'NOEEI 30.37(a)',
              non_delivery_option: 'return',
              restriction_type: 'none',
              customs_items: order.items.map((item: any) => ({
                description: (item.product?.name || 'Item').substring(0, 60),
                quantity: item.quantity,
                value: Number(item.price),
                weight: Math.max(
                  1,
                  Math.round(
                    (item.product?.weight ? Number(item.product.weight) : 0.5) *
                      item.quantity *
                      35.274
                  )
                ),
                origin_country: 'US',
              })),
            }
          : undefined;

        const epShipment = await client.Shipment.create({
          to_address: toAddress,
          from_address: platformFrom,
          parcel: {
            length: 20,
            width: 15,
            height: 10,
            weight: Math.max(1, Math.round(totalWeightOz)),
          },
          customs_info: customsInfo,
          options: { label_format: 'PNG', label_size: '4x6' },
        });

        this.logger.debug(
          `[EasyPost] Shipment ${epShipment.id} — rates: ${epShipment.rates?.length ?? 0}, messages: ${JSON.stringify(epShipment.messages ?? [])}`
        );

        if (!epShipment.rates || epShipment.rates.length === 0) {
          throw new BadRequestException(
            'EasyPost returned no rates — cannot auto-generate label. Use manual tracking entry instead.'
          );
        }

        // Pick cheapest rate; for international prefer DHLExpress over USPS (USPS international
        // labels often fail without full customs certification in test/sandbox accounts)
        const preferredCarrier = providerData?.carrier;
        const sortedRates = [...epShipment.rates].sort(
          (a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate)
        );
        const preferredRate =
          (preferredCarrier &&
            sortedRates.find(
              (r: any) => r.carrier?.toUpperCase() === preferredCarrier?.toUpperCase()
            )) ||
          (isInternational && sortedRates.find((r: any) => r.carrier === 'DHLExpress')) ||
          sortedRates[0];

        // Purchase label
        this.logger.debug(
          `[EasyPost] Buying rate ${preferredRate.id} (${preferredRate.carrier} ${preferredRate.service} $${preferredRate.rate})`
        );
        let boughtShipment: any;
        try {
          boughtShipment = await client.Shipment.buy(epShipment.id, preferredRate.id);
        } catch (buyErr: any) {
          this.logger.error(
            `[EasyPost] Label purchase failed: ${JSON.stringify(buyErr?.message || buyErr)}`
          );
          throw new BadRequestException(
            `EasyPost label purchase failed (${preferredRate.carrier} ${preferredRate.service}): ${buyErr?.message || 'unknown error'}. Try a different carrier or use manual tracking.`
          );
        }

        const trackingNumber: string = boughtShipment.tracking_code || '';
        const trackingUrl: string | null = boughtShipment.tracker?.public_url || null;
        const labelUrl: string | null = boughtShipment.postage_label?.label_url || null;

        const shipmentNumber = `EP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        // Persist SellerShipment
        const sellerShipment = await this.prisma.sellerShipment.create({
          data: {
            orderId: dto.orderId,
            storeId: dto.storeId,
            shipmentNumber,
            status: trackingNumber ? ShipmentStatus.LABEL_CREATED : ShipmentStatus.PROCESSING,
            carrier: preferredRate.carrier || 'USPS',
            trackingNumber: trackingNumber || null,
            trackingUrl,
            shippingCost: preferredRate.rate ? new Decimal(String(preferredRate.rate)) : undefined,
            metadata: {
              provider: 'EASYPOST',
              easypostShipmentId: epShipment.id,
              rateId: preferredRate.id,
              service: preferredRate.service,
              labelUrl,
            } as any,
          },
          include: { order: true, store: true },
        });

        // Also store in EasyPostShipment table for webhook tracking
        await this.prisma.easyPostShipment.create({
          data: {
            orderId: dto.orderId,
            sellerId,
            storeId: dto.storeId,
            easypostShipmentId: epShipment.id,
            easypostRateId: preferredRate.id,
            easypostTrackerId: boughtShipment.tracker?.id || null,
            carrier: preferredRate.carrier,
            service: preferredRate.service,
            rate: parseFloat(String(preferredRate.rate)),
            currency: preferredRate.currency || 'USD',
            labelUrl: boughtShipment.postage_label?.label_url || null,
            labelFormat: 'PNG',
            trackingNumber: trackingNumber || null,
            trackingUrl,
            status: 'PURCHASED',
            fromAddress: platformFrom as any,
            toAddress: toAddress as any,
            parcel: { weight: Math.max(1, Math.round(totalWeightOz)) } as any,
            purchasedAt: new Date(),
          },
        });

        await this.prisma.shipmentItem.createMany({
          data: orderItems.map((item) => ({
            shipmentId: sellerShipment.id,
            orderItemId: item.id,
            quantity: item.quantity,
          })),
          skipDuplicates: true,
        });

        await this.prisma.order.update({
          where: { id: dto.orderId },
          data: {
            shippingProvider: 'EASYPOST',
            shippingProviderData: {
              ...(providerData || {}),
              shipmentId: sellerShipment.id,
              trackingNumber,
              carrier: preferredRate.carrier,
            } as any,
          },
        });

        await this.updateOrderStatusAfterShipmentChange(dto.orderId);

        this.logger.log(
          `[EasyPost] Auto-generated label — ${preferredRate.carrier} ${preferredRate.service}, tracking ${trackingNumber}`
        );

        return sellerShipment;
      }

      // For other providers (DHL, ZONE, MANUAL) fall through to manual creation
      // but still generate the shipment record (they can paste tracking later)
    }

    // Generate unique shipment number
    const shipmentNumber = `SH-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    // Create shipment with items in a transaction
    const shipment = await this.prisma.$transaction(async (tx) => {
      // Create shipment
      const newShipment = await tx.sellerShipment.create({
        data: {
          orderId: dto.orderId,
          storeId: dto.storeId,
          shipmentNumber,
          status: ShipmentStatus.PENDING,
          carrier: dto.carrier,
          trackingNumber: dto.trackingNumber,
          trackingUrl: dto.trackingUrl,
          estimatedDelivery: dto.estimatedDelivery,
          shippingCost: dto.shippingCost ? new Decimal(dto.shippingCost) : undefined,
          weight: dto.weight ? new Decimal(dto.weight) : undefined,
          notes: dto.notes,
        },
        include: {
          order: true,
          store: true,
        },
      });

      // Create shipment items
      await tx.shipmentItem.createMany({
        data: orderItems.map((item) => ({
          shipmentId: newShipment.id,
          orderItemId: item.id,
          quantity: item.quantity,
        })),
      });

      // Create initial shipment event
      await tx.shipmentEvent.create({
        data: {
          shipmentId: newShipment.id,
          status: ShipmentStatus.PENDING,
          title: 'Shipment Created',
          description: `Shipment created by ${store.name}`,
        },
      });

      return newShipment;
    });

    // Update order status if needed
    await this.updateOrderStatusAfterShipmentChange(dto.orderId);

    this.logger.log(`Shipment ${shipment.shipmentNumber} created for order ${dto.orderId}`);

    return shipment;
  }

  /**
   * Update shipment details and status
   */
  async updateShipment(
    shipmentId: string,
    dto: UpdateShipmentDto,
    sellerId: string
  ): Promise<SellerShipment> {
    // Verify seller owns this shipment
    const shipment = await this.prisma.sellerShipment.findUnique({
      where: { id: shipmentId },
      include: {
        store: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.store.userId !== sellerId) {
      throw new ForbiddenException('You do not own this shipment');
    }

    // Update shipment in transaction
    const updatedShipment = await this.prisma.$transaction(async (tx) => {
      // Prepare update data
      const updateData: Prisma.SellerShipmentUpdateInput = {
        carrier: dto.carrier,
        trackingNumber: dto.trackingNumber,
        trackingUrl: dto.trackingUrl,
        estimatedDelivery: dto.estimatedDelivery,
        notes: dto.notes,
      };

      if (dto.shippingCost !== undefined) {
        updateData.shippingCost = new Decimal(dto.shippingCost);
      }

      if (dto.weight !== undefined) {
        updateData.weight = new Decimal(dto.weight);
      }

      // Handle status change
      if (dto.status && dto.status !== shipment.status) {
        updateData.status = dto.status;

        // Set timestamps based on status
        if (dto.status === ShipmentStatus.PICKED_UP && !shipment.shippedAt) {
          updateData.shippedAt = new Date();
        }

        if (dto.status === ShipmentStatus.DELIVERED && !shipment.deliveredAt) {
          updateData.deliveredAt = new Date();
        }

        // Create shipment event for status change
        await tx.shipmentEvent.create({
          data: {
            shipmentId: shipment.id,
            status: dto.status,
            title: this.getStatusTitle(dto.status),
            description: this.getStatusDescription(dto.status),
          },
        });
      }

      // Update shipment
      const updated = await tx.sellerShipment.update({
        where: { id: shipmentId },
        data: updateData,
        include: {
          order: true,
          store: true,
          items: {
            include: {
              orderItem: {
                include: {
                  product: true,
                },
              },
            },
          },
          events: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
      });

      return updated;
    });

    // Update order status if shipment was delivered or status changed
    if (dto.status) {
      await this.updateOrderStatusAfterShipmentChange(shipment.orderId);
    }

    this.logger.log(
      `Shipment ${shipment.shipmentNumber} updated. New status: ${dto.status || shipment.status}`
    );

    return updatedShipment;
  }

  /**
   * Get shipment by ID with details
   */
  async getShipmentById(
    shipmentId: string,
    userId: string,
    userRole: UserRole
  ): Promise<SellerShipment | null> {
    const shipment = await this.prisma.sellerShipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          include: {
            user: true,
          },
        },
        store: true,
        items: {
          include: {
            orderItem: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        },
        events: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!shipment) {
      return null;
    }

    // Check access permissions
    const canAccess =
      userRole === UserRole.ADMIN ||
      userRole === UserRole.SUPER_ADMIN ||
      shipment.store.userId === userId || // Seller owns this shipment
      shipment.order.userId === userId; // Buyer owns this order

    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this shipment');
    }

    return shipment;
  }

  /**
   * Get all shipments for an order
   */
  async getShipmentsByOrder(
    orderId: string,
    userId: string,
    userRole: UserRole
  ): Promise<SellerShipment[]> {
    // Verify user has access to this order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: {
                store: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access permissions
    const isBuyer = order.userId === userId;
    const isSeller = order.items.some((item) => item.product.store?.userId === userId);
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (!isBuyer && !isSeller && !isAdmin) {
      throw new ForbiddenException('You do not have access to this order');
    }

    // Get shipments
    const whereClause: Prisma.SellerShipmentWhereInput = {
      orderId,
    };

    // If seller, only show their shipments
    if (isSeller && !isAdmin) {
      const sellerStoreIds = order.items
        .filter((item) => item.product.store?.userId === userId)
        .map((item) => item.product.storeId!)
        .filter((id): id is string => id !== null);

      whereClause.storeId = { in: sellerStoreIds };
    }

    const shipments = await this.prisma.sellerShipment.findMany({
      where: whereClause,
      include: {
        store: true,
        items: {
          include: {
            orderItem: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        },
        events: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return shipments;
  }

  /**
   * Get seller's shipments with pagination and filters
   */
  async getSellerShipments(
    sellerId: string,
    filters: {
      status?: ShipmentStatus;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { status, search, page = 1, limit = 20 } = filters;

    // Get seller's stores
    const stores = await this.prisma.store.findMany({
      where: { userId: sellerId },
      select: { id: true },
    });

    const storeIds = stores.map((s) => s.id);

    if (storeIds.length === 0) {
      return {
        shipments: [],
        total: 0,
        page: 1,
        pageSize: limit,
        totalPages: 0,
      };
    }

    // Build where clause
    const where: Prisma.SellerShipmentWhereInput = {
      storeId: { in: storeIds },
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { shipmentNumber: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        {
          order: {
            orderNumber: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Get total count
    const total = await this.prisma.sellerShipment.count({ where });

    // Get shipments
    const shipments = await this.prisma.sellerShipment.findMany({
      where,
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            shippingAddress: true,
          },
        },
        store: true,
        items: {
          include: {
            orderItem: {
              include: {
                product: true,
              },
            },
          },
        },
        events: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 3,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      shipments,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update order status based on all shipments' statuses
   */
  private async updateOrderStatusAfterShipmentChange(orderId: string): Promise<void> {
    // Get all shipments for this order
    const shipments = await this.prisma.sellerShipment.findMany({
      where: { orderId },
      include: {
        items: true,
      },
    });

    if (shipments.length === 0) {
      return; // No shipments yet, order stays in current status
    }

    // Count shipments by status
    const allDelivered = shipments.every((s) => s.status === ShipmentStatus.DELIVERED);
    const someDelivered = shipments.some((s) => s.status === ShipmentStatus.DELIVERED);
    const allShipped = shipments.every(
      (s) =>
        s.status === ShipmentStatus.IN_TRANSIT ||
        s.status === ShipmentStatus.OUT_FOR_DELIVERY ||
        s.status === ShipmentStatus.DELIVERED
    );
    const someShipped = shipments.some(
      (s) =>
        s.status === ShipmentStatus.IN_TRANSIT ||
        s.status === ShipmentStatus.OUT_FOR_DELIVERY ||
        s.status === ShipmentStatus.DELIVERED
    );

    // Determine new order status
    let newOrderStatus: OrderStatus | null = null;

    if (allDelivered) {
      newOrderStatus = OrderStatus.DELIVERED;
    } else if (someDelivered || (someShipped && shipments.length > 1)) {
      newOrderStatus = OrderStatus.PARTIALLY_SHIPPED;
    } else if (allShipped) {
      newOrderStatus = OrderStatus.SHIPPED;
    } else if (
      shipments.some(
        (s) =>
          s.status === ShipmentStatus.PROCESSING ||
          s.status === ShipmentStatus.LABEL_CREATED ||
          s.status === ShipmentStatus.PICKED_UP
      )
    ) {
      newOrderStatus = OrderStatus.PROCESSING;
    }

    // Update order status if it changed
    if (newOrderStatus) {
      const currentOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true },
      });

      if (currentOrder && currentOrder.status !== newOrderStatus) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: newOrderStatus },
        });

        // Create order timeline entry
        await this.prisma.orderTimeline.create({
          data: {
            orderId,
            status: newOrderStatus,
            title: this.getOrderStatusTitle(newOrderStatus),
            description: this.getOrderStatusDescription(newOrderStatus, shipments.length),
            icon: this.getOrderStatusIcon(newOrderStatus),
          },
        });

        this.logger.log(`Order ${orderId} status updated to ${newOrderStatus}`);
      }
    }
  }

  /**
   * Helper methods for status titles and descriptions
   */
  private getStatusTitle(status: ShipmentStatus): string {
    const titles: Record<ShipmentStatus, string> = {
      [ShipmentStatus.PENDING]: 'Shipment Pending',
      [ShipmentStatus.PROCESSING]: 'Processing Shipment',
      [ShipmentStatus.LABEL_CREATED]: 'Shipping Label Created',
      [ShipmentStatus.PICKED_UP]: 'Package Picked Up',
      [ShipmentStatus.IN_TRANSIT]: 'In Transit',
      [ShipmentStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
      [ShipmentStatus.DELIVERED]: 'Delivered',
      [ShipmentStatus.FAILED_DELIVERY]: 'Delivery Failed',
      [ShipmentStatus.RETURNED]: 'Returned to Sender',
    };
    return titles[status];
  }

  private getStatusDescription(status: ShipmentStatus): string {
    const descriptions: Record<ShipmentStatus, string> = {
      [ShipmentStatus.PENDING]: 'Shipment has been created',
      [ShipmentStatus.PROCESSING]: 'Seller is preparing your items',
      [ShipmentStatus.LABEL_CREATED]: 'Shipping label has been created',
      [ShipmentStatus.PICKED_UP]: 'Carrier has picked up the package',
      [ShipmentStatus.IN_TRANSIT]: 'Package is on its way',
      [ShipmentStatus.OUT_FOR_DELIVERY]: 'Package is out for delivery',
      [ShipmentStatus.DELIVERED]: 'Package has been delivered',
      [ShipmentStatus.FAILED_DELIVERY]: 'Delivery attempt failed',
      [ShipmentStatus.RETURNED]: 'Package returned to sender',
    };
    return descriptions[status];
  }

  private getOrderStatusTitle(status: OrderStatus): string {
    const titles: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Order Pending',
      [OrderStatus.CONFIRMED]: 'Order Confirmed',
      [OrderStatus.PROCESSING]: 'Processing',
      [OrderStatus.PARTIALLY_SHIPPED]: 'Partially Shipped',
      [OrderStatus.SHIPPED]: 'Shipped',
      [OrderStatus.DELIVERED]: 'Delivered',
      [OrderStatus.CANCELLED]: 'Cancelled',
      [OrderStatus.REFUNDED]: 'Refunded',
      [OrderStatus.READY_FOR_PICKUP]: 'Ready for Pickup',
      [OrderStatus.PICKED_UP]: 'Picked Up',
      [OrderStatus.PICKUP_EXPIRED]: 'Pickup Expired',
    };
    return titles[status];
  }

  private getOrderStatusDescription(status: OrderStatus, shipmentCount: number): string {
    if (status === OrderStatus.PARTIALLY_SHIPPED) {
      return `Some items from ${shipmentCount} shipment(s) have been delivered`;
    }

    if (status === OrderStatus.SHIPPED && shipmentCount > 1) {
      return `All ${shipmentCount} shipments are in transit`;
    }

    const descriptions: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Order awaiting payment',
      [OrderStatus.CONFIRMED]: 'Payment confirmed',
      [OrderStatus.PROCESSING]: 'Sellers are preparing your items',
      [OrderStatus.PARTIALLY_SHIPPED]: 'Some shipments delivered',
      [OrderStatus.SHIPPED]: 'All items shipped',
      [OrderStatus.DELIVERED]: 'All items delivered',
      [OrderStatus.CANCELLED]: 'Order cancelled',
      [OrderStatus.REFUNDED]: 'Order refunded',
      [OrderStatus.READY_FOR_PICKUP]: 'Your order is ready for pickup',
      [OrderStatus.PICKED_UP]: 'Order has been picked up',
      [OrderStatus.PICKUP_EXPIRED]: 'Pickup window has expired',
    };
    return descriptions[status];
  }

  private getOrderStatusIcon(status: OrderStatus): string {
    const icons: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'clock',
      [OrderStatus.CONFIRMED]: 'check-circle',
      [OrderStatus.PROCESSING]: 'package',
      [OrderStatus.PARTIALLY_SHIPPED]: 'truck',
      [OrderStatus.SHIPPED]: 'truck',
      [OrderStatus.DELIVERED]: 'check-circle',
      [OrderStatus.CANCELLED]: 'x-circle',
      [OrderStatus.REFUNDED]: 'arrow-left',
      [OrderStatus.READY_FOR_PICKUP]: 'store',
      [OrderStatus.PICKED_UP]: 'check-circle',
      [OrderStatus.PICKUP_EXPIRED]: 'clock',
    };
    return icons[status];
  }
}
