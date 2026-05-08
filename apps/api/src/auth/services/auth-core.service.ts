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
import { SessionService } from './session.service';
import { EmailVerificationService } from './email-verification.service';
import { TwoFactorService } from './two-factor.service';
import { TrustedDeviceService } from './trusted-device.service';
import { LoggerService } from '../../logger/logger.service';
import { SettingsService } from '../../settings/settings.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { SETTING_DEFAULTS } from '../../settings/settings.defaults';

// Custom TooManyRequestsException for compatibility
class TooManyRequestsException extends HttpException {
  constructor(message?: string) {
    super(message || 'Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
  }
}

const ENFORCED_ROLES = new Set(['SELLER', 'ADMIN', 'SUPER_ADMIN', 'DELIVERY_PARTNER']);

@Injectable()
export class AuthCoreService {
  private readonly MAX_LOGIN_ATTEMPTS_DEFAULT = 5; // fallback when setting unavailable
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private sessionService: SessionService,
    private emailVerificationService: EmailVerificationService,
    private twoFactorService: TwoFactorService,
    private trustedDeviceService: TrustedDeviceService,
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

      // Respect the seller_auto_approve setting; default to PENDING (fail closed)
      let autoApprove = false;
      try {
        const autoApproveSetting = await this.settingsService.getSetting('seller_auto_approve');
        autoApprove = Boolean(autoApproveSetting.value);
      } catch {
        // Setting unavailable — default to PENDING for safety
      }
      const storeStatus = autoApprove ? 'ACTIVE' : 'PENDING';

      store = await this.prisma.store.create({
        data: {
          userId: user.id,
          name: storeName,
          slug,
          email: user.email,
          description: data.storeDescription || '',
          status: storeStatus,
          isActive: autoApprove,
          verified: autoApprove,
        },
      });
    }

