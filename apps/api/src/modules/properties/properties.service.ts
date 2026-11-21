import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class PropertiesService {
  private properties = [
    {
      id: 'prop-1',
      ownerId: 'mock-owner-1',
      titleAr: 'سكن الهدى للطالبات بين السرايات',
      titleEn: 'Al-Huda Girls Residence Dokki',
      propertyType: 'BUILDING',
      genderPolicy: 'FEMALE_ONLY',
      status: 'APPROVED',
      governorate: 'Giza',
      city: 'Dokki',
      district: 'Bayn Al-Sarayat',
      latitude: 30.035,
      longitude: 31.205,
      pricePerMonth: 3500,
    },
  ];

  async findAll() {
    return this.properties;
  }

  async findById(id: string) {
    const prop = this.properties.find(p => p.id === id);
    if (!prop) throw new NotFoundException('Property not found');
    return prop;
  }

  async create(data: any) {
    const newProp = {
      id: `prop-${this.properties.length + 1}`,
      status: 'PENDING_APPROVAL',
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.properties.push(newProp);
    return newProp;
  }
}
