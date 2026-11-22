import {
  PropertyType,
  GenderPolicy,
  DurationUnit,
  SearchSortOption,
  SearchPropertyCardDto,
  SearchMapPinDto,
} from '@repo/shared-types';

export type SearchViewMode = 'cards' | 'split' | 'map';

export interface SearchFiltersState {
  query?: string;
  universityId?: string;
  governorateId?: string;
  cityId?: string;
  areaId?: string;
  maxDistanceKm?: number;
  minPrice?: number;
  maxPrice?: number;
  durationUnit?: DurationUnit;
  genderPolicy?: GenderPolicy;
  propertyType?: PropertyType;
  sortBy?: SearchSortOption;
}

export type SearchPropertyItem = SearchPropertyCardDto;
export type SearchPinItem = SearchMapPinDto;
