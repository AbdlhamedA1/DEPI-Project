import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupportService } from './support.service';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('ticket')
  @ApiOperation({ summary: 'Submit a customer support ticket' })
  submitTicket(@Body() body: any) {
    return this.supportService.submitTicket(body);
  }
}
