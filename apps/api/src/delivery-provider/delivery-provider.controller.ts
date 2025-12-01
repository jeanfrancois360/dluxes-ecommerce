import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { DeliveryProviderService } from './delivery-provider.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DeliveryProviderType, ProviderVerificationStatus } from '@prisma/client';

@Controller('delivery-providers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveryProviderController {
  constructor(private readonly deliveryProviderService: DeliveryProviderService) {}

  /**
   * Create a new delivery provider (Admin only)
   */
  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createProvider(
    @Body()
    body: {
      name: string;
      slug: string;
      type: DeliveryProviderType;
      description?: string;
      contactEmail: string;
      contactPhone?: string;
      website?: string;
      apiEnabled?: boolean;
      apiKey?: string;
      apiSecret?: string;
      apiEndpoint?: string;
      webhookUrl?: string;
      countries: string[];
      commissionType?: 'PERCENTAGE' | 'FIXED';
      commissionRate?: number;
      logo?: string;
      coverImage?: string;
    }
  ) {
    return this.deliveryProviderService.createProvider(body);
  }

  /**
   * Get all delivery providers (Admin only)
   */
  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllProviders(
    @Query('type') type?: DeliveryProviderType,
    @Query('isActive') isActive?: string,
    @Query('verificationStatus') verificationStatus?: ProviderVerificationStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.deliveryProviderService.getAllProviders({
      type,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      verificationStatus,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * Get active providers (for assignment dropdown)
   */
  @Get('active')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SELLER')
  async getActiveProviders() {
    const result = await this.deliveryProviderService.getAllProviders({
      isActive: true,
      verificationStatus: 'VERIFIED',
      limit: 100,
    });

    return result.data.map((provider) => ({
      id: provider.id,
      name: provider.name,
      type: provider.type,
      countries: provider.countries,
      commissionRate: provider.commissionRate,
    }));
  }

  /**
   * Get provider by ID
   */
  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getProviderById(@Param('id') id: string) {
    return this.deliveryProviderService.getProviderById(id);
  }

  /**
   * Get provider statistics
   */
  @Get(':id/statistics')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getProviderStatistics(@Param('id') id: string) {
    return this.deliveryProviderService.getProviderStatistics(id);
  }

  /**
   * Update delivery provider
   */
  @Put(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateProvider(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      type: DeliveryProviderType;
      description: string;
      contactEmail: string;
      contactPhone: string;
      website: string;
      apiEnabled: boolean;
      apiKey: string;
      apiSecret: string;
      apiEndpoint: string;
      webhookUrl: string;
      countries: string[];
      commissionType: 'PERCENTAGE' | 'FIXED';
      commissionRate: number;
      isActive: boolean;
      logo: string;
      coverImage: string;
    }>
  ) {
    return this.deliveryProviderService.updateProvider(id, body);
  }

  /**
   * Delete delivery provider
   */
  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProvider(@Param('id') id: string) {
    return this.deliveryProviderService.deleteProvider(id);
  }

  /**
   * Verify delivery provider
   */
  @Post(':id/verify')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async verifyProvider(@Param('id') id: string, @Request() req) {
    const adminId = req.user.userId;
    return this.deliveryProviderService.verifyProvider(id, adminId);
  }

  /**
   * Update verification status (Suspend/Reject)
   */
  @Put(':id/verification-status')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateVerificationStatus(
    @Param('id') id: string,
    @Body('status') status: ProviderVerificationStatus,
    @Request() req
  ) {
    const adminId = req.user.userId;
    return this.deliveryProviderService.updateVerificationStatus(id, status, adminId);
  }

  /**
   * Toggle active status
   */
  @Put(':id/toggle-active')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async toggleActiveStatus(@Param('id') id: string) {
    return this.deliveryProviderService.toggleActiveStatus(id);
  }

  /**
   * Assign delivery partner to provider
   */
  @Post(':id/assign-partner')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async assignDeliveryPartner(
    @Param('id') providerId: string,
    @Body('userId') userId: string
  ) {
    return this.deliveryProviderService.assignDeliveryPartner(providerId, userId);
  }

  /**
   * Remove delivery partner from provider
   */
  @Delete('partners/:userId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async removeDeliveryPartner(@Param('userId') userId: string) {
    return this.deliveryProviderService.removeDeliveryPartner(userId);
  }
}
