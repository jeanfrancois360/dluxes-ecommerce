import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(sessionId: string, userId?: string) {
    const where: any = { sessionId };
    if (userId) where.userId = userId;

    let cart = await this.prisma.cart.findFirst({
      where,
      include: { items: true },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { sessionId, userId },
        include: { items: true },
      });
    }

    return cart;
  }

  async addItem(
    cartId: string,
    data: { productId: string; variantId?: string; quantity: number }
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
      include: { images: true },
    });

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId: data.productId,
        variantId: data.variantId,
      },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + data.quantity },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId,
        productId: data.productId,
        variantId: data.variantId,
        name: product.name,
        sku: `SKU-${product.id}`,
        price: product.price,
        quantity: data.quantity,
        image: product.images[0]?.url,
      },
    });
  }

  async updateItem(itemId: string, quantity: number) {
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  async removeItem(itemId: string) {
    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(cartId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });
    return { success: true };
  }
}
