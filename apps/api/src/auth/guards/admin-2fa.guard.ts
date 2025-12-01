import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SettingsService } from '../../settings/settings.service';
import { PrismaService } from '../../database/prisma.service';

/**
 * Admin 2FA Guard
 * Enforces 2FA requirement for admin users when enabled in settings
 */
@Injectable()
export class Admin2FAGuard implements CanActivate {
  private readonly logger = new Logger(Admin2FAGuard.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Only apply to admin routes
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return true; // Not an admin route, allow through
    }

    try {
      // Check if 2FA is required for admins
      const setting = await this.settingsService.getSetting('2fa_required_for_admin');
      const twoFARequired = setting.value === 'true' || setting.value === true;

      if (!twoFARequired) {
        return true; // 2FA not required
      }

      // Check if user has 2FA enabled
      const userRecord = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { twoFactorEnabled: true },
      });

      if (!userRecord?.twoFactorEnabled) {
        this.logger.warn(`Admin ${user.email} attempted access without 2FA enabled`);
        throw new ForbiddenException({
          statusCode: 403,
          message: 'Two-factor authentication is required for admin access. Please enable 2FA in your account settings.',
          requires2FA: true,
          setupUrl: '/admin/account/security',
        });
      }

      this.logger.log(`Admin ${user.email} access granted (2FA verified)`);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // If settings check fails, log error but allow access (fail-open)
      this.logger.error('Failed to check 2FA requirement:', error);
      return true;
    }
  }
}
