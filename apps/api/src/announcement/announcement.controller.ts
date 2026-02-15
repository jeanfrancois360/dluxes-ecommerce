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
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, AnnouncementType } from '@prisma/client';
import { AnnouncementService } from './announcement.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  ReorderAnnouncementsDto,
} from './dto/create-announcement.dto';

@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  // ============================================================================
  // Public Endpoints
  // ============================================================================

  /**
   * Get active announcements for top bar display
   * Public endpoint - no authentication required
   */
  @Get('active')
  async getActiveAnnouncements() {
    return this.announcementService.getActiveAnnouncements();
  }

  // ============================================================================
  // Admin Endpoints
  // ============================================================================

  /**
   * Get all announcements (with filters)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllAnnouncements(
    @Query('isActive') isActive?: string,
    @Query('type') type?: AnnouncementType
  ) {
    return this.announcementService.getAllAnnouncements({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      type,
    });
  }

  /**
   * Get single announcement by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAnnouncementById(@Param('id') id: string) {
    return this.announcementService.getAnnouncementById(id);
  }

  /**
   * Create new announcement
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createAnnouncement(@Body() dto: CreateAnnouncementDto, @Request() req: any) {
    return this.announcementService.createAnnouncement({
      ...dto,
      createdBy: req.user.id,
    });
  }

  /**
   * Update announcement
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @Request() req: any
  ) {
    return this.announcementService.updateAnnouncement(id, {
      ...dto,
      updatedBy: req.user.id,
    });
  }

  /**
   * Delete announcement
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteAnnouncement(@Param('id') id: string) {
    return this.announcementService.deleteAnnouncement(id);
  }

  /**
   * Reorder announcements (bulk update display order)
   */
  @Post('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async reorderAnnouncements(@Body() dto: ReorderAnnouncementsDto) {
    return this.announcementService.reorderAnnouncements(dto.announcementIds);
  }
}
