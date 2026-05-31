import { Controller, Get, Param, UseGuards, Request, Redirect } from '@nestjs/common';
import { DownloadsService } from './downloads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Downloads Controller
 * Handles digital product downloads for buyers.
 *
 * Route ordering matters — static prefixes (secure, order) MUST come before
 * the catch-all :orderId/:productId param route.
 */
@Controller('downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  /**
   * Get all digital purchases for current user
   * @route GET /downloads
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyDownloads(@Request() req) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.downloadsService.getMyDownloads(userId);

      return {
        success: true,
        data: data.map((item) => ({
          ...item,
          digitalFileSize: item.digitalFileSize ? item.digitalFileSize.toString() : null,
        })),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Validate a signed download token and redirect to the actual file.
   * No auth guard — the token itself is the proof of purchase.
   * Token valid for 1 hour. Returns 302 → actual Supabase file URL.
   *
   * MUST be declared before :orderId/:productId to avoid param collision.
   * @route GET /downloads/secure/:token
   */
  @Get('secure/:token')
  @Redirect()
  async secureDownload(@Param('token') token: string) {
    try {
      const fileUrl = await this.downloadsService.redeemDownloadToken(token);
      return { url: fileUrl, statusCode: 302 };
    } catch {
      return { url: '/account/downloads?error=expired', statusCode: 302 };
    }
  }

  /**
   * Get digital products from a specific order
   * MUST be declared before :orderId/:productId to avoid param collision.
   * @route GET /downloads/order/:orderId
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getOrderDigitalProducts(@Request() req, @Param('orderId') orderId: string) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.downloadsService.getOrderDigitalProducts(userId, orderId);

      return {
        success: true,
        data: data.map((item) => ({
          ...item,
          digitalFileSize: item.digitalFileSize ? item.digitalFileSize.toString() : null,
        })),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Issue a signed download token for a specific purchase.
   * Validates ownership, enforces download limits, records the download event,
   * and returns a short-lived /downloads/secure/:token URL instead of the raw file URL.
   *
   * @route GET /downloads/:orderId/:productId
   */
  @Get(':orderId/:productId')
  @UseGuards(JwtAuthGuard)
  async getDownloadUrl(
    @Request() req,
    @Param('orderId') orderId: string,
    @Param('productId') productId: string
  ) {
    try {
      const userId = req.user.userId || req.user.id;
      const ipAddress = req.ip || req.connection?.remoteAddress;
      const data = await this.downloadsService.getDownloadUrl(
        userId,
        orderId,
        productId,
        ipAddress
      );

      return {
        success: true,
        data: {
          ...data,
          fileSize: data.fileSize ? data.fileSize.toString() : null,
          // Keep legacy `url` alias so existing frontend still works
          url: data.downloadUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }
}
