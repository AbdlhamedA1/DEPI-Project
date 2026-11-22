import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Pricing')
@Controller()
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('pricing/:entityType/:entityId')
  @ApiOperation({ summary: 'Get active rental rate for accommodation tier' })
  getPricing(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.pricingService.getPricing(entityType, entityId);
  }

  @Post('pricing/:entityType/:entityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set or update rental rate for accommodation tier' })
  setPricing(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() body: any,
  ) {
    return this.pricingService.setPricing(entityType, entityId, body);
  }

  @Get('properties/:propertyId/expenses')
  @ApiOperation({ summary: 'List itemized additional expenses for a property' })
  getExpenses(@Param('propertyId') propertyId: string) {
    return this.pricingService.getExpensesByProperty(propertyId);
  }

  @Post('properties/:propertyId/expenses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add itemized additional expense to property' })
  addExpense(@Param('propertyId') propertyId: string, @Body() body: any) {
    return this.pricingService.addExpense(propertyId, body);
  }

  @Delete('expenses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove itemized expense' })
  deleteExpense(@Param('id') id: string) {
    return this.pricingService.deleteExpense(id);
  }

  @Post('pricing/calculate')
  @ApiOperation({ summary: 'Calculate quotation breakdown in EGP' })
  calculateQuote(@Body() body: any) {
    return this.pricingService.calculateQuote(body);
  }
}
