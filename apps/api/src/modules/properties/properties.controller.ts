import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all properties' })
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property by id' })
  findById(@Param('id') id: string) {
    return this.propertiesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new property listing' })
  create(@Body() body: any) {
    return this.propertiesService.create(body);
  }
}
