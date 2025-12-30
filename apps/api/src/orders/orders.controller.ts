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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

/**
 * Orders Controller
 * Handles all order-related HTTP requests
 */
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
      const data = await this.ordersService.findOne(id, req.user.userId || req.user.id);
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
}
