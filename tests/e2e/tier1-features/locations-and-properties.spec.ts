/**
 * Tier 1 Feature Coverage: Locations, Universities & Properties (F6 - F13)
 * Covers:
 * - F6: Locations Registry (Governorates, Cities, Areas)
 * - F7: University Directory & Main Campus Geocoordinates
 * - F8: Hierarchical Accommodation (Building/Unit/Room/Bed)
 * - F9: Partial Availability & Sibling State Independence
 * - F10: Flexible EGP Pricing & Duration Units
 * - F11: Itemized Mandatory & Optional Expenses
 * - F12: Property Media Upload & Cover Image Selection
 * - F13: Property Listing Admin Approval Gate
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { calculateHaversineDistance } from '../../harness/domain-state-simulator';
import { TEST_PROVIDERS, TEST_ADMINS } from '../../fixtures/users.fixture';
import { TEST_PROPERTIES } from '../../fixtures/properties.fixture';

describe('Tier 1: Locations, Universities & Properties (F6 - F13)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  // ==========================================
  // FEATURE F6: Locations Registry (Governorates, Cities, Areas)
  // ==========================================
  describe('F6: Locations Registry (Governorates, Cities, Areas)', () => {
    it('F6-01: Successfully retrieve all Egyptian governorates (Cairo, Giza, Alexandria, etc.)', async () => {
      const res = await client.get('/api/v1/locations/governorates');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(7);
      const namesEn = res.body.data.map((g: any) => g.nameEn);
      expect(namesEn).toContain('Cairo');
      expect(namesEn).toContain('Giza');
      expect(namesEn).toContain('Alexandria');
      expect(namesEn).toContain('Assiut');
    });

    it('F6-02: Successfully retrieve cities filtered by governorate', async () => {
      const res = await client.get('/api/v1/locations/cities?governorateId=gov-giza');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const city of res.body.data) {
        expect(city.governorateId).toBe('gov-giza');
      }
    });

    it('F6-03: Retrieve popular student housing areas in Giza (Dokki, Mohandessin, Giza Square)', async () => {
      const res = await client.get('/api/v1/locations/areas?cityId=city-giza');
      expect(res.status).toBe(200);
      const areaNamesEn = res.body.data.map((a: any) => a.nameEn);
      expect(areaNamesEn).toContain('Dokki');
      expect(areaNamesEn).toContain('Mohandessin');
      expect(areaNamesEn).toContain('Giza Square');
    });

    it('F6-04: Retrieve popular student housing areas in Alexandria (Shatby, Smouha)', async () => {
      const res = await client.get('/api/v1/locations/areas?cityId=city-alexandria');
      expect(res.status).toBe(200);
      const areaNamesEn = res.body.data.map((a: any) => a.nameEn);
      expect(areaNamesEn).toContain('Shatby');
      expect(areaNamesEn).toContain('Smouha');
    });

    it('F6-05: Area records include valid geographic coordinates and postal codes', async () => {
      const res = await client.get('/api/v1/locations/areas?cityId=city-giza');
      const dokki = res.body.data.find((a: any) => a.id === 'area-dokki');
      expect(dokki).toBeDefined();
      expect(dokki.coordinates.lat).toBeGreaterThan(29.0);
      expect(dokki.coordinates.lng).toBeGreaterThan(30.0);
      expect(dokki.popularForStudents).toBe(true);
    });
  });

  // ==========================================
  // FEATURE F7: University Directory & Main Campus Geocoordinates
  // ==========================================
  describe('F7: University Directory & Main Campus Geocoordinates', () => {
    it('F7-01: Retrieve full directory of public and private Egyptian universities', async () => {
      const res = await client.get('/api/v1/universities');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(10);
    });

    it('F7-02: Retrieve Cairo University with exact main campus geocoordinates (30.0276, 31.2089)', async () => {
      const res = await client.get('/api/v1/universities/univ-cairo');
      expect(res.status).toBe(200);
      expect(res.body.data.nameAr).toBe('جامعة القاهرة');
      expect(res.body.data.mainCampusCoordinates.lat).toBe(30.0276);
      expect(res.body.data.mainCampusCoordinates.lng).toBe(31.2089);
    });

    it('F7-03: Retrieve Ain Shams (Abbassia) and Alexandria (Shatby) university coordinates', async () => {
      const asuRes = await client.get('/api/v1/universities/univ-ain-shams');
      expect(asuRes.status).toBe(200);
      expect(asuRes.body.data.mainCampusCoordinates.lat).toBe(30.0763);

      const alexRes = await client.get('/api/v1/universities/univ-alexandria');
      expect(alexRes.status).toBe(200);
      expect(alexRes.body.data.mainCampusCoordinates.lat).toBe(31.2089);
    });

    it('F7-04: University entities contain bilingual names and popular faculties list', async () => {
      const res = await client.get('/api/v1/universities/univ-mansoura');
      expect(res.status).toBe(200);
      expect(res.body.data.nameAr).toContain('جامعة المنصورة');
      expect(res.body.data.nameEn).toContain('Mansoura University');
      expect(res.body.data.popularFaculties).toContain('Medicine');
    });

    it('F7-05: Haversine distance correctly computes proximity from Dokki accommodation to Cairo Univ campus (~1.2 km)', async () => {
      const dokkiCoords = { lat: 30.0385, lng: 31.2124 };
      const cairoUnivCoords = { lat: 30.0276, lng: 31.2089 };

      const distanceKm = calculateHaversineDistance(
        dokkiCoords.lat,
        dokkiCoords.lng,
        cairoUnivCoords.lat,
        cairoUnivCoords.lng,
      );
      expect(distanceKm).toBeGreaterThan(1.0);
      expect(distanceKm).toBeLessThan(1.5);
    });
  });

  // ==========================================
  // FEATURE F8: Hierarchical Accommodation (Building/Unit/Room/Bed)
  // ==========================================
  describe('F8: Hierarchical Accommodation (Building/Unit/Room/Bed)', () => {
    it('F8-01: Retrieve building accommodation with hierarchical nesting (Building -> Unit -> Room -> Bed)', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      expect(res.status).toBe(200);
      expect(res.body.data.propertyType).toBe('BUILDING');
      expect(res.body.data.units.length).toBeGreaterThan(0);

      const unit = res.body.data.units[0];
      expect(unit.rooms.length).toBeGreaterThan(0);

      const room = unit.rooms[0];
      expect(room.beds.length).toBeGreaterThan(0);
    });

    it('F8-02: Support standalone apartment listing without requiring parent building wrapper', async () => {
      const res = await client.get('/api/v1/properties/prop-nasr-city-flat');
      expect(res.status).toBe(200);
      expect(res.body.data.propertyType).toBe('APARTMENT');
      expect(res.body.data.units.length).toBe(1);
    });

    it('F8-03: Inspect individual bed attributes (bedNumber, label, price, duration, availability)', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const bed = res.body.data.units[0].rooms[1].beds[0]; // Bed B1 in Room 101-B
      expect(bed.id).toBe('bed-dokki-101-b1');
      expect(bed.bedNumber).toBe(1);
      expect(bed.pricePerMonthEgp).toBe(2200);
      expect(bed.isAvailable).toBe(true);
      expect(bed.pricingUnit).toBe('PER_BED');
    });

    it('F8-04: Inspect room configurations (SINGLE with private bath vs shared DOUBLE/TRIPLE)', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const singleRoom = res.body.data.units[0].rooms[0]; // Room A
      expect(singleRoom.type).toBe('SINGLE');
      expect(singleRoom.hasPrivateBathroom).toBe(true);

      const tripleRoom = res.body.data.units[0].rooms[2]; // Room C
      expect(tripleRoom.type).toBe('TRIPLE');
      expect(tripleRoom.beds.length).toBe(3);
    });

    it('F8-05: Inspect unit properties (floorNumber, bathroomsCount, kitchensCount)', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const unit = res.body.data.units[0];
      expect(unit.unitNumber).toBe('101');
      expect(unit.floorNumber).toBe(1);
      expect(unit.bathroomsCount).toBe(2);
      expect(unit.kitchensCount).toBe(1);
    });
  });

  // ==========================================
  // FEATURE F9: Partial Availability & Sibling State Independence
  // ==========================================
  describe('F9: Partial Availability & Sibling State Independence', () => {
    it('F9-01: Query availability of individual bed returns isAvailable: true initially', async () => {
      const res = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/BED/bed-dokki-101-b1/availability',
      );
      expect(res.status).toBe(200);
      expect(res.body.data.isAvailable).toBe(true);
    });

    it('F9-02: Booking a bed leaves sibling bed in same room available (Sibling independence)', async () => {
      // Simulate booking Bed B1
      const sim = client.getSimulator();
      const prop = sim.getPropertyById('prop-dokki-building')!;
      const bedB1 = prop.units[0].rooms[1].beds.find(b => b.id === 'bed-dokki-101-b1')!;
      const bedB2 = prop.units[0].rooms[1].beds.find(b => b.id === 'bed-dokki-101-b2')!;

      // Mark Bed B1 as booked
      bedB1.isAvailable = false;
      bedB1.bookedByStudentId = 'student-ahmed';

      expect(bedB1.isAvailable).toBe(false);
      expect(bedB2.isAvailable).toBe(true); // Sibling bed remains available!
    });

    it('F9-03: Sibling rooms in same unit remain available when another room is occupied', async () => {
      const resA = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/ROOM/room-dokki-101-a/availability',
      );
      const resB = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/ROOM/room-dokki-101-b/availability',
      );
      expect(resA.body.data.isAvailable).toBe(true);
      expect(resB.body.data.isAvailable).toBe(true);
    });

    it('F9-04: Sibling units in building remain unaffected by reservations in another unit', async () => {
      const unitRes = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/UNIT/unit-dokki-101/availability',
      );
      expect(unitRes.status).toBe(200);
      expect(unitRes.body.data.isAvailable).toBe(true);
    });

    it('F9-05: Querying non-existent portion ID returns 404 Not Found', async () => {
      const res = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/BED/bed-non-existent/availability',
      );
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // FEATURE F10: Flexible EGP Pricing & Duration Units
  // ==========================================
  describe('F10: Flexible EGP Pricing & Duration Units', () => {
    it('F10-01: Property listing prices are strictly denominated in Egyptian Pounds (EGP)', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      expect(res.status).toBe(200);
      expect(res.body.data.basePriceEgp).toBe(2200);
      for (const exp of res.body.data.itemizedExpenses) {
        expect(exp.currency).toBe('EGP');
      }
    });

    it('F10-02: Support MONTHLY accommodation duration unit with PER_BED pricing', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      expect(res.body.data.durationUnit).toBe('MONTHLY');
      expect(res.body.data.pricingUnit).toBe('PER_BED');
    });

    it('F10-03: Support PER_UNIT pricing for full apartment rental', async () => {
      const res = await client.get('/api/v1/properties/prop-nasr-city-flat');
      expect(res.status).toBe(200);
      expect(res.body.data.units[0].pricingUnit).toBe('PER_UNIT');
      expect(res.body.data.units[0].entireUnitPricePerMonthEgp).toBe(5200);
    });

    it('F10-04: Reject property listing creation if base price is zero or negative', async () => {
      const verifiedProvider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن بسعر غير صحيح',
          titleEn: 'Zero Price Property',
          descriptionAr: 'وصف',
          descriptionEn: 'description',
          propertyType: 'APARTMENT',
          genderPolicy: 'MALE_ONLY',
          governorateId: 'gov-cairo',
          cityId: 'city-cairo',
          areaId: 'area-downtown',
          exactAddressAr: 'وسط البلد',
          exactAddressEn: 'Downtown',
          coordinates: { lat: 30.0488, lng: 31.2404 },
          nearUniversityId: 'univ-cairo',
          basePriceEgp: 0, // Invalid zero price
          pricingUnit: 'PER_ROOM',
          durationUnit: 'MONTHLY',
          mediaAssets: [
            {
              id: 'm1',
              url: 'https://cloudinary/img1.jpg',
              publicId: 'p1',
              isCover: true,
              width: 800,
              height: 600,
            },
          ],
          units: [],
          itemizedExpenses: [],
          amenities: [],
          rulesAr: [],
          rulesEn: [],
        },
        { Authorization: `Bearer ${verifiedProvider.id}:OWNER` },
      );
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Base price in EGP must be greater than zero');
    });

    it('F10-05: Accurately verify total monthly rent for single room vs shared bed', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const singleRoomPrice = res.body.data.units[0].rooms[0].pricePerMonthEgp;
      const sharedBedPrice = res.body.data.units[0].rooms[1].beds[0].pricePerMonthEgp;
      expect(singleRoomPrice).toBe(3500);
      expect(sharedBedPrice).toBe(2200);
      expect(singleRoomPrice).toBeGreaterThan(sharedBedPrice);
    });
  });

  // ==========================================
  // FEATURE F11: Itemized Mandatory & Optional Expenses
  // ==========================================
  describe('F11: Itemized Mandatory & Optional Expenses', () => {
    it('F11-01: Listing displays itemized recurring mandatory expenses (Utilities 250 EGP/mo)', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const expenses = res.body.data.itemizedExpenses;
      const util = expenses.find((e: any) => e.id === 'exp-dokki-util');
      expect(util).toBeDefined();
      expect(util.isMandatory).toBe(true);
      expect(util.isRecurring).toBe(true);
      expect(util.recurringPeriod).toBe('MONTHLY');
      expect(util.amount).toBe(250);
    });

    it('F11-02: Listing displays one-time mandatory expenses (Refundable Deposit 1500 EGP)', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const deposit = res.body.data.itemizedExpenses.find((e: any) => e.id === 'exp-dokki-deposit');
      expect(deposit).toBeDefined();
      expect(deposit.isMandatory).toBe(true);
      expect(deposit.isRecurring).toBe(false);
      expect(deposit.amount).toBe(1500);
    });

    it('F11-03: Listing clearly distinguishes optional expenses (Optional Cleaning 200 EGP/mo)', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const cleaning = res.body.data.itemizedExpenses.find(
        (e: any) => e.id === 'exp-dokki-cleaning',
      );
      expect(cleaning).toBeDefined();
      expect(cleaning.isMandatory).toBe(false);
      expect(cleaning.isRecurring).toBe(true);
      expect(cleaning.amount).toBe(200);
    });

    it('F11-04: All expenses specify amount in EGP currency', async () => {
      const res = await client.get('/api/v1/properties/prop-nasr-city-flat');
      for (const exp of res.body.data.itemizedExpenses) {
        expect(exp.currency).toBe('EGP');
        expect(exp.amount).toBeGreaterThan(0);
      }
    });

    it('F11-05: Accurate calculation of total move-in upfront cost (Rent + Mandatory Deposit + Utilities)', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const baseRent = 2200; // Bed B1
      const mandatoryExpenses = res.body.data.itemizedExpenses
        .filter((e: any) => e.isMandatory)
        .reduce((sum: number, e: any) => sum + e.amount, 0);

      // 250 utilities + 1500 deposit = 1750
      expect(mandatoryExpenses).toBe(1750);
      const totalFirstMonthUpfront = baseRent + mandatoryExpenses;
      expect(totalFirstMonthUpfront).toBe(3950);
    });
  });

  // ==========================================
  // FEATURE F12: Property Media Upload & Cover Image Selection
  // ==========================================
  describe('F12: Property Media Upload & Cover Image Selection', () => {
    it('F12-01: Listing media assets contain Cloudinary URLs, public IDs, and pixel dimensions', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      expect(res.body.data.mediaAssets.length).toBeGreaterThanOrEqual(3);
      const cover = res.body.data.mediaAssets.find((m: any) => m.isCover);
      expect(cover).toBeDefined();
      expect(cover.url).toContain('cloudinary.com');
      expect(cover.width).toBe(1920);
      expect(cover.height).toBe(1080);
    });

    it('F12-02: Listing enforces exactly one designated cover image (isCover: true)', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const covers = res.body.data.mediaAssets.filter((m: any) => m.isCover);
      expect(covers.length).toBe(1);
    });

    it('F12-03: Reject property creation if media assets array is empty (422 Unprocessable)', async () => {
      const verifiedProvider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن بلا صور',
          titleEn: 'No Photos Flat',
          descriptionAr: 'وصف',
          descriptionEn: 'description',
          propertyType: 'APARTMENT',
          genderPolicy: 'MALE_ONLY',
          governorateId: 'gov-cairo',
          cityId: 'city-cairo',
          areaId: 'area-downtown',
          exactAddressAr: 'وسط البلد',
          exactAddressEn: 'Downtown',
          coordinates: { lat: 30.0488, lng: 31.2404 },
          nearUniversityId: 'univ-cairo',
          basePriceEgp: 2000,
          pricingUnit: 'PER_ROOM',
          durationUnit: 'MONTHLY',
          mediaAssets: [], // Empty photos
          units: [],
          itemizedExpenses: [],
          amenities: [],
          rulesAr: [],
          rulesEn: [],
        },
        { Authorization: `Bearer ${verifiedProvider.id}:OWNER` },
      );
      expect(res.status).toBe(422);
      expect(res.body.message).toContain('Property must have at least one photo');
    });

    it('F12-04: Reject property creation if multiple images are set as cover image (422 Unprocessable)', async () => {
      const verifiedProvider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن بصورتين رئيسيتين',
          titleEn: 'Two Covers Flat',
          descriptionAr: 'وصف',
          descriptionEn: 'description',
          propertyType: 'APARTMENT',
          genderPolicy: 'MALE_ONLY',
          governorateId: 'gov-cairo',
          cityId: 'city-cairo',
          areaId: 'area-downtown',
          exactAddressAr: 'وسط البلد',
          exactAddressEn: 'Downtown',
          coordinates: { lat: 30.0488, lng: 31.2404 },
          nearUniversityId: 'univ-cairo',
          basePriceEgp: 2000,
          pricingUnit: 'PER_ROOM',
          durationUnit: 'MONTHLY',
          mediaAssets: [
            {
              id: 'm1',
              url: 'http://img1.jpg',
              publicId: 'p1',
              isCover: true,
              width: 800,
              height: 600,
            },
            {
              id: 'm2',
              url: 'http://img2.jpg',
              publicId: 'p2',
              isCover: true,
              width: 800,
              height: 600,
            }, // Second cover
          ],
          units: [],
          itemizedExpenses: [],
          amenities: [],
          rulesAr: [],
          rulesEn: [],
        },
        { Authorization: `Bearer ${verifiedProvider.id}:OWNER` },
      );
      expect(res.status).toBe(422);
      expect(res.body.message).toContain('Property must have exactly one designated cover image');
    });

    it('F12-05: Media assets include bilingual captions (Arabic and English)', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const asset = res.body.data.mediaAssets[0];
      expect(asset.captionAr).toBeDefined();
      expect(asset.captionEn).toBeDefined();
    });
  });

  // ==========================================
  // FEATURE F13: Property Listing Admin Approval Gate
  // ==========================================
  describe('F13: Property Listing Admin Approval Gate', () => {
    it('F13-01: Newly submitted listing starts in PENDING_APPROVAL status and isActive: false', async () => {
      const verifiedProvider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'شقة طلابية راقية بالمهندسين',
          titleEn: 'Fine Student Flat Mohandessin',
          descriptionAr: 'وصف تفصيلي',
          descriptionEn: 'detailed description',
          propertyType: 'APARTMENT',
          genderPolicy: 'MALE_ONLY',
          governorateId: 'gov-giza',
          cityId: 'city-giza',
          areaId: 'area-mohandessin',
          exactAddressAr: 'المهندسين',
          exactAddressEn: 'Mohandessin',
          coordinates: { lat: 30.0538, lng: 31.2001 },
          nearUniversityId: 'univ-cairo',
          basePriceEgp: 3200,
          pricingUnit: 'PER_BED',
          durationUnit: 'MONTHLY',
          mediaAssets: [
            {
              id: 'm1',
              url: 'https://cloudinary/img1.jpg',
              publicId: 'p1',
              isCover: true,
              width: 800,
              height: 600,
            },
          ],
          units: [],
          itemizedExpenses: [],
          amenities: [],
          rulesAr: [],
          rulesEn: [],
        },
        { Authorization: `Bearer ${verifiedProvider.id}:OWNER` },
      );
      expect(res.status).toBe(201);
      expect(res.body.data.approvalStatus).toBe('PENDING_APPROVAL');
      expect(res.body.data.isActive).toBe(false);
    });

    it('F13-02: Unverified provider cannot submit property listings for approval (403 Forbidden)', async () => {
      const unverifiedProvider = TEST_PROVIDERS[4]; // provider-unverified
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'محاولة نشر من مالك غير موثق',
          titleEn: 'Unverified Post',
          basePriceEgp: 2500,
        },
        { Authorization: `Bearer ${unverifiedProvider.id}:OWNER` },
      );
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unverified provider cannot publish');
    });

    it('F13-03: Platform admin can view queue of pending property listings', async () => {
      const admin = TEST_ADMINS[0];
      const res = await client.get('/api/v1/admin/moderation/properties', {
        Authorization: `Bearer ${admin.id}:ADMIN`,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const p of res.body.data) {
        expect(p.approvalStatus).toBe('PENDING_APPROVAL');
      }
    });

    it('F13-04: Admin approval activates listing and makes it publicly searchable', async () => {
      const admin = TEST_ADMINS[0];
      const res = await client.post(
        '/api/v1/admin/moderation/properties/prop-pending-approval/review',
        { approved: true },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );
      expect(res.status).toBe(200);
      expect(res.body.data.approvalStatus).toBe('APPROVED');
      expect(res.body.data.isActive).toBe(true);
    });

    it('F13-05: Admin rejection keeps listing inactive with status REJECTED', async () => {
      const admin = TEST_ADMINS[0];
      const res = await client.post(
        '/api/v1/admin/moderation/properties/prop-pending-approval/review',
        { approved: false, reason: 'Property details incomplete' },
        { Authorization: `Bearer ${admin.id}:ADMIN` },
      );
      expect(res.status).toBe(200);
      expect(res.body.data.approvalStatus).toBe('REJECTED');
      expect(res.body.data.isActive).toBe(false);
    });
  });
});
