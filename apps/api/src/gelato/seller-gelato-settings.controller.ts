import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SellerGelatoSettingsService } from './seller-gelato-settings.service';
import { UpdateGelatoSettingsDto, TestGelatoConnectionDto } from './dto';

/**
 * Seller Gelato Settings Controller
 *
 * API endpoints for sellers to manage their Gelato Print-on-Demand integration.
 * Allows sellers to connect their own Gelato accounts instead of using platform account.
 */
@Controller('seller/gelato')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class SellerGelatoSettingsController {
  constructor(private readonly settingsService: SellerGelatoSettingsService) {}

  /**
   * GET /seller/gelato
   * Get seller's current Gelato settings (with masked credentials)
   */
  @Get()
  async getSettings(@Req() req: any) {
    const settings = await this.settingsService.getSettings(req.user.id);
    return { success: true, data: settings };
  }

  /**
   * POST /seller/gelato
   * Create or update seller's Gelato settings
   * Tests connection before saving
   */
  @Post()
  async upsertSettings(@Req() req: any, @Body() dto: UpdateGelatoSettingsDto) {
    const settings = await this.settingsService.upsertSettings(req.user.id, dto);
    return {
      success: true,
      data: settings,
      message: 'Gelato settings saved and verified successfully',
    };
  }

  /**
   * POST /seller/gelato/test
   * Test Gelato API connection without saving
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testConnection(@Body() dto: TestGelatoConnectionDto) {
    const result = await this.settingsService.testConnection({
      apiKey: dto.apiKey,
      storeId: dto.storeId,
    });

    return {
      success: result.success,
      data: result,
      message: result.success
        ? 'Connection test successful'
        : `Connection test failed: ${result.error}`,
    };
  }

  /**
   * PATCH /seller/gelato/toggle
   * Enable or disable Gelato integration
   */
  @Patch('toggle')
  async toggleEnabled(@Req() req: any, @Body() body: { enabled: boolean }) {
    const settings = await this.settingsService.toggleEnabled(req.user.id, body.enabled);

    return {
      success: true,
      data: settings,
      message: `Gelato integration ${body.enabled ? 'enabled' : 'disabled'} successfully`,
    };
  }

  /**
   * DELETE /seller/gelato
   * Delete seller's Gelato settings
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteSettings(@Req() req: any) {
    await this.settingsService.deleteSettings(req.user.id);

    return {
      success: true,
      message: 'Gelato settings deleted successfully',
    };
  }

  /**
   * GET /seller/gelato/webhook-url
   * Get seller-specific webhook URL for Gelato dashboard
   */
  @Get('webhook-url')
  async getWebhookUrl(@Req() req: any) {
    const settings = await this.settingsService.getSettings(req.user.id);

    return {
      success: true,
      data: {
        webhookUrl: settings.webhookUrl,
        instructions: [
          'Copy the webhook URL above',
          'Go to Gelato Dashboard → Developer → Webhooks',
          'Create a new webhook with your URL',
          'Select events: order_status_updated, order_item_tracking_code_updated',
          'Save your webhook secret in the settings above',
        ],
      },
    };
  }
}
