import { Pool } from 'pg';

export interface SeededLocationsData {
  governorates: string[];
  cities: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    governorateAr: string;
    governorateEn: string;
    areas: Array<{
      id: string;
      nameAr: string;
      nameEn: string;
      centerLatitude: number;
      centerLongitude: number;
    }>;
  }>;
  universities: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    governorate: string;
    cityName: string;
    latitude: number;
    longitude: number;
  }>;
}

export const EGYPT_LOCATIONS_DATA: SeededLocationsData = {
  governorates: ['القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'أسيوط'],
  cities: [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      nameAr: 'القاهرة',
      nameEn: 'Cairo',
      governorateAr: 'القاهرة',
      governorateEn: 'Cairo',
      areas: [
        {
          id: 'a1111111-1111-1111-1111-111111111101',
          nameAr: 'مدينة نصر',
          nameEn: 'Nasr City',
          centerLatitude: 30.0561,
          centerLongitude: 31.3439,
        },
        {
          id: 'a1111111-1111-1111-1111-111111111102',
          nameAr: 'العباسية',
          nameEn: 'Abbaseya',
          centerLatitude: 30.0712,
          centerLongitude: 31.2825,
        },
        {
          id: 'a1111111-1111-1111-1111-111111111103',
          nameAr: 'القاهرة الجديدة',
          nameEn: 'New Cairo',
          centerLatitude: 30.0278,
          centerLongitude: 31.4913,
        },
      ],
    },
    {
      id: 'c2222222-2222-2222-2222-222222222222',
      nameAr: 'الجيزة',
      nameEn: 'Giza',
      governorateAr: 'الجيزة',
      governorateEn: 'Giza',
      areas: [
        {
          id: 'a2222222-2222-2222-2222-222222222201',
          nameAr: 'الدقي',
          nameEn: 'Dokki',
          centerLatitude: 30.0385,
          centerLongitude: 31.2119,
        },
        {
          id: 'a2222222-2222-2222-2222-222222222202',
          nameAr: 'المهندسين',
          nameEn: 'Mohandessin',
          centerLatitude: 30.0538,
          centerLongitude: 31.2001,
        },
        {
          id: 'a2222222-2222-2222-2222-222222222203',
          nameAr: 'بين السرايات',
          nameEn: 'Bayn Al-Sarayat',
          centerLatitude: 30.0315,
          centerLongitude: 31.2052,
        },
      ],
    },
    {
      id: 'c3333333-3333-3333-3333-333333333333',
      nameAr: 'الإسكندرية',
      nameEn: 'Alexandria',
      governorateAr: 'الإسكندرية',
      governorateEn: 'Alexandria',
      areas: [
        {
          id: 'a3333333-3333-3333-3333-333333333301',
          nameAr: 'الشاطبي',
          nameEn: 'Shatby',
          centerLatitude: 31.2082,
          centerLongitude: 29.9168,
        },
        {
          id: 'a3333333-3333-3333-3333-333333333302',
          nameAr: 'سيدي جابر',
          nameEn: 'Sidi Gaber',
          centerLatitude: 31.2198,
          centerLongitude: 29.9421,
        },
      ],
    },
    {
      id: 'c4444444-4444-4444-4444-444444444444',
      nameAr: 'المنصورة',
      nameEn: 'Mansoura',
      governorateAr: 'الدقهلية',
      governorateEn: 'Dakahlia',
      areas: [
        {
          id: 'a4444444-4444-4444-4444-444444444401',
          nameAr: 'حي الجامعة',
          nameEn: 'University District',
          centerLatitude: 31.0412,
          centerLongitude: 31.3541,
        },
      ],
    },
    {
      id: 'c5555555-5555-5555-5555-555555555555',
      nameAr: 'أسيوط',
      nameEn: 'Assiut',
      governorateAr: 'أسيوط',
      governorateEn: 'Assiut',
      areas: [
        {
          id: 'a5555555-5555-5555-5555-555555555501',
          nameAr: 'حي الجامعة',
          nameEn: 'University District',
          centerLatitude: 27.1882,
          centerLongitude: 31.1695,
        },
      ],
    },
  ],
  universities: [
    {
      id: 'u1111111-1111-1111-1111-111111111111',
      nameAr: 'جامعة القاهرة',
      nameEn: 'Cairo University',
      governorate: 'الجيزة',
      cityName: 'Giza',
      latitude: 30.0276,
      longitude: 31.2089,
    },
    {
      id: 'u2222222-2222-2222-2222-222222222222',
      nameAr: 'جامعة عين شمس',
      nameEn: 'Ain Shams University',
      governorate: 'القاهرة',
      cityName: 'Cairo',
      latitude: 30.0771,
      longitude: 31.2859,
    },
    {
      id: 'u3333333-3333-3333-3333-333333333333',
      nameAr: 'جامعة الإسكندرية',
      nameEn: 'Alexandria University',
      governorate: 'الإسكندرية',
      cityName: 'Alexandria',
      latitude: 31.2065,
      longitude: 29.9197,
    },
    {
      id: 'u4444444-4444-4444-4444-444444444444',
      nameAr: 'جامعة المنصورة',
      nameEn: 'Mansoura University',
      governorate: 'الدقهلية',
      cityName: 'Mansoura',
      latitude: 31.0425,
      longitude: 31.3562,
    },
    {
      id: 'u5555555-5555-5555-5555-555555555555',
      nameAr: 'جامعة أسيوط',
      nameEn: 'Assiut University',
      governorate: 'أسيوط',
      cityName: 'Assiut',
      latitude: 27.1895,
      longitude: 31.1712,
    },
  ],
};

export async function seedLocationsAndUniversities(pool?: Pool) {
  if (!pool) return EGYPT_LOCATIONS_DATA;

  try {
    // Seed cities
    for (const city of EGYPT_LOCATIONS_DATA.cities) {
      await pool.query(
        `INSERT INTO cities (id, name_ar, name_en, governorate_ar, governorate_en)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name_en) DO UPDATE
         SET name_ar = EXCLUDED.name_ar,
             governorate_ar = EXCLUDED.governorate_ar,
             governorate_en = EXCLUDED.governorate_en`,
        [city.id, city.nameAr, city.nameEn, city.governorateAr, city.governorateEn],
      );

      // Seed areas
      for (const area of city.areas) {
        await pool.query(
          `INSERT INTO areas (id, city_id, name_ar, name_en, center_latitude, center_longitude)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (city_id, name_en) DO UPDATE
           SET name_ar = EXCLUDED.name_ar,
               center_latitude = EXCLUDED.center_latitude,
               center_longitude = EXCLUDED.center_longitude`,
          [area.id, city.id, area.nameAr, area.nameEn, area.centerLatitude, area.centerLongitude],
        );
      }
    }

    // Seed universities
    for (const u of EGYPT_LOCATIONS_DATA.universities) {
      const city = EGYPT_LOCATIONS_DATA.cities.find(c => c.nameEn === u.cityName);
      await pool.query(
        `INSERT INTO universities (id, name_ar, name_en, governorate, latitude, longitude, city_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE
         SET name_ar = EXCLUDED.name_ar,
             name_en = EXCLUDED.name_en,
             governorate = EXCLUDED.governorate,
             latitude = EXCLUDED.latitude,
             longitude = EXCLUDED.longitude,
             city_id = EXCLUDED.city_id`,
        [u.id, u.nameAr, u.nameEn, u.governorate, u.latitude, u.longitude, city?.id || null],
      );
    }
  } catch (err: any) {
    console.warn('Could not seed database tables directly (maybe DB not connected):', err.message);
  }

  return EGYPT_LOCATIONS_DATA;
}
