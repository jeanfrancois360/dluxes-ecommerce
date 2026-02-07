import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

/**
 * Upload Controller
 * Handles file upload HTTP requests
 */
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUYER, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload single image
   * @route POST /upload/image
   */
  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Query('folder') folder?: string) {
    try {
      const data = await this.uploadService.uploadImage(file, folder || 'images');
      return {
        success: true,
        data,
        message: 'Image uploaded successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Upload multiple images
   * @route POST /upload/images
   */
  @Post('images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 files
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string
  ) {
    try {
      const data = await this.uploadService.uploadImages(files, folder || 'images');
      return {
        success: true,
        data,
        message: 'Images uploaded successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Upload image with optimization
   * @route POST /upload/optimized
   */
  @Post('optimized')
  @UseInterceptors(FileInterceptor('image'))
  async uploadOptimized(
    @UploadedFile() file: Express.Multer.File,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string
  ) {
    try {
      const data = await this.uploadService.uploadImageWithOptimization(
        file,
        entityType || 'products',
        entityId
      );
      return {
        success: true,
        data,
        message: 'Image uploaded and optimized successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get signed upload URL for client-side direct upload
   * @route POST /upload/signed-url
   */
  @Post('signed-url')
  async getSignedUploadUrl(
    @Body() body: { entityType?: string; entityId?: string; fileName?: string }
  ) {
    try {
      const data = await this.uploadService.getSignedUploadUrl(
        body.entityType || 'products',
        body.entityId,
        body.fileName
      );
      return {
        success: true,
        data,
        message: 'Signed upload URL generated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Get placeholder image URL
   * @route GET /upload/placeholder/:type
   */
  @Get('placeholder/:type')
  getPlaceholder(@Param('type') type: string) {
    try {
      const url = this.uploadService.getPlaceholderImage(type as any);
      return {
        success: true,
        data: { url },
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  /**
   * Delete uploaded file
   * @route DELETE /upload/:folder/:fileName
   */
  @Delete(':folder/:fileName')
  async deleteFile(@Param('folder') folder: string, @Param('fileName') fileName: string) {
    try {
      const data = await this.uploadService.deleteFile(fileName, folder);
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
}
