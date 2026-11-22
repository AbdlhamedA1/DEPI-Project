import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get(':entityType/:entityId')
  @ApiOperation({
    summary: 'Get current availability state and date ranges for accommodation tier',
  })
  getStatus(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.availabilityService.getStatus(entityType, entityId);
  }

  @Put(':entityType/:entityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update manual availability status (e.g. MAINTENANCE or UNAVAILABLE)' })
  updateStatus(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body('status') status: any,
    @Body('availableFrom') availableFrom?: string,
    @Body('availableTo') availableTo?: string,
  ) {
    return this.availabilityService.setStatus(
      entityType,
      entityId,
      status,
      availableFrom,
      availableTo,
    );
  }
}
