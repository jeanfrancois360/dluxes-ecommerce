import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { EasyshipService, EasyshipGetRatesRequest } from './easyship.service';

@Controller('easyship')
export class EasyshipController {
  constructor(private readonly easyshipService: EasyshipService) {}

  /**
   * Get shipping rates from Easyship
   * Accessible to all authenticated users
   */
  @Post('rates')
  @UseGuards(JwtAuthGuard)
  async getRates(@Body() request: EasyshipGetRatesRequest) {
    return this.easyshipService.getRates(request);
  }

  /**
   * Get Easyship health status
   * Public endpoint - no authentication required (safe for admin UI)
   */
  @Get('health')
  async getHealth() {
    return this.easyshipService.getHealthStatus();
  }
}
