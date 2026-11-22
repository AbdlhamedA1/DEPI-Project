import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BedsService } from './beds.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Beds')
@Controller()
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  @Get('rooms/:roomId/beds')
  @ApiOperation({ summary: 'List all beds in a shared room' })
  findByRoom(@Param('roomId') roomId: string) {
    return this.bedsService.findByRoom(roomId);
  }

  @Post('rooms/:roomId/beds')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a bed to a shared room' })
  create(@Param('roomId') roomId: string, @Body() body: any) {
    return this.bedsService.create(roomId, body);
  }

  @Get('beds/:id')
  @ApiOperation({ summary: 'Get bed details by ID' })
  findById(@Param('id') id: string) {
    return this.bedsService.findById(id);
  }

  @Put('beds/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update bed details' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.bedsService.update(id, body);
  }

  @Delete('beds/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete bed' })
  delete(@Param('id') id: string) {
    return this.bedsService.delete(id);
  }
}
