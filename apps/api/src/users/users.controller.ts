import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
   * Upload user avatar
   * @route POST /users/avatar
   */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    try {
      const userId = req.user.userId || req.user.id;

      if (!file) {
        return {
          success: false,
          message: 'No file provided',
        };
      }

      const updatedUser = await this.usersService.uploadAvatar(userId, file);
      return updatedUser;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload avatar',
      };
    }
  }

  /**
   * Delete user avatar
   * @route DELETE /users/avatar
   */
  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  async deleteAvatar(@Request() req) {
    try {
      const userId = req.user.userId || req.user.id;
      const updatedUser = await this.usersService.deleteAvatar(userId);
      return updatedUser;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete avatar',
      };
    }
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
        message:
          error instanceof Error ? error.message : 'Failed to update notification preferences',
      };
    }
  }

  /**
   * Delete user account
   * Requires password confirmation for security
   * @route POST /users/delete-account
   */
  @Post('delete-account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Request() req, @Body() body: { password: string }) {
    try {
      const userId = req.user.userId || req.user.id;

      if (!body.password) {
        return {
          success: false,
          message: 'Password is required to delete account',
        };
      }

      const result = await this.usersService.deleteAccount(userId, body.password);
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete account',
      };
    }
  }

  /**
   * Get all active sessions for current user
   * @route GET /users/sessions
   */
  @Get('sessions')
  async getSessions(@Request() req) {
    try {
      const userId = req.user.userId || req.user.id;
      const sessions = await this.usersService.getSessions(userId);
      return {
        success: true,
        data: sessions,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get sessions',
      };
    }
  }

  /**
   * Revoke a specific session
   * @route DELETE /users/sessions/:id
   */
  @Delete('sessions/:id')
  async revokeSession(@Request() req, @Param('id') sessionId: string) {
    try {
      const userId = req.user.userId || req.user.id;
      const result = await this.usersService.revokeSession(userId, sessionId);
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to revoke session',
      };
    }
  }

  /**
   * Revoke all other sessions except current
   * @route POST /users/sessions/revoke-all
   */
  @Post('sessions/revoke-all')
  @HttpCode(HttpStatus.OK)
  async revokeAllSessions(@Request() req, @Body() body: { currentSessionId?: string }) {
    try {
      const userId = req.user.userId || req.user.id;
      const result = await this.usersService.revokeAllSessions(userId, body.currentSessionId);
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to revoke sessions',
      };
    }
  }
}
