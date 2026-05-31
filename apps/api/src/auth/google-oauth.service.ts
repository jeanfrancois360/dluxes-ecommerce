import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { SessionService } from './services/session.service';
import { TwoFactorService } from './services/two-factor.service';
import { AuthProvider } from '@prisma/client';

@Injectable()
export class GoogleOAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private sessionService: SessionService,
    private twoFactorService: TwoFactorService
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

      // If 2FA is enabled, do not issue a full JWT yet.
      // Return a short-lived pending token so the frontend can prompt for TOTP.
      if (user.twoFactorEnabled) {
        const pendingToken = this.jwtService.sign(
          { sub: user.id, email: user.email, role: user.role, google_2fa_pending: true },
          { secret: this.configService.get<string>('JWT_SECRET'), expiresIn: '10m' }
        );
        return { requires2FA: true, pendingToken };
      }

      // Ensure SELLER users have a store (handles users created before auto-store or via OAuth)
      if (user.role === 'SELLER') {
        const existingStore = await this.prisma.store.findUnique({ where: { userId: user.id } });
        if (!existingStore) {
          const storeName = `${user.firstName || 'Seller'}'s Store`;
          const slug =
            storeName
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim() + `-${Date.now()}`;
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
      const { token: sessionToken, id: sessionId } = await this.sessionService.createSession(
        user.id,
        ipAddress,
        userAgent,
        false
      );

      // Generate JWT
      const accessToken = this.generateJWT(user, sessionId);

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
          'This account has been suspended. Please contact support for assistance.'
        );
      }

      // Guard: do not auto-link if 2FA is enabled — user must explicitly link via settings
      if (existingEmailUser.twoFactorEnabled) {
        throw new BadRequestException(
          'An account with this email already exists and has 2FA enabled. Please log in with your password and link Google from your account settings.'
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
      await this.emailService
        .sendEmailOTP(
          user.email,
          user.firstName || 'User',
          '', // No code needed for this notification
          'ACCOUNT_RECOVERY' as any, // Using a generic type
          ipAddress
        )
        .catch((err) => {
          console.error('Failed to send Google linked notification:', err);
        });

      // Create session
      const { token: sessionToken, id: sessionId } = await this.sessionService.createSession(
        user.id,
        ipAddress,
        userAgent,
        false
      );

      // Generate JWT
      const accessToken = this.generateJWT(user, sessionId);

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
    const { token: sessionToken, id: sessionId } = await this.sessionService.createSession(
      user.id,
      ipAddress,
      userAgent,
      false
    );

    // Generate JWT
    const accessToken = this.generateJWT(user, sessionId);

    return {
      accessToken,
      sessionToken,
      user: this.sanitizeUser(user),
      message: 'Google signup successful',
      isNewUser: true,
    };
  }

  /**
   * Verify TOTP code after Google OAuth when the user has 2FA enabled.
   * Accepts the short-lived pending token issued in googleAuth() and the TOTP code.
   * Returns a full accessToken + session on success.
   */
  async verifyGoogle2FA(pendingToken: string, code: string, ipAddress: string, userAgent: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(pendingToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired verification token. Please sign in again.'
      );
    }

    if (!payload.google_2fa_pending) {
      throw new UnauthorizedException('Invalid token type.');
    }

    const userId: string = payload.sub;

    const isValid = await this.twoFactorService.verify2FA(userId, code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code. Please check your authenticator app.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found.');

    const { token: sessionToken, id: sessionId } = await this.sessionService.createSession(
      userId,
      ipAddress,
      userAgent,
      false
    );
    const accessToken = this.generateJWT(user, sessionId);

    return {
      accessToken,
      sessionToken,
      user: this.sanitizeUser(user),
      message: 'Google login successful',
      isNewUser: false,
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
      throw new BadRequestException('Please set a password before unlinking your Google account');
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
  private generateJWT(user: any, sessionId?: string) {
    const payload: Record<string, unknown> = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    if (sessionId) payload.session_id = sessionId;

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
