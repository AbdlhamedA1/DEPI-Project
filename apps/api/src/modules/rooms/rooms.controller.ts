import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Rooms')
@Controller()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get('units/:unitId/rooms')
  @ApiOperation({ summary: 'List all rooms in an apartment unit' })
  findByUnit(@Param('unitId') unitId: string) {
    return this.roomsService.findByUnit(unitId);
  }

  @Post('units/:unitId/rooms')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a room to an apartment unit' })
  create(@Param('unitId') unitId: string, @Body() body: any) {
    return this.roomsService.create(unitId, body);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Get room by ID' })
  findById(@Param('id') id: string) {
    return this.roomsService.findById(id);
  }

  @Put('rooms/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update room attributes' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.roomsService.update(id, body);
  }

  @Delete('rooms/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete room' })
  delete(@Param('id') id: string) {
    return this.roomsService.delete(id);
  }
}
