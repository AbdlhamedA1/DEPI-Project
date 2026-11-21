import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StudentsService } from './students.service';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get student academic profile' })
  getProfile(@Param('id') id: string) {
    return this.studentsService.getProfile(id);
  }

  @Put(':id/profile')
  @ApiOperation({ summary: 'Update student academic profile' })
  updateProfile(@Param('id') id: string, @Body() body: any) {
    return this.studentsService.updateProfile(id, body);
  }
}
