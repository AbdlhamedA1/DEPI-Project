import { Injectable, Logger } from '@nestjs/common';
import {
  PropertyType,
  GenderPolicy,
  DurationUnit,
  SearchSortOption,
  SearchPropertyCardDto,
  SearchMapPinDto,
  SearchResponseDto,
} from '@repo/shared-types';
import { SearchQueryDto, SearchMapQueryDto } from './dto/search.dto';
import { PropertiesService } from '../properties/properties.service';
import { UniversitiesService } from '../universities/universities.service';

/**
 * Computes straight-line distance in kilometers between two coordinates
 * using the spherical Earth Haversine formula (Earth radius R = 6371 km).
 * Per app.txt line 302, uses the main university campus coordinates.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly universitiesService: UniversitiesService,
  ) {}

  /**
   * Multi-filter search endpoint executing objective, transparent ranking algorithm without hidden bias.
   */
  async search(query: SearchQueryDto): Promise<SearchResponseDto> {
    const allProperties = await this.propertiesService.findAll();

    // 1. Filter only APPROVED listings (BR-LST-001)
    let candidates = allProperties.filter(p => p.status === 'APPROVED');

    // 2. Resolve university if requested for proximity calculation
    let targetUniversity: any = null;
    if (query.universityId) {
      targetUniversity = await this.universitiesService.findById(query.universityId);
    }

    // 3. Apply Multi-Parameter Filters
    // Text search query
    if (query.query) {
      const q = query.query.toLowerCase();
      candidates = candidates.filter(
        p =>
          p.titleAr.toLowerCase().includes(q) ||
          p.titleEn.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.streetAddress.toLowerCase().includes(q),
      );
    }

    // City & Area & Governorate
    if (query.governorateId) {
      candidates = candidates.filter(
        p =>
          p.governorate === query.governorateId ||
          p.governorate.toLowerCase() === query.governorateId?.toLowerCase(),
      );
    }
    if (query.cityId) {
      candidates = candidates.filter(
        p => p.cityId === query.cityId || p.city.toLowerCase() === query.cityId?.toLowerCase(),
      );
    }
    if (query.areaId) {
      candidates = candidates.filter(
        p => p.areaId === query.areaId || p.district.toLowerCase() === query.areaId?.toLowerCase(),
      );
    }

    // Gender policy
    if (query.genderPolicy) {
      candidates = candidates.filter(p => p.genderPolicy === query.genderPolicy);
    }

    // Property type
    if (query.propertyType) {
      candidates = candidates.filter(p => p.propertyType === query.propertyType);
    }

    // Budget range (EGP)
    if (query.minPrice !== undefined) {
      candidates = candidates.filter(p => p.pricePerMonth >= Number(query.minPrice));
    }
    if (query.maxPrice !== undefined) {
      candidates = candidates.filter(p => p.pricePerMonth <= Number(query.maxPrice));
    }

    // Map candidate listings to SearchPropertyCardDto with distance calculation
    let cardDtos: SearchPropertyCardDto[] = candidates.map(p => {
      let distanceToCampusKm: number | null = null;
      let nearestUniversityName: string | undefined = undefined;

      if (targetUniversity) {
        distanceToCampusKm = calculateHaversineDistanceKm(
          p.latitude,
          p.longitude,
          targetUniversity.latitude,
          targetUniversity.longitude,
        );
        nearestUniversityName = targetUniversity.nameAr || targetUniversity.nameEn;
      } else if (p.distanceToUniversityKm !== undefined) {
        distanceToCampusKm = p.distanceToUniversityKm;
      }

      const coverImg = p.images?.find(img => img.isCover) || p.images?.[0];

      return {
        id: p.id,
        titleAr: p.titleAr,
        titleEn: p.titleEn,
        propertyType: p.propertyType as PropertyType,
        genderPolicy: p.genderPolicy as GenderPolicy,
        governorate: p.governorate,
        city: p.city,
        district: p.district,
        streetAddress: p.streetAddress,
        latitude: p.latitude,
        longitude: p.longitude,
        nearestUniversity: nearestUniversityName,
        distanceToCampusKm,
        minPriceEgp: p.pricePerMonth,
        durationUnit: DurationUnit.MONTHLY,
        isVerified: p.isVerified ?? true,
        coverImage:
          coverImg?.imageUrl || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5',
        totalAvailableUnits: 2,
        amenities: p.amenities,
        rules: p.rules,
      };
    });

    // Campus radius filter if requested
    if (query.maxDistanceKm !== undefined && targetUniversity) {
      const maxDist = Number(query.maxDistanceKm);
      cardDtos = cardDtos.filter(
        c => c.distanceToCampusKm !== null && c.distanceToCampusKm <= maxDist,
      );
    }

    // 4. Transparent Student Matching Sort (DEC-007)
    const sortBy = query.sortBy || SearchSortOption.SUITABILITY;
    const hasUniv = Boolean(targetUniversity);

    cardDtos.sort((a, b) => {
      switch (sortBy) {
        case SearchSortOption.DISTANCE_ASC:
          return (a.distanceToCampusKm ?? 9999) - (b.distanceToCampusKm ?? 9999);
        case SearchSortOption.PRICE_ASC:
          return a.minPriceEgp - b.minPriceEgp;
        case SearchSortOption.PRICE_DESC:
          return b.minPriceEgp - a.minPriceEgp;
        case SearchSortOption.NEWEST:
          return b.id > a.id ? 1 : -1;
        case SearchSortOption.SUITABILITY:
        default:
          // Level 1: Verified providers prioritized for student trust & safety
          if (a.isVerified !== b.isVerified) {
            return a.isVerified ? -1 : 1;
          }
          // Level 2: Proximity to selected university campus (if university selected)
          if (hasUniv && a.distanceToCampusKm !== null && b.distanceToCampusKm !== null) {
            if (a.distanceToCampusKm !== b.distanceToCampusKm) {
              return a.distanceToCampusKm - b.distanceToCampusKm;
            }
          }
          // Level 3: Base rental price affordability (lowest monthly price first)
          if (a.minPriceEgp !== b.minPriceEgp) {
            return a.minPriceEgp - b.minPriceEgp;
          }
          // Level 4: Deterministic tie-breaker
          return b.id > a.id ? 1 : -1;
      }
    });

    // 5. Pagination
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit || 12)));
    const total = cardDtos.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const pagedResults = cardDtos.slice(startIndex, startIndex + limit);

    return {
      data: pagedResults,
      total,
      page,
      limit,
      totalPages,
      filtersApplied: query,
    };
  }

  /**
   * Map bounding box endpoint returning coordinate pins with price badges and distance.
   */
  async getMapPins(query: SearchMapQueryDto): Promise<SearchMapPinDto[]> {
    const allProperties = await this.propertiesService.findAll();
    let candidates = allProperties.filter(p => p.status === 'APPROVED');

    let targetUniversity: any = null;
    if (query.universityId) {
      targetUniversity = await this.universitiesService.findById(query.universityId);
    }

    // Bounding box filter (north, south, east, west)
    if (
      query.north !== undefined &&
      query.south !== undefined &&
      query.east !== undefined &&
      query.west !== undefined
    ) {
      const north = Number(query.north);
      const south = Number(query.south);
      const east = Number(query.east);
      const west = Number(query.west);

      candidates = candidates.filter(
        p =>
          p.latitude <= north && p.latitude >= south && p.longitude <= east && p.longitude >= west,
      );
    }

    // Gender policy & Property type
    if (query.genderPolicy) {
      candidates = candidates.filter(p => p.genderPolicy === query.genderPolicy);
    }
    if (query.propertyType) {
      candidates = candidates.filter(p => p.propertyType === query.propertyType);
    }
    if (query.minPrice !== undefined) {
      candidates = candidates.filter(p => p.pricePerMonth >= Number(query.minPrice));
    }
    if (query.maxPrice !== undefined) {
      candidates = candidates.filter(p => p.pricePerMonth <= Number(query.maxPrice));
    }

    return candidates.map(p => {
      let distanceToCampusKm: number | null = null;
      if (targetUniversity) {
        distanceToCampusKm = calculateHaversineDistanceKm(
          p.latitude,
          p.longitude,
          targetUniversity.latitude,
          targetUniversity.longitude,
        );
      } else if (p.distanceToUniversityKm !== undefined) {
        distanceToCampusKm = p.distanceToUniversityKm;
      }

      const coverImg = p.images?.find(img => img.isCover) || p.images?.[0];

      return {
        id: p.id,
        titleAr: p.titleAr,
        titleEn: p.titleEn,
        latitude: p.latitude,
        longitude: p.longitude,
        minPriceEgp: p.pricePerMonth,
        durationUnit: DurationUnit.MONTHLY,
        genderPolicy: p.genderPolicy as GenderPolicy,
        propertyType: p.propertyType as PropertyType,
        distanceToCampusKm,
        isVerified: p.isVerified ?? true,
        coverImage: coverImg?.imageUrl,
      };
    });
  }
}
