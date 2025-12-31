import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CartService } from '../cart/cart.service';
import { SettingsService } from '../settings/settings.service';
import { PrismaService } from '../database/prisma.service';

// Account lockout configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private cartService: CartService,
    private settingsService: SettingsService,
    private prisma: PrismaService,
  ) {}

  /**
   * Check if account is locked due to too many failed login attempts
   */
  async isAccountLocked(email: string): Promise<{ locked: boolean; remainingMinutes?: number }> {
    const lockoutTime = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000);

    // Count failed attempts in the lockout window
    const failedAttempts = await this.prisma.loginAttempt.count({
      where: {
        email: email.toLowerCase(),
        success: false,
        createdAt: { gte: lockoutTime },
      },
    });

    if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
      // Find the most recent failed attempt to calculate remaining lockout time
      const lastAttempt = await this.prisma.loginAttempt.findFirst({
        where: {
          email: email.toLowerCase(),
          success: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (lastAttempt) {
        const unlockTime = new Date(lastAttempt.createdAt.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
        const remainingMs = unlockTime.getTime() - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 60000);

        if (remainingMinutes > 0) {
          return { locked: true, remainingMinutes };
        }
      }
    }

    return { locked: false };
  }

  /**
   * Record a login attempt
   */
  async recordLoginAttempt(
    email: string,
    success: boolean,
    ipAddress: string,
    userAgent?: string,
    userId?: string,
    reason?: string
  ): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        success,
        ipAddress,
        userAgent,
        userId,
        reason,
      },
    });
  }

  /**
   * Clear failed login attempts on successful login
   */
  async clearFailedAttempts(email: string): Promise<void> {
    await this.prisma.loginAttempt.deleteMany({
      where: {
        email: email.toLowerCase(),
        success: false,
      },
    });
  }

  /**
   * Get remaining login attempts before lockout
   */
  async getRemainingAttempts(email: string): Promise<number> {
    const lockoutTime = new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000);

    const failedAttempts = await this.prisma.loginAttempt.count({
      where: {
        email: email.toLowerCase(),
        success: false,
        createdAt: { gte: lockoutTime },
      },
    });

    return Math.max(0, MAX_LOGIN_ATTEMPTS - failedAttempts);
  }

  async validateUser(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<any> {
    // Check if account is locked
    const lockStatus = await this.isAccountLocked(email);
    if (lockStatus.locked) {
      await this.recordLoginAttempt(email, false, ipAddress || 'unknown', userAgent, undefined, 'account_locked');
      throw new ForbiddenException(
        `Account is temporarily locked due to too many failed login attempts. Please try again in ${lockStatus.remainingMinutes} minute(s).`
      );
    }

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      await this.recordLoginAttempt(email, false, ipAddress || 'unknown', userAgent, undefined, 'user_not_found');
      const remaining = await this.getRemainingAttempts(email);
      throw new UnauthorizedException(
        remaining > 0
          ? `Invalid credentials. ${remaining} attempt(s) remaining before account lockout.`
          : 'Invalid credentials'
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await this.recordLoginAttempt(email, false, ipAddress || 'unknown', userAgent, user.id, 'invalid_password');
      const remaining = await this.getRemainingAttempts(email);
      throw new UnauthorizedException(
        remaining > 0
          ? `Invalid credentials. ${remaining} attempt(s) remaining before account lockout.`
          : 'Invalid credentials'
      );
    }

    // Clear failed attempts on successful login
    await this.clearFailedAttempts(email);

    // Record successful login
    await this.recordLoginAttempt(email, true, ipAddress || 'unknown', userAgent, user.id);

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any, sessionId?: string, deviceInfo?: {
    ipAddress?: string;
    userAgent?: string;
  }) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Create user session
    let userSession = null;
    try {
      const parsedDevice = this.parseUserAgent(deviceInfo?.userAgent || '');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      userSession = await this.prisma.userSession.create({
        data: {
          userId: user.id,
          token: accessToken,
          deviceName: parsedDevice.deviceName,
          deviceType: parsedDevice.deviceType,
          browser: parsedDevice.browser,
          os: parsedDevice.os,
          ipAddress: deviceInfo?.ipAddress || 'unknown',
          isActive: true,
          lastActiveAt: new Date(),
          expiresAt,
        },
      });
      this.logger.log(`Created session for user ${user.id}`);
    } catch (sessionError) {
      this.logger.error(`Error creating session for user ${user.id}:`, sessionError);
    }

    // Merge guest cart with user cart if sessionId provided
    let cart = null;
    if (sessionId) {
      try {
        cart = await this.cartService.mergeGuestCart(sessionId, user.id);
        this.logger.log(`Merged cart for user ${user.id} from session ${sessionId}`);
      } catch (cartError) {
        this.logger.error(`Error merging cart for user ${user.id}:`, cartError);
      }
    }

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      cart: cart ? {
        id: cart.id,
        itemCount: cart.items?.length || 0,
      } : null,
      sessionId: userSession?.id,
    };
  }

  /**
   * Parse user agent string to extract device info
   */
  private parseUserAgent(userAgent: string): {
    deviceName: string;
    deviceType: string;
    browser: string;
    os: string;
  } {
    let deviceType = 'desktop';
    let browser = 'Unknown';
    let os = 'Unknown';
    let deviceName = 'Unknown Device';

    if (!userAgent) {
      return { deviceName, deviceType, browser, os };
    }

    // Detect device type
    if (/mobile/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      deviceType = 'tablet';
    }

    // Detect browser
    if (/chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent)) {
      browser = 'Chrome';
    } else if (/firefox/i.test(userAgent)) {
      browser = 'Firefox';
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
      browser = 'Safari';
    } else if (/edge|edg/i.test(userAgent)) {
      browser = 'Edge';
    } else if (/opera|opr/i.test(userAgent)) {
      browser = 'Opera';
    } else if (/msie|trident/i.test(userAgent)) {
      browser = 'Internet Explorer';
    }

    // Detect OS
    if (/windows/i.test(userAgent)) {
      os = 'Windows';
    } else if (/macintosh|mac os x/i.test(userAgent)) {
      os = 'macOS';
    } else if (/linux/i.test(userAgent)) {
      os = 'Linux';
    } else if (/android/i.test(userAgent)) {
      os = 'Android';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      os = 'iOS';
    }

    // Create device name
    deviceName = `${browser} on ${os}`;

    return { deviceName, deviceType, browser, os };
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: any;
    sessionId?: string;
    deviceInfo?: {
      ipAddress?: string;
      userAgent?: string;
    };
  }) {
    // Validate password meets requirements
    await this.validatePassword(data.password);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || ('BUYER' as any),
    });

    return this.login(user, data.sessionId, data.deviceInfo);
  }

  /**
   * Get minimum password length from settings
   */
  private async getMinPasswordLength(): Promise<number> {
    try {
      const setting = await this.settingsService.getSetting('password_min_length');
      return Number(setting.value) || 8;
    } catch (error) {
      this.logger.warn('Password min length setting not found, using 8');
      return 8;
    }
  }

  /**
   * Check if password complexity is required from settings
   */
  private async isPasswordComplexityRequired(): Promise<boolean> {
    try {
      const setting = await this.settingsService.getSetting('password_require_complexity');
      return setting.value === 'true' || setting.value === true;
    } catch (error) {
      // Default to requiring complexity for security
      return true;
    }
  }

  /**
   * Validate password meets requirements
   */
  async validatePassword(password: string): Promise<void> {
    const minLength = await this.getMinPasswordLength();
    const requireComplexity = await this.isPasswordComplexityRequired();
    const errors: string[] = [];

    // Check minimum length
    if (password.length < minLength) {
      errors.push(`at least ${minLength} characters`);
    }

    if (requireComplexity) {
      // Check for uppercase letter
      if (!/[A-Z]/.test(password)) {
        errors.push('at least one uppercase letter');
      }

      // Check for lowercase letter
      if (!/[a-z]/.test(password)) {
        errors.push('at least one lowercase letter');
      }

      // Check for number
      if (!/[0-9]/.test(password)) {
        errors.push('at least one number');
      }

      // Check for special character
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(
        `Password must contain: ${errors.join(', ')}`
      );
    }
  }
}
