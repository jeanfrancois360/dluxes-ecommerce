import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { MarkAsReadDto } from './dto/notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get user's notifications with pagination
   * GET /notifications?page=1&limit=20&unreadOnly=false
   */
  @Get()
  async getNotifications(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string
  ) {
    const userId = req.user.id;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const filterUnread = unreadOnly === 'true';

    return this.notificationsService.getUserNotifications(userId, {
      page: pageNum,
      limit: limitNum,
      unreadOnly: filterUnread,
    });
  }

  /**
   * Get unread notification count
   * GET /notifications/unread/count
   */
  @Get('unread/count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.id;
    return this.notificationsService.getUnreadCount(userId);
  }

  /**
   * Mark a notification as read
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Request() req,
    @Param('id') notificationId: string,
    @Body() dto: MarkAsReadDto
  ) {
    const userId = req.user.id;
    return this.notificationsService.markAsRead(userId, notificationId, dto.read);
  }

  /**
   * Mark all notifications as read
   * PATCH /notifications/read-all
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req) {
    const userId = req.user.id;
    return this.notificationsService.markAllAsRead(userId);
  }

  /**
   * Delete a notification
   * DELETE /notifications/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(@Request() req, @Param('id') notificationId: string) {
    const userId = req.user.id;
    await this.notificationsService.deleteNotification(userId, notificationId);
  }

  /**
   * Delete all read notifications
   * DELETE /notifications/read
   */
  @Delete('read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReadNotifications(@Request() req) {
    const userId = req.user.id;
    await this.notificationsService.deleteReadNotifications(userId);
  }
}
