import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UniversitiesService } from './universities.service';

@ApiTags('Universities')
@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all universities in Egypt with optional filtering' })
  @ApiQuery({ name: 'cityId', required: false })
  @ApiQuery({ name: 'governorate', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('cityId') cityId?: string,
    @Query('governorate') governorate?: string,
    @Query('search') search?: string,
  ) {
    return this.universitiesService.findAll({ cityId, governorate, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get university details and campus GPS coordinates by ID' })
  findById(@Param('id') id: string) {
    return this.universitiesService.findById(id);
  }
}
