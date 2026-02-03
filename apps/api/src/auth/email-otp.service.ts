import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmailOTPType } from '@prisma/client';

@Injectable()
export class EmailOTPService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a random 6-digit OTP code
   */
  private generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create and send a new email OTP
   */
  async createEmailOTP(
    userId: string,
    type: EmailOTPType,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const code = this.generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otp = await this.prisma.emailOTP.create({
      data: {
        userId,
        code,
        type,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return { code, expiresAt, otpId: otp.id };
  }

  /**
   * Verify an email OTP code
   */
  async verifyEmailOTP(
    userId: string,
    code: string,
    type: EmailOTPType,
  ): Promise<boolean> {
    const otp = await this.prisma.emailOTP.findFirst({
      where: {
        userId,
        code,
        type,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    // Check attempts limit (max 3)
    if (otp.attempts >= 3) {
      throw new BadRequestException('Too many verification attempts. Please request a new code.');
    }

    // Increment attempts
    await this.prisma.emailOTP.update({
      where: { id: otp.id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    // Mark as used
    await this.prisma.emailOTP.update({
      where: { id: otp.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    return true;
  }

  /**
   * Invalidate all unused OTPs for a user
   */
  async invalidateUserOTPs(userId: string, type?: EmailOTPType) {
    await this.prisma.emailOTP.updateMany({
      where: {
        userId,
        used: false,
        ...(type && { type }),
      },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });
  }

  /**
   * Clean up expired OTPs (to be run periodically)
   */
  async cleanupExpiredOTPs() {
    const result = await this.prisma.emailOTP.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
        },
      },
    });

    return result.count;
  }

  /**
   * Check if user has email OTP enabled
   */
  async isEmailOTPEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailOTPEnabled: true },
    });

    return user?.emailOTPEnabled ?? false;
  }

  /**
   * Enable email OTP for a user
   */
  async enableEmailOTP(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailOTPEnabled: true },
    });
  }

  /**
   * Disable email OTP for a user
   */
  async disableEmailOTP(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailOTPEnabled: false },
    });

    // Invalidate all existing OTPs
    await this.invalidateUserOTPs(userId);
  }
}
