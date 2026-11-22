import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Pool } from 'pg';
import { createHash, randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { UnitsService } from '../units/units.service';
import { RoomsService } from '../rooms/rooms.service';
import { BedsService } from '../beds/beds.service';
import { PricingService } from '../pricing/pricing.service';
import { AvailabilityService } from '../availability/availability.service';
import { AdminService } from '../admin/admin.service';
import { AuthService } from '../auth/auth.service';

export interface PropertyImageRecord {
  id: string;
  propertyId: string;
  cloudinaryPublicId: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption?: string;
  isCover: boolean;
  displayOrder: number;
  createdAt: Date;
}

export interface PropertyRecord {
  id: string;
  ownerId: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  propertyType: string;
  genderPolicy: string;
  status: string;
  cityId?: string;
  areaId?: string;
  governorate: string;
  city: string;
  district: string;
  streetAddress: string;
  buildingNumber?: string;
  floorNumber?: number;
  latitude: number;
  longitude: number;
  nearestUniversityId?: string;
  distanceToUniversityKm?: number;
  amenities: string[];
  rules: string[];
  moderationNote?: string;
  publishedAt?: string;
  pricePerMonth: number;
  isVerified?: boolean;
  images: PropertyImageRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export function isSignificantPropertyEdit(existing: any, updated: any): boolean {
  if (updated.streetAddress && updated.streetAddress !== existing.streetAddress) return true;
  if (updated.buildingNumber && updated.buildingNumber !== existing.buildingNumber) return true;
  if (updated.cityId && updated.cityId !== existing.cityId) return true;
  if (updated.areaId && updated.areaId !== existing.areaId) return true;
  if (
    updated.latitude !== undefined &&
    Math.abs(Number(updated.latitude) - Number(existing.latitude)) > 0.0001
  )
    return true;
  if (
    updated.longitude !== undefined &&
    Math.abs(Number(updated.longitude) - Number(existing.longitude)) > 0.0001
  )
    return true;
  if (updated.genderPolicy && updated.genderPolicy !== existing.genderPolicy) return true;
  if (updated.propertyType && updated.propertyType !== existing.propertyType) return true;
  return false;
}

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);
  private readonly properties: PropertyRecord[] = [];
  private readonly propertyImages: PropertyImageRecord[] = [];

  constructor(
    private readonly unitsService: UnitsService,
    private readonly roomsService: RoomsService,
    private readonly bedsService: BedsService,
    private readonly pricingService: PricingService,
    private readonly availabilityService: AvailabilityService,
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {
    this.seedDefaultProperties();
  }

  private seedDefaultProperties() {
    const prop1: PropertyRecord = {
      id: 'prop-1',
      ownerId: 'mock-owner-1',
      titleAr: 'سكن الهدى للطالبات بين السرايات',
      titleEn: 'Al-Huda Girls Residence Dokki',
      descriptionAr: 'سكن طالبات هادئ ومتميز بالقرب من جامعة القاهرة وبوابة كلية التجارة',
      descriptionEn: 'Quiet female student housing near Cairo University gates',
      propertyType: 'BUILDING',
      genderPolicy: 'FEMALE_ONLY',
      status: 'APPROVED',
      cityId: 'c2222222-2222-2222-2222-222222222222',
      areaId: 'a2222222-2222-2222-2222-222222222203',
      governorate: 'الجيزة',
      city: 'الدقي',
      district: 'بين السرايات',
      streetAddress: '15 شارع بين السرايات الرئيسي',
      buildingNumber: '15',
      floorNumber: 3,
      latitude: 30.035,
      longitude: 31.205,
      nearestUniversityId: 'u1111111-1111-1111-1111-111111111111',
      distanceToUniversityKm: 0.8,
      amenities: ['WIFI', 'AIR_CONDITIONING', 'ELEVATOR', 'BALCONY'],
      rules: ['NO_SMOKING', 'FEMALE_ONLY'],
      publishedAt: '2026-09-01T00:00:00.000Z',
      pricePerMonth: 3500,
      isVerified: true,
      images: [
        {
          id: 'img-1',
          propertyId: 'prop-1',
          cloudinaryPublicId: 'sakany/prop1_cover',
          imageUrl:
            'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
          thumbnailUrl:
            'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=300&q=80',
          caption: 'صورة الواجهة الرئيسية',
          isCover: true,
          displayOrder: 1,
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const prop2: PropertyRecord = {
      id: 'prop-2',
      ownerId: 'mock-owner-2',
      titleAr: 'سكن الشباب بالعباسية بجوار جامعة عين شمس',
      titleEn: 'Ain Shams Youth Residence Abbaseya',
      descriptionAr: 'شقة طلابية واسعة ومجهزة بالكامل بالقرب من جامعة عين شمس ومحطة المترو',
      descriptionEn: 'Spacious student apartment near Ain Shams University & Metro',
      propertyType: 'APARTMENT',
      genderPolicy: 'MALE_ONLY',
      status: 'APPROVED',
      cityId: 'c1111111-1111-1111-1111-111111111111',
      areaId: 'a1111111-1111-1111-1111-111111111102',
      governorate: 'القاهرة',
      city: 'القاهرة',
      district: 'العباسية',
      streetAddress: '42 شارع العباسية الرئيسي',
      buildingNumber: '42',
      floorNumber: 4,
      latitude: 30.075,
      longitude: 31.282,
      nearestUniversityId: 'u2222222-2222-2222-2222-222222222222',
      distanceToUniversityKm: 0.5,
      amenities: ['WIFI', 'ELEVATOR', 'WASHING_MACHINE'],
      rules: ['NO_SMOKING'],
      publishedAt: '2026-09-02T00:00:00.000Z',
      pricePerMonth: 2800,
      isVerified: true,
      images: [
        {
          id: 'img-2',
          propertyId: 'prop-2',
          cloudinaryPublicId: 'sakany/prop2_cover',
          imageUrl:
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          thumbnailUrl:
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=300&q=80',
          caption: 'غرفة المعيشة',
          isCover: true,
          displayOrder: 1,
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const prop3: PropertyRecord = {
      id: 'prop-3',
      ownerId: 'mock-owner-3',
      titleAr: 'سكن الطلاب بالشاطبي الإسكندرية',
      titleEn: 'Alexandria Shatby Student Flat',
      descriptionAr: 'شقة بإطلالة متميزة على بعد خطوات من مجمع كليات الشاطبي جامعة الإسكندرية',
      descriptionEn: 'Prime flat steps away from Alexandria University Shatby campus',
      propertyType: 'APARTMENT',
      genderPolicy: 'MALE_ONLY',
      status: 'APPROVED',
      cityId: 'c3333333-3333-3333-3333-333333333333',
      areaId: 'a3333333-3333-3333-3333-333333333301',
      governorate: 'الإسكندرية',
      city: 'الإسكندرية',
      district: 'الشاطبي',
      streetAddress: '10 طريق الكورنيش - الشاطبي',
      buildingNumber: '10',
      floorNumber: 5,
      latitude: 31.207,
      longitude: 29.918,
      nearestUniversityId: 'u3333333-3333-3333-3333-333333333333',
      distanceToUniversityKm: 0.2,
      amenities: ['WIFI', 'AIR_CONDITIONING', 'BALCONY'],
      rules: ['QUIET_HOURS'],
      publishedAt: '2026-09-03T00:00:00.000Z',
      pricePerMonth: 3200,
      isVerified: true,
      images: [
        {
          id: 'img-3',
          propertyId: 'prop-3',
          cloudinaryPublicId: 'sakany/prop3_cover',
          imageUrl:
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
          thumbnailUrl:
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=300&q=80',
          caption: 'إطلالة الغرفة',
          isCover: true,
          displayOrder: 1,
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.properties.push(prop1, prop2, prop3);
  }

  async findAll(filter?: any) {
    let results = [...this.properties];
    if (filter?.status) {
      results = results.filter(p => p.status === filter.status);
    }
    return results;
  }

  async findById(id: string) {
    const prop = this.properties.find(p => p.id === id);
    if (!prop) throw new NotFoundException('العقار غير موجود');

    const expenses = await this.pricingService.getExpensesByProperty(id);
    return {
      ...prop,
      additionalExpenses: expenses,
    };
  }

  async create(user: any, data: any) {
    // Check provider verification status (BR-PRV-002)
    const isVerified =
      user.role === 'ADMIN' || user.isVerified === true || user.verificationStatus === 'VERIFIED';
    if (!isVerified) {
      throw new ForbiddenException({
        code: 'ERR_PROVIDER_NOT_VERIFIED',
        message: 'يجب توثيق حساب المالك ورفع وثائق الهوية والملكية لتتمكن من إنشاء ونشر العقارات',
      });
    }

    const newId = randomUUID();
    const loc = data.location || {};

    const newProp: PropertyRecord = {
      id: newId,
      ownerId: user.id || 'mock-owner-1',
      titleAr: data.titleAr,
      titleEn: data.titleEn,
      descriptionAr: data.descriptionAr || '',
      descriptionEn: data.descriptionEn || '',
      propertyType: data.propertyType || 'APARTMENT',
      genderPolicy: data.genderPolicy || 'MIXED_FAMILY',
      status: 'PENDING_APPROVAL', // Defaults to PENDING_APPROVAL per BR-LST-001
      cityId: data.cityId || loc.cityId,
      areaId: data.areaId || loc.areaId,
      governorate: data.governorate || loc.governorate || 'القاهرة',
      city: data.city || loc.city || 'القاهرة',
      district: data.district || loc.district || '',
      streetAddress: data.streetAddress || loc.streetName || '',
      buildingNumber: data.buildingNumber || loc.buildingNumber,
      floorNumber: data.floorNumber,
      latitude: Number(data.latitude || loc.latitude || 30.0),
      longitude: Number(data.longitude || loc.longitude || 31.0),
      nearestUniversityId: data.nearestUniversityId || data.primaryUniversityId,
      amenities: data.amenities || data.amenityKeys || [],
      rules: data.rules || [],
      pricePerMonth: Number(data.defaultPricing?.amount || data.pricePerMonth || 2500),
      isVerified: true,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.properties.push(newProp);

    // Register with admin approval queue
    this.adminService.registerPendingProperty(newProp);

    // Save pricing if provided
    if (data.defaultPricing) {
      await this.pricingService.setPricing('PROPERTY', newId, data.defaultPricing);
    }

    // Save nested units if provided in multi-step wizard
    if (Array.isArray(data.units)) {
      for (const u of data.units) {
        const createdUnit = await this.unitsService.create(newId, u);
        if (Array.isArray(u.rooms)) {
          for (const r of u.rooms) {
            const createdRoom = await this.roomsService.create(createdUnit.id, r);
            if (Array.isArray(r.beds)) {
              for (const b of r.beds) {
                await this.bedsService.create(createdRoom.id, b);
              }
            }
          }
        }
      }
    }

    return newProp;
  }

  async update(id: string, user: any, data: any) {
    const prop = await this.findById(id);

    // Check significant edit (BR-LST-002)
    const isSignificant = isSignificantPropertyEdit(prop, data);

    Object.assign(prop, data, { updatedAt: new Date() });

    if (isSignificant && prop.status === 'APPROVED') {
      prop.status = 'PENDING_APPROVAL';
      this.adminService.registerPendingProperty(prop);
      await this.adminService.logAdminAction(
        user?.id || prop.ownerId,
        'LISTING_SIGNIFICANT_EDIT_RESET',
        'PROPERTY',
        id,
        { reason: 'Significant modification to location, coordinates, or property hierarchy' },
      );
    }

    return prop;
  }

  async delete(id: string) {
    const idx = this.properties.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.properties[idx].status = 'INACTIVE';
      return { success: true };
    }
    return { success: false };
  }

  /**
   * Generates deterministic Cloudinary upload signature for direct CDN uploads.
   */
  generateUploadSignature(propertyId: string) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'sakany-cloud';
    const apiKey = process.env.CLOUDINARY_API_KEY || '123456789012345';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'sakany-cloudinary-secret';
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `sakany/properties/${propertyId}`;
    const transformation = 'c_limit,w_2048,h_2048,f_auto,q_auto';

    // Parameters in alphabetical order
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}&transformation=${transformation}${apiSecret}`;
    const signature = createHash('sha1').update(paramsToSign).digest('hex');

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      apiKey,
      timestamp,
      folder,
      transformation,
      signature,
    };
  }

  /**
   * Attaches an uploaded photo to property gallery, enforcing single cover photo.
   */
  async attachImage(propertyId: string, data: any) {
    const prop = await this.findById(propertyId);
    const isCover = data.isCover === true;

    if (isCover) {
      prop.images.forEach(img => (img.isCover = false));
    }

    const newImg: PropertyImageRecord = {
      id: randomUUID(),
      propertyId,
      cloudinaryPublicId: data.cloudinaryPublicId || `img-${Date.now()}`,
      imageUrl: data.imageUrl,
      thumbnailUrl: data.thumbnailUrl || data.imageUrl,
      caption: data.caption,
      isCover: isCover || prop.images.length === 0,
      displayOrder: data.displayOrder || prop.images.length + 1,
      createdAt: new Date(),
    };

    prop.images.push(newImg);
    this.propertyImages.push(newImg);

    return newImg;
  }

  async deleteImage(propertyId: string, imageId: string) {
    const prop = await this.findById(propertyId);
    const idx = prop.images.findIndex(i => i.id === imageId);
    if (idx !== -1) {
      prop.images.splice(idx, 1);
      return { success: true };
    }
    return { success: false };
  }

  /**
   * Computes the 4-tier hierarchical tree with bottom-up capacity aggregation and partial availability.
   */
  async getHierarchy(propertyId: string) {
    const property = await this.findById(propertyId);
    const units = await this.unitsService.findByProperty(propertyId);

    const rates = this.pricingService.getRateMap();
    const availMap = this.availabilityService.getAvailabilityMap();

    const unitNodes: any[] = [];

    for (const u of units) {
      const rooms = await this.roomsService.findByUnit(u.id);
      const roomNodes: any[] = [];

      for (const r of rooms) {
        const beds = await this.bedsService.findByRoom(r.id);

        if (r.roomType === 'PRIVATE' || beds.length === 0) {
          const status = availMap.get(`ROOM:${r.id}`) || 'AVAILABLE';
          const isAvail = status === 'AVAILABLE';
          roomNodes.push({
            id: r.id,
            type: 'ROOM',
            title: r.roomNumber,
            capacity: r.capacity || 1,
            availableCapacity: isAvail ? r.capacity || 1 : 0,
            status,
            pricing: rates.get(`ROOM:${r.id}`),
            children: [],
          });
        } else {
          // Shared room with beds
          const bedNodes = beds.map(b => {
            const bedStatus = availMap.get(`BED:${b.id}`) || b.availabilityStatus || 'AVAILABLE';
            return {
              id: b.id,
              type: 'BED',
              code: b.bedCode,
              capacity: 1,
              availableCapacity: bedStatus === 'AVAILABLE' ? 1 : 0,
              status: bedStatus,
              pricing: rates.get(`BED:${b.id}`),
            };
          });

          const totalBeds = bedNodes.length;
          const freeBeds = bedNodes.reduce((acc, b) => acc + b.availableCapacity, 0);
          const roomStatus =
            freeBeds === 0 ? 'BOOKED' : freeBeds < totalBeds ? 'PARTIALLY_AVAILABLE' : 'AVAILABLE';

          roomNodes.push({
            id: r.id,
            type: 'ROOM',
            title: r.roomNumber,
            capacity: totalBeds,
            availableCapacity: freeBeds,
            status: roomStatus,
            pricing: rates.get(`ROOM:${r.id}`),
            children: bedNodes,
          });
        }
      }

      const totalUnitCap = roomNodes.reduce((acc, r) => acc + r.capacity, 0);
      const freeUnitCap = roomNodes.reduce((acc, r) => acc + r.availableCapacity, 0);
      const unitDirectStatus = availMap.get(`UNIT:${u.id}`);
      const unitStatus =
        unitDirectStatus === 'BOOKED'
          ? 'BOOKED'
          : freeUnitCap === 0
            ? 'BOOKED'
            : freeUnitCap < totalUnitCap
              ? 'PARTIALLY_AVAILABLE'
              : 'AVAILABLE';

      unitNodes.push({
        id: u.id,
        type: 'UNIT',
        code: u.unitNumber,
        capacity: totalUnitCap,
        availableCapacity: unitDirectStatus === 'BOOKED' ? 0 : freeUnitCap,
        status: unitStatus,
        pricing: rates.get(`UNIT:${u.id}`),
        children: roomNodes,
      });
    }

    const totalPropCap = unitNodes.reduce((acc, u) => acc + u.capacity, 0);
    const freePropCap = unitNodes.reduce((acc, u) => acc + u.availableCapacity, 0);
    const propDirectStatus = availMap.get(`PROPERTY:${property.id}`);
    const propStatus =
      propDirectStatus === 'BOOKED'
        ? 'BOOKED'
        : freePropCap === 0
          ? 'BOOKED'
          : freePropCap < totalPropCap
            ? 'PARTIALLY_AVAILABLE'
            : 'AVAILABLE';

    return {
      id: property.id,
      type: 'PROPERTY',
      title: property.titleAr || property.titleEn,
      capacity: totalPropCap,
      availableCapacity: freePropCap,
      status: propStatus,
      pricing: rates.get(`PROPERTY:${property.id}`),
      children: unitNodes,
    };
  }
}
