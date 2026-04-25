import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class MaintenanceModeGuard implements CanActivate {
  private readonly logger = new Logger(MaintenanceModeGuard.name);
  private hasLoggedMissingSetting = false;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Check if maintenance mode is enabled
      const setting = await this.settingsService.getSetting('maintenance_mode');
      const isMaintenanceMode = setting.value === 'true' || setting.value === true;

      if (!isMaintenanceMode) {
        return true; // Normal operation
      }

      // Maintenance is ON — check if requester is admin/super_admin.
      // request.user is always null here because JwtAuthGuard hasn't run yet
      // (MaintenanceModeGuard is registered first as APP_GUARD).
      // Manually verify the JWT from the Authorization header instead.
      const request = context.switchToHttp().getRequest();

      // Always allow the settings endpoint so admins can turn maintenance back off via API
      const path: string = request.path || '';
      if (path.includes('/settings/maintenance_mode') || path.includes('/auth/login')) {
        return true;
      }

      try {
        const authHeader: string | undefined = request.headers?.authorization;
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const jwtSecret = this.configService.get<string>('JWT_SECRET');
          const payload = this.jwtService.verify(token, { secret: jwtSecret });
          const role: string | undefined = payload?.role;
          if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
            this.logger.log(`Admin (role=${role}) accessing during maintenance mode — allowed`);
            return true;
          }
        }
      } catch {
        // Invalid or missing token — fall through to block
      }

      // Non-admin during maintenance — return 503
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: 'The site is currently under maintenance. Please try again later.',
        maintenanceMode: true,
      });
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      // Handle missing setting gracefully
      if (error instanceof NotFoundException && error.message?.includes('maintenance_mode')) {
        if (!this.hasLoggedMissingSetting) {
          this.logger.warn(
            'Setting "maintenance_mode" not found in database. Defaulting to maintenance mode OFF.'
          );
          this.hasLoggedMissingSetting = true;
        }
        return true;
      }

      // If settings check fails for other reasons, allow request (fail-open for availability)
      this.logger.error('Failed to check maintenance mode:', error);
      return true;
    }
  }
}
