import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../../database/database.module';

export interface RoomRecord {
  id: string;
  unitId: string;
  roomNumber: string;
  roomType: 'PRIVATE' | 'SHARED';
  capacity: number;
  hasPrivateBathroom: boolean;
  hasAirConditioning: boolean;
  hasBalcony?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RoomsService {
  private readonly rooms: RoomRecord[] = [
    {
      id: 'room-1',
      unitId: 'unit-1',
      roomNumber: 'Room 101',
      roomType: 'SHARED',
      capacity: 2,
      hasPrivateBathroom: false,
      hasAirConditioning: true,
      hasBalcony: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'room-2',
      unitId: 'unit-1',
      roomNumber: 'Room 102',
      roomType: 'PRIVATE',
      capacity: 1,
      hasPrivateBathroom: true,
      hasAirConditioning: true,
      hasBalcony: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'room-3',
      unitId: 'unit-2',
      roomNumber: 'Room 201',
      roomType: 'SHARED',
      capacity: 2,
      hasPrivateBathroom: false,
      hasAirConditioning: false,
      hasBalcony: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  constructor(
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {}

  async findByUnit(unitId: string): Promise<RoomRecord[]> {
    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, unit_id as "unitId", room_number as "roomNumber",
                  capacity_beds as "capacity", has_balcony as "hasBalcony",
                  has_ac as "hasAirConditioning", created_at as "createdAt"
           FROM rooms WHERE unit_id = $1 ORDER BY room_number`,
          [unitId],
        );
        if (res.rows.length > 0) return res.rows;
      } catch {}
    }
    return this.rooms.filter(r => r.unitId === unitId);
  }

  async findById(id: string): Promise<RoomRecord> {
    const room = this.rooms.find(r => r.id === id);
    if (!room) throw new NotFoundException('الغرفة غير موجودة');
    return room;
  }

  async create(unitId: string, data: any): Promise<RoomRecord> {
    const id = randomUUID();
    const capacity = data.capacity || data.capacityBeds || (data.roomType === 'PRIVATE' ? 1 : 2);
    const roomType = data.roomType || (capacity > 1 ? 'SHARED' : 'PRIVATE');

    const newRoom: RoomRecord = {
      id,
      unitId,
      roomNumber: data.roomNumber || `Room-${this.rooms.length + 1}`,
      roomType,
      capacity,
      hasPrivateBathroom: data.hasPrivateBathroom ?? false,
      hasAirConditioning: data.hasAirConditioning ?? data.hasAc ?? false,
      hasBalcony: data.hasBalcony ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rooms.push(newRoom);

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO rooms (id, unit_id, room_number, capacity_beds, has_balcony, has_ac, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            newRoom.id,
            unitId,
            newRoom.roomNumber,
            newRoom.capacity,
            newRoom.hasBalcony,
            newRoom.hasAirConditioning,
            newRoom.createdAt,
          ],
        );
      } catch {}
    }

    return newRoom;
  }

  async update(id: string, data: any): Promise<RoomRecord> {
    const room = await this.findById(id);
    Object.assign(room, data, { updatedAt: new Date() });
    return room;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.rooms.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.rooms.splice(idx, 1);
      return true;
    }
    return false;
  }
}
