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
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { PaymentService } from '../payment/payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateSettingDto, UpdateSettingDto, RollbackSettingDto } from './dto/settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
  ) {}

  // ============================================================================
  // Public Endpoints
  // ============================================================================

  /**
   * Get public settings (accessible by frontend)
   * @route GET /settings/public
   */
  @Get('public')
  async getPublicSettings() {
    try {
      const data = await this.settingsService.getPublicSettings();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get inventory settings (public for frontend use)
   * @route GET /settings/inventory
   */
  @Get('inventory/all')
  async getInventorySettings() {
    try {
      const data = await this.settingsService.getInventorySettings();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get Stripe publishable key (public for frontend Stripe initialization)
   * @route GET /settings/stripe/publishable-key
   */
  @Get('stripe/publishable-key')
  async getStripePublishableKey() {
    try {
      const data = await this.settingsService.getStripePublishableKey();
      return {
        success: true,
        data: {
          publishableKey: data,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Check if Stripe is configured (public for frontend checks)
   * @route GET /settings/stripe/configured
   */
  @Get('stripe/configured')
  async isStripeConfigured() {
    try {
      const data = await this.settingsService.isStripeConfigured();
      return {
        success: true,
        data: {
          configured: data,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  // ============================================================================
  // Admin Endpoints
  // ============================================================================

  /**
   * Get all settings
   * @route GET /settings
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllSettings() {
    try {
      const data = await this.settingsService.getAllSettings();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get settings by category
   * @route GET /settings/category/:category
   */
  @Get('category/:category')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getSettingsByCategory(@Param('category') category: string) {
    try {
      const data = await this.settingsService.getSettingsByCategory(category);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get all audit logs
   * @route GET /settings/admin/audit-logs
   * IMPORTANT: Must come BEFORE :key route
   */
  @Get('admin/audit-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllAuditLogs(@Query('limit') limit?: string) {
    try {
      const data = await this.settingsService.getAllAuditLogs(
        limit ? parseInt(limit) : undefined
      );
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get Stripe configuration status (Admin only - includes sensitive info status)
   * @route GET /settings/stripe/status
   * IMPORTANT: Must come BEFORE :key route
   */
  @Get('stripe/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStripeStatus() {
    try {
      const data = await this.paymentService.getStripeStatus();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get audit log for a setting
   * @route GET /settings/:key/audit
   * IMPORTANT: Must come BEFORE generic :key route
   */
  @Get(':key/audit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getSettingAuditLog(
    @Param('key') key: string,
    @Query('limit') limit?: string
  ) {
    try {
      const data = await this.settingsService.getSettingAuditLog(
        key,
        limit ? parseInt(limit) : undefined
      );
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  // ============================================================================
  // Authenticated Endpoints
  // ============================================================================

  /**
   * Get setting by key
   * @route GET /settings/:key
   * IMPORTANT: This MUST come AFTER all specific routes to avoid catching them
   */
  @Get(':key')
  @UseGuards(JwtAuthGuard)
  async getSetting(@Param('key') key: string) {
    try {
      const data = await this.settingsService.getSetting(key);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Create new setting
   * @route POST /settings
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createSetting(@Body() dto: CreateSettingDto, @Req() req: any) {
    try {
      const data = await this.settingsService.createSetting({
        ...dto,
        createdBy: req.user.id,
      });
      return {
        success: true,
        data,
        message: 'Setting created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Update setting
   * @route PATCH /settings/:key
   */
  @Patch(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @Req() req: any
  ) {
    // Log request details for debugging
    console.log('Update setting request:', {
      key,
      value: dto.value,
      user: req.user,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const data = await this.settingsService.updateSetting(
      key,
      dto.value,
      req.user.id || 'unknown',
      req.user.email || 'unknown@test.com',
      req.ip,
      req.headers['user-agent'],
      dto.reason
    );
    return {
      success: true,
      data,
      message: 'Setting updated successfully',
    };
  }

  /**
   * Rollback setting to previous value
   * @route POST /settings/rollback
   */
  @Post('rollback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async rollbackSetting(@Body() dto: RollbackSettingDto, @Req() req: any) {
    try {
      const data = await this.settingsService.rollbackSetting(
        dto.auditLogId,
        req.user.id,
        req.user.email
      );
      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Reload Stripe configuration without restarting the application
   * @route POST /settings/stripe/reload
   */
  @Post('stripe/reload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async reloadStripeConfig() {
    try {
      await this.paymentService.reloadStripeConfig();
      const status = await this.paymentService.getStripeStatus();
      return {
        success: true,
        message: 'Stripe configuration reloaded successfully',
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Delete setting
   * @route DELETE /settings/:key
   */
  @Delete(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteSetting(@Param('key') key: string, @Req() req: any) {
    try {
      const data = await this.settingsService.deleteSetting(
        key,
        req.user.id,
        req.user.email
      );
      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }
}
