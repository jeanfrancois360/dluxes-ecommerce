import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { SessionService } from './services/session.service';
import { AuthProvider } from '@prisma/client';

@Injectable()
export class GoogleOAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private sessionService: SessionService,
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

      // Ensure SELLER users have a store (handles users created before auto-store or via OAuth)
      if (user.role === 'SELLER') {
        const existingStore = await this.prisma.store.findUnique({ where: { userId: user.id } });
        if (!existingStore) {
          const storeName = `${user.firstName || 'Seller'}'s Store`;
          const slug = storeName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim() + `-${Date.now()}`;
          await this.prisma.store.create({
            data: {
              userId: user.id,
              name: storeName,
              slug,
              email: user.email,
              status: 'ACTIVE',
            },
          });
        }
      }

      // Create session
      const sessionToken = await this.sessionService.createSession(user.id, ipAddress, userAgent, false);

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
      // Guard: do not auto-link if account is suspended
      if (existingEmailUser.isSuspended) {
        throw new BadRequestException(
          'This account has been suspended. Please contact support for assistance.',
        );
      }

      // Guard: do not auto-link if 2FA is enabled — user must explicitly link via settings
      if (existingEmailUser.twoFactorEnabled) {
        throw new BadRequestException(
          'An account with this email already exists and has 2FA enabled. Please log in with your password and link Google from your account settings.',
        );
      }

      // Email exists but not linked to Google — link Google account to existing user
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
      const sessionToken = await this.sessionService.createSession(user.id, ipAddress, userAgent, false);

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
        password: null, // No password for Google OAuth users
      },
    });

    // Send welcome email (non-blocking)
    this.emailService.sendWelcomeEmail(user.email, user.firstName || 'User').catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    // Create session
    const sessionToken = await this.sessionService.createSession(user.id, ipAddress, userAgent, false);

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
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      googleId: user.googleId,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

}
