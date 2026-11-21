import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get approved reviews for property' })
  getByProperty(@Param('propertyId') propertyId: string) {
    return this.reviewsService.getByProperty(propertyId);
  }

  @Post()
  @ApiOperation({ summary: 'Submit student review for property' })
  create(@Body() body: any) {
    return this.reviewsService.create(body);
  }
}
