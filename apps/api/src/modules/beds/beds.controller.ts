import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BedsService } from './beds.service';

@ApiTags('Beds')
@Controller('beds')
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Get beds for a room' })
  findByRoom(@Param('roomId') roomId: string) {
    return this.bedsService.findByRoom(roomId);
  }
}
