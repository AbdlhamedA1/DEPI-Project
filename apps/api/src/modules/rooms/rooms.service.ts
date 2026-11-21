import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomsService {
  async findByUnit(unitId: string) {
    return [
      { id: 'room-1', unitId, roomNumber: '1', capacityBeds: 2, hasAc: true },
      { id: 'room-2', unitId, roomNumber: '2', capacityBeds: 1, hasAc: false },
    ];
  }
}
