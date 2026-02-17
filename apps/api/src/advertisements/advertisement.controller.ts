import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdvertisementService } from './advertisement.service';
import {
  CreateAdvertisementDto,
  UpdateAdvertisementDto,
  ApproveAdvertisementDto,
  RecordAdEventDto,
} from './dto/advertisement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, AdEventType } from '@prisma/client';

@Controller('advertisements')
export class AdvertisementController {
  constructor(private readonly adService: AdvertisementService) {}

  /**
   * Get all advertisements (Admin only)
   * GET /advertisements
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findAll(
    @Query('status') status?: string,
    @Query('placement') placement?: string,
    @Query('advertiserId') advertiserId?: string
  ) {
    const data = await this.adService.findAll({ status: status as any, placement, advertiserId });
    return { success: true, data };
  }

  /**
   * Get active advertisements (Public)
   * GET /advertisements/active
   */
  @Get('active')
  async findActive(@Query('placement') placement?: string) {
    const data = await this.adService.findActive(placement);
    return { success: true, data };
  }

  /**
   * Get pending advertisements (Admin only)
   * GET /advertisements/pending
   */
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getPending() {
    const data = await this.adService.getPendingAds();
    return { success: true, data };
  }

  /**
   * Get my advertisements
   * GET /advertisements/my
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyAds(@Request() req: any) {
    const userId = req.user.userId || req.user.id;
    const data = await this.adService.findAll({ advertiserId: userId });
    return { success: true, data };
  }

  /**
   * Get single advertisement
   * GET /advertisements/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.adService.findOne(id);
    return { success: true, data };
  }

  /**
   * Get advertisement analytics
   * GET /advertisements/:id/analytics
   */
  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard)
  async getAnalytics(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const data = await this.adService.getAnalytics(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return { success: true, data };
  }

  /**
   * Create advertisement
   * POST /advertisements
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateAdvertisementDto, @Request() req: any) {
    const userId = req.user.userId || req.user.id;
    const data = await this.adService.create(dto, userId);
    return { success: true, data, message: 'Advertisement created and pending approval' };
  }

  /**
   * Update advertisement
   * PUT /advertisements/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateAdvertisementDto, @Request() req: any) {
    const userId = req.user.userId || req.user.id;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    const data = await this.adService.update(id, dto, userId, isAdmin);
    return { success: true, data };
  }

  /**
   * Approve/Reject advertisement (Admin only)
   * PATCH /advertisements/:id/approve
   */
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async approve(@Param('id') id: string, @Body() dto: ApproveAdvertisementDto) {
    const data = await this.adService.approve(id, dto);
    return { success: true, data };
  }

  /**
   * Toggle advertisement active status (Admin only)
   * PATCH /advertisements/:id/toggle
   */
  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async toggleActive(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    const data = await this.adService.toggleActive(id, body.isActive);
    return { success: true, data };
  }

  /**
   * Record ad event (impression, click, conversion)
   * POST /advertisements/:id/event
   */
  @Post(':id/event')
  async recordEvent(@Param('id') id: string, @Body() dto: RecordAdEventDto, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id;
    const data = await this.adService.recordEvent(
      id,
      dto.eventType as AdEventType,
      userId,
      dto.page
    );
    return { success: true, data };
  }

  /**
   * Delete advertisement
   * DELETE /advertisements/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId || req.user.id;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    const data = await this.adService.delete(id, userId, isAdmin);
    return { success: true, ...data };
  }
}
