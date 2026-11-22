import { Injectable, Inject, Optional, Logger, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { EGYPT_LOCATIONS_DATA } from '../../database/seeds/seed-locations-universities';

@Injectable()
export class UniversitiesService {
  private readonly logger = new Logger(UniversitiesService.name);

  constructor(
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {}

  async findAll(params?: { cityId?: string; governorate?: string; search?: string }) {
    if (this.pool) {
      try {
        let query = `
          SELECT id, name_ar as "nameAr", name_en as "nameEn",
                 governorate, latitude, longitude, city_id as "cityId"
          FROM universities
          WHERE 1=1
        `;
        const values: any[] = [];
        let idx = 1;

        if (params?.cityId) {
          query += ` AND city_id = $${idx++}`;
          values.push(params.cityId);
        }
        if (params?.governorate) {
          query += ` AND (governorate ILIKE $${idx} OR governorate = $${idx})`;
          values.push(params.governorate);
          idx++;
        }
        if (params?.search) {
          query += ` AND (name_ar ILIKE $${idx} OR name_en ILIKE $${idx})`;
          values.push(`%${params.search}%`);
          idx++;
        }

        query += ` ORDER BY name_en`;
        const res = await this.pool.query(query, values);
        if (res.rows.length > 0) {
          return res.rows;
        }
      } catch (err: any) {
        // Fall back
      }
    }

    let results = EGYPT_LOCATIONS_DATA.universities.map(u => ({
      id: u.id,
      nameAr: u.nameAr,
      nameEn: u.nameEn,
      governorate: u.governorate,
      latitude: u.latitude,
      longitude: u.longitude,
      cityName: u.cityName,
    }));

    if (params?.search) {
      const q = params.search.toLowerCase();
      results = results.filter(
        u => u.nameAr.toLowerCase().includes(q) || u.nameEn.toLowerCase().includes(q),
      );
    }
    if (params?.governorate) {
      const g = params.governorate.toLowerCase();
      results = results.filter(u => u.governorate.toLowerCase() === g);
    }

    return results;
  }

  async findById(id: string) {
    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, name_ar as "nameAr", name_en as "nameEn",
                  governorate, latitude, longitude, city_id as "cityId"
           FROM universities WHERE id = $1`,
          [id],
        );
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      } catch (err: any) {
        // Fall back
      }
    }

    const univ = EGYPT_LOCATIONS_DATA.universities.find(
      u => u.id === id || u.nameEn.toLowerCase() === id.toLowerCase(),
    );
    if (!univ) {
      // Also match legacy mocked IDs like univ-1
      if (id === 'univ-1') {
        return EGYPT_LOCATIONS_DATA.universities[0];
      }
      if (id === 'univ-2') {
        return EGYPT_LOCATIONS_DATA.universities[1];
      }
      if (id === 'univ-3') {
        return EGYPT_LOCATIONS_DATA.universities[2];
      }
      return null;
    }
    return univ;
  }
}
