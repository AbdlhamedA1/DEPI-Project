import { Injectable } from '@nestjs/common';

@Injectable()
export class ReviewsService {
  private reviews = [
    {
      id: 'rev-1',
      propertyId: 'prop-1',
      studentId: 'mock-user-1',
      rating: 5,
      comment: 'سكن ممتاز ونظيف وقريب جداً من الجامعة.',
      isApproved: true,
      createdAt: new Date().toISOString(),
    },
  ];

  async getByProperty(propertyId: string) {
    return this.reviews.filter(r => r.propertyId === propertyId && r.isApproved);
  }

  async create(data: any) {
    const rev = {
      id: `rev-${Date.now()}`,
      isApproved: false,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.reviews.push(rev);
    return rev;
  }
}
