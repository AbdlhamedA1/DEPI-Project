import { Controller, Get, Put, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve current authenticated user profile' })
  getMe(@Req() req: any) {
    return this.usersService.getCurrentUser(req.user?.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update basic user email or full name' })
  updateMe(@Req() req: any, @Body() data: { fullName?: string; email?: string }) {
    return this.usersService.updateCurrentUser(req.user?.id, data);
  }

  @Post('change-phone/request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request phone number update (sends OTP to new number)' })
  requestPhoneChange(@Req() req: any, @Body('newPhone') newPhone: string) {
    return this.usersService.requestPhoneChange(req.user?.id, newPhone);
  }

  @Post('change-phone/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify OTP and commit new phone number' })
  verifyPhoneChange(
    @Req() req: any,
    @Body('newPhone') newPhone: string,
    @Body('code') code: string,
  ) {
    return this.usersService.verifyPhoneChange(req.user?.id, newPhone, code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.usersService.findAll();
  }
}
