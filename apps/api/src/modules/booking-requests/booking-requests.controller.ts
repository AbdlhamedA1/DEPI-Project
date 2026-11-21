import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BookingRequestsService } from './booking-requests.service';

@ApiTags('Booking Requests')
@Controller('booking-requests')
export class BookingRequestsController {
  constructor(private readonly bookingRequestsService: BookingRequestsService) {}

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get booking requests by student' })
  findByStudent(@Param('studentId') studentId: string) {
    return this.bookingRequestsService.findByStudent(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking request by id' })
  findById(@Param('id') id: string) {
    return this.bookingRequestsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new booking request' })
  create(@Body() body: any) {
    return this.bookingRequestsService.create(body);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update status of booking request' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.bookingRequestsService.updateStatus(id, status);
  }
}
