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
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
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
