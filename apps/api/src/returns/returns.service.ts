import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ReturnReason, ReturnStatus } from '@prisma/client';

export interface CreateReturnRequestDto {
  orderId: string;
  orderItemId?: string;
  reason: ReturnReason;
  description?: string;
  images?: string[];
}

export interface ReturnRequestWithDetails {
  id: string;
  orderId: string;
  orderItemId: string | null;
  userId: string;
  reason: ReturnReason;
  description: string | null;
  images: string[] | null;
  status: ReturnStatus;
  resolution: string | null;
  refundAmount: number | null;
  refundMethod: string | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  order: {
    orderNumber: string;
    total: number;
    status: string;
    createdAt: Date;
  };
  orderItem: {
    name: string;
    image: string | null;
    quantity: number;
    price: number;
  } | null;
}

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all return requests for a user
   */
  async getMyReturns(userId: string): Promise<ReturnRequestWithDetails[]> {
    const returns = await this.prisma.returnRequest.findMany({
      where: { userId },
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
        orderItem: {
          select: {
            name: true,
            image: true,
            quantity: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return returns.map((r) => ({
      ...r,
      images: r.images as string[] | null,
      refundAmount: r.refundAmount ? Number(r.refundAmount) : null,
      order: {
        ...r.order,
        total: Number(r.order.total),
      },
      orderItem: r.orderItem
        ? {
            ...r.orderItem,
            price: Number(r.orderItem.price),
          }
        : null,
    }));
  }

  /**
   * Get a single return request by ID
   */
  async getReturnById(userId: string, returnId: string): Promise<ReturnRequestWithDetails> {
    const returnRequest = await this.prisma.returnRequest.findFirst({
      where: { id: returnId, userId },
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
        orderItem: {
          select: {
            name: true,
            image: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    return {
      ...returnRequest,
      images: returnRequest.images as string[] | null,
      refundAmount: returnRequest.refundAmount ? Number(returnRequest.refundAmount) : null,
      order: {
        ...returnRequest.order,
        total: Number(returnRequest.order.total),
      },
      orderItem: returnRequest.orderItem
        ? {
            ...returnRequest.orderItem,
            price: Number(returnRequest.orderItem.price),
          }
        : null,
    };
  }

  /**
   * Create a new return request
   */
  async createReturnRequest(
    userId: string,
    data: CreateReturnRequestDto
  ): Promise<ReturnRequestWithDetails> {
    // Verify order belongs to user
    const order = await this.prisma.order.findFirst({
      where: { id: data.orderId, userId },
      include: {
        items: true,
        returnRequests: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if order is eligible for return (must be delivered)
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('Only delivered orders can be returned');
    }

    // Check if order was delivered within return window (30 days)
    const deliveredDate = order.updatedAt; // Assuming updatedAt reflects delivery
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceDelivery > 30) {
      throw new BadRequestException('Return window has expired (30 days from delivery)');
    }

    // If orderItemId is provided, verify it belongs to the order
    if (data.orderItemId) {
      const orderItem = order.items.find((item) => item.id === data.orderItemId);
      if (!orderItem) {
        throw new BadRequestException('Order item not found in this order');
      }

      // Check if this item already has a pending return
      const existingReturn = order.returnRequests.find(
        (r) => r.orderItemId === data.orderItemId &&
        !['REJECTED', 'REFUNDED', 'CANCELLED'].includes(r.status)
      );
      if (existingReturn) {
        throw new BadRequestException('A return request already exists for this item');
      }
    } else {
      // Check if order already has a pending full return
      const existingFullReturn = order.returnRequests.find(
        (r) => r.orderItemId === null &&
        !['REJECTED', 'REFUNDED', 'CANCELLED'].includes(r.status)
      );
      if (existingFullReturn) {
        throw new BadRequestException('A return request already exists for this order');
      }
    }

    // Create return request
    const returnRequest = await this.prisma.returnRequest.create({
      data: {
        orderId: data.orderId,
        orderItemId: data.orderItemId || null,
        userId,
        reason: data.reason,
        description: data.description || null,
        images: data.images || null,
        status: 'PENDING',
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
        orderItem: {
          select: {
            name: true,
            image: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    return {
      ...returnRequest,
      images: returnRequest.images as string[] | null,
      refundAmount: returnRequest.refundAmount ? Number(returnRequest.refundAmount) : null,
      order: {
        ...returnRequest.order,
        total: Number(returnRequest.order.total),
      },
      orderItem: returnRequest.orderItem
        ? {
            ...returnRequest.orderItem,
            price: Number(returnRequest.orderItem.price),
          }
        : null,
    };
  }

  /**
   * Cancel a return request (only if status is PENDING)
   */
  async cancelReturnRequest(userId: string, returnId: string): Promise<ReturnRequestWithDetails> {
    const returnRequest = await this.prisma.returnRequest.findFirst({
      where: { id: returnId, userId },
    });

    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    if (returnRequest.status !== 'PENDING') {
      throw new BadRequestException('Only pending return requests can be cancelled');
    }

    const updated = await this.prisma.returnRequest.update({
      where: { id: returnId },
      data: { status: 'CANCELLED' },
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
        orderItem: {
          select: {
            name: true,
            image: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    return {
      ...updated,
      images: updated.images as string[] | null,
      refundAmount: updated.refundAmount ? Number(updated.refundAmount) : null,
      order: {
        ...updated.order,
        total: Number(updated.order.total),
      },
      orderItem: updated.orderItem
        ? {
            ...updated.orderItem,
            price: Number(updated.orderItem.price),
          }
        : null,
    };
  }

  /**
   * Check if an order is eligible for return
   */
  async canRequestReturn(userId: string, orderId: string): Promise<{
    canReturn: boolean;
    reason?: string;
    daysRemaining?: number;
  }> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        returnRequests: {
          where: {
            orderItemId: null,
            status: { notIn: ['REJECTED', 'REFUNDED', 'CANCELLED'] },
          },
        },
      },
    });

    if (!order) {
      return { canReturn: false, reason: 'Order not found' };
    }

    if (order.status !== 'DELIVERED') {
      return { canReturn: false, reason: 'Order has not been delivered yet' };
    }

    // Check for existing full order return
    if (order.returnRequests.length > 0) {
      return { canReturn: false, reason: 'A return request already exists for this order' };
    }

    // Check return window
    const deliveredDate = order.updatedAt;
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDelivery > 30) {
      return { canReturn: false, reason: 'Return window has expired' };
    }

    return {
      canReturn: true,
      daysRemaining: 30 - daysSinceDelivery
    };
  }
}
