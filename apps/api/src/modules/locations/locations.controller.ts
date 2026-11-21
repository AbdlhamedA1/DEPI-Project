import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LocationsService } from './locations.service';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('governorates')
  @ApiOperation({ summary: 'Get list of supported Egyptian governorates and districts' })
  getGovernorates() {
    return this.locationsService.getGovernorates();
  }
}
