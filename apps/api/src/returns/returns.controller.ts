import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReturnsService, CreateReturnRequestDto } from './returns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Returns Controller
 * Handles return and refund requests for buyers
 */
@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  /**
   * Get all return requests for current user
   * @route GET /returns
   */
  @Get()
  async getMyReturns(@Request() req) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.returnsService.getMyReturns(userId);

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get a single return request by ID
   * @route GET /returns/:id
   */
  @Get(':id')
  async getReturnById(@Request() req, @Param('id') id: string) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.returnsService.getReturnById(userId, id);

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Check if an order is eligible for return
   * @route GET /returns/can-return/:orderId
   */
  @Get('can-return/:orderId')
  async canRequestReturn(@Request() req, @Param('orderId') orderId: string) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.returnsService.canRequestReturn(userId, orderId);

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Create a new return request
   * @route POST /returns
   */
  @Post()
  async createReturnRequest(@Request() req, @Body() body: CreateReturnRequestDto) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.returnsService.createReturnRequest(userId, body);

      return {
        success: true,
        data,
        message: 'Return request submitted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Cancel a return request
   * @route PATCH /returns/:id/cancel
   */
  @Patch(':id/cancel')
  async cancelReturnRequest(@Request() req, @Param('id') id: string) {
    try {
      const userId = req.user.userId || req.user.id;
      const data = await this.returnsService.cancelReturnRequest(userId, id);

      return {
        success: true,
        data,
        message: 'Return request cancelled successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }
}
