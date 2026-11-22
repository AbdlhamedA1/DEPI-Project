import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PropertyType, GenderPolicy, DurationUnit, SearchSortOption } from '@repo/shared-types';

export class SearchQueryDto {
  @ApiPropertyOptional()
  query?: string;

  @ApiPropertyOptional()
  governorateId?: string;

  @ApiPropertyOptional()
  cityId?: string;

  @ApiPropertyOptional()
  areaId?: string;

  @ApiPropertyOptional()
  universityId?: string;

  @ApiPropertyOptional({ type: Number })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  maxDistanceKm?: number;

  @ApiPropertyOptional({ type: Number })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  minPrice?: number;

  @ApiPropertyOptional({ type: Number })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  maxPrice?: number;

  @ApiPropertyOptional({ enum: DurationUnit })
  durationUnit?: DurationUnit;

  @ApiPropertyOptional({ enum: GenderPolicy })
  genderPolicy?: GenderPolicy;

  @ApiPropertyOptional({ enum: PropertyType })
  propertyType?: PropertyType;

  @ApiPropertyOptional({ enum: SearchSortOption, default: SearchSortOption.SUITABILITY })
  sortBy?: SearchSortOption;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @Transform(({ value }) => (value ? Number(value) : 1))
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 12 })
  @Transform(({ value }) => (value ? Number(value) : 12))
  limit?: number;
}

export class SearchMapQueryDto {
  @ApiPropertyOptional({ type: Number })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  north?: number;

  @ApiPropertyOptional({ type: Number })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  south?: number;

  @ApiPropertyOptional({ type: Number })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  east?: number;

  @ApiPropertyOptional({ type: Number })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  west?: number;

  @ApiPropertyOptional()
  universityId?: string;

  @ApiPropertyOptional({ type: Number })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  maxDistanceKm?: number;

  @ApiPropertyOptional({ type: Number })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  minPrice?: number;

  @ApiPropertyOptional({ type: Number })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  maxPrice?: number;

  @ApiPropertyOptional({ enum: DurationUnit })
  durationUnit?: DurationUnit;

  @ApiPropertyOptional({ enum: GenderPolicy })
  genderPolicy?: GenderPolicy;

  @ApiPropertyOptional({ enum: PropertyType })
  propertyType?: PropertyType;
}
