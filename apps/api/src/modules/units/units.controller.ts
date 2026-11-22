import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Units')
@Controller()
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get('properties/:propertyId/units')
  @ApiOperation({ summary: 'List all apartment units in a property' })
  findByProperty(@Param('propertyId') propertyId: string) {
    return this.unitsService.findByProperty(propertyId);
  }

  @Post('properties/:propertyId/units')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add apartment unit to a property' })
  create(@Param('propertyId') propertyId: string, @Body() body: any) {
    return this.unitsService.create(propertyId, body);
  }

  @Get('units/:id')
  @ApiOperation({ summary: 'Get apartment unit by ID' })
  findById(@Param('id') id: string) {
    return this.unitsService.findById(id);
  }

  @Put('units/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update apartment unit details' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.unitsService.update(id, body);
  }

  @Delete('units/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete apartment unit' })
  delete(@Param('id') id: string) {
    return this.unitsService.delete(id);
  }
}
