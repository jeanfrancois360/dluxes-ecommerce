import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CalculateTotalsDto, OrderCalculationResponse } from './dto/calculate-totals.dto';
import { OrderStatus, PaymentStatus, InventoryTransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { InventoryService } from '../inventory/inventory.service';
import { ShippingTaxService } from './shipping-tax.service';
import { CurrencyService } from '../currency/currency.service';
import { EmailService } from '../email/email.service';
import { CartService } from '../cart/cart.service';
import { PaymentService } from '../payment/payment.service';
import { GelatoOrdersService } from '../gelato/gelato-orders.service';
import PDFDocument from 'pdfkit';

/**
 * Orders Service
 * Handles all business logic for order operations
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly inventoryService: InventoryService;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CurrencyService))
    private readonly currencyService: CurrencyService,
    private readonly emailService: EmailService,
    private readonly shippingTaxService: ShippingTaxService,
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService,
    private readonly paymentService: PaymentService,
    private readonly gelatoOrdersService: GelatoOrdersService
  ) {
    this.inventoryService = new InventoryService(prisma);
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

    return await this.shippingTaxService.calculateShippingOptions(
      {
        country: address.country,
        state: address.province || undefined,
        postalCode: address.postalCode,
        city: address.city,
      },
      items.map((item) => ({
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

    return await this.shippingTaxService.calculateTax(
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
        sellerShipments: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                slug: true,
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get paginated orders for a user
   */
  async findAllPaginated(
    userId: string,
    options: {
      page: number;
      limit: number;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const { page, limit, status, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    // Build where clause
    const where: any = { userId };
    if (status) {
      where.status = status.toUpperCase();
    }

    // Get total count
    const total = await this.prisma.order.count({ where });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get orders with pagination
    const orders = await this.prisma.order.findMany({
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
        sellerShipments: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                slug: true,
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
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get single order by ID
   */
  async findOne(id: string, userId: string, isAdmin: boolean = false) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        // Admins can view any order, regular users only their own
        ...(isAdmin ? {} : { userId }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  orderBy: { displayOrder: 'asc' },
                },
                store: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
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
        delivery: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
                website: true,
              },
            },
          },
        },
        sellerShipments: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            items: {
              include: {
                orderItem: {
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
        },
        commissions: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * 🔒 Create order from cart with locked currency
   * Uses cart's locked currency and exchange rate for the entire order
   */
  async createOrderFromCart(
    userId: string,
    sessionId: string,
    shippingAddressId: string,
    billingAddressId?: string,
    notes?: string,
    idempotencyKey?: string
  ) {
    // 1. Check for duplicate order (idempotency)
    if (idempotencyKey) {
      const existingOrder = await this.prisma.order.findFirst({
        where: {
          userId,
          metadata: {
            path: ['idempotencyKey'],
            equals: idempotencyKey,
          },
        },
        include: {
          items: true,
          shippingAddress: true,
        },
      });

      if (existingOrder) {
        this.logger.warn(
          `🔄 Duplicate order prevented for user ${userId} with idempotency key: ${idempotencyKey}`
        );

        // Return existing order instead of creating duplicate
        this.logger.log(
          `Returning existing order ${existingOrder.id} (idempotency key: ${idempotencyKey})`
        );

        return {
          order: existingOrder,
          clientSecret: null, // Client secret not stored in DB, order already created
          isDuplicate: true,
        };
      }
    }

    // 2. Get cart with locked currency and totals
    const cart = await this.cartService.getCart(sessionId, userId);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 2. 🔒 Use cart's LOCKED currency for entire order
    const orderCurrency = cart.currency;
    const orderExchangeRate = new Decimal(cart.exchangeRate);

    this.logger.log(
      `📦 Creating order in ${orderCurrency} ` +
        `(rate: ${orderExchangeRate.toFixed(6)}, locked at: ${cart.rateLockedAt})`
    );

    // 3. Verify shipping address exists and belongs to user
    const shippingAddress = await this.prisma.address.findFirst({
      where: { id: shippingAddressId, userId },
    });

    if (!shippingAddress) {
      throw new BadRequestException('Invalid shipping address');
    }

    // 4. Calculate totals (already in locked currency from cart)
    const cartTotals = await this.cartService.getCart(sessionId, userId);
    const subtotal = new Decimal(cartTotals.subtotal);
    const discount = new Decimal(cartTotals.discount);

    // 5. Calculate shipping and tax in locked currency
    const taxCalc = await this.shippingTaxService.calculateTax(
      {
        country: shippingAddress.country,
        state: shippingAddress.province || undefined,
        postalCode: shippingAddress.postalCode || undefined,
      },
      Number(subtotal)
    );

    const shippingOptions = await this.shippingTaxService.calculateShippingOptions(
      {
        country: shippingAddress.country,
        state: shippingAddress.province || undefined,
        postalCode: shippingAddress.postalCode || undefined,
      },
      cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      Number(subtotal)
    );

    const selectedShipping = shippingOptions[0];
    const shipping = new Decimal(selectedShipping?.price || 15);
    const tax = new Decimal(taxCalc.amount);
    const total = subtotal.add(shipping).add(tax).sub(discount);

    // 6. Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    this.logger.log(
      `💰 Order totals: subtotal=${subtotal} ${orderCurrency}, ` +
        `shipping=${shipping}, tax=${tax}, total=${total}`
    );

    // 7. Create order with transaction
    const order = await this.prisma.$transaction(async (prisma) => {
      // Prepare order items from cart items
      const orderItems = cart.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.priceAtAdd || item.price, // 🔒 Use locked price
        currency: item.currencyAtAdd || cart.currency, // 🔒 Use locked currency
        total: new Decimal(item.priceAtAdd || item.price).mul(item.quantity),
        image: item.image,
      }));

      // Create order with locked currency
      const newOrder = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          shipping,
          tax,
          discount,
          total,

          // 🔒 LOCKED CURRENCY FROM CART
          currency: orderCurrency,
          exchangeRate: orderExchangeRate,
          baseCurrency: 'USD',

          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: 'STRIPE', // Default to Stripe
          shippingAddressId,
          billingAddressId: billingAddressId || shippingAddressId,
          notes,

          // Store idempotency key to prevent duplicate orders
          metadata: idempotencyKey ? { idempotencyKey } : null,

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

    this.logger.log(
      `✅ Order created: ${order.orderNumber} (${order.id}) - ` +
        `${total} ${orderCurrency} (rate: ${orderExchangeRate.toFixed(6)})`
    );

    // 8. Record inventory transactions
    for (const item of cart.items) {
      try {
        await this.inventoryService.recordTransaction({
          productId: item.productId,
          variantId: item.variantId || undefined,
          type: InventoryTransactionType.SALE,
          quantity: -item.quantity,
          orderId: order.id,
          userId,
          reason: 'order_placed',
          notes: `Order ${order.orderNumber}`,
        });
      } catch (invError) {
        this.logger.error(
          `Error recording inventory transaction for product ${item.productId}:`,
          invError
        );
      }
    }

    // 9. Send order confirmation email
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true },
      });

      if (user?.email) {
        const customerName =
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Customer';

        await this.emailService.sendOrderConfirmation(user.email, {
          orderNumber: order.orderNumber,
          customerName,
          items: order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: Number(item.price),
            total: Number(item.total),
          })),
          subtotal: Number(subtotal),
          shipping: Number(shipping),
          tax: Number(tax),
          total: Number(total),
          currency: orderCurrency,
          shippingAddress: {
            street: order.shippingAddress.address1 || '',
            city: order.shippingAddress.city || '',
            state: order.shippingAddress.province || '',
            zipCode: order.shippingAddress.postalCode || '',
            country: order.shippingAddress.country || '',
          },
          orderId: order.id,
        });
      }
    } catch (emailError) {
      this.logger.error('Error sending order confirmation email:', emailError);
    }

    // 10. 💳 Create Stripe Payment Intent with locked currency
    let clientSecret: string | null = null;

    try {
      this.logger.log(`💳 Creating Stripe PaymentIntent: ${total.toNumber()} ${orderCurrency}`);

      const paymentIntent = await this.paymentService.createPaymentIntent(
        {
          amount: total.toNumber(),
          currency: orderCurrency,
          orderId: order.id,
        },
        userId
      );

      clientSecret = paymentIntent.clientSecret;

      this.logger.log(
        `✅ PaymentIntent created: ${paymentIntent.paymentIntentId} - ${total.toNumber()} ${orderCurrency} ` +
          `(rate: ${orderExchangeRate.toFixed(6)}, locked at: ${cart.rateLockedAt})`
      );
    } catch (paymentError) {
      this.logger.error('Error creating payment intent:', paymentError);
      // Don't fail the order creation if payment intent fails
      // Frontend can retry payment intent creation
    }

    // 11. 🔓 Clear cart after successful order creation (unlocks currency)
    await this.cartService.clearCart(cart.id);

    this.logger.log(`🔓 Cart ${cart.id} cleared after order creation`);

    // Return both order and payment client secret
    return {
      order,
      clientSecret,
    };
  }

  /**
   * Create new order from cart (LEGACY - kept for backwards compatibility)
   */
  async create(userId: string, createOrderDto: CreateOrderDto) {
    const {
      items,
      shippingAddressId,
      billingAddressId,
      paymentMethod,
      notes,
      currency: orderCurrency,
      idempotencyKey,
    } = createOrderDto;

    // 1. Check for duplicate order (idempotency protection)
    if (idempotencyKey) {
      const existingOrder = await this.prisma.order.findFirst({
        where: {
          userId,
          metadata: {
            path: ['idempotencyKey'],
            equals: idempotencyKey,
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

      if (existingOrder) {
        this.logger.warn(
          `🔄 Duplicate order prevented for user ${userId} with idempotency key: ${idempotencyKey}`
        );
        this.logger.log(`Returning existing order ${existingOrder.id}`);

        return {
          success: true,
          data: existingOrder,
          message: 'Order already exists (duplicate prevented)',
          isDuplicate: true,
        };
      }
    }

    // 2. Verify shipping address exists and belongs to user
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
    const podItems: any[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          variants: item.variantId
            ? {
                where: { id: item.variantId },
              }
            : false,
          store: true,
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
        throw new BadRequestException(`Insufficient inventory for ${product.name}`);
      }

      const itemTotal = new Decimal(item.price).mul(item.quantity);
      subtotal = subtotal.add(itemTotal);

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        name: product.name,
        sku: item.variantId ? product.variants[0]?.sku || product.slug : product.slug,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal,
        image: product.heroImage,
      });

      // Track POD items for Gelato shipping calculation
      if (product.fulfillmentType === 'GELATO_POD' && product.gelatoProductUid) {
        podItems.push({
          productUid: product.gelatoProductUid,
          quantity: item.quantity,
          storeId: product.storeId,
        });
      }
    }

    // Calculate shipping and tax using actual rates
    const taxCalc = await this.shippingTaxService.calculateTax(
      {
        country: shippingAddress?.country || 'US',
        state: shippingAddress?.province || undefined,
        postalCode: shippingAddress?.postalCode || undefined,
      },
      Number(subtotal)
    );

    // Get shipping options and use standard by default
    const shippingOptions = await this.shippingTaxService.calculateShippingOptions(
      {
        country: shippingAddress?.country || 'US',
        state: shippingAddress?.province || undefined,
        postalCode: shippingAddress?.postalCode || undefined,
      },
      orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      Number(subtotal)
    );

    const selectedShipping = shippingOptions[0]; // Default to standard shipping
    let shipping = new Decimal(selectedShipping?.price || 15);

    // Get real-time Gelato shipping for POD items
    if (podItems.length > 0) {
      try {
        // Group POD items by storeId to get accurate quotes per seller
        const storeGroups = new Map<string, any[]>();
        for (const podItem of podItems) {
          const storeId = podItem.storeId || 'platform';
          if (!storeGroups.has(storeId)) {
            storeGroups.set(storeId, []);
          }
          storeGroups.get(storeId)!.push({
            productUid: podItem.productUid,
            quantity: podItem.quantity,
          });
        }

        // Get Gelato quotes for each store group
        let totalGelatoShipping = new Decimal(0);
        let unconfiguredStores: string[] = [];

        for (const [storeId, items] of storeGroups) {
          const gelatoQuote = await this.gelatoOrdersService.getQuote({
            items,
            country: shippingAddress.country,
            state: shippingAddress.province,
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
            storeId: storeId !== 'platform' ? storeId : undefined,
          });

          // Handle null quote (seller hasn't configured Gelato)
          if (gelatoQuote === null) {
            unconfiguredStores.push(storeId);
            this.logger.warn(
              `⚠️ Store ${storeId} has POD items but no Gelato configuration. ` +
                `These items may not be fulfillable.`
            );
            continue; // Skip this store's shipping calculation
          }

          if (gelatoQuote?.shippingCost?.amount) {
            totalGelatoShipping = totalGelatoShipping.add(
              new Decimal(parseFloat(gelatoQuote.shippingCost.amount))
            );
          }
        }

        // Log warning if some stores are unconfigured
        if (unconfiguredStores.length > 0) {
          this.logger.warn(
            `⚠️ Order contains POD items from ${unconfiguredStores.length} unconfigured store(s): ${unconfiguredStores.join(', ')}. ` +
              `These items will be marked for manual fulfillment review.`
          );
        }

        if (totalGelatoShipping.gt(0)) {
          this.logger.log(`✅ Gelato shipping: $${totalGelatoShipping.toFixed(2)}`);
          shipping = shipping.add(totalGelatoShipping);
        }
      } catch (error) {
        this.logger.warn(
          `⚠️ Failed to fetch Gelato shipping quote: ${error.message}. Using default shipping.`
        );
        // Continue with standard shipping if Gelato quote fails
      }
    }

    const tax = new Decimal(taxCalc.amount);
    const total = subtotal.add(shipping).add(tax);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

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
          // Store idempotency key to prevent duplicate orders
          metadata: idempotencyKey ? { idempotencyKey } : null,
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
        this.logger.error(
          `Error recording inventory transaction for product ${item.productId}:`,
          invError
        );
        // Don't fail the order, just log the error
      }
    }

    // Send order confirmation email
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true },
      });

      if (user?.email) {
        const customerName =
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Customer';

        await this.emailService.sendOrderConfirmation(user.email, {
          orderNumber: order.orderNumber,
          customerName,
          items: orderItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: Number(item.price),
            image: item.image,
          })),
          subtotal: Number(subtotal),
          tax: Number(tax),
          shipping: Number(shipping),
          total: Number(total),
          currency,
          shippingAddress: {
            street: order.shippingAddress.address1,
            city: order.shippingAddress.city,
            state: order.shippingAddress.province || '',
            zipCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
          },
          orderId: order.id,
        });

        this.logger.log(`Order confirmation email queued for ${user.email}`);
      }
    } catch (emailError) {
      // Don't fail the order if email fails
      this.logger.error('Failed to send order confirmation email:', emailError);
    }

    // Send seller notifications for multi-vendor orders
    try {
      // Get full order with product and store details
      const fullOrder: any = await this.prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  store: {
                    select: {
                      id: true,
                      name: true,
                      userId: true,
                    },
                  },
                },
              },
            },
          },
          shippingAddress: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          commissions: {
            include: {
              store: true,
            },
          },
        },
      });

      if (fullOrder) {
        const customerName =
          `${fullOrder.user?.firstName || ''} ${fullOrder.user?.lastName || ''}`.trim() ||
          'Customer';

        // Group items by store and send notification to each seller
        const storeGroups = new Map<string, typeof fullOrder.items>();

        fullOrder.items.forEach((item) => {
          const storeId = item.product.store?.id;
          if (storeId) {
            if (!storeGroups.has(storeId)) {
              storeGroups.set(storeId, []);
            }
            storeGroups.get(storeId)!.push(item);
          }
        });

        // Send notification to each seller
        for (const [storeId, storeItems] of storeGroups.entries()) {
          const firstItem = storeItems[0];
          const store = firstItem.product.store;

          if (store && store.userId) {
            // Get seller information
            const seller = await this.prisma.user.findUnique({
              where: { id: store.userId },
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            });

            if (seller?.email) {
              // Calculate subtotal for this seller's items
              const sellerSubtotal = storeItems.reduce(
                (sum, item) => sum + Number(item.price) * item.quantity,
                0
              );

              // Find commission for this store
              const commission = fullOrder.commissions?.find((c: any) => c.storeId === storeId);
              const commissionAmount = commission ? Number(commission.commissionAmount) : 0;
              const commissionRate =
                sellerSubtotal > 0 ? (commissionAmount / sellerSubtotal) * 100 : 10;
              const netPayout = sellerSubtotal - commissionAmount;

              const sellerName =
                `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Seller';

              await this.emailService.sendSellerOrderNotification(seller.email, {
                sellerName,
                storeName: store.name,
                orderNumber: fullOrder.orderNumber,
                customerName,
                items: storeItems.map((item: any) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: Number(item.price),
                  image: item.image || undefined,
                  sku: item.sku,
                })),
                subtotal: sellerSubtotal,
                commission: commissionAmount,
                commissionRate,
                netPayout,
                currency: fullOrder.currency,
                shippingAddress: {
                  street: fullOrder.shippingAddress.address1,
                  city: fullOrder.shippingAddress.city,
                  state: fullOrder.shippingAddress.province || '',
                  zipCode: fullOrder.shippingAddress.postalCode,
                  country: fullOrder.shippingAddress.country,
                },
                orderId: fullOrder.id,
                sellerId: store.userId,
              });

              this.logger.log(
                `Seller notification sent to ${seller.email} for store ${store.name}`
              );
            }
          }
        }
      }
    } catch (sellerEmailError) {
      // Don't fail the order if seller email fails
      this.logger.error('Failed to send seller notification emails:', sellerEmailError);
    }

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

    // Validate status transition
    this.validateStatusTransition(order.status, status);

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

    // Auto-submit Gelato POD items when order moves to PROCESSING
    // This triggers after payment authorization (uncaptured) is confirmed
    // Payment will be captured later after delivery confirmation
    if (status === OrderStatus.PROCESSING) {
      // CRITICAL FIX: Validate POD readiness BEFORE allowing status change
      try {
        const validation = await this.gelatoOrdersService.validatePodReadiness(id);

        if (!validation.ready) {
          const unreadyProducts = validation.unreadyItems
            .map((item) => `"${item.productName}" (${item.reason})`)
            .join(', ');

          this.logger.error(
            `❌ Cannot move order ${id} to PROCESSING: ${validation.unreadyItems.length}/${validation.totalPodItems} POD items not ready for fulfillment: ${unreadyProducts}`
          );

          throw new BadRequestException(
            `Cannot process order: ${validation.unreadyItems.length} POD item(s) cannot be fulfilled. ` +
              `The following items require seller Gelato configuration: ${unreadyProducts}. ` +
              `Please contact the seller(s) to enable Print-on-Demand fulfillment.`
          );
        }

        // All POD items ready - proceed with submission
        const result = await this.gelatoOrdersService.submitAllPodItems(id);
        if (result.submitted > 0) {
          this.logger.log(
            `✅ Gelato POD items submitted for order ${id}: ${result.submitted}/${result.results.length} items`
          );
        } else if (result.results.length > 0) {
          this.logger.warn(
            `⚠️ No Gelato POD items submitted for order ${id} despite validation passing - this should not happen`
          );
        }
      } catch (gelatoError) {
        this.logger.error(`❌ Gelato POD submission failed for order ${id}:`, gelatoError.message);
        // Re-throw to prevent status change if POD submission fails
        throw new BadRequestException(
          `Cannot process order: POD fulfillment validation or submission failed. ${gelatoError.message}`
        );
      }
    }

    // TODO: Send status update email via queue

    return updatedOrder;
  }

  /**
   * Update order notes (Admin only)
   */
  async updateNotes(id: string, notes: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update order notes
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { notes },
    });

    return updatedOrder;
  }

  /**
   * Validate order status transition
   * Prevents invalid status changes and regressions
   * @private
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    // Same status is allowed (idempotent)
    if (currentStatus === newStatus) {
      return;
    }

    // Define valid transitions for each status
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [
        OrderStatus.PARTIALLY_SHIPPED,
        OrderStatus.SHIPPED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PARTIALLY_SHIPPED]: [
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED], // Can't cancel delivered orders
      [OrderStatus.CANCELLED]: [], // Terminal state - no transitions allowed
      [OrderStatus.REFUNDED]: [], // Terminal state - no transitions allowed
    };

    const allowedStatuses = validTransitions[currentStatus] || [];

    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: cannot change from ${currentStatus} to ${newStatus}. ` +
          `Allowed transitions: ${allowedStatuses.length > 0 ? allowedStatuses.join(', ') : 'none (terminal state)'}`
      );
    }

    this.logger.log(`Status transition validated: ${currentStatus} → ${newStatus}`);
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
   * Generate invoice HTML for an order
   */
  async generateInvoiceHtml(orderId: string, userId: string): Promise<string> {
    const order = await this.findOne(orderId, userId);

    const formatCurrency = (amount: number | Decimal) => {
      const num = typeof amount === 'number' ? amount : Number(amount);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: order.currency || 'USD',
      }).format(num);
    };

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const itemsHtml = order.items
      .map((item) => {
        // Extract variant info from options JSON or name
        const variantInfo = item.variant ? item.variant.name || item.variant.colorName || '' : '';

        return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${item.product?.images?.[0]?.url ? `<img src="${item.product.images[0].url}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` : ''}
            <div>
              <div style="font-weight: 500;">${item.name}</div>
              ${variantInfo ? `<div style="font-size: 12px; color: #666;">Variant: ${variantInfo}</div>` : ''}
            </div>
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(Number(item.price))}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: 500;">${formatCurrency(Number(item.price) * item.quantity)}</td>
      </tr>
    `;
      })
      .join('');

    const shippingAddr = order.shippingAddress;
    const billingAddr = order.billingAddress || order.shippingAddress;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${order.orderNumber} - NextPik</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #CBB57B;
          }
          .logo {
            height: 40px;
          }
          .logo img {
            height: 100%;
            width: auto;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h1 {
            font-size: 32px;
            color: #333;
            margin-bottom: 5px;
          }
          .invoice-number {
            color: #666;
            font-size: 14px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          .info-section h3 {
            font-size: 12px;
            text-transform: uppercase;
            color: #999;
            margin-bottom: 8px;
            letter-spacing: 1px;
          }
          .info-section p {
            font-size: 14px;
            margin-bottom: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background: #f8f8f8;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
            letter-spacing: 0.5px;
          }
          th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: center; }
          th:last-child { text-align: right; }
          .totals {
            display: flex;
            justify-content: flex-end;
          }
          .totals-table {
            width: 300px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e5e5;
          }
          .totals-row.total {
            border-bottom: none;
            border-top: 2px solid #333;
            margin-top: 8px;
            padding-top: 12px;
            font-size: 18px;
            font-weight: bold;
          }
          .totals-row.total .amount { color: #CBB57B; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
          }
          .status-pending { background: #FEF3C7; color: #92400E; }
          .status-confirmed { background: #DBEAFE; color: #1E40AF; }
          .status-processing { background: #E0E7FF; color: #3730A3; }
          .status-shipped { background: #CFFAFE; color: #0E7490; }
          .status-delivered { background: #D1FAE5; color: #065F46; }
          .status-cancelled { background: #FEE2E2; color: #991B1B; }
          .status-refunded { background: #F3E8FF; color: #6B21A8; }
          @media print {
            body { background: white; padding: 0; }
            .invoice-container { box-shadow: none; padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="logo">
              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODMwMiIgaGVpZ2h0PSIyMzUzIiB2aWV3Qm94PSIwIDAgODMwMiAyMzUzIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTI1MCAxOTcwLjAxSDk1MC4xOTVMNDEwLjE1NiAxMDQ4LjE0VjE5NzAuMDFIMTI5Ljg4M1Y1NjkuNjJINDI5LjY4OEw5NjkuNzI3IDE0OTIuNDdWNTY5LjYySDEyNTBWMTk3MC4wMVpNMTg4Mi44MSAxNzE0LjE1QzE4OTMuMjMgMTcxNy40MSAxOTAzLjY1IDE3MTkuNjkgMTkxNC4wNiAxNzIwLjk5QzE5MjQuNDggMTcyMS42NCAxOTM0LjkgMTcyMS45NiAxOTQ1LjMxIDE3MjEuOTZDMTk3MS4zNSAxNzIxLjk2IDE5OTYuNDIgMTcxOC4zOCAyMDIwLjUxIDE3MTEuMjJDMjA0NC42IDE3MDQuMDYgMjA2Ny4wNiAxNjkzLjk3IDIwODcuODkgMTY4MC45NUMyMTA5LjM4IDE2NjcuMjggMjEyOC4yNiAxNjUxIDIxNDQuNTMgMTYzMi4xMkMyMTYxLjQ2IDE2MTIuNTkgMjE3NS4xMyAxNTkxLjEgMjE4NS41NSAxNTY3LjY3TDIzODAuODYgMTc2My45NkMyMzU2LjEyIDE3OTkuMTEgMjMyNy40NyAxODMwLjY5IDIyOTQuOTIgMTg1OC42OEMyMjYzLjAyIDE4ODYuNjggMjIyOC4xOSAxOTEwLjQ0IDIxOTAuNDMgMTkyOS45N0MyMTUzLjMyIDE5NDkuNSAyMTEzLjkzIDE5NjQuMTUgMjA3Mi4yNyAxOTczLjkyQzIwMzEuMjUgMTk4NC4zMyAxOTg4LjkzIDE5ODkuNTQgMTk0NS4zMSAxOTg5LjU0QzE4NzEuNzQgMTk4OS41NCAxODAyLjQxIDE5NzUuODcgMTczNy4zIDE5NDguNTNDMTY3Mi44NSAxOTIxLjE4IDE2MTYuMjEgMTg4My4xIDE1NjcuMzggMTgzNC4yN0MxNTE5LjIxIDE3ODUuNDQgMTQ4MS4xMiAxNzI3LjUgMTQ1My4xMiAxNjYwLjQ0QzE0MjUuMTMgMTU5Mi43MyAxNDExLjEzIDE1MTguNTEgMTQxMS4xMyAxNDM3Ljc4QzE0MTEuMTMgMTM1NS4xIDE0MjUuMTMgMTI3OS41OCAxNDUzLjEyIDEyMTEuMjJDMTQ4MS4xMiAxMTQyLjg2IDE1MTkuMjEgMTA4NC41OSAxNTY3LjM4IDEwMzYuNDJDMTYxNi4yMSA5ODguMjQgMTY3Mi44NSA5NTAuODA1IDE3MzcuMyA5MjQuMTEyQzE4MDIuNDEgODk3LjQyIDE4NzEuNzQgODg0LjA3MyAxOTQ1LjMxIDg4NC4wNzNDMTk4OC45MyA4ODQuMDczIDIwMzEuNTggODg5LjI4MiAyMDczLjI0IDg5OS42OThDMjExNC45MSA5MTAuMTE1IDIxNTQuMyA5MjUuMDg5IDIxOTEuNDEgOTQ0LjYyQzIyMjkuMTcgOTY0LjE1MSAyMjY0LjMyIDk4OC4yNCAyMjk2Ljg4IDEwMTYuODlDMjMyOS40MyAxMDQ0Ljg4IDIzNTguMDcgMTA3Ni40NiAyMzgyLjgxIDExMTEuNjFMMTg4Mi44MSAxNzE0LjE1Wk0yMDE5LjUzIDExNjQuMzVDMjAwNy4xNiAxMTU5Ljc5IDE5OTQuNzkgMTE1Ni44NiAxOTgyLjQyIDExNTUuNTZDMTk3MC43IDExNTQuMjYgMTk1OC4zMyAxMTUzLjYgMTk0NS4zMSAxMTUzLjZDMTkwOC44NSAxMTUzLjYgMTg3NC4zNSAxMTYwLjQ0IDE4NDEuOCAxMTc0LjExQzE4MDkuOSAxMTg3LjEzIDE3ODEuOSAxMjA2LjAxIDE3NTcuODEgMTIzMC43NUMxNzM0LjM4IDEyNTUuNDkgMTcxNS44MiAxMjg1LjQ0IDE3MDIuMTUgMTMyMC42QzE2ODguNDggMTM1NS4xIDE2ODEuNjQgMTM5NC4xNiAxNjgxLjY0IDE0MzcuNzhDMTY4MS42NCAxNDQ3LjU1IDE2ODEuOTcgMTQ1OC42MiAxNjgyLjYyIDE0NzAuOTlDMTY4My45MiAxNDgzLjM2IDE2ODUuNTUgMTQ5Ni4wNSAxNjg3LjUgMTUwOS4wN0MxNjkwLjEgMTUyMS40NCAxNjkzLjAzIDE1MzMuNDkgMTY5Ni4yOSAxNTQ1LjIxQzE2OTkuNTQgMTU1Ni45MiAxNzAzLjc4IDE1NjcuMzQgMTcwOC45OCAxNTc2LjQ2TDIwMTkuNTMgMTE2NC4zNVpNMzQ3MC43IDE5NzAuMDFIMzE0NC41M0wyOTM2LjUyIDE2NDkuN0wyNzI2LjU2IDE5NzAuMDFIMjQwMC4zOUwyNzgyLjIzIDE0MzMuODhMMjQwMC4zOSA5MTguMjUzSDI3MjYuNTZMMjkzNi41MiAxMjE4LjA2TDMxNDQuNTMgOTE4LjI1M0gzNDcwLjdMMzA4Ny44OSAxNDMzLjg4TDM0NzAuNyAxOTcwLjAxWk00MDkwLjgyIDE5NzAuMDFDNDAyNi4zNyAxOTcwLjAxIDM5NjUuODIgMTk1Ny45NyAzOTA5LjE4IDE5MzMuODhDMzg1Mi41NCAxOTA5LjE0IDM4MDIuNzMgMTg3NS42MSAzNzU5Ljc3IDE4MzMuMjlDMzcxNy40NSAxNzkwLjMyIDM2ODMuOTIgMTc0MC41MiAzNjU5LjE4IDE2ODMuODhDMzYzNS4wOSAxNjI3LjI0IDM2MjMuMDUgMTU2Ni42OSAzNjIzLjA1IDE1MDIuMjRWMTE5MS42OUgzNDkzLjE2VjkyNi4wNjVIMzYyMy4wNVY1MDguMDk3SDM4ODguNjdWOTI2LjA2NUg0MjkyLjk3VjExOTEuNjlIMzg4OC42N1YxNTAyLjI0QzM4ODguNjcgMTUzMC4yMyAzODkzLjg4IDE1NTYuNiAzOTA0LjMgMTU4MS4zNEMzOTE0LjcxIDE2MDUuNDMgMzkyOS4wNCAxNjI2LjU5IDM5NDcuMjcgMTY0NC44MkMzOTY1LjQ5IDE2NjMuMDQgMzk4Ni45OCAxNjc3LjY5IDQwMTEuNzIgMTY4OC43NkM0MDM2LjQ2IDE2OTkuMTggNDA2Mi44MyAxNzA0LjM5IDQwOTAuODIgMTcwNC4zOUg0MjkyLjk3VjE5NzAuMDFINDA5MC44MlpNNDc1MS45NSA4NDkuODk0VjE0MTAuNDRINTAzMi4yM0M1MDcwLjY0IDE0MTAuNDQgNTEwNi43NyAxNDAzLjI4IDUxNDAuNjIgMTM4OC45NkM1MTc0LjQ4IDEzNzMuOTggNTIwNC4xIDEzNTMuOCA1MjI5LjQ5IDEzMjguNDFDNTI1NC44OCAxMzAzLjAyIDUyNzQuNzQgMTI3My40IDUyODkuMDYgMTIzOS41NEM1MzA0LjA0IDEyMDUuMDQgNTMxMS41MiAxMTY4LjU4IDUzMTEuNTIgMTEzMC4xN0M1MzExLjUyIDEwOTEuNzYgNTMwNC4wNCAxMDU1LjYyIDUyODkuMDYgMTAyMS43N0M1Mjc0Ljc0IDk4Ny4yNjMgNTI1NC44OCA5NTcuMzE1IDUyMjkuNDkgOTMxLjkyNUM1MjA0LjEgOTA2LjUzNCA1MTc0LjQ4IDg4Ni42NzcgNTE0MC42MiA4NzIuMzU0QzUxMDYuNzcgODU3LjM4MSA1MDcwLjY0IDg0OS44OTQgNTAzMi4yMyA4NDkuODk0SDQ3NTEuOTVaTTQ3NTEuOTUgMTk3MC4wMUg0NDcxLjY4VjU2OS42Mkg1MDMyLjIzQzUwODMuNjYgNTY5LjYyIDUxMzMuMTQgNTc2LjQ1NiA1MTgwLjY2IDU5MC4xMjhDNTIyOC4xOSA2MDMuMTQ5IDUyNzIuNDYgNjIyLjAyOSA1MzEzLjQ4IDY0Ni43NjlDNTM1NS4xNCA2NzAuODU3IDUzOTIuOSA3MDAuMTU0IDU0MjYuNzYgNzM0LjY1OUM1NDYxLjI2IDc2OC41MTMgNTQ5MC41NiA4MDYuMjc0IDU1MTQuNjUgODQ3Ljk0QzU1MzkuMzkgODg5LjYwNyA1NTU4LjI3IDkzNC4yMDMgNTU3MS4yOSA5ODEuNzI5QzU1ODQuOTYgMTAyOS4yNiA1NTkxLjggMTA3OC43MyA1NTkxLjggMTEzMC4xN0M1NTkxLjggMTIwNi45OSA1NTc3LjE1IDEyNzkuNTggNTU0Ny44NSAxMzQ3Ljk0QzU1MTguNTUgMTQxNS42NSA1NDc4LjUyIDE0NzQuODkgNTQyNy43MyAxNTI1LjY3QzUzNzYuOTUgMTU3Ni40NiA1MzE3LjM4IDE2MTYuNSA1MjQ5LjAyIDE2NDUuNzlDNTE4MS4zMiAxNjc1LjA5IDUxMDkuMDUgMTY4OS43NCA1MDMyLjIzIDE2ODkuNzRINDc1MS45NVYxOTcwLjAxWk02MDQyLjk3IDYzOS45MzNDNjA0Mi45NyA2NjQuNjcyIDYwMzguMDkgNjg3Ljc4NCA2MDI4LjMyIDcwOS4yNjlDNjAxOS4yMSA3MzAuNzUzIDYwMDYuNTEgNzQ5LjYzMyA1OTkwLjIzIDc2NS45MDlDNTk3My45NiA3ODEuNTM0IDU5NTQuNzUgNzk0LjIyOSA1OTMyLjYyIDgwMy45OTVDNTkxMS4xMyA4MTMuMTEgNTg4OC4wMiA4MTcuNjY3IDU4NjMuMjggODE3LjY2N0M1ODM4LjU0IDgxNy42NjcgNTgxNS4xIDgxMy4xMSA1NzkyLjk3IDgwMy45OTVDNTc3MS40OCA3OTQuMjI5IDU3NTIuNiA3ODEuNTM0IDU3MzYuMzMgNzY1LjkwOUM1NzIwLjcgNzQ5LjYzMyA1NzA4LjAxIDczMC43NTMgNTY5OC4yNCA3MDkuMjY5QzU2ODkuMTMgNjg3Ljc4NCA1Njg0LjU3IDY2NC42NzIgNTY4NC41NyA2MzkuOTMzQzU2ODQuNTcgNjE1Ljg0NCA1Njg5LjEzIDU5My4wNTggNTY5OC4yNCA1NzEuNTczQzU3MDguMDEgNTQ5LjQzOCA1NzIwLjcgNTMwLjU1OCA1NzM2LjMzIDUxNC45MzNDNTc1Mi42IDQ5OC42NTcgNTc3MS40OCA0ODUuOTYxIDU3OTIuOTcgNDc2Ljg0N0M1ODE1LjEgNDY3LjA4MSA1ODM4LjU0IDQ2Mi4xOTggNTg2My4yOCA0NjIuMTk4QzU4ODguMDIgNDYyLjE5OCA1OTExLjEzIDQ2Ny4wODEgNTkzMi42MiA0NzYuODQ3QzU5NTQuNzUgNDg1Ljk2MSA1OTczLjk2IDQ5OC42NTcgNTk5MC4yMyA1MTQuOTMzQzYwMDYuNTEgNTMwLjU1OCA2MDE5LjIxIDU0OS40MzggNjAyOC4zMiA1NzEuNTczQzYwMzguMDkgNTkzLjA1OCA2MDQyLjk3IDYxNS44NDQgNjA0Mi45NyA2MzkuOTMzWk01OTk3LjA3IDE5NzAuMDFINTcyOC41MlY5MjQuMTEySDU5OTcuMDdWMTk3MC4wMVoiIGZpbGw9ImJsYWNrIi8+CjxwYXRoIGQ9Ik03NTM2LjM1IDI1Ny41NDRMNzUxOC4zNiAxOTM4LjMzTDU4ODAuNjMgMzAwLjYwMUw3NTM2LjM1IDI1Ny41NDRaIiBmaWxsPSIjQ0JCNTdCIi8+CjxwYXRoIGQ9Ik02NDgyLjI4IDE5NjkuOTlINjIxMy43MlY1MDguMDc2SDY0ODIuMjhWMTQyOS45NUw2ODc5Ljc0IDkyNi4wNDRINzE4Ni4zOEw2ODM5LjcgMTM2MS41OUw3MTg2LjM4IDE5NjkuOTlINjg3OS43NEw2NjY3LjgyIDE1OTAuMTFMNjQ4Mi4yOCAxODM2LjJWMTk2OS45OVoiIGZpbGw9ImJsYWNrIi8+Cjwvc3ZnPgo=" alt="NextPik" />
            </div>
            <div class="invoice-title">
              <h1>INVOICE</h1>
              <div class="invoice-number">#${order.orderNumber}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-section">
              <h3>Invoice Date</h3>
              <p>${formatDate(order.createdAt)}</p>
              <p style="margin-top: 12px;"><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></p>
            </div>
            <div class="info-section">
              <h3>Shipping Address</h3>
              ${
                shippingAddr
                  ? `
                <p>${shippingAddr.firstName} ${shippingAddr.lastName}</p>
                <p>${shippingAddr.address1}</p>
                ${shippingAddr.address2 ? `<p>${shippingAddr.address2}</p>` : ''}
                <p>${shippingAddr.city}, ${shippingAddr.province} ${shippingAddr.postalCode}</p>
                <p>${shippingAddr.country}</p>
              `
                  : '<p>N/A</p>'
              }
            </div>
            <div class="info-section">
              <h3>Billing Address</h3>
              ${
                billingAddr
                  ? `
                <p>${billingAddr.firstName} ${billingAddr.lastName}</p>
                <p>${billingAddr.address1}</p>
                ${billingAddr.address2 ? `<p>${billingAddr.address2}</p>` : ''}
                <p>${billingAddr.city}, ${billingAddr.province} ${billingAddr.postalCode}</p>
                <p>${billingAddr.country}</p>
              `
                  : '<p>Same as shipping</p>'
              }
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-table">
              <div class="totals-row">
                <span>Subtotal</span>
                <span>${formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div class="totals-row">
                <span>Shipping</span>
                <span>${formatCurrency(Number(order.shipping))}</span>
              </div>
              <div class="totals-row">
                <span>Tax</span>
                <span>${formatCurrency(Number(order.tax))}</span>
              </div>
              ${
                order.discount && Number(order.discount) > 0
                  ? `
                <div class="totals-row">
                  <span>Discount</span>
                  <span>-${formatCurrency(Number(order.discount))}</span>
                </div>
              `
                  : ''
              }
              <div class="totals-row total">
                <span>Total</span>
                <span class="amount">${formatCurrency(Number(order.total))}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for shopping with NextPik!</p>
            <p style="margin-top: 8px;">For questions about this invoice, please contact support@nextpik.com</p>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="background: #000; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
            Print / Save as PDF
          </button>
        </div>
      </body>
      </html>
    `;
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

  /**
   * Calculate order totals before creating order (NEW - P0-002)
   * SAFE: Read-only operation, doesn't modify any data
   * Used by checkout to preview final price before order creation
   */
  async calculateOrderTotals(
    userId: string,
    dto: CalculateTotalsDto
  ): Promise<OrderCalculationResponse> {
    const warnings: string[] = [];

    try {
      // 1. Verify shipping address exists and belongs to user
      const address = await this.prisma.address.findFirst({
        where: {
          id: dto.shippingAddressId,
          userId,
        },
      });

      if (!address) {
        throw new BadRequestException('Invalid shipping address');
      }

      // 2. Verify item prices and calculate subtotal
      let subtotal = 0;
      const verifiedItems: any[] = [];

      for (const item of dto.items) {
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

        // Get actual price from database
        const actualPrice = item.variantId
          ? Number(product.variants[0]?.price || product.price)
          : Number(product.price);

        // Verify price matches (allow 1 cent difference for rounding)
        const priceDiff = Math.abs(actualPrice - item.price);
        if (priceDiff > 0.01) {
          warnings.push(
            `Price mismatch for ${product.name}: expected $${actualPrice}, got $${item.price}. Using database price.`
          );
          this.logger.warn(
            `Price mismatch for product ${product.id}: expected ${actualPrice}, got ${item.price}`
          );
        }

        // Use database price (source of truth)
        const verifiedPrice = actualPrice;
        const itemTotal = verifiedPrice * item.quantity;
        subtotal += itemTotal;

        verifiedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: verifiedPrice,
          total: itemTotal,
        });
      }

      // 3. Calculate shipping options
      const shippingOptions = await this.shippingTaxService.calculateShippingOptions(
        {
          country: address.country,
          state: address.province || undefined,
          postalCode: address.postalCode,
          city: address.city,
        },
        verifiedItems,
        subtotal
      );

      if (!shippingOptions || shippingOptions.length === 0) {
        throw new BadRequestException('No shipping options available for this address');
      }

      // 4. Select shipping method
      let selectedShipping = shippingOptions[0]; // Default to first option (standard)

      if (dto.shippingMethod) {
        const requestedShipping = shippingOptions.find((opt) => opt.id === dto.shippingMethod);

        if (requestedShipping) {
          selectedShipping = requestedShipping;
        } else {
          warnings.push(
            `Shipping method '${dto.shippingMethod}' not available. Using ${selectedShipping.name}.`
          );
        }
      }

      // 5. Calculate tax
      const taxCalc = await this.shippingTaxService.calculateTax(
        {
          country: address.country,
          state: address.province || undefined,
          postalCode: address.postalCode,
        },
        subtotal
      );

      // 6. Apply coupon discount (future feature - placeholder)
      const discount = 0;
      const couponDetails = null;

      if (dto.couponCode) {
        // TODO: Implement coupon validation
        // For now, just log that a coupon was provided
        this.logger.log(
          `Coupon code '${dto.couponCode}' provided but coupon system not yet implemented`
        );
        warnings.push('Coupon system not yet implemented. Coupon code will be ignored.');
      }

      // 7. Get currency and exchange rate
      const targetCurrency = dto.currency || 'USD';
      let exchangeRate = 1;

      // Convert from USD to target currency if needed
      if (targetCurrency !== 'USD') {
        try {
          const currencyRate = await this.currencyService.getRateByCode(targetCurrency);
          exchangeRate = Number(currencyRate.rate);
          this.logger.log(
            `💱 Converting prices from USD to ${targetCurrency} (rate: ${exchangeRate})`
          );
        } catch (error) {
          this.logger.error(`Failed to get exchange rate for ${targetCurrency}:`, error);
          warnings.push(`Could not get exchange rate for ${targetCurrency}. Using USD instead.`);
          // Fallback to USD if currency conversion fails
        }
      }

      // 8. Convert all prices to target currency
      const convertPrice = (usdPrice: number) => usdPrice * exchangeRate;

      const subtotalInTargetCurrency = convertPrice(subtotal);
      const shippingCost = selectedShipping.price;
      const shippingCostInTargetCurrency = convertPrice(shippingCost);
      const taxAmount = taxCalc.amount;
      const taxAmountInTargetCurrency = convertPrice(taxAmount);
      const discountInTargetCurrency = convertPrice(discount);
      const total =
        subtotalInTargetCurrency +
        shippingCostInTargetCurrency +
        taxAmountInTargetCurrency -
        discountInTargetCurrency;

      // 9. Return detailed calculation in target currency
      return {
        subtotal: Math.round(subtotalInTargetCurrency * 100) / 100,
        shipping: {
          method: selectedShipping.id,
          name: selectedShipping.name,
          price: Math.round(shippingCostInTargetCurrency * 100) / 100,
          estimatedDays: selectedShipping.estimatedDays,
          carrier: selectedShipping.carrier,
        },
        shippingOptions: shippingOptions.map((opt) => ({
          id: opt.id,
          name: opt.name,
          price: Math.round(convertPrice(opt.price) * 100) / 100,
          estimatedDays: opt.estimatedDays,
          carrier: opt.carrier,
        })),
        tax: {
          amount: Math.round(taxAmountInTargetCurrency * 100) / 100,
          rate: taxCalc.rate,
          jurisdiction: taxCalc.jurisdiction || 'N/A',
          breakdown: taxCalc.breakdown,
        },
        discount: Math.round(discountInTargetCurrency * 100) / 100,
        coupon: couponDetails,
        total: Math.round(total * 100) / 100,
        currency: targetCurrency,
        breakdown: {
          subtotal: Math.round(subtotalInTargetCurrency * 100) / 100,
          shipping: Math.round(shippingCostInTargetCurrency * 100) / 100,
          tax: Math.round(taxAmountInTargetCurrency * 100) / 100,
          discount: Math.round(-discountInTargetCurrency * 100) / 100,
          total: Math.round(total * 100) / 100,
        },
        ...(warnings.length > 0 && { warnings }),
      };
    } catch (error) {
      this.logger.error('Order total calculation failed:', error);
      throw error;
    }
  }

  /**
   * Generate invoice PDF for an order using PDFKit
   */
  async generateInvoicePdf(orderId: string, userId: string): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: { include: { store: true } },
            variant: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // === HEADER ===
      doc
        .fontSize(24)
        .fillColor('#CBB57B')
        .text('NEXTPIK', 50, 50)
        .fontSize(10)
        .fillColor('#666')
        .text('Luxury E-commerce Platform', 50, 80);

      doc
        .fontSize(20)
        .fillColor('#000')
        .text('INVOICE', 400, 50, { align: 'right' })
        .fontSize(10)
        .fillColor('#666')
        .text(`#${order.orderNumber}`, 400, 75, { align: 'right' })
        .text(
          new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          400,
          90,
          { align: 'right' }
        );

      // === STATUS BADGE ===
      const statusY = 110;
      doc
        .rect(400, statusY, 150, 25)
        .fillAndStroke(this.getStatusColor(order.status), '#ddd')
        .fillColor('#fff')
        .fontSize(12)
        .text(order.status, 400, statusY + 7, { align: 'center', width: 150 });

      // === ADDRESSES ===
      const addressY = 150;

      // Shipping Address
      doc
        .fillColor('#000')
        .fontSize(12)
        .text('Ship To:', 50, addressY)
        .fontSize(10)
        .fillColor('#666')
        .text(
          `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          50,
          addressY + 20
        )
        .text(order.shippingAddress.address1, 50, addressY + 35);

      if (order.shippingAddress.address2) {
        doc.text(order.shippingAddress.address2, 50, addressY + 50);
      }

      doc
        .text(
          `${order.shippingAddress.city}, ${order.shippingAddress.province} ${order.shippingAddress.postalCode}`,
          50,
          addressY + 65
        )
        .text(order.shippingAddress.country, 50, addressY + 80);

      // Billing Address (if different)
      if (order.billingAddress && order.billingAddressId !== order.shippingAddressId) {
        doc
          .fillColor('#000')
          .fontSize(12)
          .text('Bill To:', 300, addressY)
          .fontSize(10)
          .fillColor('#666')
          .text(
            `${order.billingAddress.firstName} ${order.billingAddress.lastName}`,
            300,
            addressY + 20
          )
          .text(order.billingAddress.address1, 300, addressY + 35);
      }

      // === ITEMS TABLE ===
      const tableTop = 280;
      const itemCodeX = 50;
      const descriptionX = 150;
      const quantityX = 350;
      const priceX = 420;
      const amountX = 490;

      // Table Header
      doc
        .fillColor('#CBB57B')
        .fontSize(10)
        .text('SKU', itemCodeX, tableTop)
        .text('Description', descriptionX, tableTop)
        .text('Qty', quantityX, tableTop)
        .text('Price', priceX, tableTop)
        .text('Amount', amountX, tableTop);

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke('#ddd');

      // Items
      let itemY = tableTop + 25;
      order.items.forEach((item) => {
        const itemName = item.name || item.product?.name || 'Product';
        const variantInfo = item.variant
          ? ` (${Object.entries((item.variant as any).attributes || {})
              .map(([k, v]) => v)
              .join(', ')})`
          : '';

        doc
          .fillColor('#000')
          .fontSize(9)
          .text(item.sku || 'N/A', itemCodeX, itemY, { width: 90 })
          .text(itemName + variantInfo, descriptionX, itemY, { width: 190 })
          .text(item.quantity.toString(), quantityX, itemY)
          .text(this.formatCurrency(Number(item.price), order.currency), priceX, itemY)
          .text(this.formatCurrency(Number(item.total), order.currency), amountX, itemY);

        itemY += 30;
      });

      // === TOTALS ===
      const totalsY = itemY + 20;
      const totalsX = 400;

      doc
        .moveTo(50, totalsY - 10)
        .lineTo(550, totalsY - 10)
        .stroke('#ddd');

      doc
        .fontSize(10)
        .fillColor('#666')
        .text('Subtotal:', totalsX, totalsY, { align: 'right', width: 100 })
        .text(this.formatCurrency(Number(order.subtotal), order.currency), totalsX + 110, totalsY);

      doc
        .text('Shipping:', totalsX, totalsY + 20, { align: 'right', width: 100 })
        .text(
          this.formatCurrency(Number(order.shipping), order.currency),
          totalsX + 110,
          totalsY + 20
        );

      doc
        .text('Tax:', totalsX, totalsY + 40, { align: 'right', width: 100 })
        .text(this.formatCurrency(Number(order.tax), order.currency), totalsX + 110, totalsY + 40);

      if (Number(order.discount) > 0) {
        doc
          .text('Discount:', totalsX, totalsY + 60, { align: 'right', width: 100 })
          .text(
            `-${this.formatCurrency(Number(order.discount), order.currency)}`,
            totalsX + 110,
            totalsY + 60
          );
      }

      doc
        .moveTo(totalsX, totalsY + 70)
        .lineTo(550, totalsY + 70)
        .stroke('#CBB57B');

      doc
        .fontSize(14)
        .fillColor('#CBB57B')
        .text('TOTAL:', totalsX, totalsY + 80, { align: 'right', width: 100 })
        .text(
          this.formatCurrency(Number(order.total), order.currency),
          totalsX + 110,
          totalsY + 80
        );

      // === FOOTER ===
      doc
        .fontSize(10)
        .fillColor('#666')
        .text('Thank you for your business!', 50, 700, {
          align: 'center',
          width: 500,
        })
        .fontSize(8)
        .text('For support: support@nextpik.com', 50, 720, {
          align: 'center',
          width: 500,
        });

      doc.end();
    });
  }

  /**
   * Helper method to format currency
   * @private
   */
  private formatCurrency(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(amount);
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  }

  /**
   * Helper method to get status color for PDF
   * @private
   */
  private getStatusColor(status: string): string {
    const colors = {
      PENDING: '#FFA500',
      CONFIRMED: '#4CAF50',
      PROCESSING: '#2196F3',
      SHIPPED: '#9C27B0',
      DELIVERED: '#4CAF50',
      CANCELLED: '#F44336',
      REFUNDED: '#FF9800',
    };
    return colors[status] || '#666';
  }
}
