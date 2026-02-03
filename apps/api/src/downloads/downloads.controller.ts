import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DownloadsService } from './downloads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Downloads Controller
 * Handles digital product downloads for buyers
 */
@Controller('downloads')
@UseGuards(JwtAuthGuard)
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  /**
   * Get all digital purchases for current user
   * @route GET /downloads
   */
  @Get()
  async getMyDownloads(@Request() req) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.downloadsService.getMyDownloads(userId);

      // Convert BigInt to string for JSON serialization
      const serializedData = data.map(item => ({
        ...item,
        digitalFileSize: item.digitalFileSize ? item.digitalFileSize.toString() : null,
      }));

      return {
        success: true,
        data: serializedData,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get download URL for a specific purchase
   * @route GET /downloads/:orderId/:productId
   */
  @Get(':orderId/:productId')
  async getDownloadUrl(
    @Request() req,
    @Param('orderId') orderId: string,
    @Param('productId') productId: string
  ) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.downloadsService.getDownloadUrl(userId, orderId, productId);

      return {
        success: true,
        data: {
          ...data,
          fileSize: data.fileSize ? data.fileSize.toString() : null,
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
   * Get digital products from a specific order
   * @route GET /downloads/order/:orderId
   */
  @Get('order/:orderId')
  async getOrderDigitalProducts(
    @Request() req,
    @Param('orderId') orderId: string
  ) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.downloadsService.getOrderDigitalProducts(userId, orderId);

      // Convert BigInt to string for JSON serialization
      const serializedData = data.map(item => ({
        ...item,
        digitalFileSize: item.digitalFileSize ? item.digitalFileSize.toString() : null,
      }));

      return {
        success: true,
        data: serializedData,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }
}
