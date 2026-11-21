/**
 * Tier 1 Feature Coverage: Search & Discovery (F14 - F15)
 * Covers:
 * - F14: Multi-Filter Search Query (City, Budget, Duration, Gender)
 * - F15: University Proximity Calculation & Sort Ranking
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';

describe('Tier 1: Search & Discovery (F14 - F15)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  // ==========================================
  // FEATURE F14: Multi-Filter Search Query
  // ==========================================
  describe('F14: Multi-Filter Search Query (City, Budget, Duration, Gender)', () => {
    it('F14-01: Successfully filter properties by Egyptian city (cityId = city-giza)', async () => {
      const res = await client.get('/api/v1/search?cityId=city-giza');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const prop of res.body.data) {
        expect(prop.cityId).toBe('city-giza');
      }
    });

    it('F14-02: Filter properties by EGP budget range (min: 2000, max: 3000 EGP)', async () => {
      const res = await client.get('/api/v1/search?minPriceEgp=2000&maxPriceEgp=3000');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const prop of res.body.data) {
        expect(prop.basePriceEgp).toBeGreaterThanOrEqual(2000);
        expect(prop.basePriceEgp).toBeLessThanOrEqual(3000);
      }
    });

    it('F14-03: Filter properties by gender policy (FEMALE_ONLY)', async () => {
      const res = await client.get('/api/v1/search?genderPolicy=FEMALE_ONLY');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const prop of res.body.data) {
        expect(prop.genderPolicy).toBe('FEMALE_ONLY');
      }
    });

    it('F14-04: Filter properties by accommodation type (BUILDING vs APARTMENT)', async () => {
      const res = await client.get('/api/v1/search?accommodationType=BUILDING');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const prop of res.body.data) {
        expect(prop.propertyType).toBe('BUILDING');
      }
    });

    it('F14-05: Exclude pending approval or inactive properties from public search results', async () => {
      const res = await client.get('/api/v1/search');
      expect(res.status).toBe(200);
      for (const prop of res.body.data) {
        expect(prop.approvalStatus).toBe('APPROVED');
        expect(prop.isActive).toBe(true);
        expect(prop.id).not.toBe('prop-pending-approval');
      }
    });
  });

  // ==========================================
  // FEATURE F15: University Proximity Calculation & Sort Ranking
  // ==========================================
  describe('F15: University Proximity Calculation & Sort Ranking', () => {
    it('F15-01: Compute distance in kilometers to target university main campus (Cairo Univ)', async () => {
      const res = await client.get('/api/v1/search?universityId=univ-cairo');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      const dokkiBuilding = res.body.data.find((p: any) => p.id === 'prop-dokki-building');
      expect(dokkiBuilding).toBeDefined();
      expect(dokkiBuilding.distanceToUniversityKm).toBeDefined();
      expect(dokkiBuilding.distanceToUniversityKm).toBeGreaterThan(1.0);
      expect(dokkiBuilding.distanceToUniversityKm).toBeLessThan(2.0);
    });

    it('F15-02: Filter search by maximum distance from university campus (maxDistanceKm = 2.0 km)', async () => {
      const res = await client.get('/api/v1/search?universityId=univ-cairo&maxDistanceKm=2.0');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const prop of res.body.data) {
        expect(prop.distanceToUniversityKm).toBeLessThanOrEqual(2.0);
      }
    });

    it('F15-03: Transparent sort ranking sorts closest property to university first', async () => {
      const res = await client.get('/api/v1/search?universityId=univ-alexandria');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      // First property in Shatby is within walking distance (~0.4 km)
      expect(res.body.data[0].distanceToUniversityKm).toBeLessThan(1.0);
    });

    it('F15-04: Distance calculations use main campus coordinates according to app.txt §5.6', async () => {
      const res = await client.get('/api/v1/search?universityId=univ-alexandria');
      const shatbyProp = res.body.data.find((p: any) => p.id === 'prop-shatby-villa');
      expect(shatbyProp).toBeDefined();
      expect(shatbyProp.distanceToUniversityKm).toBeDefined();
      expect(shatbyProp.distanceToUniversityKm).toBeLessThan(0.8);
    });

    it('F15-05: Search results return exact coordinates supporting synchronized card and map view', async () => {
      const res = await client.get('/api/v1/search?cityId=city-cairo');
      expect(res.status).toBe(200);
      for (const prop of res.body.data) {
        expect(prop.coordinates).toBeDefined();
        expect(prop.coordinates.lat).toBeDefined();
        expect(prop.coordinates.lng).toBeDefined();
        expect(prop.exactAddressAr).toBeDefined();
      }
    });
  });
});
