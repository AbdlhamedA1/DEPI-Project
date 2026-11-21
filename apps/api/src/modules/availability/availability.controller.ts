import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('check')
  @ApiOperation({ summary: 'Check unit/bed availability for given dates' })
  check(
    @Query('targetType') targetType: string,
    @Query('targetId') targetId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.availabilityService.checkAvailability(targetType, targetId, startDate, endDate);
  }
}
