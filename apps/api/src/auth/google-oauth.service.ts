import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { AuthProvider } from '@prisma/client';

@Injectable()
export class GoogleOAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  /**
   * Handle Google OAuth login/signup
   */
  async googleAuth(googleUser: any, ipAddress: string, userAgent: string) {
    const { googleId, email, firstName, lastName, picture } = googleUser;

    // Check if user exists with this Google ID
    let user = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (user) {
      // User exists, update last login
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress,
        },
      });

      // Create session
      const sessionToken = await this.createSession(user.id, ipAddress, userAgent);

      // Generate JWT
      const accessToken = this.generateJWT(user);

      return {
        accessToken,
        sessionToken,
        user: this.sanitizeUser(user),
        message: 'Google login successful',
        isNewUser: false,
      };
    }

    // Check if user exists with this email
    const existingEmailUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingEmailUser) {
      // Email exists but not linked to Google
      // Link Google account to existing user
      user = await this.prisma.user.update({
        where: { id: existingEmailUser.id },
        data: {
          googleId,
          authProvider: AuthProvider.GOOGLE,
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress,
          emailVerified: true, // Google accounts are pre-verified
        },
      });

      // Send notification email
      await this.emailService.sendEmailOTP(
        user.email,
        user.firstName || 'User',
        '', // No code needed for this notification
        'ACCOUNT_RECOVERY' as any, // Using a generic type
        ipAddress,
      ).catch((err) => {
        console.error('Failed to send Google linked notification:', err);
      });

      // Create session
      const sessionToken = await this.createSession(user.id, ipAddress, userAgent);

      // Generate JWT
      const accessToken = this.generateJWT(user);

      return {
        accessToken,
        sessionToken,
        user: this.sanitizeUser(user),
        message: 'Google account linked successfully',
        isNewUser: false,
      };
    }

    // Create new user with Google
    user = await this.prisma.user.create({
      data: {
        email,
        googleId,
        authProvider: AuthProvider.GOOGLE,
        firstName: firstName || '',
        lastName: lastName || '',
        role: 'BUYER',
        emailVerified: true, // Google accounts are pre-verified
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        password: '', // No password for Google OAuth users
      },
    });

    // Send welcome email (non-blocking)
    this.emailService.sendWelcomeEmail(user.email, user.firstName || 'User').catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    // Create session
    const sessionToken = await this.createSession(user.id, ipAddress, userAgent);

    // Generate JWT
    const accessToken = this.generateJWT(user);

    return {
      accessToken,
      sessionToken,
      user: this.sanitizeUser(user),
      message: 'Google signup successful',
      isNewUser: true,
    };
  }

  /**
   * Link Google account to existing authenticated user
   */
  async linkGoogleAccount(userId: string, googleUser: any) {
    const { googleId, email } = googleUser;

    // Check if Google ID is already used by another user
    const existingGoogleUser = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (existingGoogleUser && existingGoogleUser.id !== userId) {
      throw new ConflictException('This Google account is already linked to another user');
    }

    // Get current user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Update user with Google ID
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleId,
        authProvider: AuthProvider.GOOGLE,
      },
    });

    return {
      success: true,
      message: 'Google account linked successfully',
      user: this.sanitizeUser(updatedUser),
    };
  }

  /**
   * Unlink Google account from user
   */
  async unlinkGoogleAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.googleId) {
      throw new BadRequestException('No Google account linked');
    }

    // Ensure user has password set before unlinking
    if (!user.password) {
      throw new BadRequestException(
        'Please set a password before unlinking your Google account',
      );
    }

    // Remove Google ID
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleId: null,
        authProvider: AuthProvider.LOCAL,
      },
    });

    return {
      success: true,
      message: 'Google account unlinked successfully',
    };
  }

  /**
   * Create a user session
   */
  private async createSession(userId: string, ipAddress: string, userAgent: string) {
    const randomBytes = (size: number) => {
      const bytes = new Uint8Array(size);
      crypto.getRandomValues(bytes);
      return Buffer.from(bytes).toString('hex');
    };

    const token = randomBytes(32);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.userSession.create({
      data: {
        userId,
        token,
        ipAddress,
        deviceType: this.getDeviceType(userAgent),
        browser: this.getBrowser(userAgent),
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Generate JWT token
   */
  private generateJWT(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
  }

  /**
   * Sanitize user object (remove sensitive fields)
   */
  private sanitizeUser(user: any) {
    const { password, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Get device type from user agent
   */
  private getDeviceType(userAgent: string): string {
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  /**
   * Get browser from user agent
   */
  private getBrowser(userAgent: string): string {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/edge/i.test(userAgent)) return 'Edge';
    return 'Unknown';
  }
}
