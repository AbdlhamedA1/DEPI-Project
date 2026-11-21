import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AgreementsService {
  private agreements = [
    {
      id: 'agr-1',
      bookingRequestId: 'req-101',
      monthlyRentEgp: 3500,
      depositEgp: 3500,
      status: 'CONFIRMED',
      confirmedAt: '2026-08-16T12:00:00Z',
    },
  ];

  async findByRequestId(requestId: string) {
    const agr = this.agreements.find(a => a.bookingRequestId === requestId);
    if (!agr) throw new NotFoundException('Agreement not found');
    return agr;
  }

  async confirm(requestId: string) {
    const agr = {
      id: `agr-${Date.now()}`,
      bookingRequestId: requestId,
      monthlyRentEgp: 3500,
      depositEgp: 3500,
      status: 'CONFIRMED',
      confirmedAt: new Date().toISOString(),
    };
    this.agreements.push(agr);
    return agr;
  }
}
