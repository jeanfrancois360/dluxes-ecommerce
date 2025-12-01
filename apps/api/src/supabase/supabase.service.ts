import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
