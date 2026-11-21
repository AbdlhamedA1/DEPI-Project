import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AgreementsService } from './agreements.service';

@ApiTags('Agreements')
@Controller('agreements')
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Get('request/:requestId')
  @ApiOperation({ summary: 'Get rental agreement confirmation by request id' })
  findByRequestId(@Param('requestId') requestId: string) {
    return this.agreementsService.findByRequestId(requestId);
  }

  @Post('request/:requestId/confirm')
  @ApiOperation({ summary: 'Confirm rental agreement' })
  confirm(@Param('requestId') requestId: string) {
    return this.agreementsService.confirm(requestId);
  }
}
