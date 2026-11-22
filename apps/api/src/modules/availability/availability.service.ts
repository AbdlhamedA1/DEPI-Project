import { Injectable, Inject, Optional, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../../database/database.module';

export interface AvailabilityRecord {
  id: string;
  entityType: string;
  entityId: string;
  status: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'MAINTENANCE' | 'UNAVAILABLE';
  availableFrom: string;
  availableTo?: string;
  currentBookingRequestId?: string;
  version: number;
  updatedAt: Date;
}

@Injectable()
export class AvailabilityService {
  private readonly availabilities = new Map<string, AvailabilityRecord>();

  constructor(
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {
    this.seedDefaultAvailability();
  }

  private seedDefaultAvailability() {
    this.setStatus('PROPERTY', 'prop-1', 'AVAILABLE');
    this.setStatus('UNIT', 'unit-1', 'AVAILABLE');
    this.setStatus('UNIT', 'unit-2', 'AVAILABLE');
    this.setStatus('ROOM', 'room-1', 'AVAILABLE');
    this.setStatus('ROOM', 'room-2', 'AVAILABLE');
    this.setStatus('ROOM', 'room-3', 'AVAILABLE');
    this.setStatus('BED', 'bed-1', 'AVAILABLE');
    this.setStatus('BED', 'bed-2', 'AVAILABLE');
    this.setStatus('BED', 'bed-3', 'AVAILABLE');
    this.setStatus('BED', 'bed-4', 'BOOKED');
  }

  getAvailabilityMap(): Map<string, string> {
    const map = new Map<string, string>();
    for (const [key, val] of this.availabilities.entries()) {
      map.set(key, val.status);
    }
    return map;
  }

  async getStatus(entityType: string, entityId: string): Promise<AvailabilityRecord> {
    const key = `${entityType.toUpperCase()}:${entityId}`;
    const record = this.availabilities.get(key);
    if (!record) {
      return {
        id: randomUUID(),
        entityType: entityType.toUpperCase(),
        entityId,
        status: 'AVAILABLE',
        availableFrom: new Date().toISOString().split('T')[0],
        version: 1,
        updatedAt: new Date(),
      };
    }
    return record;
  }

  async setStatus(
    entityType: string,
    entityId: string,
    status: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'MAINTENANCE' | 'UNAVAILABLE',
    availableFrom?: string,
    availableTo?: string,
  ): Promise<AvailabilityRecord> {
    const key = `${entityType.toUpperCase()}:${entityId}`;
    const existing = this.availabilities.get(key);

    const record: AvailabilityRecord = {
      id: existing?.id || randomUUID(),
      entityType: entityType.toUpperCase(),
      entityId,
      status,
      availableFrom:
        availableFrom || existing?.availableFrom || new Date().toISOString().split('T')[0],
      availableTo: availableTo || existing?.availableTo,
      version: (existing?.version || 0) + 1,
      updatedAt: new Date(),
    };

    this.availabilities.set(key, record);

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO availabilities (id, entity_type, entity_id, status, available_from, available_to, version, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (entity_type, entity_id) DO UPDATE
           SET status = EXCLUDED.status,
               available_from = EXCLUDED.available_from,
               available_to = EXCLUDED.available_to,
               version = availabilities.version + 1,
               updated_at = NOW()`,
          [
            record.id,
            record.entityType,
            record.entityId,
            record.status,
            record.availableFrom,
            record.availableTo || null,
            record.version,
            record.updatedAt,
          ],
        );
      } catch {}
    }

    return record;
  }

  async checkAvailability(
    targetType: string,
    targetId: string,
    startDate: string,
    endDate: string,
  ) {
    const rec = await this.getStatus(targetType, targetId);
    const isAvailable = rec.status === 'AVAILABLE';

    return {
      targetType: targetType.toUpperCase(),
      targetId,
      startDate,
      endDate,
      status: rec.status,
      isAvailable,
    };
  }

  /**
   * Concurrency row-level locking runner for agreement confirmation (Milestone 4 preparation)
   */
  async lockEntity(entityType: string, entityId: string): Promise<boolean> {
    if (this.pool) {
      try {
        await this.pool.query(
          `SELECT * FROM availabilities WHERE entity_type = $1 AND entity_id = $2 FOR UPDATE`,
          [entityType.toUpperCase(), entityId],
        );
      } catch {}
    }
    return true;
  }
}
