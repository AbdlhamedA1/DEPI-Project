import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingRequestsService } from './booking-requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Booking Requests')
@Controller('booking-requests')
export class BookingRequestsController {
  constructor(private readonly bookingRequestsService: BookingRequestsService) {}

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get booking requests by student ID' })
  findByStudent(@Param('studentId') studentId: string) {
    return this.bookingRequestsService.findByStudent(studentId);
  }

  @Get('owner/:ownerId')
  @ApiOperation({ summary: 'Get booking requests by owner ID' })
  findByOwner(@Param('ownerId') ownerId: string) {
    return this.bookingRequestsService.findByOwner(ownerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking request by ID' })
  findById(@Param('id') id: string) {
    return this.bookingRequestsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new booking request' })
  create(@Body() body: any, @Req() req: any) {
    return this.bookingRequestsService.create(body, req.user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update status of booking request' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('reason') reason?: string,
  ) {
    return this.bookingRequestsService.updateStatus(id, status, reason);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Owner accepts booking request' })
  accept(@Param('id') id: string, @Req() req: any) {
    return this.bookingRequestsService.accept(id, req.user?.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Owner rejects booking request' })
  reject(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
    return this.bookingRequestsService.reject(id, req.user?.id, reason);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Student cancels booking request' })
  cancel(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
    return this.bookingRequestsService.cancel(id, req.user?.id, reason);
  }
}
