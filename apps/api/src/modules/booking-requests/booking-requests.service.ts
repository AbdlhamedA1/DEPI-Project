import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class BookingRequestsService {
  private requests = [
    {
      id: 'req-101',
      studentId: 'mock-user-1',
      propertyId: 'prop-1',
      targetType: 'ROOM',
      targetId: 'room-1',
      status: 'PENDING',
      startDate: '2026-09-01',
      endDate: '2027-06-30',
      createdAt: new Date().toISOString(),
    },
  ];

  async findByStudent(studentId: string) {
    return this.requests.filter(r => r.studentId === studentId);
  }

  async findById(id: string) {
    const req = this.requests.find(r => r.id === id);
    if (!req) throw new NotFoundException('Booking request not found');
    return req;
  }

  async create(data: any) {
    const newReq = {
      id: `req-${Date.now()}`,
      status: 'PENDING',
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.requests.push(newReq);
    return newReq;
  }

  async updateStatus(id: string, status: string) {
    const req = await this.findById(id);
    req.status = status;
    return req;
  }
}
