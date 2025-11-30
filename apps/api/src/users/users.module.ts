import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AddressController } from './address.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  providers: [UsersService, PrismaService],
  controllers: [UsersController, AddressController],
  exports: [UsersService],
})
export class UsersModule {}
