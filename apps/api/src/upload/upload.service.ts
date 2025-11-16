import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload Service
 * Handles file upload operations
 */
@Injectable()
export class UploadService {
  private readonly uploadDir = path.join(process.cwd(), 'public', 'uploads');

  constructor() {
    // Ensure upload directories exist
    this.ensureDirectories();
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

    const uploadPath = path.join(this.uploadDir, folder);

    // Ensure folder exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
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
   */
  async deleteFileByUrl(fileUrl: string) {
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
