import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';

@Injectable()
export class EmailVerificationService {
  private readonly EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Send email verification to a user
   */
  async sendEmailVerification(userId: string, email: string, firstName: string) {
    // Generate verification token
    const token = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(token).digest('hex');

    // Store token in magic_links table (reuse for email verification)
    await this.prisma.magicLink.create({
      data: {
        userId,
        token: hashedToken,
        email,
        expiresAt: new Date(Date.now() + this.EMAIL_VERIFICATION_EXPIRY),
      },
    });

    // Send verification email
    await this.emailService.sendEmailVerification(email, firstName, token);

    return {
      message: 'Verification email sent successfully',
      // For development only
      _dev: process.env.NODE_ENV === 'development' ? { token } : undefined,
    };
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a verification link has been sent' };
    }

    if (user.emailVerified) {
      throw new BadRequestException(
        'Your email is already verified. You can log in now.',
      );
    }

    // Generate new token
    const token = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(token).digest('hex');

    // Invalidate old verification tokens
    await this.prisma.magicLink.updateMany({
      where: {
        userId: user.id,
        used: false,
      },
      data: { used: true },
    });

    // Create new verification token
    await this.prisma.magicLink.create({
      data: {
        userId: user.id,
        token: hashedToken,
        email: user.email,
        expiresAt: new Date(Date.now() + this.EMAIL_VERIFICATION_EXPIRY),
      },
    });

    // Send verification email
    this.emailService.sendEmailVerification(user.email, user.firstName, token).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    return {
      message: 'Verification email sent successfully',
      // For development only
      _dev: process.env.NODE_ENV === 'development' ? { token } : undefined,
    };
  }

  /**
   * Verify email using verification token
   */
  async verifyEmail(token: string) {
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const verificationToken = await this.prisma.magicLink.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new UnauthorizedException(
        'Invalid verification link. Please request a new verification email.',
      );
    }

    if (verificationToken.used) {
      throw new UnauthorizedException(
        'This verification link has already been used. Your email is already verified.',
      );
    }

    if (new Date() > verificationToken.expiresAt) {
      throw new UnauthorizedException({
        message: 'This verification link has expired (valid for 24 hours). Please request a new verification email.',
        canResend: true,
        resendEmail: verificationToken.email,
      });
    }

    // Mark email as verified
    const user = await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    // Mark token as used
    await this.prisma.magicLink.update({
      where: { id: verificationToken.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Return sanitized user (without sensitive fields)
    const { password, twoFactorSecret, ...sanitized } = user;

    return {
      message: 'Email verified successfully! You can now log in.',
      user: sanitized,
    };
  }
}
