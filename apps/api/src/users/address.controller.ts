import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../database/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all addresses for the authenticated user
   */
  @Get()
  async getAddresses(@Request() req: any) {
    return this.prisma.address.findMany({
      where: { userId: req.user.userId || req.user.id },
      orderBy: { isDefault: 'desc' },
    });
  }

  /**
   * Get a single address by ID
   */
  @Get(':id')
  async getAddress(@Request() req: any, @Param('id') id: string) {
    return this.prisma.address.findFirst({
      where: { id, userId: req.user.userId || req.user.id },
    });
  }

  /**
   * Create a new address
   */
  @Post()
  async createAddress(
    @Request() req: any,
    @Body() body: CreateAddressDto,
  ) {
    const userId = req.user.userId || req.user.id;

    // If this is the first address or marked as default, update other addresses
    if (body.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Check if this is the first address
    const existingCount = await this.prisma.address.count({
      where: { userId },
    });

    return this.prisma.address.create({
      data: {
        userId,
        firstName: body.firstName,
        lastName: body.lastName,
        address1: body.address1,
        address2: body.address2 || '',
        city: body.city,
        province: body.province || null, // Optional - null if not provided
        postalCode: body.postalCode || null, // Optional - null if not provided
        country: body.country,
        phone: body.phone || '',
        isDefault: body.isDefault || existingCount === 0, // First address is default
      },
    });
  }

  /**
   * Update an existing address
   */
  @Put(':id')
  async updateAddress(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: UpdateAddressDto,
  ) {
    const userId = req.user.userId || req.user.id;

    // Verify ownership
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    // If marking as default, update other addresses
    if (body.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id },
      data: body,
    });
  }

  /**
   * Delete an address
   */
  @Delete(':id')
  async deleteAddress(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.userId || req.user.id;

    // Verify ownership
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    await this.prisma.address.delete({
      where: { id },
    });

    // If this was the default, make another one default
    if (address.isDefault) {
      const nextAddress = await this.prisma.address.findFirst({
        where: { userId },
      });

      if (nextAddress) {
        await this.prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true, message: 'Address deleted' };
  }

  /**
   * Set an address as default
   */
  @Post(':id/default')
  async setDefault(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.userId || req.user.id;

    // Verify ownership
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    // Remove default from other addresses
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set this as default
    return this.prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}
