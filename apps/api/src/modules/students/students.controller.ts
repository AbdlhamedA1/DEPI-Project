import { Controller, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current student tenant profile' })
  getMe(@Req() req: any) {
    return this.studentsService.getProfile(req.user?.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current student tenant profile' })
  updateMe(@Req() req: any, @Body() body: any) {
    return this.studentsService.updateProfile(req.user?.id, body);
  }

  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get student tenant dashboard metrics' })
  getDashboard(@Req() req: any) {
    return this.studentsService.getDashboard(req.user?.id);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get student academic profile by ID' })
  getProfile(@Param('id') id: string) {
    return this.studentsService.getProfile(id);
  }

  @Put(':id/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update student academic profile by ID' })
  updateProfile(@Param('id') id: string, @Body() body: any) {
    return this.studentsService.updateProfile(id, body);
  }
}
