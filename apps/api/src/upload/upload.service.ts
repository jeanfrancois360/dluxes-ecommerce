import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Upload Service
 * Handles file upload operations with Supabase integration
 * Falls back to local storage if Supabase is not configured
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = path.join(process.cwd(), 'public', 'uploads');

  constructor(private readonly supabaseService: SupabaseService) {
    // Ensure upload directories exist (for fallback)
    this.ensureDirectories();

    if (this.supabaseService.isConfigured()) {
      this.logger.log('Using Supabase Storage for file uploads');
    } else {
      this.logger.warn('Supabase not configured. Using local file storage');
    }
  }

  /**
   * Ensure upload directories exist
   */
  private ensureDirectories() {
    const dirs = [
      path.join(this.uploadDir, 'images'),
      path.join(this.uploadDir, 'products'),
      path.join(this.uploadDir, 'avatars'),
      path.join(this.uploadDir, 'categories'),
      path.join(this.uploadDir, 'collections'),
    ];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Upload single image
   * Uses Supabase if configured, falls back to local storage
   */
  async uploadImage(file: Express.Multer.File, folder: string = 'images') {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;

    // Use Supabase if configured
    if (this.supabaseService.isConfigured()) {
      try {
        const publicUrl = await this.supabaseService.uploadFile(
          file.buffer,
          fileName,
          folder,
          file.mimetype,
        );

        return {
          url: publicUrl,
          fileName,
          size: file.size,
          mimeType: file.mimetype,
        };
      } catch (error) {
        this.logger.error(`Supabase upload failed, falling back to local storage: ${error.message}`);
        // Fall through to local storage
      }
    }

    // Local storage fallback
    const uploadPath = path.join(this.uploadDir, folder);

    // Ensure folder exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filePath = path.join(uploadPath, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    return {
      url: `/uploads/${folder}/${fileName}`,
      fileName,
      path: filePath,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Upload multiple images
   */
  async uploadImages(files: Express.Multer.File[], folder: string = 'images') {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadedFiles = [];

    for (const file of files) {
      try {
        const result = await this.uploadImage(file, folder);
        uploadedFiles.push(result);
      } catch (error) {
        // Continue with other files even if one fails
        console.error(`Failed to upload file ${file.originalname}:`, error instanceof Error ? error.message : String(error));
      }
    }

    return uploadedFiles;
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(fileName: string, folder: string = 'images') {
    const filePath = path.join(this.uploadDir, folder, fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    try {
      fs.unlinkSync(filePath);
      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to delete file');
    }
  }

  /**
   * Delete file by URL
   * Handles both Supabase and local file URLs
   */
  async deleteFileByUrl(fileUrl: string) {
    // Check if it's a Supabase URL
    if (this.supabaseService.isConfigured() && fileUrl.includes('supabase.co')) {
      try {
        // Extract file path from Supabase URL
        // Example: https://project.supabase.co/storage/v1/object/public/bucket/folder/file.jpg
        const urlParts = fileUrl.split('/');
        const bucketIndex = urlParts.findIndex((part) => part === 'public') + 1;
        const filePath = urlParts.slice(bucketIndex + 1).join('/');

        await this.supabaseService.deleteFile(filePath);
        return {
          success: true,
          message: 'File deleted successfully from Supabase',
        };
      } catch (error) {
        this.logger.error(`Failed to delete file from Supabase: ${error.message}`);
        throw new BadRequestException('Failed to delete file from Supabase');
      }
    }

    // Local storage fallback
    // Extract path from URL
    // Example: /uploads/images/filename.jpg -> images/filename.jpg
    const urlPath = fileUrl.replace('/uploads/', '');
    const filePath = path.join(this.uploadDir, urlPath);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    try {
      fs.unlinkSync(filePath);
      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to delete file');
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(fileName: string, folder: string = 'images') {
    const filePath = path.join(this.uploadDir, folder, fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const stats = fs.statSync(filePath);

    return {
      fileName,
      path: filePath,
      url: `/uploads/${folder}/${fileName}`,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  }
}
