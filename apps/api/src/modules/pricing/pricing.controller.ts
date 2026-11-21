import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PricingService } from './pricing.service';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  @ApiOperation({ summary: 'Get pricing for a target entity' })
  getPricing(@Query('targetType') targetType: string, @Query('targetId') targetId: string) {
    return this.pricingService.getPricing(targetType, targetId);
  }
}
