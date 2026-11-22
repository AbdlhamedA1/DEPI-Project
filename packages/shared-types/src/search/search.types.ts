import { PropertyType, GenderPolicy, DurationUnit } from '../properties/property.types';

export enum SearchSortOption {
  SUITABILITY = 'SUITABILITY',
  DISTANCE_ASC = 'DISTANCE_ASC',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  NEWEST = 'NEWEST',
}

export interface SearchPropertyCardDto {
  id: string;
  titleAr: string;
  titleEn: string;
  propertyType: PropertyType;
  genderPolicy: GenderPolicy;
  governorate: string;
  city: string;
  district: string;
  streetAddress: string;
  latitude: number;
  longitude: number;
  nearestUniversity?: string;
  distanceToCampusKm: number | null;
  minPriceEgp: number;
  durationUnit: DurationUnit;
  isVerified: boolean;
  coverImage?: string;
  totalAvailableUnits?: number;
  amenities?: string[];
  rules?: string[];
}

export interface SearchMapPinDto {
  id: string;
  titleAr: string;
  titleEn: string;
  latitude: number;
  longitude: number;
  minPriceEgp: number;
  durationUnit: DurationUnit;
  genderPolicy: GenderPolicy;
  propertyType: PropertyType;
  distanceToCampusKm: number | null;
  isVerified: boolean;
  coverImage?: string;
}

export interface SearchQueryParams {
  governorateId?: string;
  cityId?: string;
  areaId?: string;
  universityId?: string;
  maxDistanceKm?: number;
  minPrice?: number;
  maxPrice?: number;
  durationUnit?: DurationUnit;
  genderPolicy?: GenderPolicy;
  propertyType?: PropertyType;
  sortBy?: SearchSortOption;
  page?: number;
  limit?: number;
}

export interface SearchMapQueryParams {
  north?: number;
  south?: number;
  east?: number;
  west?: number;
  universityId?: string;
  maxDistanceKm?: number;
  minPrice?: number;
  maxPrice?: number;
  durationUnit?: DurationUnit;
  genderPolicy?: GenderPolicy;
  propertyType?: PropertyType;
}

export interface SearchResponseDto {
  data: SearchPropertyCardDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filtersApplied: SearchQueryParams;
}
