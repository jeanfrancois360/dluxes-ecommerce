import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { OrdersService } from './orders.service';
import { CartService } from '../cart/cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { CalculateTotalsDto } from './dto/calculate-totals.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

/**
 * Orders Controller
 * Handles all order-related HTTP requests
 */
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly cartService: CartService,
  ) {}

  /**
   * Get user's orders with pagination
   * @route GET /orders
   */
  @Get()
  async findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;

      const result = await this.ordersService.findAllPaginated(req.user.userId, {
        page: pageNum,
        limit: limitNum,
        status,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Get order details
   * @route GET /orders/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    try {
      // Check if user is admin - admins can view any order
      const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
      const order = await this.ordersService.findOne(id, req.user.userId || req.user.id, isAdmin);

      // Transform data for frontend compatibility
      const data = {
        ...order,
        customer: order.user ? {
          id: order.user.id,
          name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || null,
          email: order.user.email,
        } : null,
        items: order.items?.map(item => ({
          ...item,
          image: item.product?.images?.[0]?.url || null,
        })),
        shippingAddress: order.shippingAddress ? {
          street: order.shippingAddress.address1,
          city: order.shippingAddress.city,
          state: order.shippingAddress.province,
          zipCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
        } : null,
      };

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Get order invoice as HTML (for printing/PDF)
   * @route GET /orders/:id/invoice
   */
  @Get(':id/invoice')
  @Header('Content-Type', 'text/html')
  async getInvoice(
    @Param('id') id: string,
    @Request() req,
    @Res() res: Response
  ) {
    try {
      const html = await this.ordersService.generateInvoiceHtml(id, req.user.userId || req.user.id);
      res.send(html);
    } catch (error) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Error</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>Invoice Not Found</h1>
            <p>${error instanceof Error ? error.message : 'An error occurred'}</p>
          </body>
        </html>
      `);
    }
  }

  /**
   * Calculate order totals before checkout (NEW - P0-002)
   * @route POST /orders/calculate-totals
   * SAFE: Read-only operation, doesn't create any records
   */
  @Post('calculate-totals')
  async calculateTotals(@Request() req, @Body() dto: CalculateTotalsDto) {
    try {
      const userId = req.user.userId || req.user.id;
      const calculation = await this.ordersService.calculateOrderTotals(userId, dto);

      return {
        success: true,
        data: calculation,
      };
    } catch (error) {
      this.ordersService['logger'].error('Failed to calculate order totals:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to calculate order totals',
      };
    }
  }

  /**
   * Create new order from cart
   * @route POST /orders
   */
  @Post()
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    try {
      const data = await this.ordersService.create(
        req.user.userId,
        createOrderDto
      );
      return {
        success: true,
        data,
        message: 'Order created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Update order status (Admin only)
   * @route PATCH /orders/:id/status
   */
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto
  ) {
    try {
      const data = await this.ordersService.updateStatus(
        id,
        updateOrderStatusDto.status
      );
      return {
        success: true,
        data,
        message: 'Order status updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Cancel order
   * @route POST /orders/:id/cancel
   */
  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @Request() req) {
    try {
      const data = await this.ordersService.cancel(id, req.user.userId);
      return {
        success: true,
        data,
        message: 'Order cancelled successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Track order
   * @route GET /orders/:id/track
   */
  @Get(':id/track')
  @HttpCode(HttpStatus.OK)
  async track(@Param('id') id: string) {
    try {
      const data = await this.ordersService.track(id);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }

  /**
   * Reorder - Add all items from a previous order to cart
   * @route POST /orders/:id/reorder
   */
  @Post(':id/reorder')
  async reorder(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.userId || req.user.id;
      const sessionId = req.headers['x-session-id'] || req.sessionID || `session-${userId}`;

      // Get the order
      const order = await this.ordersService.findOne(id, userId);

      // Get or create cart
      const cart = await this.cartService.getCart(sessionId, userId);

      // Track results
      const results = {
        added: [] as string[],
        skipped: [] as { name: string; reason: string }[],
      };

      // Add each item from the order to the cart
      for (const item of order.items) {
        try {
          await this.cartService.addItem(cart.id, {
            productId: item.productId,
            variantId: item.variantId || undefined,
            quantity: item.quantity,
          });
          results.added.push(item.name);
        } catch (error) {
          results.skipped.push({
            name: item.name,
            reason: error instanceof Error ? error.message : 'Failed to add item',
          });
        }
      }

      // Get updated cart
      const updatedCart = await this.cartService.getCart(sessionId, userId);

      return {
        success: true,
        data: {
          cart: updatedCart,
          results,
        },
        message: results.added.length > 0
          ? `Added ${results.added.length} item(s) to cart`
          : 'No items could be added to cart',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      };
    }
  }
}
