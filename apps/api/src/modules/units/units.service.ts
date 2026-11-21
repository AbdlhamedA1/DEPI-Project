import { Injectable } from '@nestjs/common';

@Injectable()
export class UnitsService {
  async findByProperty(propertyId: string) {
    return [
      { id: 'unit-1', propertyId, unitNumber: '101', floorNumber: 1, totalRooms: 3 },
      { id: 'unit-2', propertyId, unitNumber: '102', floorNumber: 1, totalRooms: 2 },
    ];
  }
}