    // Send email verification (non-blocking)
    this.emailVerificationService
      .sendEmailVerification(user.id, user.email, user.firstName)
      .catch((err) => {
        console.error('Failed to send verification email:', err);
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
  async login(dto: LoginDto, ipAddress: string, userAgent: string, cookieHeader?: string) {
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
    let deviceAlreadyTrusted = false;
    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode && !dto.backupCode) {
        // Before asking for 2FA, check if this device is already trusted
        const rawTrustToken = this.trustedDeviceService.parseTrustTokenFromCookie(cookieHeader);
        if (rawTrustToken) {
          const trusted = await this.trustedDeviceService.validateTrustedDevice(
            user.id,
            rawTrustToken
          );
          if (trusted) {
            deviceAlreadyTrusted = true; // skip 2FA verification below
          }
        }

        if (!deviceAlreadyTrusted) {
          return {
            requires2FA: true,
            userId: user.id,
          };
        }
      }

      if (!deviceAlreadyTrusted) {
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
    }

    // --- 2FA enforcement check (v2.12.0) ---
    // After credentials are verified, check if 2FA is required and the grace period has expired.
    const enforcement = await this.check2FAEnforcement(user);
    if (enforcement.hardBlock) {
      // Issue a short-lived setup-only JWT so the user can set up 2FA
      const setupToken = this.jwtService.sign(
        { sub: user.id, email: user.email, role: user.role, setup_only: true },
        { expiresIn: '15m' }
      );
      const setupUrl = user.role === 'SELLER' ? '/seller/security' : '/admin/account/security';
      throw new HttpException(
        {
          statusCode: 403,
          message:
            'Two-factor authentication is required. Your grace period has expired. Please set up 2FA to continue.',
          code: '2FA_GRACE_EXPIRED',
          setupToken,
          setupUrl,
        },
        HttpStatus.FORBIDDEN
      );
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
    const { token: sessionToken, id: sessionId } = await this.sessionService.createSession(
      user.id,
      ipAddress,
      userAgent,
      dto.rememberMe || false
    );

    // Generate JWT
    const accessToken = this.generateJWT(user, sessionId);

    // --- Device trust (v2.12.0) ---
    // Only issue a trust token when the user explicitly used 2FA (TOTP or backup code)
    // so that the device token is tied to a 2FA-verified session.
    let deviceTrustToken: string | undefined;
    if (
      dto.trustDevice &&
      user.twoFactorEnabled &&
      !deviceAlreadyTrusted &&
      (dto.twoFactorCode || dto.backupCode)
    ) {
      try {
        const durationDays = await this.getDeviceTrustDurationDays();
        deviceTrustToken = this.trustedDeviceService.generateRawToken();
        await this.trustedDeviceService.createTrustedDevice(
          user.id,
          deviceTrustToken,
          userAgent,
          ipAddress,
          durationDays
        );
      } catch (err) {
        // Non-fatal — device trust failure must not block login
        this.logger.error('Failed to create trusted device record', err);
        deviceTrustToken = undefined;
      }
    }

    // Log successful login
    this.logger.logAuthEvent('login', user.id, {
      email: user.email,
      ipAddress,
      has2FA: user.twoFactorEnabled,
      rememberMe: dto.rememberMe || false,
      deviceTrusted: !!deviceTrustToken,
    });

    const response: Record<string, unknown> = {
      accessToken,
      sessionToken,
      user: this.sanitizeUser(user),
      message: 'Login successful',
    };

    if (enforcement.graceDaysRemaining !== undefined) {
      response.twoFactorGraceWarning = {
        daysRemaining: enforcement.graceDaysRemaining,
        setupUrl: user.role === 'SELLER' ? '/seller/security' : '/admin/account/security',
      };
    }

    // deviceTrustToken is passed to the controller which sets it as httpOnly cookie.
    // Keep it in the service response temporarily; the controller will strip it before
    // sending the JSON to the client.
    if (deviceTrustToken) {
      response.deviceTrustToken = deviceTrustToken;
    }

    return response;
  }

  /**
   * Check if 2FA enforcement is required for the given user.
   * Returns hardBlock=true when the grace period has expired.
   */
  private async check2FAEnforcement(user: any): Promise<{
    hardBlock: boolean;
    graceDaysRemaining?: number;
  }> {
    if (!ENFORCED_ROLES.has(user.role)) return { hardBlock: false };
    if (user.twoFactorEnabled) return { hardBlock: false };

    const required = await this.isRequiredForRole(user.role);
    if (!required) return { hardBlock: false };

    // $queryRaw because twoFactorGracePeriodStartsAt is not yet in Prisma client types
    const rows = await this.prisma.$queryRaw<
      {
        twoFactorGracePeriodStartsAt: Date | null;
        createdAt: Date;
      }[]
    >`
      SELECT "twoFactorGracePeriodStartsAt", "createdAt" FROM users WHERE id = ${user.id} LIMIT 1
    `;

    const dbUser = rows[0];
    const graceDays = await this.getGraceDays(dbUser?.createdAt);

    if (!dbUser?.twoFactorGracePeriodStartsAt) {
      await this.prisma.$executeRaw`
        UPDATE users SET "twoFactorGracePeriodStartsAt" = NOW() WHERE id = ${user.id}
      `;
      return { hardBlock: false, graceDaysRemaining: graceDays };
    }

    const graceExpiry = new Date(
      dbUser.twoFactorGracePeriodStartsAt.getTime() + graceDays * 24 * 60 * 60 * 1000
    );

    if (new Date() < graceExpiry) {
      const msRemaining = graceExpiry.getTime() - Date.now();
      const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
      return { hardBlock: false, graceDaysRemaining: daysRemaining };
    }

    return { hardBlock: true };
  }

  private async isRequiredForRole(role: string): Promise<boolean> {
    const keyMap: Record<string, string> = {
      SELLER: '2fa_required_for_seller',
      ADMIN: '2fa_required_for_admin_v2',
      SUPER_ADMIN: '2fa_required_for_admin_v2',
      DELIVERY_PARTNER: '2fa_required_for_delivery_partner',
    };
    const defaultMap: Record<string, boolean> = {
      SELLER: SETTING_DEFAULTS.twoFactor.required_for_seller,
      ADMIN: SETTING_DEFAULTS.twoFactor.required_for_admin_v2,
      SUPER_ADMIN: SETTING_DEFAULTS.twoFactor.required_for_admin_v2,
      DELIVERY_PARTNER: SETTING_DEFAULTS.twoFactor.required_for_delivery_partner,
    };
    try {
      const key = keyMap[role];
      if (!key) return false;
      const setting = await this.settingsService.getSetting(key);
      return setting.value === true || setting.value === 'true';
    } catch {
      return defaultMap[role] ?? false;
    }
  }

  private async getGraceDays(createdAt?: Date): Promise<number> {
    const featureRolloutDate = new Date('2026-05-08');
    const isNew = createdAt ? createdAt > featureRolloutDate : false;
    const key = isNew ? '2fa_grace_period_days_new' : '2fa_grace_period_days_existing';
    const fallback = isNew
      ? SETTING_DEFAULTS.twoFactor.grace_period_days_new
      : SETTING_DEFAULTS.twoFactor.grace_period_days_existing;
    try {
      const setting = await this.settingsService.getSetting(key);
      const days = Number(setting.value);
      return isNaN(days) ? fallback : days;
    } catch {
      return fallback;
    }
  }

  private async getDeviceTrustDurationDays(): Promise<number> {
    try {
      const setting = await this.settingsService.getSetting('2fa_device_trust_duration_days');
      const days = Number(setting.value);
      return isNaN(days) ? SETTING_DEFAULTS.twoFactor.device_trust_duration_days : days;
    } catch {
      return SETTING_DEFAULTS.twoFactor.device_trust_duration_days;
    }
  }

  /**
   * Check rate limiting for login attempts
   */
  private async checkRateLimit(email: string, ipAddress: string) {
    let maxLoginAttempts = this.MAX_LOGIN_ATTEMPTS_DEFAULT;
    try {
      const setting = await this.settingsService.getSetting('max_login_attempts');
      if (setting?.value !== null && setting?.value !== undefined) {
        const parsed = Number(setting.value);
        if (!isNaN(parsed) && parsed > 0) {
          maxLoginAttempts = parsed;
        }
      }
    } catch {
      // Use fallback silently
    }

    const recentAttempts = await this.prisma.loginAttempt.findMany({
      where: {
        OR: [{ email }, { ipAddress }],
        createdAt: {
          gte: new Date(Date.now() - this.LOCKOUT_DURATION),
        },
      },
    });

    const failedAttempts = recentAttempts.filter((attempt) => !attempt.success);

    if (failedAttempts.length >= maxLoginAttempts) {
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
  private generateJWT(user: any, sessionId?: string) {
    const payload: Record<string, unknown> = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    if (sessionId) payload.session_id = sessionId;

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
