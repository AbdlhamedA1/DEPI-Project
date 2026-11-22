import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LocationsService } from './locations.service';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('governorates')
  @ApiOperation({ summary: 'Get list of supported Egyptian governorates' })
  getGovernorates() {
    return this.locationsService.getGovernorates();
  }

  @Get('cities')
  @ApiOperation({ summary: 'Get list of active Egyptian cities' })
  getCities() {
    return this.locationsService.getCities();
  }

  @Get('cities/:cityId/areas')
  @ApiOperation({ summary: 'Get neighborhoods/areas within a city' })
  getAreas(@Param('cityId') cityId: string) {
    return this.locationsService.getAreasByCity(cityId);
  }
}
