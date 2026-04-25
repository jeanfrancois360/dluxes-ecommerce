import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SendcloudService, SendcloudGetRatesRequest } from './sendcloud.service';

@Controller('sendcloud')
export class SendcloudController {
  constructor(private readonly sendcloudService: SendcloudService) {}

  /**
   * Get shipping rates from Sendcloud
   * Accessible to all authenticated users
   */
  @Post('rates')
  @UseGuards(JwtAuthGuard)
  async getRates(@Body() request: SendcloudGetRatesRequest) {
    return this.sendcloudService.getRates(request);
  }

  /**
   * Get Sendcloud health status
   * Public endpoint - no authentication required (safe for admin UI)
   */
  @Get('health')
  async getHealth() {
    return this.sendcloudService.getHealthStatus();
  }
}
