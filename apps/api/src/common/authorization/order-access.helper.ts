import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@prisma/client';

export type OrderAccessMode = 'buyer' | 'seller' | 'any';

export interface AuthenticatedUser {
  id: string;
  userId?: string;
  email: string;
  role: UserRole;
}

/**
 * Verifies that the given user may access the given order.
 *
 * Access rules:
 *   - ADMIN and SUPER_ADMIN: always allowed
 *   - Buyer: allowed if order.userId === user.id (modes 'buyer' and 'any')
 *   - Seller: allowed if the order contains an item from a store the user owns
 *             (modes 'seller' and 'any')
 *
 * Throws:
 *   - NotFoundException if the order doesn't exist
 *   - ForbiddenException if the user lacks access
 */
export async function assertOrderAccess(
  prisma: PrismaService,
  orderId: string,
  user: AuthenticatedUser,
  mode: OrderAccessMode = 'any'
): Promise<{ id: string; userId: string; status: string; total: any; currency: string }> {
  const userId = user.id ?? user.userId;
  if (!userId) {
    throw new ForbiddenException('Invalid authentication context');
  }

  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true, total: true, currency: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      total: true,
      currency: true,
      items: {
        select: {
          product: {
            select: {
              store: { select: { userId: true } },
            },
          },
        },
      },
    },
  });

  if (!order) throw new NotFoundException('Order not found');

  const isBuyer = order.userId === userId;
  const isSeller = order.items.some((item) => item.product?.store?.userId === userId);

  if (mode === 'buyer' && !isBuyer) {
    throw new ForbiddenException('You do not have access to this order');
  }
  if (mode === 'seller' && !isSeller) {
    throw new ForbiddenException('You do not have access to this order');
  }
  if (mode === 'any' && !isBuyer && !isSeller) {
    throw new ForbiddenException('You do not have access to this order');
  }

  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    total: order.total,
    currency: order.currency,
  };
}
