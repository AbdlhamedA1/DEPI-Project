import { Injectable } from '@nestjs/common';

@Injectable()
export class LocationsService {
  private governorates = [
    {
      code: 'GZ',
      nameAr: 'الجيزة',
      nameEn: 'Giza',
      districts: ['الدقي', 'المهندسين', 'بين السرايات'],
    },
    {
      code: 'CAI',
      nameAr: 'القاهرة',
      nameEn: 'Cairo',
      districts: ['مدينة نصر', 'العباسية', 'مصر الجديدة'],
    },
    {
      code: 'ALX',
      nameAr: 'الإسكندرية',
      nameEn: 'Alexandria',
      districts: ['الشاطبي', 'سيدي جابر', 'سموحة'],
    },
  ];

  async getGovernorates() {
    return this.governorates;
  }
}
