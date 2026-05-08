import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SettingsService } from '../../settings/settings.service';
import { PrismaService } from '../../database/prisma.service';
import { TrustedDeviceService } from '../services/trusted-device.service';
import { SKIP_TWO_FACTOR_CHECK_KEY } from '../decorators/skip-two-factor-check.decorator';
import { SETTING_DEFAULTS } from '../../settings/settings.defaults';

const ENFORCED_ROLES = new Set(['SELLER', 'ADMIN', 'SUPER_ADMIN', 'DELIVERY_PARTNER']);

/**
 * TwoFactorEnforcementGuard (v2.12.0)
 *
 * Replaces Admin2FAGuard. Enforces 2FA for SELLER, ADMIN, SUPER_ADMIN,
 * and DELIVERY_PARTNER with a configurable grace period.
 *
 * Grace period logic:
 *  - First login without 2FA → starts the clock, allows through
 *  - Within grace period → allows through with warning attached to request
 *  - Grace period expired → 403 FORBIDDEN
 *
 * Trusted device flow:
 *  - Validates httpOnly cookie `device_trust_token` against DB
 *  - If valid and not expired → allows through without 2FA
 *
 * Setup-only JWT:
 *  - If JWT payload contains setup_only=true (issued by login when grace expired)
 *  - Only allows paths containing /auth/2fa/
 */
@Injectable()
export class TwoFactorEnforcementGuard implements CanActivate {
  private readonly logger = new Logger(TwoFactorEnforcementGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly settingsService: SettingsService,
    private readonly prisma: PrismaService,
    private readonly trustedDeviceService: TrustedDeviceService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Unauthenticated — handled by JwtAuthGuard
    if (!user) return true;

    // Route explicitly opted out
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TWO_FACTOR_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    // Setup-only JWT: only /auth/2fa/* allowed
    if (user.setupOnly) {
      const path: string = request.path || '';
      if (!path.includes('/auth/2fa')) {
        throw new ForbiddenException({
          statusCode: 403,
          message: 'You must set up two-factor authentication before accessing other resources.',
          code: 'SETUP_2FA_REQUIRED',
          setupUrl: '/account/security',
        });
      }
      return true;
    }

    // Only enforce for designated roles
    if (!ENFORCED_ROLES.has(user.role)) return true;

    // Check if enforcement is enabled for this role
    const required = await this.isRequiredForRole(user.role);
    if (!required) return true;

    // Fetch current 2FA state and grace period from DB
    // (uses $queryRaw because twoFactorGracePeriodStartsAt is a new column
    //  not yet in the generated Prisma client types)
    const rows = await this.prisma.$queryRaw<
      {
        twoFactorEnabled: boolean;
        twoFactorGracePeriodStartsAt: Date | null;
        createdAt: Date;
      }[]
    >`
      SELECT "twoFactorEnabled", "twoFactorGracePeriodStartsAt", "createdAt"
      FROM users WHERE id = ${user.id} LIMIT 1
    `;

    const dbUser = rows[0];
    if (!dbUser) return true;

    // User already has 2FA set up — allow
    if (dbUser.twoFactorEnabled) return true;

    // Check trusted device cookie
    const cookieHeader = request.headers['cookie'] as string | undefined;
    const rawToken = this.trustedDeviceService.parseTrustTokenFromCookie(cookieHeader);
    if (rawToken) {
      const trusted = await this.trustedDeviceService.validateTrustedDevice(user.id, rawToken);
      if (trusted) return true;
    }

    // Grace period logic
    const graceDays = await this.getGraceDays(user.role, dbUser.createdAt);

    if (!dbUser.twoFactorGracePeriodStartsAt) {
      // First time hitting enforcement — start the grace period clock
      await this.prisma.$executeRaw`
        UPDATE users SET "twoFactorGracePeriodStartsAt" = NOW() WHERE id = ${user.id}
      `;
      request.twoFactorGraceWarning = { daysRemaining: graceDays };
      return true;
    }

    const graceExpiry = new Date(
      dbUser.twoFactorGracePeriodStartsAt.getTime() + graceDays * 24 * 60 * 60 * 1000
    );

    if (new Date() < graceExpiry) {
      const msRemaining = graceExpiry.getTime() - Date.now();
      const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
      request.twoFactorGraceWarning = { daysRemaining };
      return true;
    }

    // Grace period expired — hard block
    this.logger.warn(`2FA grace expired for user ${user.id} (role: ${user.role})`);
    const setupUrl = user.role === 'SELLER' ? '/seller/security' : '/admin/account/security';
    throw new ForbiddenException({
      statusCode: 403,
      message:
        'Two-factor authentication is required. Your grace period has expired. Please enable 2FA to continue.',
      code: '2FA_GRACE_EXPIRED',
      setupUrl,
    });
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

  private async getGraceDays(role: string, createdAt: Date): Promise<number> {
    // Accounts created after the v2.12.0 rollout use the "new user" grace period
    const featureRolloutDate = new Date('2026-05-08');
    const isNew = createdAt > featureRolloutDate;
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
}
