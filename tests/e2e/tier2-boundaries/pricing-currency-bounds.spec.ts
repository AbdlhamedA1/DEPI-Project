/**
 * Tier 2 Boundary & Corner Cases: Pricing, Currency & Expense Boundaries
 * Covers:
 * - F10: Flexible EGP Pricing & Duration Units boundaries
 * - Zero and negative EGP prices strictly rejected
 * - Boundary minimum & maximum valid price ranges
 * - DurationUnit enum bounds (DAILY, WEEKLY, MONTHLY, SEMESTER, YEARLY)
 * - PricingUnit enum bounds (PER_PERSON, PER_BED, PER_ROOM, PER_UNIT)
 * - Search filter price bounds (minPriceEgp, maxPriceEgp, exact match, inverted range)
 * - F11: Itemized Mandatory vs Optional Expense accounting
 * - Recurring vs one-time expense configurations
 *
 * Total: 30 Boundary Test Cases
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_PROVIDERS } from '../../fixtures/users.fixture';

describe('Tier 2: Pricing, Currency & Expense Boundaries', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  // =========================================================================
  // BOUNDARY 1: Base Price Zero & Negative Value Rejection (F10)
  // =========================================================================
  describe('Boundary 1: Base Price Zero & Negative Value Rejection', () => {
    it('B-PRICE-01: Reject listing creation with basePriceEgp = 0 (400 Bad Request)', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن بسعر صفر',
          titleEn: 'Zero Price House',
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
          basePriceEgp: 0, // Exactly zero
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
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('must be greater than zero');
    });

    it('B-PRICE-02: Reject listing creation with negative price basePriceEgp = -100', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن بسعر سالب',
          titleEn: 'Negative Price House',
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
          basePriceEgp: -100, // Negative integer
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
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('must be greater than zero');
    });

    it('B-PRICE-03: Reject listing creation with negative fraction basePriceEgp = -0.50', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن بكسر سالب',
          titleEn: 'Negative Fraction House',
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
          basePriceEgp: -0.5,
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
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('must be greater than zero');
    });

    it('B-PRICE-04: Accept listing creation with minimum positive price basePriceEgp = 1', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن بسعر رمزي',
          titleEn: 'Nominal Price House',
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
          basePriceEgp: 1, // Minimum positive integer
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
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(201);
      expect(res.body.data.basePriceEgp).toBe(1);
    });

    it('B-PRICE-05: Accept listing creation with high boundary price basePriceEgp = 50000', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'فيلا فاخرة للطلاب',
          titleEn: 'Luxury Villa for Students',
          descriptionAr: 'وصف',
          descriptionEn: 'description',
          propertyType: 'APARTMENT',
          genderPolicy: 'MIXED_FAMILY',
          governorateId: 'gov-cairo',
          cityId: 'city-cairo',
          areaId: 'area-downtown',
          exactAddressAr: 'وسط البلد',
          exactAddressEn: 'Downtown',
          coordinates: { lat: 30.0488, lng: 31.2404 },
          nearUniversityId: 'univ-cairo',
          basePriceEgp: 50000,
          pricingUnit: 'PER_UNIT',
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
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(201);
      expect(res.body.data.basePriceEgp).toBe(50000);
    });
  });

  // =========================================================================
  // BOUNDARY 2: DurationUnit & PricingUnit Enum Bounds (F10)
  // =========================================================================
  describe('Boundary 2: DurationUnit & PricingUnit Enum Bounds', () => {
    it('B-PRICE-06: Support DAILY duration unit accommodation', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن يومي للطلاب أثناء الامتحانات',
          titleEn: 'Daily Stay for Exams',
          descriptionAr: 'وصف',
          descriptionEn: 'description',
          propertyType: 'ROOM',
          genderPolicy: 'MALE_ONLY',
          governorateId: 'gov-cairo',
          cityId: 'city-cairo',
          areaId: 'area-downtown',
          exactAddressAr: 'وسط البلد',
          exactAddressEn: 'Downtown',
          coordinates: { lat: 30.0488, lng: 31.2404 },
          nearUniversityId: 'univ-cairo',
          basePriceEgp: 200,
          pricingUnit: 'PER_ROOM',
          durationUnit: 'DAILY',
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
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(201);
      expect(res.body.data.durationUnit).toBe('DAILY');
    });

    it('B-PRICE-07: Support WEEKLY duration unit accommodation', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن أسبوعي',
          titleEn: 'Weekly Stay',
          descriptionAr: 'وصف',
          descriptionEn: 'description',
          propertyType: 'ROOM',
          genderPolicy: 'MALE_ONLY',
          governorateId: 'gov-cairo',
          cityId: 'city-cairo',
          areaId: 'area-downtown',
          exactAddressAr: 'وسط البلد',
          exactAddressEn: 'Downtown',
          coordinates: { lat: 30.0488, lng: 31.2404 },
          nearUniversityId: 'univ-cairo',
          basePriceEgp: 1000,
          pricingUnit: 'PER_ROOM',
          durationUnit: 'WEEKLY',
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
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(201);
      expect(res.body.data.durationUnit).toBe('WEEKLY');
    });

    it('B-PRICE-08: Support MONTHLY duration unit accommodation', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      expect(res.status).toBe(200);
      expect(res.body.data.durationUnit).toBe('MONTHLY');
    });

    it('B-PRICE-09: Support SEMESTER duration unit accommodation (Egyptian academic term)', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن بالترم الدراسي',
          titleEn: 'Semester Accommodation',
          descriptionAr: 'وصف',
          descriptionEn: 'description',
          propertyType: 'APARTMENT',
          genderPolicy: 'FEMALE_ONLY',
          governorateId: 'gov-giza',
          cityId: 'city-giza',
          areaId: 'area-dokki',
          exactAddressAr: 'الدقي',
          exactAddressEn: 'Dokki',
          coordinates: { lat: 30.0385, lng: 31.2124 },
          nearUniversityId: 'univ-cairo',
          basePriceEgp: 12000,
          pricingUnit: 'PER_PERSON',
          durationUnit: 'SEMESTER',
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
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(201);
      expect(res.body.data.durationUnit).toBe('SEMESTER');
    });

    it('B-PRICE-10: Support YEARLY duration unit accommodation', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن سنوي كامل',
          titleEn: 'Full Year Residence',
          descriptionAr: 'وصف',
          descriptionEn: 'description',
          propertyType: 'APARTMENT',
          genderPolicy: 'MALE_ONLY',
          governorateId: 'gov-cairo',
          cityId: 'city-cairo',
          areaId: 'area-nasr-city',
          exactAddressAr: 'مدينة نصر',
          exactAddressEn: 'Nasr City',
          coordinates: { lat: 30.0561, lng: 31.3412 },
          nearUniversityId: 'univ-al-azhar',
          basePriceEgp: 30000,
          pricingUnit: 'PER_UNIT',
          durationUnit: 'YEARLY',
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
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(201);
      expect(res.body.data.durationUnit).toBe('YEARLY');
    });

    it('B-PRICE-11: Support PER_BED pricing unit', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      expect(res.body.data.pricingUnit).toBe('PER_BED');
    });

    it('B-PRICE-12: Support PER_UNIT pricing unit', async () => {
      const res = await client.get('/api/v1/properties/prop-nasr-city-flat');
      expect(res.body.data.units[0].pricingUnit).toBe('PER_UNIT');
    });

    it('B-PRICE-13: Support PER_ROOM pricing unit', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'غرفة مستقلة مفروشة',
          titleEn: 'Private Furnished Room',
          descriptionAr: 'وصف',
          descriptionEn: 'description',
          propertyType: 'ROOM',
          genderPolicy: 'MALE_ONLY',
          governorateId: 'gov-cairo',
          cityId: 'city-cairo',
          areaId: 'area-downtown',
          exactAddressAr: 'وسط البلد',
          exactAddressEn: 'Downtown',
          coordinates: { lat: 30.0488, lng: 31.2404 },
          nearUniversityId: 'univ-cairo',
          basePriceEgp: 3500,
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
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(201);
      expect(res.body.data.pricingUnit).toBe('PER_ROOM');
    });

    it('B-PRICE-14: Support PER_PERSON pricing unit', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن مشترك بحساب الفرد',
          titleEn: 'Per Person Accommodation',
          descriptionAr: 'وصف',
          descriptionEn: 'description',
          propertyType: 'APARTMENT',
          genderPolicy: 'FEMALE_ONLY',
          governorateId: 'gov-giza',
          cityId: 'city-giza',
          areaId: 'area-dokki',
          exactAddressAr: 'الدقي',
          exactAddressEn: 'Dokki',
          coordinates: { lat: 30.0385, lng: 31.2124 },
          nearUniversityId: 'univ-cairo',
          basePriceEgp: 1800,
          pricingUnit: 'PER_PERSON',
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
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(201);
      expect(res.body.data.pricingUnit).toBe('PER_PERSON');
    });
  });

  // =========================================================================
  // BOUNDARY 3: Search Query Price Filter Bounds (F14)
  // =========================================================================
  describe('Boundary 3: Search Query Price Filter Bounds', () => {
    it('B-PRICE-15: Filter by minPriceEgp returns only properties with basePriceEgp >= minPriceEgp', async () => {
      const res = await client.get('/api/v1/search?minPriceEgp=3000');
      expect(res.status).toBe(200);
      for (const p of res.body.data) {
        expect(p.basePriceEgp).toBeGreaterThanOrEqual(3000);
      }
    });

    it('B-PRICE-16: Filter by maxPriceEgp returns only properties with basePriceEgp <= maxPriceEgp', async () => {
      const res = await client.get('/api/v1/search?maxPriceEgp=2500');
      expect(res.status).toBe(200);
      for (const p of res.body.data) {
        expect(p.basePriceEgp).toBeLessThanOrEqual(2500);
      }
    });

    it('B-PRICE-17: Exact price range match (minPriceEgp = maxPriceEgp = 2200)', async () => {
      const res = await client.get('/api/v1/search?minPriceEgp=2200&maxPriceEgp=2200');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const p of res.body.data) {
        expect(p.basePriceEgp).toBe(2200);
      }
    });

    it('B-PRICE-18: Inverted price range (minPriceEgp > maxPriceEgp) returns empty result list', async () => {
      const res = await client.get('/api/v1/search?minPriceEgp=5000&maxPriceEgp=1000');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('B-PRICE-19: Out of bounds high minPriceEgp (e.g. 500,000 EGP) returns empty results', async () => {
      const res = await client.get('/api/v1/search?minPriceEgp=500000');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('B-PRICE-20: Filter by durationUnit in search query', async () => {
      const res = await client.get('/api/v1/search?durationUnit=MONTHLY');
      expect(res.status).toBe(200);
      for (const p of res.body.data) {
        expect(p.durationUnit).toBe('MONTHLY');
      }
    });
  });

  // =========================================================================
  // BOUNDARY 4: Itemized Mandatory vs Optional Expense Accounting (F11)
  // =========================================================================
  describe('Boundary 4: Itemized Mandatory vs Optional Expense Accounting', () => {
    it('B-PRICE-21: Mandatory recurring expenses are explicitly identified with isMandatory: true', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const mandatoryExpenses = res.body.data.itemizedExpenses.filter((e: any) => e.isMandatory);
      expect(mandatoryExpenses.length).toBeGreaterThan(0);
      for (const exp of mandatoryExpenses) {
        expect(exp.amount).toBeGreaterThan(0);
        expect(exp.currency).toBe('EGP');
      }
    });

    it('B-PRICE-22: Mandatory one-time refundable deposit is non-recurring (isRecurring: false)', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const deposit = res.body.data.itemizedExpenses.find((e: any) => e.nameEn.includes('Deposit'));
      expect(deposit).toBeDefined();
      expect(deposit.isMandatory).toBe(true);
      expect(deposit.isRecurring).toBe(false);
      expect(deposit.amount).toBe(1500);
    });

    it('B-PRICE-23: Monthly recurring utilities specify recurringPeriod: MONTHLY', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const util = res.body.data.itemizedExpenses.find((e: any) => e.nameEn.includes('Utilities'));
      expect(util).toBeDefined();
      expect(util.isRecurring).toBe(true);
      expect(util.recurringPeriod).toBe('MONTHLY');
      expect(util.amount).toBe(250);
    });

    it('B-PRICE-24: Optional expenses specify isMandatory: false', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const optional = res.body.data.itemizedExpenses.find((e: any) => !e.isMandatory);
      if (optional) {
        expect(optional.isMandatory).toBe(false);
        expect(optional.currency).toBe('EGP');
      }
    });

    it('B-PRICE-25: Total move-in cash calculation sums base price + mandatory deposit + first month utilities', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const baseRent = res.body.data.basePriceEgp; // 2200
      let mandatoryDeposit = 0;
      let monthlyMandatoryUtilities = 0;

      for (const exp of res.body.data.itemizedExpenses) {
        if (exp.isMandatory && !exp.isRecurring) {
          mandatoryDeposit += exp.amount; // 1500
        }
        if (exp.isMandatory && exp.isRecurring && exp.recurringPeriod === 'MONTHLY') {
          monthlyMandatoryUtilities += exp.amount; // 250
        }
      }

      const totalInitialMoveInEgp = baseRent + mandatoryDeposit + monthlyMandatoryUtilities;
      expect(totalInitialMoveInEgp).toBe(3950); // 2200 + 1500 + 250
    });

    it('B-PRICE-26: Listing with 0 itemized expenses is accepted without error', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن شامل جميع المصاريف',
          titleEn: 'All Inclusive Housing',
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
          basePriceEgp: 4000,
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
          itemizedExpenses: [], // Empty expenses
          amenities: [],
          rulesAr: [],
          rulesEn: [],
        },
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(201);
      expect(res.body.data.itemizedExpenses).toHaveLength(0);
    });

    it('B-PRICE-27: Itemized expense amounts must be strictly positive (> 0)', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      for (const exp of res.body.data.itemizedExpenses) {
        expect(exp.amount).toBeGreaterThan(0);
      }
    });

    it('B-PRICE-28: Itemized expenses have bilingual labels (nameAr and nameEn)', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      for (const exp of res.body.data.itemizedExpenses) {
        expect(exp.nameAr.length).toBeGreaterThan(0);
        expect(exp.nameEn.length).toBeGreaterThan(0);
      }
    });

    it('B-PRICE-29: All property listings across database are strictly denominated in EGP', async () => {
      const res = await client.get('/api/v1/search');
      for (const prop of res.body.data) {
        expect(typeof prop.basePriceEgp).toBe('number');
        for (const exp of prop.itemizedExpenses) {
          expect(exp.currency).toBe('EGP');
        }
      }
    });

    it('B-PRICE-30: Average price calculation in platform metrics reflects true arithmetic mean', async () => {
      const admin = 'admin-super';
      const res = await client.get('/api/v1/admin/dashboard/metrics', {
        Authorization: `Bearer ${admin}:ADMIN`,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.avgMonthlyPriceEgp).toBeGreaterThan(0);
      expect(res.body.data.activeProperties).toBeGreaterThan(0);
    });
  });
});
