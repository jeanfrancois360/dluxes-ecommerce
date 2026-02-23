import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GelatoService } from './gelato.service';
import { GelatoProductsService } from './gelato-products.service';
import { GelatoOrdersService } from './gelato-orders.service';
import {
  CreatePodProductDto,
  UpdatePodProductDto,
  SubmitPodOrderDto,
  CancelPodOrderDto,
} from './dto';
import { GelatoPodStatus } from '@prisma/client';

@Controller('gelato')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GelatoController {
  constructor(
    private readonly gelatoService: GelatoService,
    private readonly productsService: GelatoProductsService,
    private readonly ordersService: GelatoOrdersService
  ) {}

  // ---- STATUS ----

  @Get('status')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStatus() {
    return this.gelatoService.getStatus();
  }

  // ---- CATALOG ----

  @Get('catalog/categories')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  async getCategories() {
    const categories = await this.productsService.getCategories();
    return { success: true, data: { categories } };
  }

  @Get('catalog/products')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  async getCatalogProducts(
    @Req() req: any,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const userId = req.user?.id;
    const result = await this.productsService.getCatalog(
      {
        category,
        search,
        limit: limit ? parseInt(limit, 10) : 20,
        offset: offset ? parseInt(offset, 10) : 0,
      },
      userId
    );
    return { success: true, data: result };
  }

  @Get('catalog/products/:productUid')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  async getCatalogProductDetails(@Req() req: any, @Param('productUid') productUid: string) {
    const userId = req.user?.id;
    const product = await this.productsService.getProductDetails(productUid, userId);
    return { success: true, data: product };
  }

  // ---- PRODUCT POD CONFIGURATION ----

  @Post('products/:productId/configure')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  async configurePodProduct(
    @Param('productId') productId: string,
    @Body() dto: CreatePodProductDto
  ) {
    const product = await this.productsService.configurePodProduct(productId, dto);
    return { success: true, data: product };
  }

  @Patch('products/:productId/configure')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  async updatePodProduct(@Param('productId') productId: string, @Body() dto: UpdatePodProductDto) {
    const product = await this.productsService.updatePodProduct(productId, dto);
    return { success: true, data: product };
  }

  @Delete('products/:productId/configure')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  async removePodConfiguration(@Param('productId') productId: string) {
    const product = await this.productsService.removePodConfiguration(productId);
    return { success: true, data: product };
  }

  @Get('products/:productId/shipping')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  async getShippingEstimate(
    @Param('productId') productId: string,
    @Query('quantity') quantity: string,
    @Query('country') country: string,
    @Query('state') state?: string
  ) {
    const methods = await this.productsService.getShippingEstimate(productId, {
      quantity: parseInt(quantity, 10) || 1,
      country,
      state,
    });
    return { success: true, data: { shippingMethods: methods } };
  }

  // ---- POD ORDER MANAGEMENT ----

  @Get('orders')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getPodOrders(
    @Query('status') status?: GelatoPodStatus,
    @Query('orderId') orderId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const result = await this.ordersService.getPodOrders({
      status,
      orderId,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    return { success: true, data: result };
  }

  @Get('orders/:podOrderId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getPodOrder(@Param('podOrderId') podOrderId: string) {
    const order = await this.ordersService.getPodOrder(podOrderId);
    return { success: true, data: order };
  }

  @Post('orders/submit')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async submitPodOrder(@Body() dto: SubmitPodOrderDto) {
    const result = await this.ordersService.submitOrderToGelato(
      dto.orderId,
      dto.orderItemId,
      dto.shippingMethod
    );
    return { success: true, data: result };
  }

  @Post('orders/:orderId/submit-all')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async submitAllPodItems(@Param('orderId') orderId: string) {
    const result = await this.ordersService.submitAllPodItems(orderId);
    return { success: true, data: result };
  }

  @Post('orders/:podOrderId/cancel')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async cancelPodOrder(@Param('podOrderId') podOrderId: string, @Body() dto: CancelPodOrderDto) {
    const order = await this.ordersService.cancelPodOrder(podOrderId, dto.reason);
    return { success: true, data: order };
  }

  @Post('orders/:podOrderId/sync')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncOrderStatus(@Param('podOrderId') podOrderId: string) {
    const order = await this.ordersService.syncOrderStatus(podOrderId);
    return { success: true, data: order };
  }
}
