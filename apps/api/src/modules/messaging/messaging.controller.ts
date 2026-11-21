import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';

@ApiTags('Messaging')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  getMessages(@Param('conversationId') conversationId: string) {
    return this.messagingService.getMessages(conversationId);
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Body('senderId') senderId: string,
    @Body('senderRole') senderRole: string,
    @Body('body') body: string,
  ) {
    return this.messagingService.sendMessage(conversationId, senderId, senderRole, body);
  }
}
