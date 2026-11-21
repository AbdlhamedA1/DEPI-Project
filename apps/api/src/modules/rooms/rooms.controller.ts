import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get('unit/:unitId')
  @ApiOperation({ summary: 'Get rooms for a unit' })
  findByUnit(@Param('unitId') unitId: string) {
    return this.roomsService.findByUnit(unitId);
  }
}
