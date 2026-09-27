import { Controller, Post, Get, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

class SubscribeDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email: string;

  @IsOptional()
  @IsString()
  source?: string;
}

class UnsubscribeDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email: string;
}

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  /**
   * Subscribe to newsletter (public — no auth required)
   * POST /newsletter/subscribe
   */
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(@Body() dto: SubscribeDto, @Req() req: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const result = await this.newsletterService.subscribe(
      dto.email,
      dto.source || 'homepage',
      ipAddress
    );
    return { success: true, data: result };
  }

  /**
   * Unsubscribe from newsletter (public)
   * POST /newsletter/unsubscribe
   */
  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribe(@Body() dto: UnsubscribeDto) {
    const result = await this.newsletterService.unsubscribe(dto.email);
    return { success: true, data: result };
  }

  /**
   * Get newsletter statistics (admin only)
   * GET /newsletter/stats
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStats() {
    const data = await this.newsletterService.getStats();
    return { success: true, data };
  }
}
