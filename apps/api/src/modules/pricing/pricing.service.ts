import { Injectable } from '@nestjs/common';

@Injectable()
export class PricingService {
  async getPricing(targetType: string, targetId: string) {
    return {
      targetType,
      targetId,
      amountEgp: 2500,
      durationUnit: 'MONTHLY',
      depositAmountEgp: 2500,
      billsIncluded: true,
    };
  }
}
