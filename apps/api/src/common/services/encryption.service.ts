import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Encryption Service
 *
 * Provides AES-256-GCM encryption/decryption for sensitive data like API keys.
 * Uses authenticated encryption to prevent tampering.
 *
 * Pattern: Similar to password.service.ts but using symmetric encryption
 * for data that needs to be retrieved (not just verified).
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

    if (!encryptionKey) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is not set. ' +
          'Generate with: openssl rand -base64 32'
      );
    }

    // Decode base64 key
    this.key = Buffer.from(encryptionKey, 'base64');

    if (this.key.length !== this.keyLength) {
      throw new Error(
        `ENCRYPTION_KEY must be ${this.keyLength} bytes (256 bits). ` +
          `Current length: ${this.key.length} bytes. ` +
          'Generate a new key with: openssl rand -base64 32'
      );
    }
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   *
   * @param plaintext - The text to encrypt
   * @returns Base64 encoded string in format: iv:authTag:encrypted
   *
   * @example
   * ```typescript
   * const encrypted = encryptionService.encrypt('my-secret-api-key');
   * // Returns: "abc123...:def456...:ghi789..."
   * ```
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty string');
    }

    // Generate random IV (initialization vector)
    const iv = randomBytes(this.ivLength);

    // Create cipher
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    // Encrypt the plaintext
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted (all base64 encoded)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  /**
   * Decrypt ciphertext encrypted with AES-256-GCM
   *
   * @param ciphertext - The encrypted string from encrypt()
   * @returns The original plaintext
   *
   * @throws Error if ciphertext is invalid or authentication fails
   *
   * @example
   * ```typescript
   * const plaintext = encryptionService.decrypt(encrypted);
   * // Returns: "my-secret-api-key"
   * ```
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) {
      throw new Error('Cannot decrypt empty string');
    }

    // Parse the ciphertext format: iv:authTag:encrypted
    const parts = ciphertext.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format. Expected format: iv:authTag:encrypted');
    }

    const [ivB64, authTagB64, encrypted] = parts;

    try {
      // Decode components
      const iv = Buffer.from(ivB64, 'base64');
      const authTag = Buffer.from(authTagB64, 'base64');

      // Create decipher
      const decipher = createDecipheriv(this.algorithm, this.key, iv);

      // Set authentication tag
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error.message}. ` +
          'The ciphertext may be corrupted or the encryption key may have changed.'
      );
    }
  }

  /**
   * Check if a string is encrypted (has the correct format)
   *
   * @param value - The string to check
   * @returns true if the string appears to be encrypted
   */
  isEncrypted(value: string): boolean {
    if (!value) return false;

    const parts = value.split(':');
    return parts.length === 3;
  }
}
