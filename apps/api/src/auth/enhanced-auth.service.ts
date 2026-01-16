import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

// Custom TooManyRequestsException for compatibility
class TooManyRequestsException extends HttpException {
  constructor(message?: string) {
    super(message || 'Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
  }
}
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { EmailOTPService } from './email-otp.service';
import { EmailOTPType } from '@prisma/client';
import {
  RegisterDto,
  LoginDto,
  MagicLinkDto,
  PasswordResetDto,
  PasswordResetRequestDto,
} from './dto/auth.dto';

@Injectable()
export class EnhancedAuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes
  private readonly PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour
  private readonly EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly SESSION_EXPIRY_REMEMBER = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly SESSION_EXPIRY_DEFAULT = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private emailOTPService: EmailOTPService,
  ) {}

  // ============================================================================
  // Registration
  // ============================================================================

  async register(data: RegisterDto, ipAddress: string, userAgent: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Determine user role (default to BUYER)
    const userRole = data.role || 'BUYER';

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: userRole,
        lastLoginIp: ipAddress,
      },
    });

    // If user is a seller and store details are provided, create store with PENDING status
    let store = null;
    if (userRole === 'SELLER' && (data.storeName || data.storeDescription)) {
      const storeName = data.storeName || `${user.firstName}'s Store`;
      const slug = storeName
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() + `-${Date.now()}`;

      store = await this.prisma.store.create({
        data: {
          userId: user.id,
          name: storeName,
          slug,
          email: user.email,
          description: data.storeDescription || '',
          status: 'PENDING', // Requires admin approval
        },
      });

      // Send welcome seller email (non-blocking)
      this.emailService.sendWelcomeEmail(user.email, user.firstName).catch((err) => {
        console.error('Failed to send welcome seller email:', err);
      });
    }

    // Send email verification (non-blocking)
    this.sendEmailVerification(user.id, user.email, user.firstName).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    // Create session
    const sessionToken = await this.createSession(user.id, ipAddress, userAgent, false);

    // Generate JWT
    const accessToken = this.generateJWT(user);

    return {
      accessToken,
      sessionToken,
      user: this.sanitizeUser(user),
      store: store ? { id: store.id, name: store.name, status: store.status } : null,
      message: store
        ? 'Registration successful. Your store application is pending approval.'
        : 'Registration successful',
    };
  }

  // ============================================================================
  // Login with Rate Limiting
  // ============================================================================

  async login(dto: LoginDto, ipAddress: string, userAgent: string) {
    // Check rate limiting
    await this.checkRateLimit(dto.email, ipAddress);

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      await this.recordLoginAttempt(null, dto.email, ipAddress, userAgent, false, 'user_not_found');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is suspended
    if (user.isSuspended) {
      throw new UnauthorizedException('Account is suspended');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Check if email is verified (block unverified users)
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in. Check your inbox for the verification link.');
    }

    // Verify password
    if (!user.password) {
      throw new UnauthorizedException('Please use passwordless login');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      await this.recordLoginAttempt(user.id, dto.email, ipAddress, userAgent, false, 'invalid_password');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check 2FA
    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        return {
          requires2FA: true,
          userId: user.id,
        };
      }

      const is2FAValid = await this.verify2FA(user.id, dto.twoFactorCode);
      if (!is2FAValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    // Success - record attempt
    await this.recordLoginAttempt(user.id, dto.email, ipAddress, userAgent, true);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Create session
    const sessionToken = await this.createSession(
      user.id,
      ipAddress,
      userAgent,
      dto.rememberMe || false,
    );

    // Generate JWT
    const accessToken = this.generateJWT(user);

    return {
      accessToken,
      sessionToken,
      user: this.sanitizeUser(user),
      message: 'Login successful',
    };
  }

  // ============================================================================
  // Magic Link (Passwordless Auth)
  // ============================================================================

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

  async verifyMagicLink(token: string, ipAddress: string, userAgent: string) {
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const magicLink = await this.prisma.magicLink.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!magicLink) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    if (magicLink.used) {
      throw new UnauthorizedException('Magic link already used');
    }

    if (new Date() > magicLink.expiresAt) {
      throw new UnauthorizedException('Magic link expired');
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
    const sessionToken = await this.createSession(magicLink.userId, ipAddress, userAgent, true);

    // Generate JWT
    const accessToken = this.generateJWT(magicLink.user);

    return {
      accessToken,
      sessionToken,
      user: this.sanitizeUser(magicLink.user),
      message: 'Login successful',
    };
  }

  // ============================================================================
  // Password Reset
  // ============================================================================

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

  async resetPassword(dto: PasswordResetDto) {
    const hashedToken = createHash('sha256').update(dto.token).digest('hex');

    const resetToken = await this.prisma.passwordReset.findUnique({
      where: { token: hashedToken },
    });

    if (!resetToken) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (resetToken.used) {
      throw new UnauthorizedException('Reset token already used');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new UnauthorizedException('Reset token expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    // Update password
    await this.prisma.user.update({
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

    // Invalidate all sessions for security
    await this.prisma.userSession.updateMany({
      where: { userId: resetToken.userId },
      data: { isActive: false },
    });

    return { message: 'Password reset successful' };
  }

  // ============================================================================
  // Email Verification
  // ============================================================================

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

  async resendEmailVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a verification link has been sent' };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
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

  async verifyEmail(token: string) {
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const verificationToken = await this.prisma.magicLink.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new UnauthorizedException('Invalid or expired verification link');
    }

    if (verificationToken.used) {
      throw new UnauthorizedException('Verification link already used');
    }

    if (new Date() > verificationToken.expiresAt) {
      throw new UnauthorizedException('Verification link expired');
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

    return {
      message: 'Email verified successfully! You can now log in.',
      user: this.sanitizeUser(user),
    };
  }

  // ============================================================================
  // 2FA (Two-Factor Authentication)
  // ============================================================================

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

    return { message: '2FA enabled successfully' };
  }

  async disable2FA(userId: string, code: string) {
    const isValid = await this.verify2FA(userId, code);

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { message: '2FA disabled successfully' };
  }

  private async verify2FA(userId: string, code: string): Promise<boolean> {
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

  // ============================================================================
  // Session Management
  // ============================================================================

  private async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    rememberMe: boolean,
  ): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiryDuration = rememberMe ? this.SESSION_EXPIRY_REMEMBER : this.SESSION_EXPIRY_DEFAULT;

    await this.prisma.userSession.create({
      data: {
        userId,
        token,
        ipAddress,
        deviceType: this.getDeviceType(userAgent),
        browser: this.getBrowser(userAgent),
        expiresAt: new Date(Date.now() + expiryDuration),
      },
    });

    return token;
  }

  async getUserSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.userSession.updateMany({
      where: {
        id: sessionId,
        userId,
      },
      data: { isActive: false },
    });

    return { message: 'Session revoked successfully' };
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string) {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        id: exceptSessionId ? { not: exceptSessionId } : undefined,
      },
      data: { isActive: false },
    });

    return { message: 'All sessions revoked successfully' };
  }

  // ============================================================================
  // Rate Limiting
  // ============================================================================

  private async checkRateLimit(email: string, ipAddress: string) {
    const recentAttempts = await this.prisma.loginAttempt.findMany({
      where: {
        OR: [{ email }, { ipAddress }],
        createdAt: {
          gte: new Date(Date.now() - this.LOCKOUT_DURATION),
        },
      },
    });

    const failedAttempts = recentAttempts.filter((attempt) => !attempt.success);

    if (failedAttempts.length >= this.MAX_LOGIN_ATTEMPTS) {
      const oldestAttempt = failedAttempts[0];
      const timeRemaining = Math.ceil(
        (oldestAttempt.createdAt.getTime() + this.LOCKOUT_DURATION - Date.now()) / 1000 / 60,
      );

      throw new TooManyRequestsException(
        `Too many failed login attempts. Please try again in ${timeRemaining} minutes.`,
      );
    }
  }

  private async recordLoginAttempt(
    userId: string | null,
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    reason?: string,
  ) {
    await this.prisma.loginAttempt.create({
      data: {
        userId,
        email,
        ipAddress,
        userAgent,
        success,
        reason,
      },
    });
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

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

  private sanitizeUser(user: any) {
    const { password, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }

  private getDeviceType(userAgent: string): string {
    // Simple device type detection
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  private getBrowser(userAgent: string): string {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/edge/i.test(userAgent)) return 'Edge';
    return 'Unknown';
  }

  // ============================================================================
  // Email OTP Methods
  // ============================================================================

  /**
   * Request an email OTP code
   */
  async requestEmailOTP(
    userId: string,
    type: EmailOTPType,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, emailOTPEnabled: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Invalidate any existing unused OTPs of this type
    await this.emailOTPService.invalidateUserOTPs(userId, type);

    // Create new OTP
    const { code, expiresAt } = await this.emailOTPService.createEmailOTP(
      userId,
      type,
      ipAddress,
      userAgent,
    );

    // Send email with OTP
    await this.emailService.sendEmailOTP(
      user.email,
      user.firstName || 'User',
      code,
      type,
      ipAddress,
    );

    return {
      success: true,
      message: 'OTP sent to your email',
      expiresAt,
    };
  }

  /**
   * Verify an email OTP code
   */
  async verifyEmailOTP(userId: string, code: string, type: EmailOTPType) {
    const isValid = await this.emailOTPService.verifyEmailOTP(userId, code, type);

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  }

  /**
   * Enable email OTP for a user
   */
  async enableEmailOTP(userId: string) {
    await this.emailOTPService.enableEmailOTP(userId);

    return {
      success: true,
      message: 'Email OTP enabled successfully',
    };
  }

  /**
   * Disable email OTP for a user
   */
  async disableEmailOTP(userId: string) {
    await this.emailOTPService.disableEmailOTP(userId);

    return {
      success: true,
      message: 'Email OTP disabled successfully',
    };
  }

  /**
   * Check if email OTP is enabled for a user
   */
  async isEmailOTPEnabled(userId: string): Promise<boolean> {
    return this.emailOTPService.isEmailOTPEnabled(userId);
  }

  /**
   * Login with email OTP (2FA via email)
   */
  async loginWithEmailOTP(
    email: string,
    password: string,
    otpCode: string,
    ipAddress: string,
    userAgent: string,
  ) {
    // First verify password
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify OTP
    await this.emailOTPService.verifyEmailOTP(
      user.id,
      otpCode,
      EmailOTPType.TWO_FACTOR_BACKUP,
    );

    // Create session
    const sessionToken = await this.createSession(
      user.id,
      ipAddress,
      userAgent,
      false,
    );

    // Generate JWT
    const accessToken = this.generateJWT(user);

    return {
      accessToken,
      sessionToken,
      user: this.sanitizeUser(user),
      message: 'Login successful',
    };
  }
}
