import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PropertiesModule } from '../properties/properties.module';
import { UniversitiesModule } from '../universities/universities.module';

@Module({
  imports: [PropertiesModule, UniversitiesModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
