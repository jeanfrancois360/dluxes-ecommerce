import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create cart with calculated totals
   */
  async getCart(sessionId: string, userId?: string) {
    const where: any = { sessionId };
    if (userId) where.userId = userId;

    let cart = await this.prisma.cart.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                heroImage: true,
                inventory: true,
                status: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                inventory: true,
                isAvailable: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { sessionId, userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  heroImage: true,
                  inventory: true,
                  status: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  inventory: true,
                  isAvailable: true,
                },
              },
            },
          },
        },
      });
    }

    // Calculate totals
    return this.calculateCartTotals(cart);
  }

  /**
   * Calculate cart totals
   */
  private async calculateCartTotals(cart: any) {
    let subtotal = new Decimal(0);
    let discount = new Decimal(0);

    for (const item of cart.items) {
      const itemTotal = new Decimal(item.price).mul(item.quantity);
      subtotal = subtotal.add(itemTotal);
    }

    const total = subtotal.sub(discount);

    // Update cart totals in database
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        subtotal,
        discount,
        total,
      },
    });

    return {
      ...cart,
      subtotal,
      discount,
      total,
    };
  }

  /**
   * Add item to cart with inventory validation
   */
  async addItem(
    cartId: string,
    data: { productId: string; variantId?: string; quantity: number }
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
      include: {
        images: true,
        variants: data.variantId ? { where: { id: data.variantId } } : false,
      },
    });

    if (!product) {
      throw new BadRequestException('Product not found');
    }

    // Block inquiry-based products from being added to cart
    // These products require contacting the seller instead of direct purchase
    const isInquiryProduct =
      product.purchaseType === 'INQUIRY' ||
      product.productType === 'REAL_ESTATE' ||
      product.productType === 'VEHICLE';

    if (isInquiryProduct) {
      throw new BadRequestException(
        'This product requires contacting the seller. It cannot be added to cart.'
      );
    }

    // Check inventory availability
    const availableInventory = data.variantId
      ? product.variants[0]?.inventory || 0
      : product.inventory;

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId: data.productId,
        variantId: data.variantId,
      },
    });

    const newQuantity = existingItem ? existingItem.quantity + data.quantity : data.quantity;

    if (newQuantity > availableInventory) {
      throw new Error(`Only ${availableInventory} items available in stock`);
    }

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          previousQuantity: existingItem.quantity,
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId,
          productId: data.productId,
          variantId: data.variantId,
          name: product.name,
          sku: data.variantId ? product.variants[0]?.sku || `SKU-${product.id}` : `SKU-${product.id}`,
          price: data.variantId ? product.variants[0]?.price || product.price : product.price,
          quantity: data.quantity,
          image: product.heroImage || product.images[0]?.url,
        },
      });
    }

    // Recalculate totals and return updated cart
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                heroImage: true,
                inventory: true,
                status: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                inventory: true,
                isAvailable: true,
              },
            },
          },
        },
      },
    });

    return this.calculateCartTotals(cart);
  }

  /**
   * Update cart item quantity with recalculation
   */
  async updateItem(itemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        product: { select: { inventory: true } },
        variant: { select: { inventory: true } },
      },
    });

    if (!item) {
      throw new Error('Cart item not found');
    }

    const availableInventory = item.variantId ? item.variant?.inventory || 0 : item.product.inventory;

    if (quantity > availableInventory) {
      throw new Error(`Only ${availableInventory} items available in stock`);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity,
        previousQuantity: item.quantity,
      },
    });

    // Recalculate cart totals
    const cart = await this.prisma.cart.findUnique({
      where: { id: item.cartId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                heroImage: true,
                inventory: true,
                status: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                inventory: true,
                isAvailable: true,
              },
            },
          },
        },
      },
    });

    return this.calculateCartTotals(cart);
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new Error('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    // Recalculate cart totals
    const cart = await this.prisma.cart.findUnique({
      where: { id: item.cartId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                heroImage: true,
                inventory: true,
                status: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                inventory: true,
                isAvailable: true,
              },
            },
          },
        },
      },
    });

    return this.calculateCartTotals(cart);
  }

  /**
   * Clear all items from cart
   */
  async clearCart(cartId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });

    // Reset cart totals
    await this.prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotal: 0,
        discount: 0,
        total: 0,
      },
    });

    return { success: true, message: 'Cart cleared successfully' };
  }

  /**
   * Merge guest cart with user cart on login
   * This transfers items from guest session cart to user's persistent cart
   */
  async mergeGuestCart(sessionId: string, userId: string) {
    // Find guest cart (cart without userId)
    const guestCart = await this.prisma.cart.findFirst({
      where: { sessionId, userId: null },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      // No guest cart to merge, just get/create user cart
      return this.getCart(sessionId, userId);
    }

    // Find or create user's cart
    let userCart = await this.prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });

    if (!userCart) {
      // Create user cart
      userCart = await this.prisma.cart.create({
        data: { sessionId, userId },
        include: { items: true },
      });
    }

    // Merge items from guest cart to user cart
    for (const guestItem of guestCart.items) {
      // Check if item already exists in user cart
      const existingItem = userCart.items.find(
        (item) => item.productId === guestItem.productId && item.variantId === guestItem.variantId
      );

      if (existingItem) {
        // Update quantity (add guest quantity to existing)
        const newQuantity = existingItem.quantity + guestItem.quantity;

        // Check inventory
        const product = await this.prisma.product.findUnique({
          where: { id: guestItem.productId },
          select: { inventory: true },
        });

        const maxQuantity = product?.inventory || guestItem.quantity;
        const finalQuantity = Math.min(newQuantity, maxQuantity);

        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: finalQuantity,
            previousQuantity: existingItem.quantity,
          },
        });
      } else {
        // Add new item to user cart
        await this.prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            name: guestItem.name,
            sku: guestItem.sku,
            price: guestItem.price,
            quantity: guestItem.quantity,
            image: guestItem.image,
          },
        });
      }
    }

    // Delete guest cart items and cart
    await this.prisma.cartItem.deleteMany({
      where: { cartId: guestCart.id },
    });
    await this.prisma.cart.delete({
      where: { id: guestCart.id },
    });

    // Return updated user cart with totals
    const updatedCart = await this.prisma.cart.findUnique({
      where: { id: userCart.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                heroImage: true,
                inventory: true,
                status: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                inventory: true,
                isAvailable: true,
              },
            },
          },
        },
      },
    });

    return this.calculateCartTotals(updatedCart);
  }

  /**
   * Transfer cart ownership to user (simple version without merge)
   */
  async assignCartToUser(sessionId: string, userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { sessionId, userId: null },
    });

    if (cart) {
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { userId },
      });
    }

    return this.getCart(sessionId, userId);
  }
}
