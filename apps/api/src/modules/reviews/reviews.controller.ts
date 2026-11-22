import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get approved reviews for property' })
  findByProperty(@Param('propertyId') propertyId: string) {
    return this.reviewsService.findByProperty(propertyId);
  }

  @Post()
  @ApiOperation({ summary: 'Submit new review for confirmed booking' })
  create(@Body() body: any, @Req() req: any) {
    return this.reviewsService.create(body, req.user);
  }

  @Post(':id/response')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit single owner rebuttal response to review' })
  createResponse(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.reviewsService.createResponse(id, body, req.user);
  }
}
