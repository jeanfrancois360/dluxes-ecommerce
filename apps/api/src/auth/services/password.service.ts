import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { SessionService } from './session.service';
import { LoggerService } from '../../logger/logger.service';
import { PasswordResetRequestDto, PasswordResetDto } from '../dto/auth.dto';

@Injectable()
export class PasswordService {
  private readonly PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private sessionService: SessionService,
    private logger: LoggerService,
  ) {}

  /**
   * Request a password reset email
   */
  async requestPasswordReset(dto: PasswordResetRequestDto, ipAddress: string, userAgent: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate token
    const token = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(token).digest('hex');

    // Create reset token
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + this.PASSWORD_RESET_EXPIRY),
        ipAddress,
        userAgent,
      },
    });

    // Send email (non-blocking)
    this.emailService.sendPasswordReset(user.email, user.firstName, token).catch((err) => {
      console.error('Failed to send password reset email:', err);
    });

    return {
      message: 'If the email exists, a reset link has been sent',
      // For development only
      _dev: process.env.NODE_ENV === 'development' ? { token } : undefined,
    };
  }

  /**
   * Reset password using a reset token
   */
  async resetPassword(dto: PasswordResetDto) {
    const hashedToken = createHash('sha256').update(dto.token).digest('hex');

    const resetToken = await this.prisma.passwordReset.findUnique({
      where: { token: hashedToken },
    });

    if (!resetToken) {
      throw new UnauthorizedException(
        'Invalid password reset link. Please request a new password reset email.',
      );
    }

    if (resetToken.used) {
      throw new UnauthorizedException(
        'This password reset link has already been used. Please request a new one if you need to reset your password again.',
      );
    }

    if (new Date() > resetToken.expiresAt) {
      throw new UnauthorizedException(
        'This password reset link has expired (valid for 1 hour). Please request a new password reset email.',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    // Update password
    const user = await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await this.prisma.passwordReset.update({
      where: { id: resetToken.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Log password reset event
    this.logger.logAuthEvent('password_reset', resetToken.userId, {
      email: user.email,
    });

    // Invalidate all sessions for security
    await this.sessionService.revokeAllSessions(resetToken.userId);

    return { message: 'Password reset successful' };
  }

  /**
   * Change password for authenticated user
   * @param userId - The authenticated user's ID
   * @param currentPassword - The user's current password
   * @param newPassword - The new password to set
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Get user with password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException(
        'Unable to change password. This account may use passwordless login.',
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Current password is incorrect. Please try again or use "Forgot Password" to reset it.',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all sessions for security (user will need to log in again)
    await this.sessionService.revokeAllSessions(userId);

    return { message: 'Password changed successfully. Please log in again.' };
  }
}
