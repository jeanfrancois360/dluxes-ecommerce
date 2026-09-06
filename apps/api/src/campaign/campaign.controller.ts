import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, UpdateCampaignDto, ScheduleCampaignDto } from './dto/campaign.dto';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  create(@Body() dto: CreateCampaignDto, @Request() req: any) {
    return this.campaignService.create(dto, req.user.id);
  }

  @Get()
  findAll() {
    return this.campaignService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.campaignService.delete(id);
  }

  /** Get estimated recipient count for an audience */
  @Get('audience/:audience/count')
  getRecipientCount(@Param('audience') audience: any) {
    return this.campaignService.getRecipientCount(audience).then((count) => ({ count }));
  }

  /** Send campaign immediately */
  @Post(':id/send')
  sendNow(@Param('id') id: string) {
    return this.campaignService.sendNow(id);
  }

  /** Schedule campaign for a future date */
  @Patch(':id/schedule')
  schedule(@Param('id') id: string, @Body() dto: ScheduleCampaignDto) {
    return this.campaignService.schedule(id, dto);
  }

  /** Cancel a scheduled campaign (reverts to DRAFT) */
  @Patch(':id/cancel-schedule')
  cancelSchedule(@Param('id') id: string) {
    return this.campaignService.cancelSchedule(id);
  }
}
