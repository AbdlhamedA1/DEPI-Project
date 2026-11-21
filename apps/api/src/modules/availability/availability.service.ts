import { Injectable } from '@nestjs/common';

@Injectable()
export class AvailabilityService {
  async checkAvailability(
    targetType: string,
    targetId: string,
    startDate: string,
    endDate: string,
  ) {
    return {
      targetType,
      targetId,
      startDate,
      endDate,
      isAvailable: true,
    };
  }
}
