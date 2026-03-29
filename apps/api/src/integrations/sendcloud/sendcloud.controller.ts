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
   * Get Sendcloud health status (admin only)
   */
  @Get('health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getHealth() {
    return this.sendcloudService.getHealthStatus();
  }
}
