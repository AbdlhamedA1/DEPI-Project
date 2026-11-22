import { z } from 'zod';
import { PropertyType, GenderPolicy, DurationUnit, SearchSortOption } from '@repo/shared-types';

export const searchQueryParamsSchema = z.object({
  query: z.string().optional(),
  governorateId: z.string().optional(),
  cityId: z.string().optional(),
  areaId: z.string().optional(),
  universityId: z.string().optional(),
  maxDistanceKm: z.coerce.number().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  durationUnit: z.nativeEnum(DurationUnit).optional(),
  genderPolicy: z.nativeEnum(GenderPolicy).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  sortBy: z.nativeEnum(SearchSortOption).optional().default(SearchSortOption.SUITABILITY),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const searchMapQueryParamsSchema = z.object({
  north: z.coerce.number().optional(),
  south: z.coerce.number().optional(),
  east: z.coerce.number().optional(),
  west: z.coerce.number().optional(),
  universityId: z.string().optional(),
  maxDistanceKm: z.coerce.number().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  durationUnit: z.nativeEnum(DurationUnit).optional(),
  genderPolicy: z.nativeEnum(GenderPolicy).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
});

export type SearchQueryParamsInput = z.infer<typeof searchQueryParamsSchema>;
export type SearchMapQueryParamsInput = z.infer<typeof searchMapQueryParamsSchema>;
