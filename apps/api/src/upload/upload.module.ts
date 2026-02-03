import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    SupabaseModule,
    MulterModule.register({
      storage: memoryStorage(), // Use memory storage for file.buffer
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
