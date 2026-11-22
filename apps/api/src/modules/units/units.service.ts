import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../../database/database.module';

export interface PropertyUnitRecord {
  id: string;
  propertyId: string;
  unitNumber: string;
  floorNumber: number;
  totalRooms: number;
  totalBathrooms: number;
  furnishedStatus?: string;
  hasKitchen?: boolean;
  hasLivingRoom?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UnitsService {
  private readonly units: PropertyUnitRecord[] = [
    {
      id: 'unit-1',
      propertyId: 'prop-1',
      unitNumber: 'Apt 1',
      floorNumber: 1,
      totalRooms: 3,
      totalBathrooms: 2,
      furnishedStatus: 'FURNISHED',
      hasKitchen: true,
      hasLivingRoom: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'unit-2',
      propertyId: 'prop-1',
      unitNumber: 'Apt 2',
      floorNumber: 2,
      totalRooms: 2,
      totalBathrooms: 1,
      furnishedStatus: 'FURNISHED',
      hasKitchen: true,
      hasLivingRoom: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  constructor(
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {}

  async findByProperty(propertyId: string): Promise<PropertyUnitRecord[]> {
    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, property_id as "propertyId", unit_number as "unitNumber",
                  floor_number as "floorNumber", total_rooms as "totalRooms",
                  total_bathrooms as "totalBathrooms", created_at as "createdAt"
           FROM property_units WHERE property_id = $1 ORDER BY unit_number`,
          [propertyId],
        );
        if (res.rows.length > 0) return res.rows;
      } catch {}
    }
    return this.units.filter(u => u.propertyId === propertyId);
  }

  async findById(id: string): Promise<PropertyUnitRecord> {
    const unit = this.units.find(u => u.id === id);
    if (!unit) throw new NotFoundException('الوحدة السكنية غير موجودة');
    return unit;
  }

  async create(propertyId: string, data: any): Promise<PropertyUnitRecord> {
    const id = randomUUID();
    const newUnit: PropertyUnitRecord = {
      id,
      propertyId,
      unitNumber: data.unitNumber || `Unit-${this.units.length + 1}`,
      floorNumber: data.floorNumber || data.floor || 1,
      totalRooms: data.totalRooms || 1,
      totalBathrooms: data.totalBathrooms || data.bathroomsCount || 1,
      furnishedStatus: data.furnishedStatus || 'FURNISHED',
      hasKitchen: data.hasKitchen ?? true,
      hasLivingRoom: data.hasLivingRoom ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.units.push(newUnit);

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO property_units (id, property_id, unit_number, floor_number, total_rooms, total_bathrooms, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            newUnit.id,
            propertyId,
            newUnit.unitNumber,
            newUnit.floorNumber,
            newUnit.totalRooms,
            newUnit.totalBathrooms,
            newUnit.createdAt,
          ],
        );
      } catch {}
    }

    return newUnit;
  }

  async update(id: string, data: any): Promise<PropertyUnitRecord> {
    const unit = await this.findById(id);
    Object.assign(unit, data, { updatedAt: new Date() });
    return unit;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.units.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.units.splice(idx, 1);
      return true;
    }
    return false;
  }
}
