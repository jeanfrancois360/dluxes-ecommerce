import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HotDealsService } from './hot-deals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CreateHotDealDto } from './dto/create-hot-deal.dto';
import { RespondToDealDto } from './dto/respond-to-deal.dto';
import { HotDealQueryDto } from './dto/hot-deal-query.dto';

/**
 * Hot Deals Controller
 * Emergency Services Marketplace - $1 per post
 */
@Controller('hot-deals')
export class HotDealsController {
  constructor(private readonly hotDealsService: HotDealsService) {}

  /**
   * Create a new hot deal (requires authentication)
   * @route POST /hot-deals
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: any, @Body() dto: CreateHotDealDto) {
    try {
      const deal = await this.hotDealsService.create(req.user.id, dto);
      return {
        success: true,
        data: deal,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create hot deal',
      };
    }
  }

  /**
   * Get all active hot deals with filters
   * @route GET /hot-deals
   */
  @Get()
  async findAll(@Query() query: HotDealQueryDto) {
    try {
      const data = await this.hotDealsService.findAll(query);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch hot deals',
      };
    }
  }

  /**
   * Get category statistics for filters
   * @route GET /hot-deals/categories/stats
   */
  @Get('categories/stats')
  async getCategoryStats() {
    try {
      const data = await this.hotDealsService.getCategoryStats();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch category stats',
      };
    }
  }

  /**
   * Get user's own hot deals
   * @route GET /hot-deals/my-deals
   */
  @Get('my-deals')
  @UseGuards(JwtAuthGuard)
  async getMyDeals(@Req() req: any) {
    try {
      const deals = await this.hotDealsService.getMyDeals(req.user.id);
      return {
        success: true,
        data: deals,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch your deals',
      };
    }
  }

  /**
   * Get a single hot deal by ID
   * @route GET /hot-deals/:id
   */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() req: any) {
    try {
      const deal = await this.hotDealsService.findOne(id, req.user?.id);
      return {
        success: true,
        data: deal,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch hot deal',
      };
    }
  }

  /**
   * Respond to a hot deal
   * @route POST /hot-deals/:id/respond
   */
  @Post(':id/respond')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async respond(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: RespondToDealDto,
  ) {
    try {
      const response = await this.hotDealsService.respondToDeal(
        id,
        req.user.id,
        dto,
      );
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to respond to hot deal',
      };
    }
  }

  /**
   * Confirm payment and activate hot deal
   * @route POST /hot-deals/:id/confirm-payment
   */
  @Post(':id/confirm-payment')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirmPayment(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { paymentIntentId: string },
  ) {
    try {
      const deal = await this.hotDealsService.confirmPayment(
        id,
        req.user.id,
        body.paymentIntentId,
      );
      return {
        success: true,
        data: deal,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to confirm payment',
      };
    }
  }

  /**
   * Mark hot deal as fulfilled
   * @route PATCH /hot-deals/:id/fulfill
   */
  @Patch(':id/fulfill')
  @UseGuards(JwtAuthGuard)
  async markFulfilled(@Param('id') id: string, @Req() req: any) {
    try {
      const deal = await this.hotDealsService.markAsFulfilled(id, req.user.id);
      return {
        success: true,
        data: deal,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark as fulfilled',
      };
    }
  }

  /**
   * Cancel a hot deal
   * @route PATCH /hot-deals/:id/cancel
   */
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(@Param('id') id: string, @Req() req: any) {
    try {
      const deal = await this.hotDealsService.cancel(id, req.user.id);
      return {
        success: true,
        data: deal,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel hot deal',
      };
    }
  }
}
