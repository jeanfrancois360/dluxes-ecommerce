import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { CurrencyService } from '../currency/currency.service';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService
  ) {}

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
   * Calculate cart totals using locked prices
   */
  private async calculateCartTotals(cart: any) {
    let subtotal = new Decimal(0);
    const discount = new Decimal(0);

    for (const item of cart.items) {
      // Use priceAtAdd (locked price) if available, fallback to price for backwards compat
      const itemPrice = item.priceAtAdd || item.price;
      const itemTotal = new Decimal(itemPrice).mul(item.quantity);
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
   * Add item to cart with inventory and currency validation
   */
  async addItem(
    cartId: string,
    data: { productId: string; variantId?: string; quantity: number; currency?: string }
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

    // Get current cart to check currency lock
    const currentCart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });

    if (!currentCart) {
      throw new BadRequestException('Cart not found');
    }

    // 🔒 CURRENCY LOCKING LOGIC
    const requestCurrency = data.currency?.toUpperCase() || 'USD';

    let cartCurrency = requestCurrency;
    let exchangeRate: Decimal;

    if (currentCart.items.length === 0) {
      // 🆕 FIRST ITEM - LOCK CURRENCY AND CAPTURE EXCHANGE RATE
      this.logger.log(`🔒 Locking cart ${cartId} to currency: ${requestCurrency}`);

      // Get exchange rate from USD to requested currency
      exchangeRate = await this.currencyService.getExchangeRate('USD', requestCurrency);

      // Update cart with locked currency and exchange rate
      await this.prisma.cart.update({
        where: { id: cartId },
        data: {
          currency: requestCurrency,
          exchangeRate: exchangeRate,
          rateLockedAt: new Date(),
        },
      });

      this.logger.log(
        `✅ Currency locked: ${requestCurrency} at rate ${exchangeRate.toFixed(6)} ` +
          `(1 USD = ${exchangeRate.toFixed(6)} ${requestCurrency})`
      );
    } else {
      // ⚠️ SUBSEQUENT ITEMS - VALIDATE CURRENCY MATCHES
      if (currentCart.currency !== requestCurrency) {
        throw new BadRequestException(
          `Cannot add item. Cart is locked to ${currentCart.currency}. ` +
            `Please clear your cart to change currency.`
        );
      }

      // Use cart's locked exchange rate
      exchangeRate = new Decimal(currentCart.exchangeRate);
      cartCurrency = currentCart.currency;

      this.logger.log(
        `✓ Using locked currency: ${currentCart.currency} ` +
          `(rate: ${exchangeRate.toFixed(6)}, locked at: ${currentCart.rateLockedAt})`
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

    // Get product price in USD (base currency)
    const basePriceUSD = data.variantId
      ? product.variants[0]?.price || product.price
      : product.price;

    // 💱 CONVERT PRICE TO CART'S LOCKED CURRENCY
    const priceInCartCurrency = new Decimal(basePriceUSD).mul(exchangeRate).toDecimalPlaces(2);

    if (existingItem) {
      // Update quantity only (price is immutable once added)
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          previousQuantity: existingItem.quantity,
        },
      });
    } else {
      // 🆕 CREATE NEW CART ITEM WITH LOCKED PRICE
      await this.prisma.cartItem.create({
        data: {
          cartId,
          productId: data.productId,
          variantId: data.variantId,
          name: product.name,
          sku: data.variantId
            ? product.variants[0]?.sku || `SKU-${product.id}`
            : `SKU-${product.id}`,
          price: priceInCartCurrency, // Current price (for backwards compat)
          priceAtAdd: priceInCartCurrency, // 🔒 LOCKED PRICE - immutable
          currencyAtAdd: cartCurrency, // 🔒 LOCKED CURRENCY - immutable
          quantity: data.quantity,
          image: product.heroImage || product.images[0]?.url,
        },
      });

      this.logger.log(
        `➕ Added to cart: ${product.name} - ` +
          `$${basePriceUSD} USD → ${priceInCartCurrency} ${cartCurrency} ` +
          `(rate: ${exchangeRate.toFixed(6)})`
      );
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

    const availableInventory = item.variantId
      ? item.variant?.inventory || 0
      : item.product.inventory;

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
  /**
   * Clear cart - removes all items and unlocks currency
   */
  async clearCart(cartId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });

    // 🔓 UNLOCK CURRENCY: Reset cart totals and currency lock
    await this.prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotal: 0,
        discount: 0,
        total: 0,
        currency: 'USD', // Reset to default currency
        exchangeRate: 1, // Reset to 1:1 (USD base)
        rateLockedAt: new Date(), // Update timestamp
      },
    });

    this.logger.log(`🔓 Cart ${cartId} cleared - currency unlocked`);

    return { success: true, message: 'Cart cleared - you can now change currency' };
  }

  /**
   * Update cart currency (requires clearing cart)
   * Returns information about whether cart needs to be cleared
   */
  async updateCurrency(cartId: string, newCurrency: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });

    if (!cart) {
      throw new BadRequestException('Cart not found');
    }

    const upperCurrency = newCurrency.toUpperCase();

    // If cart is empty, update currency and fetch new exchange rate
    if (cart.items.length === 0) {
      const exchangeRate = await this.currencyService.getExchangeRate('USD', upperCurrency);

      await this.prisma.cart.update({
        where: { id: cartId },
        data: {
          currency: upperCurrency,
          exchangeRate: exchangeRate,
          rateLockedAt: new Date(),
        },
      });

      this.logger.log(
        `Updated empty cart currency: ${upperCurrency} ` + `(rate: ${exchangeRate.toFixed(6)})`
      );

      return {
        success: true,
        message: 'Currency updated successfully',
        cartCleared: false,
      };
    }

    // If cart has items and currency is different, we need user confirmation
    if (cart.currency !== upperCurrency) {
      return {
        success: false,
        message: `Cart contains items in ${cart.currency}. Changing to ${upperCurrency} will clear your cart.`,
        requiresConfirmation: true,
        currentCurrency: cart.currency,
        newCurrency: upperCurrency,
        itemCount: cart.items.length,
      };
    }

    // Currency is same, no change needed
    return {
      success: true,
      message: 'Currency is already set to ' + upperCurrency,
      cartCleared: false,
    };
  }

  /**
   * Force update cart currency by clearing items
   */
  async forceUpdateCurrency(cartId: string, newCurrency: string) {
    const upperCurrency = newCurrency.toUpperCase();

    // Fetch new exchange rate
    const exchangeRate = await this.currencyService.getExchangeRate('USD', upperCurrency);

    // Clear cart items
    await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });

    // Update currency, exchange rate, and reset totals
    await this.prisma.cart.update({
      where: { id: cartId },
      data: {
        currency: upperCurrency,
        exchangeRate: exchangeRate,
        rateLockedAt: new Date(),
        subtotal: 0,
        discount: 0,
        total: 0,
      },
    });

    this.logger.log(
      `Force updated cart currency: ${upperCurrency} ` +
        `(rate: ${exchangeRate.toFixed(6)}), cart cleared`
    );

    return {
      success: true,
      message: `Currency updated to ${upperCurrency}. Cart has been cleared.`,
      cartCleared: true,
    };
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
            priceAtAdd: guestItem.priceAtAdd || guestItem.price, // Use locked price or fallback
            currencyAtAdd: guestItem.currencyAtAdd || 'USD', // Use locked currency or fallback
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
