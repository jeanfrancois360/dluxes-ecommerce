import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    this.bucketName = this.configService.get<string>('SUPABASE_BUCKET_NAME') || 'product-images';

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase credentials not configured. Image upload will use fallback.');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('Supabase client initialized successfully');
  }

  /**
   * Check if Supabase is configured
   */
  isConfigured(): boolean {
    return !!this.supabase;
  }

  /**
   * Upload a file to Supabase Storage
   * @param file - The file buffer
   * @param fileName - The file name (with extension)
   * @param folder - Optional folder path (e.g., 'products', 'categories')
   * @param contentType - The MIME type of the file
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    folder: string = 'products',
    contentType: string = 'image/jpeg',
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured');
    }

    try {
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          contentType,
          upsert: false,
          cacheControl: '3600',
        });

      if (error) {
        this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: publicData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      this.logger.log(`File uploaded successfully: ${filePath}`);
      return publicData.publicUrl;
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Upload multiple files
   * @param files - Array of file objects with buffer, fileName, and contentType
   * @param folder - Optional folder path
   * @returns Array of public URLs
   */
  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer; fileName: string; contentType: string }>,
    folder: string = 'products',
  ): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file.buffer, file.fileName, folder, file.contentType),
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from Supabase Storage
   * @param filePath - Full path to the file in storage (including folder)
   * @returns boolean indicating success
   */
  async deleteFile(filePath: string): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured');
    }

    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
        return false;
      }

      this.logger.log(`File deleted successfully: ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Delete multiple files
   * @param filePaths - Array of file paths
   * @returns boolean indicating success
   */
  async deleteMultipleFiles(filePaths: string[]): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured');
    }

    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove(filePaths);

      if (error) {
        this.logger.error(`Failed to delete files: ${error.message}`, error.stack);
        return false;
      }

      this.logger.log(`Files deleted successfully: ${filePaths.length} files`);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting files: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Get a signed URL for temporary access to a private file
   * @param filePath - Path to the file
   * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed URL
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured');
    }

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        this.logger.error(`Failed to create signed URL: ${error.message}`, error.stack);
        throw new Error(`Signed URL creation failed: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      this.logger.error(`Error creating signed URL: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * List files in a folder
   * @param folder - Folder path
   * @param limit - Maximum number of files to return
   * @returns Array of file objects
   */
  async listFiles(folder: string = 'products', limit: number = 100): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured');
    }

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(folder, {
          limit,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        this.logger.error(`Failed to list files: ${error.message}`, error.stack);
        throw new Error(`List files failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error(`Error listing files: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate folder path based on entity type and ID
   * @param entityType - Type of entity (product, seller, category, etc.)
   * @param entityId - ID of the entity
   * @returns Folder path
   */
  generateFolderPath(entityType: string, entityId?: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    if (entityId) {
      return `${entityType}/${entityId}/${timestamp}`;
    }
    return `${entityType}/${timestamp}`;
  }

  /**
   * Optimize and resize image
   * @param buffer - Image buffer
   * @param options - Optimization options
   * @returns Optimized image buffer
   */
  async optimizeImage(
    buffer: Buffer,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<Buffer> {
    const {
      width = 1920,
      height,
      quality = 80,
      format = 'webp',
    } = options;

    try {
      let pipeline = sharp(buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        });

      // Convert to specified format
      switch (format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality, progressive: true });
          break;
        case 'png':
          pipeline = pipeline.png({ quality, compressionLevel: 9 });
          break;
        case 'webp':
        default:
          pipeline = pipeline.webp({ quality });
          break;
      }

      return await pipeline.toBuffer();
    } catch (error) {
      this.logger.error(`Image optimization failed: ${error.message}`);
      throw new Error('Image optimization failed');
    }
  }

  /**
   * Upload file with optimization
   * @param file - File buffer
   * @param fileName - File name
   * @param folder - Folder path
   * @param contentType - MIME type
   * @param optimize - Whether to optimize image
   * @returns Object with URL and metadata
   */
  async uploadFileWithOptimization(
    file: Buffer,
    fileName: string,
    folder: string = 'products',
    contentType: string = 'image/jpeg',
    optimize: boolean = true
  ): Promise<{
    url: string;
    fileName: string;
    size: number;
    originalSize: number;
    width?: number;
    height?: number;
    format: string;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const originalSize = file.length;
    let processedBuffer = file;
    let metadata: { width?: number; height?: number; format?: string } = {};

    // Optimize if requested and it's an image
    if (optimize && contentType.startsWith('image/')) {
      try {
        // Get original image metadata
        const imageMetadata = await sharp(file).metadata();
        metadata = {
          width: imageMetadata.width,
          height: imageMetadata.height,
          format: imageMetadata.format,
        };

        // Optimize image
        processedBuffer = await this.optimizeImage(file, {
          format: 'webp',
          quality: 85,
        });

        // Update filename extension to webp
        fileName = fileName.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
        contentType = 'image/webp';
      } catch (error) {
        this.logger.warn(`Image optimization failed, using original: ${error.message}`);
        processedBuffer = file;
      }
    }

    // Upload to Supabase
    const url = await this.uploadFile(processedBuffer, fileName, folder, contentType);

    return {
      url,
      fileName,
      size: processedBuffer.length,
      originalSize,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format || 'unknown',
    };
  }

  /**
   * Create signed upload URL for client-side upload
   * @param filePath - Path where file will be uploaded
   * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed upload URL and token
   */
  async createSignedUploadUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<{ signedUrl: string; token: string; path: string }> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured');
    }

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUploadUrl(filePath);

      if (error) {
        this.logger.error(`Failed to create signed upload URL: ${error.message}`, error.stack);
        throw new Error(`Signed upload URL creation failed: ${error.message}`);
      }

      return {
        signedUrl: data.signedUrl,
        token: data.token,
        path: data.path,
      };
    } catch (error) {
      this.logger.error(`Error creating signed upload URL: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate thumbnail from image
   * @param buffer - Original image buffer
   * @param size - Thumbnail size (default: 300x300)
   * @returns Thumbnail buffer
   */
  async generateThumbnail(
    buffer: Buffer,
    size: number = 300
  ): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 75 })
        .toBuffer();
    } catch (error) {
      this.logger.error(`Thumbnail generation failed: ${error.message}`);
      throw new Error('Thumbnail generation failed');
    }
  }

  /**
   * Upload image with multiple sizes (original, optimized, thumbnail)
   * @param file - Original file buffer
   * @param baseFileName - Base file name (without extension)
   * @param folder - Folder path
   * @returns URLs for all versions
   */
  async uploadMultipleSizes(
    file: Buffer,
    baseFileName: string,
    folder: string = 'products'
  ): Promise<{
    original: string;
    optimized: string;
    thumbnail: string;
    metadata: any;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured');
    }

    try {
      // Upload original
      const originalResult = await this.uploadFileWithOptimization(
        file,
        `${baseFileName}-original.webp`,
        folder,
        'image/webp',
        true
      );

      // Generate and upload thumbnail
      const thumbnailBuffer = await this.generateThumbnail(file, 300);
      const thumbnailUrl = await this.uploadFile(
        thumbnailBuffer,
        `${baseFileName}-thumb.webp`,
        `${folder}/thumbnails`,
        'image/webp'
      );

      // Generate medium size
      const mediumBuffer = await this.optimizeImage(file, {
        width: 800,
        quality: 85,
        format: 'webp',
      });
      const mediumUrl = await this.uploadFile(
        mediumBuffer,
        `${baseFileName}-medium.webp`,
        folder,
        'image/webp'
      );

      return {
        original: originalResult.url,
        optimized: mediumUrl,
        thumbnail: thumbnailUrl,
        metadata: {
          originalSize: originalResult.originalSize,
          optimizedSize: originalResult.size,
          width: originalResult.width,
          height: originalResult.height,
        },
      };
    } catch (error) {
      this.logger.error(`Multiple sizes upload failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if bucket exists and create if it doesn't
   */
  async ensureBucketExists(): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some((bucket) => bucket.name === this.bucketName);

      if (!bucketExists) {
        this.logger.warn(`Bucket ${this.bucketName} does not exist. Creating...`);
        const { error } = await this.supabase.storage.createBucket(this.bucketName, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
        });

        if (error) {
          this.logger.error(`Failed to create bucket: ${error.message}`, error.stack);
        } else {
          this.logger.log(`Bucket ${this.bucketName} created successfully`);
        }
      }
    } catch (error) {
      this.logger.error(`Error ensuring bucket exists: ${error.message}`, error.stack);
    }
  }
}
