import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { CreatePartnerDto, UpdatePartnerDto } from './dto/partner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  /** Public — active partners for homepage */
  @Get('active')
  getActivePartners() {
    return this.partnersService.getActivePartners();
  }

  /** Admin — all partners */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getAllPartners() {
    return this.partnersService.getAllPartners();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  createPartner(@Body() dto: CreatePartnerDto) {
    return this.partnersService.createPartner(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updatePartner(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.partnersService.updatePartner(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  deletePartner(@Param('id') id: string) {
    return this.partnersService.deletePartner(id);
  }
}
