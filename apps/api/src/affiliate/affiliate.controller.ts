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
  Request,
  HttpCode,
  HttpStatus,
  Redirect,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';
import { AffiliateService } from './affiliate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateAdvertiserDto,
  UpdateAdvertiserDto,
  ListAdvertisersQueryDto,
  CreateAffiliateProductDto,
  UpdateAffiliateProductDto,
  ListProductsQueryDto,
  AdminListProductsQueryDto,
  CreateTranslationDto,
  UpdateTranslationDto,
  RecordClickDto,
  SyncCommissionDto,
  ListCommissionsQueryDto,
  ClickAnalyticsQueryDto,
} from './dto/affiliate.dto';

/**
 * Affiliate Controller (Phase C.3)
 * Public endpoints: list/get products, record clicks
 * Admin endpoints: full CRUD on advertisers, products, translations, commissions
 */
@Controller('affiliate')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  // ============================================================================
  // PUBLIC ENDPOINTS
  // ============================================================================

  /**
   * GET /affiliate/products
   * List active affiliate products (public)
   */
  @Get('products')
  async listProducts(@Query() query: ListProductsQueryDto) {
    const result = await this.affiliateService.listProducts(query);
    return { success: true, ...result };
  }

  /**
   * GET /affiliate/products/:slug
   * Get a single active product by slug (public)
   */
  @Get('products/:slug')
  async getProductBySlug(@Param('slug') slug: string, @Query('locale') locale?: string) {
    const product = await this.affiliateService.getProductBySlug(slug, locale);
    return { success: true, data: product };
  }

  /**
   * POST /affiliate/products/:id/click
   * Log click then 302 redirect to Awin deep link (public).
   * Rate-limited: 30 requests/minute/IP.
   * Click log write is the critical path; counter increment is best-effort.
   */
  @Post('products/:id/click')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Redirect()
  async logClick(@Param('id') id: string, @Body() dto: RecordClickDto, @Req() req: ExpressRequest) {
    const result = await this.affiliateService.logClick(id, {
      locale: dto.locale,
      referrer: dto.referrer ?? req.get('referer'),
      userId: (req as any).user?.id,
      sessionId: (req as any).session?.id ?? (req.headers['x-session-id'] as string | undefined),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    return { url: result.deepLink, statusCode: 302 };
  }

  // ============================================================================
  // ADMIN — ADVERTISERS
  // ============================================================================

  /**
   * POST /affiliate/admin/advertisers
   * Create a new Awin advertiser (ADMIN)
   */
  @Post('admin/advertisers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createAdvertiser(@Body() dto: CreateAdvertiserDto) {
    const advertiser = await this.affiliateService.createAdvertiser(dto);
    return { success: true, data: advertiser };
  }

  /**
   * GET /affiliate/admin/advertisers
   * List all advertisers with filters (ADMIN)
   */
  @Get('admin/advertisers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listAdvertisers(@Query() query: ListAdvertisersQueryDto) {
    const result = await this.affiliateService.listAdvertisers(query);
    return { success: true, ...result };
  }

  /**
   * GET /affiliate/admin/advertisers/:id
   * Get advertiser by ID (ADMIN)
   */
  @Get('admin/advertisers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAdvertiser(@Param('id') id: string) {
    const advertiser = await this.affiliateService.getAdvertiser(id);
    return { success: true, data: advertiser };
  }

  /**
   * PATCH /affiliate/admin/advertisers/:id
   * Update advertiser (ADMIN)
   */
  @Patch('admin/advertisers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateAdvertiser(@Param('id') id: string, @Body() dto: UpdateAdvertiserDto) {
    const advertiser = await this.affiliateService.updateAdvertiser(id, dto);
    return { success: true, data: advertiser };
  }

  /**
   * DELETE /affiliate/admin/advertisers/:id
   * Soft-delete advertiser (ADMIN)
   */
  @Delete('admin/advertisers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async deleteAdvertiser(@Param('id') id: string) {
    await this.affiliateService.deleteAdvertiser(id);
    return { success: true, message: 'Advertiser deleted' };
  }

  // ============================================================================
  // ADMIN — PRODUCTS
  // ============================================================================

  /**
   * POST /affiliate/admin/products
   * Create an affiliate product (ADMIN)
   */
  @Post('admin/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createProduct(@Body() dto: CreateAffiliateProductDto, @Request() req: any) {
    const product = await this.affiliateService.createProduct(dto, req.user.id);
    return { success: true, data: product };
  }

  /**
   * GET /affiliate/admin/products
   * List all products including inactive (ADMIN)
   */
  @Get('admin/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminListProducts(@Query() query: AdminListProductsQueryDto) {
    const result = await this.affiliateService.adminListProducts(query);
    return { success: true, ...result };
  }

  /**
   * GET /affiliate/admin/products/:id
   * Get product by ID (ADMIN)
   */
  @Get('admin/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getProductById(@Param('id') id: string) {
    const product = await this.affiliateService.getProductById(id);
    return { success: true, data: product };
  }

  /**
   * PATCH /affiliate/admin/products/:id
   * Update affiliate product (ADMIN)
   */
  @Patch('admin/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateAffiliateProductDto) {
    const product = await this.affiliateService.updateProduct(id, dto);
    return { success: true, data: product };
  }

  /**
   * DELETE /affiliate/admin/products/:id
   * Soft-delete affiliate product (ADMIN)
   */
  @Delete('admin/products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async deleteProduct(@Param('id') id: string) {
    await this.affiliateService.deleteProduct(id);
    return { success: true, message: 'Product deleted' };
  }

  // ============================================================================
  // ADMIN — TRANSLATIONS
  // ============================================================================

  /**
   * POST /affiliate/admin/products/:id/translations
   * Upsert a translation for a product (ADMIN)
   */
  @Post('admin/products/:id/translations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async upsertTranslation(
    @Param('id') id: string,
    @Body() dto: CreateTranslationDto,
    @Request() req: any
  ) {
    const translation = await this.affiliateService.upsertTranslation(id, dto, req.user.id);
    return { success: true, data: translation };
  }

  /**
   * PATCH /affiliate/admin/products/:id/translations/:locale
   * Update an existing translation (ADMIN)
   */
  @Patch('admin/products/:id/translations/:locale')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateTranslation(
    @Param('id') id: string,
    @Param('locale') locale: string,
    @Body() dto: UpdateTranslationDto,
    @Request() req: any
  ) {
    const translation = await this.affiliateService.updateTranslation(id, locale, dto, req.user.id);
    return { success: true, data: translation };
  }

  /**
   * GET /affiliate/admin/products/:id/translations
   * List all translations for a product (ADMIN)
   */
  @Get('admin/products/:id/translations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listTranslations(@Param('id') id: string) {
    const translations = await this.affiliateService.listTranslations(id);
    return { success: true, data: translations };
  }

  // ============================================================================
  // ADMIN — COMMISSIONS
  // ============================================================================

  /**
   * POST /affiliate/admin/commissions/sync
   * Sync a single Awin commission (ADMIN or webhook)
   */
  @Post('admin/commissions/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async syncCommission(@Body() dto: SyncCommissionDto) {
    const commission = await this.affiliateService.syncCommission(dto);
    return { success: true, data: commission };
  }

  /**
   * POST /affiliate/admin/commissions/sync/batch
   * Batch sync Awin commissions (ADMIN)
   */
  @Post('admin/commissions/sync/batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async batchSyncCommissions(@Body() body: { commissions: SyncCommissionDto[] }) {
    const result = await this.affiliateService.batchSyncCommissions(body.commissions);
    return { success: true, data: result };
  }

  /**
   * GET /affiliate/admin/commissions
   * List commissions with filters (ADMIN)
   */
  @Get('admin/commissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listCommissions(@Query() query: ListCommissionsQueryDto) {
    const result = await this.affiliateService.listCommissions(query);
    return { success: true, ...result };
  }

  /**
   * GET /affiliate/admin/commissions/stats
   * Commission statistics (ADMIN)
   */
  @Get('admin/commissions/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getCommissionStats(@Query('advertiserId') advertiserId?: string) {
    const stats = await this.affiliateService.getCommissionStats(advertiserId);
    return { success: true, data: stats };
  }

  // ============================================================================
  // ADMIN — CLICK ANALYTICS
  // ============================================================================

  /**
   * GET /affiliate/admin/clicks
   * Click log analytics (ADMIN)
   */
  @Get('admin/clicks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listClickLogs(@Query() query: ClickAnalyticsQueryDto) {
    const result = await this.affiliateService.listClickLogs(query);
    return { success: true, ...result };
  }
}
