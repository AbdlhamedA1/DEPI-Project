import { Controller, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OwnersService } from './owners.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Owners')
@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current provider profile, KYC status, and company details' })
  getMe(@Req() req: any) {
    return this.ownersService.getProfile(req.user?.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update provider profile details' })
  updateMe(@Req() req: any, @Body() body: any) {
    return this.ownersService.updateProfile(req.user?.id, body);
  }

  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get provider portfolio metrics and occupancy stats' })
  getDashboard(@Req() req: any) {
    return this.ownersService.getDashboard(req.user?.id);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get provider profile by ID' })
  getProfile(@Param('id') id: string) {
    return this.ownersService.getProfile(id);
  }
}
