import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../../database/database.module';

export interface BedRecord {
  id: string;
  roomId: string;
  bedCode: string;
  bedNumber?: string;
  bedType: string;
  availabilityStatus: 'AVAILABLE' | 'BOOKED' | 'MAINTENANCE';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class BedsService {
  private readonly beds: BedRecord[] = [
    {
      id: 'bed-1',
      roomId: 'room-1',
      bedCode: 'Bed 1A',
      bedNumber: 'Bed 1A',
      bedType: 'SINGLE',
      availabilityStatus: 'AVAILABLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'bed-2',
      roomId: 'room-1',
      bedCode: 'Bed 1B',
      bedNumber: 'Bed 1B',
      bedType: 'SINGLE',
      availabilityStatus: 'AVAILABLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'bed-3',
      roomId: 'room-3',
      bedCode: 'Bed 3A',
      bedNumber: 'Bed 3A',
      bedType: 'SINGLE',
      availabilityStatus: 'AVAILABLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'bed-4',
      roomId: 'room-3',
      bedCode: 'Bed 3B',
      bedNumber: 'Bed 3B',
      bedType: 'SINGLE',
      availabilityStatus: 'BOOKED',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  constructor(
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {}

  async findByRoom(roomId: string): Promise<BedRecord[]> {
    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, room_id as "roomId", bed_code as "bedCode",
                  availability_status as "availabilityStatus", created_at as "createdAt"
           FROM beds WHERE room_id = $1 ORDER BY bed_code`,
          [roomId],
        );
        if (res.rows.length > 0) return res.rows;
      } catch {}
    }
    return this.beds.filter(b => b.roomId === roomId);
  }

  async findById(id: string): Promise<BedRecord> {
    const bed = this.beds.find(b => b.id === id);
    if (!bed) throw new NotFoundException('السرير غير موجود');
    return bed;
  }

  async create(roomId: string, data: any): Promise<BedRecord> {
    const id = randomUUID();
    const bedCode = data.bedCode || data.bedNumber || `Bed-${this.beds.length + 1}`;
    const newBed: BedRecord = {
      id,
      roomId,
      bedCode,
      bedNumber: bedCode,
      bedType: data.bedType || 'SINGLE',
      availabilityStatus: data.availabilityStatus || 'AVAILABLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.beds.push(newBed);

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO beds (id, room_id, bed_code, availability_status, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [newBed.id, roomId, newBed.bedCode, newBed.availabilityStatus, newBed.createdAt],
        );
      } catch {}
    }

    return newBed;
  }

  async update(id: string, data: any): Promise<BedRecord> {
    const bed = await this.findById(id);
    Object.assign(bed, data, { updatedAt: new Date() });
    return bed;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.beds.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.beds.splice(idx, 1);
      return true;
    }
    return false;
  }
}
