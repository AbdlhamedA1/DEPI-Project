import { Controller, Get, Post, Put, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Messaging')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's conversations" })
  getConversations(@CurrentUser() user: any) {
    return this.messagingService.getConversationsForUser(user.id);
  }

  @Get('conversations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversation details and counterparty contact info' })
  getConversation(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagingService.getConversationById(id, user.id);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get messages in conversation' })
  getMessages(
    @Param('conversationId') conversationId: string,
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const userId = req.user?.id;
    return this.messagingService.getMessages(conversationId, userId, limit, offset);
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Send message in conversation' })
  sendMessage(@Param('conversationId') conversationId: string, @Body() body: any, @Req() req: any) {
    const senderId = req.user?.id || body.senderId || 'mock-user-1';
    const senderRole = req.user?.role || body.senderRole || 'STUDENT';
    const messageText = body.body || body.content || '';
    return this.messagingService.sendMessage(conversationId, senderId, senderRole, messageText);
  }

  @Put('conversations/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark conversation as read' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagingService.markAsRead(id, user.id);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get total unread messages count' })
  getUnreadCount(@CurrentUser() user: any) {
    return this.messagingService.getUnreadCount(user.id);
  }
}
