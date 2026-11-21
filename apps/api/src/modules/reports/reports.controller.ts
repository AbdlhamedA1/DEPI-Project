import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'List all incident reports' })
  findAll() {
    return this.reportsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Submit an incident report' })
  create(@Body() body: any) {
    return this.reportsService.create(body);
  }
}
