import { Injectable, Inject, Optional, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { EGYPT_LOCATIONS_DATA } from '../../database/seeds/seed-locations-universities';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {}

  async getGovernorates() {
    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT DISTINCT governorate_ar as "nameAr", governorate_en as "nameEn" FROM cities ORDER BY governorate_en`,
        );
        if (res.rows.length > 0) {
          return res.rows;
        }
      } catch (err: any) {
        // Fall back
      }
    }
    return [
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
        districts: ['مدينة نصر', 'العباسية', 'القاهرة الجديدة'],
      },
      {
        code: 'ALX',
        nameAr: 'الإسكندرية',
        nameEn: 'Alexandria',
        districts: ['الشاطبي', 'سيدي جابر'],
      },
      { code: 'DKH', nameAr: 'الدقهلية', nameEn: 'Dakahlia', districts: ['حي الجامعة'] },
      { code: 'AST', nameAr: 'أسيوط', nameEn: 'Assiut', districts: ['حي الجامعة'] },
    ];
  }

  async getCities() {
    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, name_ar as "nameAr", name_en as "nameEn",
                  governorate_ar as "governorateAr", governorate_en as "governorateEn",
                  is_active as "isActive"
           FROM cities WHERE is_active = true ORDER BY name_en`,
        );
        if (res.rows.length > 0) {
          return res.rows;
        }
      } catch (err: any) {
        // Fall back
      }
    }
    return EGYPT_LOCATIONS_DATA.cities.map(c => ({
      id: c.id,
      nameAr: c.nameAr,
      nameEn: c.nameEn,
      governorateAr: c.governorateAr,
      governorateEn: c.governorateEn,
      isActive: true,
    }));
  }

  async getAreasByCity(cityId: string) {
    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, city_id as "cityId", name_ar as "nameAr", name_en as "nameEn",
                  center_latitude as "centerLatitude", center_longitude as "centerLongitude",
                  is_active as "isActive"
           FROM areas WHERE city_id = $1 AND is_active = true ORDER BY name_en`,
          [cityId],
        );
        if (res.rows.length > 0) {
          return res.rows;
        }
      } catch (err: any) {
        // Fall back
      }
    }

    const city = EGYPT_LOCATIONS_DATA.cities.find(
      c => c.id === cityId || c.nameEn.toLowerCase() === cityId.toLowerCase(),
    );
    return city ? city.areas : [];
  }
}
