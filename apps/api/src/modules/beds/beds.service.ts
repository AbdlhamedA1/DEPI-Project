import { Injectable } from '@nestjs/common';

@Injectable()
export class BedsService {
  async findByRoom(roomId: string) {
    return [
      { id: 'bed-1', roomId, bedCode: 'A', availabilityStatus: 'AVAILABLE' },
      { id: 'bed-2', roomId, bedCode: 'B', availabilityStatus: 'BOOKED' },
    ];
  }
}
