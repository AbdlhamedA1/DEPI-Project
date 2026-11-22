import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AgreementsService } from './agreements.service';

@ApiTags('Agreements')
@Controller('agreements')
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Get('booking-request/:requestId')
  @ApiOperation({ summary: 'Get agreement details for booking request' })
  findByRequestId(@Param('requestId') requestId: string) {
    return this.agreementsService.findByRequestId(requestId);
  }

  @Post(':requestId/confirm')
  @ApiOperation({ summary: 'Confirm agreement for booking request' })
  confirm(@Param('requestId') requestId: string, @Body() body: any, @Req() req: any) {
    return this.agreementsService.confirm(requestId, req.user, body);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm agreement by payload (legacy / form post)' })
  confirmByPayload(@Body() body: any, @Req() req: any) {
    const requestId = body.bookingRequestId || body.requestId;
    return this.agreementsService.confirm(requestId, req.user, body);
  }
}
