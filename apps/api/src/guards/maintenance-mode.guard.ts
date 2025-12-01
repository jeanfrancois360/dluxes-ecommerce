import { Injectable, CanActivate, ExecutionContext, ServiceUnavailableException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SettingsService } from '../settings/settings.service';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class MaintenanceModeGuard implements CanActivate {
  private readonly logger = new Logger(MaintenanceModeGuard.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Check if maintenance mode is enabled
      const setting = await this.settingsService.getSetting('maintenance_mode');
      const isMaintenanceMode = setting.value === 'true' || setting.value === true;

      if (!isMaintenanceMode) {
        return true; // Normal operation
      }

      // In maintenance mode - check if user is admin
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      // Allow admins to access during maintenance
      if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
        this.logger.log(`Admin ${user.email} accessing during maintenance mode`);
        return true;
      }

      // Block all other requests
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: 'The site is currently under maintenance. Please try again later.',
        maintenanceMode: true,
      });
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      // If settings check fails, allow request (fail-open for availability)
      this.logger.error('Failed to check maintenance mode:', error);
      return true;
    }
  }
}
