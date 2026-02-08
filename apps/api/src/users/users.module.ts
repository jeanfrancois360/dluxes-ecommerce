import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AddressController } from './address.controller';
import { PrismaService } from '../database/prisma.service';
import { UploadModule } from '../upload/upload.module';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    UploadModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max for avatars
      },
    }),
  ],
  providers: [UsersService, PrismaService],
  controllers: [UsersController, AddressController],
  exports: [UsersService],
})
export class UsersModule {}
