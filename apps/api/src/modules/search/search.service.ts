import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchService {
  async search(query: any) {
    return {
      total: 1,
      results: [
        {
          id: 'prop-1',
          title: 'سكن طالبات متميز بالقرب من جامعة القاهرة',
          university: 'Cairo University',
          distanceKm: 0.5,
          pricePerMonth: 3500,
          genderPolicy: 'FEMALE_ONLY',
          isVerified: true,
        },
      ],
      filtersApplied: query,
    };
  }
}
