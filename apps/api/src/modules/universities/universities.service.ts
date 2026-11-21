import { Injectable } from '@nestjs/common';

@Injectable()
export class UniversitiesService {
  private universities = [
    {
      id: 'univ-1',
      nameAr: 'جامعة القاهرة',
      nameEn: 'Cairo University',
      governorate: 'Giza',
      latitude: 30.0261,
      longitude: 31.2118,
    },
    {
      id: 'univ-2',
      nameAr: 'جامعة عين شمس',
      nameEn: 'Ain Shams University',
      governorate: 'Cairo',
      latitude: 30.0766,
      longitude: 31.2854,
    },
    {
      id: 'univ-3',
      nameAr: 'جامعة الإسكندرية',
      nameEn: 'Alexandria University',
      governorate: 'Alexandria',
      latitude: 31.2064,
      longitude: 29.9192,
    },
  ];

  async findAll() {
    return this.universities;
  }

  async findById(id: string) {
    return this.universities.find(u => u.id === id) || null;
  }
}
