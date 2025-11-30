import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CurrencyService } from './currency.service';
import {
  CreateCurrencyRateDto,
  UpdateCurrencyRateDto,
  ConvertCurrencyDto,
} from './dto/currency.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  /**
   * Get all active currency rates (Public)
   * @route GET /currency/rates
   */
  @Get('rates')
  async getAllRates() {
    try {
      const rates = await this.currencyService.getAllRates();
      return {
        success: true,
        data: rates.map(rate => ({
          ...rate,
          rate: Number(rate.rate),
        })),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get a specific currency rate (Public)
   * @route GET /currency/rates/:code
   */
  @Get('rates/:code')
  async getRate(@Param('code') code: string) {
    try {
      const rate = await this.currencyService.getRateByCode(code);
      return {
        success: true,
        data: {
          ...rate,
          rate: Number(rate.rate),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Convert amount between currencies (Public)
   * @route GET /currency/convert?amount=100&from=USD&to=EUR
   */
  @Get('convert')
  async convert(@Query() query: ConvertCurrencyDto) {
    try {
      const convertedAmount = await this.currencyService.convertAmount(
        query.amount,
        query.fromCurrency,
        query.toCurrency
      );

      return {
        success: true,
        data: {
          amount: query.amount,
          fromCurrency: query.fromCurrency,
          toCurrency: query.toCurrency,
          convertedAmount,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get all currencies including inactive (Admin only)
   * @route GET /currency/admin/all
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllCurrenciesAdmin() {
    try {
      const rates = await this.currencyService.getAllCurrenciesAdmin();
      return {
        success: true,
        data: rates.map(rate => ({
          ...rate,
          rate: Number(rate.rate),
        })),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Create a new currency rate (Admin only)
   * @route POST /currency/admin/rates
   */
  @Post('admin/rates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createRate(@Body() dto: CreateCurrencyRateDto, @Request() req) {
    try {
      const rate = await this.currencyService.createRate(dto, req.user?.id);
      return {
        success: true,
        data: {
          ...rate,
          rate: Number(rate.rate),
        },
        message: 'Currency rate created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Update a currency rate (Admin only)
   * @route PATCH /currency/admin/rates/:code
   */
  @Patch('admin/rates/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateRate(
    @Param('code') code: string,
    @Body() dto: UpdateCurrencyRateDto,
    @Request() req
  ) {
    try {
      const rate = await this.currencyService.updateRate(code, dto, req.user?.id);
      return {
        success: true,
        data: {
          ...rate,
          rate: Number(rate.rate),
        },
        message: 'Currency rate updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Toggle currency active status (Admin only)
   * @route PATCH /currency/admin/rates/:code/toggle
   */
  @Patch('admin/rates/:code/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async toggleActive(@Param('code') code: string) {
    try {
      const rate = await this.currencyService.toggleActive(code);
      return {
        success: true,
        data: {
          ...rate,
          rate: Number(rate.rate),
        },
        message: `Currency ${rate.isActive ? 'activated' : 'deactivated'} successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Delete a currency rate (Admin only)
   * @route DELETE /currency/admin/rates/:code
   */
  @Delete('admin/rates/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteRate(@Param('code') code: string) {
    try {
      await this.currencyService.deleteRate(code);
      return {
        success: true,
        message: 'Currency rate deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }
}
