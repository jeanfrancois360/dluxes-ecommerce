import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryStatusDto } from './dto/update-inquiry-status.dto';
import { InquiryQueryDto } from './dto/inquiry-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  /**
   * Submit a new product inquiry (public - guests allowed)
   * No auth guard - anyone can submit an inquiry
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateInquiryDto, @Req() req: any) {
    // Get user ID if logged in (from optional JWT)
    const userId = req.user?.id || req.user?.userId;
    return this.inquiriesService.create(dto, userId);
  }

  /**
   * Get all inquiries for the current seller
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('seller')
  async getSellerInquiries(@Req() req: any, @Query() query: InquiryQueryDto) {
    const sellerId = req.user.id || req.user.userId;
    return this.inquiriesService.getSellerInquiries(sellerId, query);
  }

  /**
   * Get inquiry statistics for the current seller
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('seller/stats')
  async getSellerStats(@Req() req: any) {
    const sellerId = req.user.id || req.user.userId;
    return this.inquiriesService.getSellerStats(sellerId);
  }

  /**
   * Get buyer's own inquiries
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-inquiries')
  async getMyInquiries(@Req() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.inquiriesService.getBuyerInquiries(userId);
  }

  /**
   * Get a single inquiry by ID (seller only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id')
  async getInquiry(@Param('id') id: string, @Req() req: any) {
    const sellerId = req.user.id || req.user.userId;
    return this.inquiriesService.getById(id, sellerId);
  }

  /**
   * Update inquiry status (seller only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInquiryStatusDto,
    @Req() req: any,
  ) {
    const sellerId = req.user.id || req.user.userId;
    return this.inquiriesService.updateStatus(id, sellerId, dto);
  }
}
