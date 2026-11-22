import { Controller, Get, Patch, Put, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user notifications' })
  getMyNotifications(
    @CurrentUser() user: any,
    @Query('isRead') isRead?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const filter = isRead !== undefined ? { isRead: isRead === 'true' } : undefined;
    return this.notificationsService.getByUser(user.id, {
      ...filter,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notification count for badge' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get notifications by user id (legacy compatibility)' })
  getByUser(@Param('userId') userId: string) {
    return this.notificationsService.getByUser(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read (PATCH)' })
  markAsReadPatch(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markAsRead(id, req.user?.id);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read (PUT)' })
  markAsReadPut(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markAsRead(id, req.user?.id);
  }

  @Put('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
