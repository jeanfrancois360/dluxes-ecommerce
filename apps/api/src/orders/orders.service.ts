import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Orders Service
 * Handles all business logic for order operations
 */
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

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
    const { items, shippingAddressId, billingAddressId, paymentMethod, notes } =
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

    // Calculate shipping and tax (simplified)
    const shipping = new Decimal(15.0); // Fixed shipping for now
    const tax = subtotal.mul(0.1); // 10% tax
    const total = subtotal.add(shipping).add(tax);

    // Generate order number
    const orderNumber = `LUX-${Date.now()}`;

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

      // Update product inventory
      for (const item of items) {
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: {
              inventory: {
                decrement: item.quantity,
              },
            },
          });
        } else {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              inventory: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      return newOrder;
    });

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

    // Restore inventory
    await this.prisma.$transaction(async (prisma) => {
      for (const item of order.items) {
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: {
              inventory: {
                increment: item.quantity,
              },
            },
          });
        } else {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              inventory: {
                increment: item.quantity,
              },
            },
          });
        }
      }
    });

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
