export const SEARCH_FEATURE_NAME = 'search';
export interface SearchFiltersState {
  universityId?: string;
  genderPolicy?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
}
