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
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdatePayoutSettingsDto } from './dto/update-payout-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('stores')
export class StoresController {
  constructor(private storesService: StoresService) {}

  // ============================================================================
  // Public Routes
  // ============================================================================

  /**
   * Get all active stores (public)
   */
  @Get()
  findAll(@Query() query: any) {
    return this.storesService.findAll(query);
  }

  /**
   * Get store by slug (public)
   */
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.storesService.getBySlug(slug);
  }

  /**
   * Get store reviews (aggregated from product reviews)
   */
  @Get(':storeId/reviews')
  getStoreReviews(
    @Param('storeId') storeId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.storesService.getStoreReviews(
      storeId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  // ============================================================================
  // Seller Routes (Authenticated)
  // ============================================================================

  /**
   * Create a new store (Seller only - becomes seller after creation)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: any, @Body() dto: CreateStoreDto) {
    return this.storesService.create(req.user.id, dto);
  }

  /**
   * Get seller's own store
   */
  @Get('me/store')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getMyStore(@Req() req: any) {
    return this.storesService.getMyStore(req.user.id);
  }

  /**
   * Update seller's store
   */
  @Patch('me/store')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  update(@Req() req: any, @Body() dto: UpdateStoreDto) {
    return this.storesService.update(req.user.id, dto);
  }

  /**
   * Get seller's store analytics
   */
  @Get('me/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getAnalytics(@Req() req: any) {
    return this.storesService.getAnalytics(req.user.id);
  }

  /**
   * Delete/deactivate seller's store
   */
  @Delete('me/store')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  delete(@Req() req: any) {
    return this.storesService.delete(req.user.id);
  }

  /**
   * Upload store logo
   */
  @Post('me/store/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('logo'))
  @HttpCode(HttpStatus.OK)
  uploadLogo(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.storesService.uploadLogo(req.user.id, file);
  }

  /**
   * Upload store banner
   */
  @Post('me/store/banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('banner'))
  @HttpCode(HttpStatus.OK)
  uploadBanner(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.storesService.uploadBanner(req.user.id, file);
  }

  /**
   * Get seller's payout settings
   */
  @Get('me/payout-settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getPayoutSettings(@Req() req: any) {
    return this.storesService.getPayoutSettings(req.user.id);
  }

  /**
   * Update seller's payout settings
   */
  @Patch('me/payout-settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updatePayoutSettings(@Req() req: any, @Body() dto: UpdatePayoutSettingsDto) {
    return this.storesService.updatePayoutSettings(req.user.id, dto);
  }

  /**
   * Get seller's payout history
   */
  @Get('me/payouts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getPayoutHistory(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.storesService.getPayoutHistory(
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }

  // ============================================================================
  // Admin Routes
  // ============================================================================

  /**
   * Get all stores with admin filters
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  adminFindAll(@Query() query: any) {
    return this.storesService.adminFindAll(query);
  }

  /**
   * Update store status (approve/reject/suspend)
   */
  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateStoreStatus(
    @Param('id') id: string,
    @Body() dto: { status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' },
  ) {
    return this.storesService.updateStoreStatus(id, dto.status);
  }
}
