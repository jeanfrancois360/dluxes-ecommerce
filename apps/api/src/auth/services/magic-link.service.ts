import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { SessionService } from './session.service';
import { MagicLinkDto } from '../dto/auth.dto';

@Injectable()
export class MagicLinkService {
  private readonly MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private sessionService: SessionService,
  ) {}

  /**
   * Send a magic link for passwordless authentication
   */
  async sendMagicLink(dto: MagicLinkDto, ipAddress: string, userAgent: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a magic link has been sent' };
    }

    // Generate token
    const token = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(token).digest('hex');

    // Create magic link
    await this.prisma.magicLink.create({
      data: {
        userId: user.id,
        token: hashedToken,
        email: dto.email,
        expiresAt: new Date(Date.now() + this.MAGIC_LINK_EXPIRY),
        ipAddress,
        userAgent,
      },
    });

    // Send email with magic link (non-blocking)
    this.emailService.sendMagicLink(user.email, user.firstName, token).catch((err) => {
      console.error('Failed to send magic link email:', err);
    });

    return {
      message: 'If the email exists, a magic link has been sent',
      // For development only - remove in production
      _dev: process.env.NODE_ENV === 'development' ? { token } : undefined,
    };
  }

  /**
   * Verify magic link and log user in
   */
  async verifyMagicLink(token: string, ipAddress: string, userAgent: string) {
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const magicLink = await this.prisma.magicLink.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!magicLink) {
      throw new UnauthorizedException(
        'Invalid magic link. Please request a new one to log in.',
      );
    }

    if (magicLink.used) {
      throw new UnauthorizedException(
        'This magic link has already been used. Please request a new one if you need to log in again.',
      );
    }

    if (new Date() > magicLink.expiresAt) {
      throw new UnauthorizedException(
        'This magic link has expired (valid for 15 minutes). Please request a new one.',
      );
    }

    // Mark as used
    await this.prisma.magicLink.update({
      where: { id: magicLink.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Update user
    await this.prisma.user.update({
      where: { id: magicLink.userId },
      data: {
        emailVerified: true,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Create session
    const sessionToken = await this.sessionService.createSession(
      magicLink.userId,
      ipAddress,
      userAgent,
      true, // Remember me for magic link logins
    );

    // Generate JWT
    const accessToken = this.generateJWT(magicLink.user);

    // Sanitize user — whitelist only safe fields
    const u = magicLink.user;
    const sanitizedUser = {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      avatar: u.avatar,
      role: u.role,
      emailVerified: u.emailVerified,
      twoFactorEnabled: u.twoFactorEnabled,
      googleId: u.googleId,
      authProvider: u.authProvider,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };

    return {
      accessToken,
      sessionToken,
      user: sanitizedUser,
      message: 'Login successful',
    };
  }

  /**
   * Generate JWT token for user
   */
  private generateJWT(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '7d', // JWT expires in 7 days, session controls actual auth
    });
  }
}
