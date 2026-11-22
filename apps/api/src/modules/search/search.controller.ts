import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto, SearchMapQueryDto } from './dto/search.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter student housing listings with proximity ranking' })
  @ApiResponse({ status: 200, description: 'Paginated search results' })
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }

  @Get('map')
  @ApiOperation({
    summary: 'Map search returning coordinate pins with price badges within bounding box',
  })
  @ApiResponse({ status: 200, description: 'List of map pins' })
  getMapPins(@Query() query: SearchMapQueryDto) {
    return this.searchService.getMapPins(query);
  }
}
