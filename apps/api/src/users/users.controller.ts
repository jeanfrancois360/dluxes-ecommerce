import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @Patch('me')
  async updateProfile(@Request() req, @Body() body: any) {
    return this.usersService.update(req.user.userId, body);
  }

  /**
   * Get notification preferences for current user
   * @route GET /users/notification-preferences
   */
  @Get('notification-preferences')
  async getNotificationPreferences(@Request() req) {
    try {
      const userId = req.user.userId || req.user.id;
      const preferences = await this.usersService.getNotificationPreferences(userId);
      return {
        success: true,
        data: preferences,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get notification preferences',
      };
    }
  }

  /**
   * Update notification preferences for current user
   * @route PATCH /users/notification-preferences
   */
  @Patch('notification-preferences')
  async updateNotificationPreferences(@Request() req, @Body() body: any) {
    try {
      const userId = req.user.userId || req.user.id;
      const preferences = await this.usersService.updateNotificationPreferences(userId, body);
      return {
        success: true,
        data: preferences,
        message: 'Notification preferences updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update notification preferences',
      };
    }
  }
}
