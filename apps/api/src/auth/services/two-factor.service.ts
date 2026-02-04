import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { SessionService } from './session.service';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private sessionService: SessionService,
    private logger: LoggerService,
  ) {}

  /**
   * Setup 2FA for a user (generate QR code)
   */
  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `NextPik E-commerce (${user.email})`,
      issuer: 'NextPik E-commerce',
      length: 32,
    });

    // Store the secret (but don't enable 2FA yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      otpauthUrl: secret.otpauth_url,
      message: 'Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)',
    };
  }

  /**
   * Enable 2FA after user verifies they can generate codes
   */
  async enable2FA(userId: string, code: string) {
    const isValid = await this.verify2FA(userId, code);

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    // Send notification email
    this.emailService.send2FAEnabledNotification(user.email, user.firstName).catch((err) => {
      console.error('Failed to send 2FA notification email:', err);
    });

    // Log 2FA enable event
    this.logger.logAuthEvent('2fa_enable', userId, {
      email: user.email,
    });

    // Note: Sessions are NOT rotated here because 2FA is an additional layer
    // Existing sessions remain valid, but future logins will require 2FA

    // Generate backup codes on enable
    const backupCodes = await this.generateAndStoreBackupCodes(userId);

    return {
      message: '2FA enabled successfully',
      backupCodes, // One-time display — user must save these
    };
  }

  /**
   * Generate 10 backup codes, hash and store them, return plaintext codes
   */
  async generateAndStoreBackupCodes(userId: string): Promise<string[]> {
    const codes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < 10; i++) {
      const code = randomBytes(4).toString('hex'); // 8-char hex code
      codes.push(code);
      hashedCodes.push(createHash('sha256').update(code).digest('hex'));
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { backupCodes: hashedCodes },
    });

    return codes;
  }

  /**
   * Regenerate backup codes (replaces existing set)
   */
  async regenerateBackupCodes(userId: string): Promise<{ backupCodes: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled) {
      throw new BadRequestException('2FA must be enabled to manage backup codes');
    }

    const backupCodes = await this.generateAndStoreBackupCodes(userId);
    return { backupCodes };
  }

  /**
   * Verify and consume a backup code. Returns true if valid and consumed.
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { backupCodes: true },
    });

    if (!user?.backupCodes || !Array.isArray(user.backupCodes)) {
      return false;
    }

    const hashedCode = createHash('sha256').update(code).digest('hex');
    const index = (user.backupCodes as string[]).indexOf(hashedCode);

    if (index === -1) {
      return false;
    }

    // Remove the used code from the array
    const remaining = (user.backupCodes as string[]).filter((_, i) => i !== index);
    await this.prisma.user.update({
      where: { id: userId },
      data: { backupCodes: remaining },
    });

    this.logger.logAuthEvent('backup_code_used', userId, {
      codesRemaining: remaining.length,
    });

    return true;
  }

  /**
   * Disable 2FA for a user
   */
  async disable2FA(userId: string, code: string) {
    const isValid = await this.verify2FA(userId, code);

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
      },
    });

    // Log 2FA disable event
    this.logger.logAuthEvent('2fa_disable', userId, {
      email: user.email,
    });

    // Revoke all sessions when disabling 2FA for security
    // User will need to log in again without 2FA
    await this.sessionService.revokeAllSessions(userId);

    return { message: '2FA disabled successfully. Please log in again.' };
  }

  /**
   * Verify a 2FA code for a user
   */
  async verify2FA(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      return false;
    }

    // Verify TOTP code with speakeasy
    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps before/after for clock drift
    });
  }

  /**
   * Check if 2FA is enabled for a user
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    return user?.twoFactorEnabled || false;
  }
}
