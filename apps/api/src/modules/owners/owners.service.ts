import { Injectable } from '@nestjs/common';

@Injectable()
export class OwnersService {
  async getProfile(userId: string) {
    return {
      userId,
      providerType: 'INDIVIDUAL_OWNER',
      isVerified: true,
      propertiesCount: 4,
    };
  }
}
