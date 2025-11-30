import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus, InventoryTransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { InventoryService } from '../inventory/inventory.service';
import { ShippingTaxService } from './shipping-tax.service';
import { CurrencyService } from '../currency/currency.service';

/**
 * Orders Service
 * Handles all business logic for order operations
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly inventoryService: InventoryService;
  private readonly shippingTaxService: ShippingTaxService;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CurrencyService))
    private readonly currencyService: CurrencyService
  ) {
    this.inventoryService = new InventoryService(prisma);
    this.shippingTaxService = new ShippingTaxService(null as any);
  }

  /**
   * Get shipping options for checkout
   */
  async getShippingOptions(addressId: string, items: any[]) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new BadRequestException('Address not found');
    }

    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    return this.shippingTaxService.calculateShippingOptions(
      {
        country: address.country,
        state: address.province || undefined,
        postalCode: address.postalCode,
        city: address.city,
      },
      items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      subtotal
    );
  }

  /**
   * Calculate tax for checkout
   */
  async calculateTax(addressId: string, subtotal: number) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new BadRequestException('Address not found');
    }

    return this.shippingTaxService.calculateTax(
      {
        country: address.country,
        state: address.province || undefined,
        postalCode: address.postalCode,
      },
      subtotal
    );
  }

  /**
   * Get all orders for a user
   */
  async findAll(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single order by ID
   */
  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
            variant: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Create new order from cart
   */
  async create(userId: string, createOrderDto: CreateOrderDto) {
    const { items, shippingAddressId, billingAddressId, paymentMethod, notes, currency: orderCurrency } =
      createOrderDto;

    // Verify shipping address exists and belongs to user
    const shippingAddress = await this.prisma.address.findFirst({
      where: {
        id: shippingAddressId,
        userId,
      },
    });

    if (!shippingAddress) {
      throw new BadRequestException('Invalid shipping address');
    }

    // Calculate totals
    let subtotal = new Decimal(0);
    const orderItems: any[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          variants: item.variantId
            ? {
                where: { id: item.variantId },
              }
            : false,
        },
      });

      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      // Check inventory
      const availableInventory = item.variantId
        ? product.variants[0]?.inventory || 0
        : product.inventory;

      if (availableInventory < item.quantity) {
        throw new BadRequestException(
          `Insufficient inventory for ${product.name}`
        );
      }

      const itemTotal = new Decimal(item.price).mul(item.quantity);
      subtotal = subtotal.add(itemTotal);

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        name: product.name,
        sku: item.variantId
          ? product.variants[0]?.sku || product.slug
          : product.slug,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal,
        image: product.heroImage,
      });
    }

    // Calculate shipping and tax using actual rates
    const taxCalc = this.shippingTaxService.calculateTax(
      {
        country: shippingAddress?.country || 'US',
        state: shippingAddress?.province || undefined,
        postalCode: shippingAddress?.postalCode || undefined,
      },
      Number(subtotal)
    );

    // Get shipping options and use standard by default
    const shippingOptions = this.shippingTaxService.calculateShippingOptions(
      {
        country: shippingAddress?.country || 'US',
        state: shippingAddress?.province || undefined,
        postalCode: shippingAddress?.postalCode || undefined,
      },
      orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      Number(subtotal)
    );

    const selectedShipping = shippingOptions[0]; // Default to standard shipping
    const shipping = new Decimal(selectedShipping?.price || 15);
    const tax = new Decimal(taxCalc.amount);
    const total = subtotal.add(shipping).add(tax);

    // Generate order number
    const orderNumber = `LUX-${Date.now()}`;

    // Get currency and exchange rate for order
    const currency = orderCurrency || 'USD';
    const baseCurrency = 'USD';
    let exchangeRate: Decimal | null = null;

    // Get the exchange rate at time of order if currency is different from base
    if (currency !== baseCurrency) {
      try {
        const currencyRate = await this.currencyService.getRateByCode(currency);
        exchangeRate = new Decimal(Number(currencyRate.rate));
      } catch (error) {
        this.logger.error(`Failed to get exchange rate for currency ${currency}:`, error);
        // Continue with order creation without exchange rate
      }
    }

    // Create order with transaction
    const order = await this.prisma.$transaction(async (prisma) => {
      // Create order
      const newOrder = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          shipping,
          tax,
          total,
          currency,
          exchangeRate,
          baseCurrency,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod,
          shippingAddressId,
          billingAddressId: billingAddressId || shippingAddressId,
          notes,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          shippingAddress: true,
          billingAddress: true,
        },
      });

      // Create initial timeline entry
      await prisma.orderTimeline.create({
        data: {
          orderId: newOrder.id,
          status: OrderStatus.PENDING,
          title: 'Order Placed',
          description: 'Your order has been received and is being processed.',
          icon: 'shopping-bag',
        },
      });

      return newOrder;
    });

    // Record inventory transactions outside the main transaction
    // This creates proper audit trail
    for (const item of items) {
      try {
        await this.inventoryService.recordTransaction({
          productId: item.productId,
          variantId: item.variantId || undefined,
          type: InventoryTransactionType.SALE,
          quantity: -item.quantity, // Negative for decrement
          orderId: order.id,
          userId,
          reason: 'order_placed',
          notes: `Order ${order.orderNumber}`,
        });
      } catch (invError) {
        this.logger.error(`Error recording inventory transaction for product ${item.productId}:`, invError);
        // Don't fail the order, just log the error
      }
    }

    // TODO: Send order confirmation email via queue

    return order;
  }

  /**
   * Update order status (Admin only)
   */
  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: true,
        shippingAddress: true,
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Create timeline entry
    const timelineData: any = {
      orderId: id,
      status,
      title: this.getStatusTitle(status),
      description: this.getStatusDescription(status),
      icon: this.getStatusIcon(status),
    };

    await this.prisma.orderTimeline.create({
      data: timelineData,
    });

    // TODO: Send status update email via queue

    return updatedOrder;
  }

  /**
   * Cancel order
   */
  async cancel(id: string, userId: string) {
    const order = await this.findOne(id, userId);

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel delivered order');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order already cancelled');
    }

    // Restore inventory with proper transaction tracking
    for (const item of order.items) {
      try {
        await this.inventoryService.recordTransaction({
          productId: item.productId,
          variantId: item.variantId || undefined,
          type: InventoryTransactionType.RETURN,
          quantity: item.quantity, // Positive for increment
          orderId: id,
          userId,
          reason: 'order_cancelled',
          notes: `Order ${order.orderNumber} cancelled`,
        });
      } catch (invError) {
        this.logger.error(`Error restoring inventory for product ${item.productId}:`, invError);
      }
    }

    return this.updateStatus(id, OrderStatus.CANCELLED);
  }

  /**
   * Track order
   */
  async track(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      timeline: order.timeline,
      shippingAddress: order.shippingAddress,
    };
  }

  /**
   * Helper methods for timeline
   */
  private getStatusTitle(status: OrderStatus): string {
    const titles = {
      [OrderStatus.PENDING]: 'Order Pending',
      [OrderStatus.CONFIRMED]: 'Order Confirmed',
      [OrderStatus.PROCESSING]: 'Processing Order',
      [OrderStatus.SHIPPED]: 'Order Shipped',
      [OrderStatus.DELIVERED]: 'Order Delivered',
      [OrderStatus.CANCELLED]: 'Order Cancelled',
      [OrderStatus.REFUNDED]: 'Order Refunded',
    };
    return titles[status];
  }

  private getStatusDescription(status: OrderStatus): string {
    const descriptions = {
      [OrderStatus.PENDING]: 'Your order is pending confirmation.',
      [OrderStatus.CONFIRMED]: 'Your order has been confirmed and will be processed soon.',
      [OrderStatus.PROCESSING]: 'Your order is being prepared for shipment.',
      [OrderStatus.SHIPPED]: 'Your order has been shipped and is on the way.',
      [OrderStatus.DELIVERED]: 'Your order has been successfully delivered.',
      [OrderStatus.CANCELLED]: 'Your order has been cancelled.',
      [OrderStatus.REFUNDED]: 'Your order has been refunded.',
    };
    return descriptions[status];
  }

  private getStatusIcon(status: OrderStatus): string {
    const icons = {
      [OrderStatus.PENDING]: 'clock',
      [OrderStatus.CONFIRMED]: 'check-circle',
      [OrderStatus.PROCESSING]: 'package',
      [OrderStatus.SHIPPED]: 'truck',
      [OrderStatus.DELIVERED]: 'check',
      [OrderStatus.CANCELLED]: 'x-circle',
      [OrderStatus.REFUNDED]: 'arrow-left',
    };
    return icons[status];
  }
}
