import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OwnersService } from './owners.service';

@ApiTags('Owners')
@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get owner profile' })
  getProfile(@Param('id') id: string) {
    return this.ownersService.getProfile(id);
  }
}
