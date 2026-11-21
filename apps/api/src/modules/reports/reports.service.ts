import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
  private reports: any[] = [];

  async create(data: any) {
    const report = {
      id: `rep-${Date.now()}`,
      status: 'PENDING',
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.reports.push(report);
    return report;
  }

  async findAll() {
    return this.reports;
  }
}
