import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { SessionService } from './session.service';
import { EmailVerificationService } from './email-verification.service';
import { TwoFactorService } from './two-factor.service';
import { LoggerService } from '../../logger/logger.service';
import { SettingsService } from '../../settings/settings.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

// Custom TooManyRequestsException for compatibility
class TooManyRequestsException extends HttpException {
  constructor(message?: string) {
    super(message || 'Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
  }
}

@Injectable()
export class AuthCoreService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private sessionService: SessionService,
    private emailVerificationService: EmailVerificationService,
    private twoFactorService: TwoFactorService,
    private logger: LoggerService,
    private settingsService: SettingsService
  ) {}

  /**
   * Register a new user
   */
  async register(data: RegisterDto, ipAddress: string, userAgent: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'This email is already registered. Please log in instead, or use "Forgot Password" if you need to reset your password.'
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Determine user role (default to BUYER)
    const userRole = data.role || 'BUYER';

    // Create user (catch race condition where another request registered the same email
    // between our findUnique check and the create)
    let user;
    try {
      user = await this.prisma.user.create({
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
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(
          'This email is already registered. Please log in instead, or use "Forgot Password" if you need to reset your password.'
        );
      }
      throw err;
    }

    // Auto-create store for all sellers (v2.6.0 feature)
    let store = null;
    if (userRole === 'SELLER') {
      const storeName = data.storeName || `${user.firstName}'s Store`;
      const slug =
        storeName
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
          status: 'ACTIVE', // Auto-approved for immediate selling
        },
      });

      // Send welcome seller email (non-blocking)
      this.emailService.sendWelcomeEmail(user.email, user.firstName).catch((err) => {
        console.error('Failed to send welcome seller email:', err);
      });
    }

    // Send email verification (non-blocking)
    this.emailVerificationService
      .sendEmailVerification(user.id, user.email, user.firstName)
      .catch((err) => {
        console.error('Failed to send verification email:', err);
      });

    // Create session
    const sessionToken = await this.sessionService.createSession(
      user.id,
      ipAddress,
      userAgent,
      false
    );

    // Generate JWT
    const accessToken = this.generateJWT(user);

    // Log successful registration
    this.logger.logAuthEvent('register', user.id, {
      email: user.email,
      role: userRole,
      ipAddress,
      hasStore: !!store,
    });

    return {
      accessToken,
      sessionToken,
      user: this.sanitizeUser(user),
      store: store ? { id: store.id, name: store.name, status: store.status } : null,
      message: store
        ? 'Registration successful! Your store is ready. Start listing products now.'
        : 'Registration successful',
    };
  }

  /**
   * Login with email and password
   */
  async login(dto: LoginDto, ipAddress: string, userAgent: string) {
    // Check rate limiting
    await this.checkRateLimit(dto.email, ipAddress);

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      await this.recordLoginAttempt(null, dto.email, ipAddress, userAgent, false, 'user_not_found');
      this.logger.logSuspiciousActivity('Failed login - user not found', null, ipAddress, {
        email: dto.email,
      });
      throw new UnauthorizedException(
        'Invalid email or password. Please check your credentials and try again.'
      );
    }

    // Check if account is suspended
    if (user.isSuspended) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact support for assistance.'
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account is inactive. Please contact support to reactivate your account.'
      );
    }

    // Check if email verification is required (system setting)
    const emailVerificationRequiredSetting = await this.settingsService.getSetting(
      'email_verification_required'
    );
    const gracePeriodDaysSetting = await this.settingsService.getSetting(
      'email_verification_grace_period_days'
    );

    const emailVerificationRequired = Boolean(emailVerificationRequiredSetting.value);
    const gracePeriodDays = Number(gracePeriodDaysSetting.value || 0);

    if (emailVerificationRequired && !user.emailVerified) {
      // Skip verification check for OAuth users (already verified)
      if (user.authProvider !== 'GOOGLE') {
        // Check if user is still in grace period
        const accountAge = Date.now() - user.createdAt.getTime();
        const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1000;

        if (accountAge > gracePeriodMs) {
          await this.recordLoginAttempt(
            user.id,
            dto.email,
            ipAddress,
            userAgent,
            false,
            'email_not_verified'
          );
          throw new UnauthorizedException({
            message:
              'Email not verified. Please check your inbox for the verification link, or request a new one.',
            code: 'EMAIL_NOT_VERIFIED',
            canResend: true,
            email: user.email,
          });
        }
      }
    }

    // Verify password
    if (!user.password) {
      throw new UnauthorizedException(
        'This account uses passwordless login. Please use the magic link option or reset your password.'
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      await this.recordLoginAttempt(
        user.id,
        dto.email,
        ipAddress,
        userAgent,
        false,
        'invalid_password'
      );
      this.logger.logSuspiciousActivity('Failed login - invalid password', user.id, ipAddress, {
        email: dto.email,
      });
      throw new UnauthorizedException(
        'Invalid email or password. Please check your credentials and try again.'
      );
    }

    // Check 2FA
    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode && !dto.backupCode) {
        return {
          requires2FA: true,
          userId: user.id,
        };
      }

      let is2FAValid = false;

      if (dto.backupCode) {
        // Attempt backup code login
        is2FAValid = await this.twoFactorService.verifyBackupCode(user.id, dto.backupCode);
        if (!is2FAValid) {
          throw new UnauthorizedException(
            'Invalid backup code. Please try another backup code or use your authenticator app.'
          );
        }
      } else {
        is2FAValid = await this.twoFactorService.verify2FA(user.id, dto.twoFactorCode!);
        if (!is2FAValid) {
          throw new UnauthorizedException(
            'Invalid 2FA code. Please check your authenticator app and try again.'
          );
        }
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
    const sessionToken = await this.sessionService.createSession(
      user.id,
      ipAddress,
      userAgent,
      dto.rememberMe || false
    );

    // Generate JWT
    const accessToken = this.generateJWT(user);

    // Log successful login
    this.logger.logAuthEvent('login', user.id, {
      email: user.email,
      ipAddress,
      has2FA: user.twoFactorEnabled,
      rememberMe: dto.rememberMe || false,
    });

    return {
      accessToken,
      sessionToken,
      user: this.sanitizeUser(user),
      message: 'Login successful',
    };
  }

  /**
   * Check rate limiting for login attempts
   */
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
        (oldestAttempt.createdAt.getTime() + this.LOCKOUT_DURATION - Date.now()) / 1000 / 60
      );

      throw new TooManyRequestsException(
        `Too many failed login attempts. Please try again in ${timeRemaining} minutes.`
      );
    }
  }

  /**
   * Record login attempt
   */
  private async recordLoginAttempt(
    userId: string | null,
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    reason?: string
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
      expiresIn: '7d', // JWT expires in 7 days, session controls actual auth
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
