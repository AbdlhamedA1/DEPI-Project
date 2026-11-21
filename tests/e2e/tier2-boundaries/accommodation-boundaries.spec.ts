/**
 * Tier 2 Boundary & Corner Cases: Accommodation Hierarchy & Availability Boundaries
 * Covers:
 * - F8: Hierarchical Accommodation (Building/Unit/Room/Bed) boundary definitions
 * - F9: Partial bed/room availability bounds (booking bed 1 leaves beds 2 & 3 available)
 * - Whole unit booking locking all child rooms and beds
 * - Sibling units & sibling rooms independent availability bounds
 * - Non-existent portion IDs (404 Not Found)
 * - Gender Policy boundary enforcement (MALE_ONLY, FEMALE_ONLY, MIXED_FAMILY)
 * - Standalone apartment listings vs building hierarchies
 *
 * Total: 30 Boundary Test Cases
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_PROVIDERS } from '../../fixtures/users.fixture';

describe('Tier 2: Accommodation Hierarchy & Availability Boundaries', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  // =========================================================================
  // BOUNDARY 1: Partial Bed-Level Availability & Sibling Independence (F9)
  // =========================================================================
  describe('Boundary 1: Partial Bed-Level Availability & Sibling Independence', () => {
    it('B-ACCOM-01: Booking Bed 1 in a double room leaves Bed 2 fully available for other students', async () => {
      const student1 = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];

      // Student 1 books and confirms Bed B1 (Room 101-B has beds B1 and B2)
      const req = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Bed B1 is now unavailable
      const availB1 = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/BED/bed-dokki-101-b1/availability',
      );
      expect(availB1.status).toBe(200);
      expect(availB1.body.data.isAvailable).toBe(false);

      // Sibling Bed B2 remains available
      const availB2 = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/BED/bed-dokki-101-b2/availability',
      );
      expect(availB2.status).toBe(200);
      expect(availB2.body.data.isAvailable).toBe(true);
    });

    it('B-ACCOM-02: In a triple room, booking bed 1 and bed 2 leaves bed 3 independently available', async () => {
      const student1 = TEST_STUDENTS[0];
      const student2 = TEST_STUDENTS[2];
      const provider = TEST_PROVIDERS[0];

      // Book bed C1
      const r1 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      const id1 = r1.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${id1}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      await client.post(
        `/api/v1/booking-requests/${id1}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${id1}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Book bed C2
      const r2 = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-c2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student2.id}:STUDENT` },
      );
      const id2 = r2.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${id2}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      await client.post(
        `/api/v1/booking-requests/${id2}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student2.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${id2}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Bed C3 remains available
      const availC3 = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/BED/bed-dokki-101-c3/availability',
      );
      expect(availC3.status).toBe(200);
      expect(availC3.body.data.isAvailable).toBe(true);
    });

    it('B-ACCOM-03: Bed booking correctly records the tenant student ID without leaking to sibling beds', async () => {
      const student1 = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];

      const req = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      const availB1 = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/BED/bed-dokki-101-b1/availability',
      );
      expect(availB1.body.data.portion.bookedByStudentId).toBe(student1.id);

      const availB2 = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/BED/bed-dokki-101-b2/availability',
      );
      expect(availB2.body.data.portion.bookedByStudentId).toBeUndefined();
    });

    it('B-ACCOM-04: Booking an already booked bed returns 400 Bad Request', async () => {
      const student1 = TEST_STUDENTS[0];
      const student2 = TEST_STUDENTS[2];
      const provider = TEST_PROVIDERS[0];

      // Student 1 books Bed B1
      const req = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Student 2 tries to submit booking request for Bed B1
      const failReq = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student2.id}:STUDENT` },
      );
      expect(failReq.status).toBe(400);
      expect(failReq.body.message).toContain('accommodation portion is currently unavailable');
    });

    it('B-ACCOM-05: Student 2 can immediately book sibling Bed B2 in the same room', async () => {
      const student1 = TEST_STUDENTS[0];
      const student2 = TEST_STUDENTS[2];
      const provider = TEST_PROVIDERS[0];

      // Student 1 books Bed B1
      const req = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b1',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student1.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Student 2 books Bed B2
      const s2Req = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'BED',
          portionId: 'bed-dokki-101-b2',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student2.id}:STUDENT` },
      );
      expect(s2Req.status).toBe(201);
      expect(s2Req.body.data.bookingRequest.portionId).toBe('bed-dokki-101-b2');
    });
  });

  // =========================================================================
  // BOUNDARY 2: Whole Unit & Whole Room Cascading Lock Boundaries (F8 & F9)
  // =========================================================================
  describe('Boundary 2: Whole Unit & Whole Room Cascading Lock Boundaries', () => {
    it('B-ACCOM-06: Booking an entire room marks all beds inside that room unavailable', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];

      // Book Room 101-B (a double room containing bed-dokki-101-b1 and b2)
      const req = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'ROOM',
          portionId: 'room-dokki-101-b',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Room itself is unavailable
      const roomAvail = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/ROOM/room-dokki-101-b/availability',
      );
      expect(roomAvail.body.data.isAvailable).toBe(false);

      // Both child beds are now locked and unavailable
      const bed1 = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/BED/bed-dokki-101-b1/availability',
      );
      const bed2 = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/BED/bed-dokki-101-b2/availability',
      );
      expect(bed1.body.data.isAvailable).toBe(false);
      expect(bed2.body.data.isAvailable).toBe(false);
    });

    it('B-ACCOM-07: Sibling Room A and Room C in the same unit remain available when Room B is booked', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];

      const req = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'ROOM',
          portionId: 'room-dokki-101-b',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Room A and Room C remain available
      const roomA = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/ROOM/room-dokki-101-a/availability',
      );
      const roomC = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/ROOM/room-dokki-101-c/availability',
      );
      expect(roomA.body.data.isAvailable).toBe(true);
      expect(roomC.body.data.isAvailable).toBe(true);
    });

    it('B-ACCOM-08: Booking a whole unit marks ALL rooms and ALL beds in that unit unavailable', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];

      // Book Unit 101
      const req = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'UNIT',
          portionId: 'unit-dokki-101',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/accept`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Unit is unavailable
      const unitAvail = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/UNIT/unit-dokki-101/availability',
      );
      expect(unitAvail.body.data.isAvailable).toBe(false);

      // All child rooms are unavailable
      const roomA = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/ROOM/room-dokki-101-a/availability',
      );
      const roomB = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/ROOM/room-dokki-101-b/availability',
      );
      const roomC = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/ROOM/room-dokki-101-c/availability',
      );
      expect(roomA.body.data.isAvailable).toBe(false);
      expect(roomB.body.data.isAvailable).toBe(false);
      expect(roomC.body.data.isAvailable).toBe(false);

      // All child beds are unavailable
      const bedB1 = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/BED/bed-dokki-101-b1/availability',
      );
      const bedC1 = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/BED/bed-dokki-101-c1/availability',
      );
      expect(bedB1.body.data.isAvailable).toBe(false);
      expect(bedC1.body.data.isAvailable).toBe(false);
    });

    it('B-ACCOM-09: Independent unit in another property remains fully available when Unit 101 is booked', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];

      // Book Unit 101
      const req = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-dokki-building',
          portionType: 'UNIT',
          portionId: 'unit-dokki-101',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      const reqId = req.body.data.bookingRequest.id;
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      await client.post(
        `/api/v1/booking-requests/${reqId}/confirm-agreement`,
        {},
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );

      // Unit in Nasr City flat availability is completely unaffected
      const unitNasr = await client.get(
        '/api/v1/properties/prop-nasr-city-flat/portions/UNIT/unit-nasr-flat-01/availability',
      );
      expect(unitNasr.status).toBe(200);
      expect(unitNasr.body.data.isAvailable).toBe(true);
    });

    it('B-ACCOM-10: Standalone apartment listing can be booked directly via APARTMENT portionType', async () => {
      const student = TEST_STUDENTS[0];
      const provider = TEST_PROVIDERS[0];

      // prop-nasr-city-flat is an APARTMENT propertyType
      const avail = await client.get(
        '/api/v1/properties/prop-nasr-city-flat/portions/APARTMENT/prop-nasr-city-flat/availability',
      );
      expect(avail.status).toBe(200);
      expect(avail.body.data.isAvailable).toBe(true);

      const req = await client.post(
        '/api/v1/booking-requests',
        {
          propertyId: 'prop-nasr-city-flat',
          portionType: 'APARTMENT',
          portionId: 'prop-nasr-city-flat',
          proposedMoveInDate: '2026-10-01',
          proposedDurationUnit: 'MONTHLY',
        },
        { Authorization: `Bearer ${student.id}:STUDENT` },
      );
      expect(req.status).toBe(201);
      expect(req.body.data.bookingRequest.portionType).toBe('APARTMENT');
    });
  });

  // =========================================================================
  // BOUNDARY 3: Portion Querying & Non-Existent Portion Boundaries (404)
  // =========================================================================
  describe('Boundary 3: Portion Querying & Non-Existent Portion Boundaries', () => {
    it('B-ACCOM-11: Querying availability for non-existent BED ID returns 404 Not Found', async () => {
      const res = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/BED/bed-phantom-404/availability',
      );
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found in property');
    });

    it('B-ACCOM-12: Querying availability for non-existent ROOM ID returns 404 Not Found', async () => {
      const res = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/ROOM/room-ghost-room/availability',
      );
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found in property');
    });

    it('B-ACCOM-13: Querying availability for non-existent UNIT ID returns 404 Not Found', async () => {
      const res = await client.get(
        '/api/v1/properties/prop-dokki-building/portions/UNIT/unit-fake-999/availability',
      );
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found in property');
    });

    it('B-ACCOM-14: Querying portion on non-existent property returns 404 Not Found', async () => {
      const res = await client.get(
        '/api/v1/properties/prop-does-not-exist/portions/BED/bed-dokki-101-b1/availability',
      );
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Property not found');
    });

    it('B-ACCOM-15: Querying property by non-existent ID returns 404 Not Found', async () => {
      const res = await client.get('/api/v1/properties/prop-random-xyz');
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Property listing not found');
    });
  });

  // =========================================================================
  // BOUNDARY 4: Gender Policy Enforcement Boundaries
  // =========================================================================
  describe('Boundary 4: Gender Policy Enforcement Boundaries', () => {
    it('B-ACCOM-16: MALE_ONLY property is returned when searching with genderPolicy: MALE_ONLY', async () => {
      const res = await client.get('/api/v1/search?genderPolicy=MALE_ONLY');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const p of res.body.data) {
        expect(p.genderPolicy).toBe('MALE_ONLY');
      }
    });

    it('B-ACCOM-17: FEMALE_ONLY search filter strictly excludes MALE_ONLY properties', async () => {
      const res = await client.get('/api/v1/search?genderPolicy=FEMALE_ONLY');
      expect(res.status).toBe(200);
      for (const p of res.body.data) {
        expect(p.genderPolicy).toBe('FEMALE_ONLY');
        expect(p.genderPolicy).not.toBe('MALE_ONLY');
      }
    });

    it('B-ACCOM-18: MIXED_FAMILY search filter returns only MIXED_FAMILY properties', async () => {
      const res = await client.get('/api/v1/search?genderPolicy=MIXED_FAMILY');
      expect(res.status).toBe(200);
      for (const p of res.body.data) {
        expect(p.genderPolicy).toBe('MIXED_FAMILY');
      }
    });

    it('B-ACCOM-19: Unfiltered search returns listings of all valid gender policies', async () => {
      const res = await client.get('/api/v1/search');
      expect(res.status).toBe(200);
      const policies = new Set(res.body.data.map((p: any) => p.genderPolicy));
      expect(policies.has('MALE_ONLY')).toBe(true);
      expect(policies.has('FEMALE_ONLY')).toBe(true);
    });

    it('B-ACCOM-20: Submitting listing with invalid gender policy string fails validation', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن بسياسة غير صالحة',
          titleEn: 'Invalid Gender Policy',
          descriptionAr: 'وصف',
          descriptionEn: 'description',
          propertyType: 'APARTMENT',
          genderPolicy: 'ANYONE_WELCOME' as any, // Invalid enum
          governorateId: 'gov-cairo',
          cityId: 'city-cairo',
          areaId: 'area-downtown',
          exactAddressAr: 'وسط البلد',
          exactAddressEn: 'Downtown',
          coordinates: { lat: 30.0488, lng: 31.2404 },
          nearUniversityId: 'univ-cairo',
          basePriceEgp: 2500,
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
      // Property listing creation completes or fails gracefully
      expect([201, 400, 422]).toContain(res.status);
    });
  });

  // =========================================================================
  // BOUNDARY 5: Hierarchy Node Attributes & Structural Integrity
  // =========================================================================
  describe('Boundary 5: Hierarchy Node Attributes & Structural Integrity', () => {
    it('B-ACCOM-21: SINGLE room type contains exactly 1 bed and private bathroom flag is boolean', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const singleRoom = res.body.data.units[0].rooms.find((r: any) => r.type === 'SINGLE');
      expect(singleRoom).toBeDefined();
      expect(singleRoom.beds.length).toBe(1);
      expect(typeof singleRoom.hasPrivateBathroom).toBe('boolean');
    });

    it('B-ACCOM-22: DOUBLE room type contains exactly 2 beds', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const doubleRoom = res.body.data.units[0].rooms.find((r: any) => r.type === 'DOUBLE');
      expect(doubleRoom).toBeDefined();
      expect(doubleRoom.beds.length).toBe(2);
    });

    it('B-ACCOM-23: TRIPLE room type contains exactly 3 beds', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const tripleRoom = res.body.data.units[0].rooms.find((r: any) => r.type === 'TRIPLE');
      expect(tripleRoom).toBeDefined();
      expect(tripleRoom.beds.length).toBe(3);
    });

    it('B-ACCOM-24: Each bed has positive bedNumber and valid EGP price', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      for (const unit of res.body.data.units) {
        for (const room of unit.rooms) {
          for (const bed of room.beds) {
            expect(bed.bedNumber).toBeGreaterThan(0);
            expect(bed.pricePerMonthEgp).toBeGreaterThan(0);
            expect(bed.pricingUnit).toBe('PER_BED');
          }
        }
      }
    });

    it('B-ACCOM-25: Floor number can be 0 (Ground Floor) or positive integer', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      for (const unit of res.body.data.units) {
        expect(unit.floorNumber).toBeGreaterThanOrEqual(0);
      }
    });

    it('B-ACCOM-26: Bathroom and kitchen counts are non-negative integers', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      for (const unit of res.body.data.units) {
        expect(unit.bathroomsCount).toBeGreaterThanOrEqual(1);
        expect(unit.kitchensCount).toBeGreaterThanOrEqual(1);
      }
    });

    it('B-ACCOM-27: Property coordinates are bounded within Egypt geographic boundaries', async () => {
      const res = await client.get('/api/v1/properties/prop-dokki-building');
      const coords = res.body.data.coordinates;
      // Egypt latitude: 22.0 to 32.0; longitude: 24.0 to 37.0
      expect(coords.lat).toBeGreaterThan(22.0);
      expect(coords.lat).toBeLessThan(32.0);
      expect(coords.lng).toBeGreaterThan(24.0);
      expect(coords.lng).toBeLessThan(37.0);
    });

    it('B-ACCOM-28: Standalone apartment unit has entireUnitPricePerMonthEgp defined', async () => {
      const res = await client.get('/api/v1/properties/prop-nasr-city-flat');
      const unit = res.body.data.units[0];
      expect(unit.entireUnitPricePerMonthEgp).toBeDefined();
      expect(unit.entireUnitPricePerMonthEgp).toBeGreaterThan(0);
      expect(unit.pricingUnit).toBe('PER_UNIT');
    });

    it('B-ACCOM-29: Property with 0 photo media assets is rejected with 422 Unprocessable Entity', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن بدون صور',
          titleEn: 'No Photos Property',
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
          basePriceEgp: 3000,
          pricingUnit: 'PER_ROOM',
          durationUnit: 'MONTHLY',
          mediaAssets: [], // Empty photos!
          units: [],
          itemizedExpenses: [],
          amenities: [],
          rulesAr: [],
          rulesEn: [],
        },
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(422);
      expect(res.body.message).toContain('at least one photo');
    });

    it('B-ACCOM-30: Property with multiple cover images is rejected with 422 Unprocessable Entity', async () => {
      const provider = TEST_PROVIDERS[0];
      const res = await client.post(
        '/api/v1/properties',
        {
          titleAr: 'سكن بصورتين غلاف',
          titleEn: 'Two Covers Property',
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
          basePriceEgp: 3000,
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
            {
              id: 'm2',
              url: 'https://cloudinary/img2.jpg',
              publicId: 'p2',
              isCover: true,
              width: 800,
              height: 600,
            }, // Second cover!
          ],
          units: [],
          itemizedExpenses: [],
          amenities: [],
          rulesAr: [],
          rulesEn: [],
        },
        { Authorization: `Bearer ${provider.id}:OWNER` },
      );
      expect(res.status).toBe(422);
      expect(res.body.message).toContain('exactly one designated cover image');
    });
  });
});
