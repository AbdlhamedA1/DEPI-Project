/**
 * Tier 4 Scenario 3 (S3): Provider Multi-Unit Onboarding & Admin KYC Verification
 * Features Exercised: F3, F4, F5, F8, F10, F11, F12, F13, F29, F30
 * Domain Complexity: High
 *
 * Acceptance Criteria:
 * New property management company in Giza registers, uploads Commercial Registry & National ID.
 * Admin inspects and approves KYC. Provider creates a multi-unit building listing with itemized
 * electricity and deposit expenses; admin approves listings for public search.
 * Immutable administrative audit log captures complete records.
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_ADMINS } from '../../fixtures/users.fixture';

describe('Tier 4 Scenario 3: Provider Onboarding & Multi-Unit Listing (S3)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  it('S3-E2E: Complete property company onboarding, KYC approval, multi-unit listing, and public indexing', async () => {
    const admin = TEST_ADMINS[0];

    // -----------------------------------------------------------------------
    // STEP 1: Property Management Company Registration (F3)
    // -----------------------------------------------------------------------
    const regRes = await client.post('/api/v1/owners/register', {
      nameAr: 'م. حازم الصاوي',
      nameEn: 'Eng. Hazem El-Sawy',
      email: 'hazem.sawy@cairohousing.com',
      phone: '+201011223344',
      providerType: 'MANAGEMENT_COMPANY',
      nationalIdNumber: '28203151234567',
      companyNameAr: 'شركة القاهرة لإدارة العقارات وسكن الطلاب',
      companyNameEn: 'Cairo Student Housing Management Co.',
      taxRegistrationNumber: 'EG-123-456-789',
    });
    expect(regRes.status).toBe(201);
    const providerId = regRes.body.data.id;
    expect(regRes.body.data.verificationStatus).toBe('UNVERIFIED');

    // -----------------------------------------------------------------------
    // STEP 2: Secure KYC Documents Upload (F4)
    // -----------------------------------------------------------------------
    const kyc1 = await client.post(
      `/api/v1/owners/${providerId}/kyc`,
      {
        type: 'COMMERCIAL_REGISTRY',
        fileName: 'commercial_registry_cairo_housing.pdf',
        storageKey: 'private-kyc/cairo_housing_cr.pdf',
      },
      { Authorization: `Bearer ${providerId}:OWNER` },
    );
    expect(kyc1.status).toBe(201);

    const kyc2 = await client.post(
      `/api/v1/owners/${providerId}/kyc`,
      {
        type: 'NATIONAL_ID_FRONT',
        fileName: 'hazem_national_id_front.jpg',
        storageKey: 'private-kyc/hazem_nid_front.jpg',
      },
      { Authorization: `Bearer ${providerId}:OWNER` },
    );
    expect(kyc2.status).toBe(201);

    // Verify KYC status transitions to PENDING
    const userRes = await client.get(`/api/v1/users/${providerId}`);
    expect(userRes.body.data.verificationStatus).toBe('PENDING');

    // -----------------------------------------------------------------------
    // STEP 3: Admin Reviews & Approves KYC Documents (F29, F30)
    // -----------------------------------------------------------------------
    const pendingKyc = await client.get('/api/v1/admin/moderation/kyc', {
      Authorization: `Bearer ${admin.id}:ADMIN`,
    });
    expect(pendingKyc.body.data.some((p: any) => p.id === providerId)).toBe(true);

    const kycApproval = await client.post(
      `/api/v1/admin/moderation/kyc/${providerId}/review`,
      { approved: true },
      { Authorization: `Bearer ${admin.id}:ADMIN` },
    );
    expect(kycApproval.status).toBe(200);
    expect(kycApproval.body.data.verificationStatus).toBe('VERIFIED');

    // -----------------------------------------------------------------------
    // STEP 4: Provider Creates Hierarchical Multi-Unit Building Listing (F8, F10, F11, F12)
    // -----------------------------------------------------------------------
    const newListing = await client.post(
      '/api/v1/properties',
      {
        titleAr: 'عمارة النيل بلازا لسكن الطلاب - الدقي',
        titleEn: 'Nile Plaza Student Residence - Dokki',
        descriptionAr: 'مجمع سكني حديث متكامل الخدمات بالقرب من جامعة القاهرة ومترو البحوث.',
        descriptionEn:
          'Modern fully serviced residence complex near Cairo University and Bohooth metro.',
        propertyType: 'BUILDING',
        genderPolicy: 'MALE_ONLY',
        governorateId: 'gov-giza',
        cityId: 'city-giza',
        areaId: 'area-dokki',
        exactAddressAr: '٢٥ شارع مصدق، الدقي، الجيزة',
        exactAddressEn: '25 Mossadak Street, Dokki, Giza',
        coordinates: { lat: 30.0392, lng: 31.2055 },
        nearUniversityId: 'univ-cairo',
        basePriceEgp: 2800,
        pricingUnit: 'PER_BED',
        durationUnit: 'MONTHLY',
        mediaAssets: [
          {
            id: 'media-nile-cover',
            url: 'https://res.cloudinary.com/housing/image/upload/v1/nile_plaza_cover.jpg',
            publicId: 'nile_plaza_cover',
            isCover: true,
            captionAr: 'الواجهة الرئيسية للمبنى',
            captionEn: 'Main building exterior',
            width: 1920,
            height: 1080,
          },
        ],
        itemizedExpenses: [
          {
            id: 'exp-nile-elec',
            nameAr: 'استهلاك كهرباء ومياه وتكييف',
            nameEn: 'Electricity, Water & AC',
            amount: 300,
            currency: 'EGP',
            isMandatory: true,
            isRecurring: true,
            recurringPeriod: 'MONTHLY',
          },
          {
            id: 'exp-nile-deposit',
            nameAr: 'تأمين استردادي',
            nameEn: 'Refundable Security Deposit',
            amount: 2000,
            currency: 'EGP',
            isMandatory: true,
            isRecurring: false,
          },
        ],
        units: [
          {
            id: 'unit-nile-101',
            propertyId: '',
            unitNumber: '101',
            floorNumber: 1,
            type: 'APARTMENT',
            isAvailable: true,
            durationUnit: 'MONTHLY',
            pricingUnit: 'PER_BED',
            bathroomsCount: 2,
            kitchensCount: 1,
            rooms: [
              {
                id: 'room-nile-101-a',
                unitId: 'unit-nile-101',
                roomNumber: 'A',
                type: 'SINGLE',
                isAvailable: true,
                pricePerMonthEgp: 3500,
                durationUnit: 'MONTHLY',
                pricingUnit: 'PER_ROOM',
                hasPrivateBathroom: true,
                hasBalcony: true,
                beds: [
                  {
                    id: 'bed-nile-101-a1',
                    roomId: 'room-nile-101-a',
                    bedNumber: 1,
                    label: 'Bed A1',
                    isAvailable: true,
                    pricePerMonthEgp: 3500,
                    durationUnit: 'MONTHLY',
                    pricingUnit: 'PER_BED',
                  },
                ],
              },
            ],
          },
        ],
        amenities: ['Elevator', 'Security 24/7', 'High-Speed Fiber WiFi', 'Study Hall'],
        rulesAr: ['ممنوع التدخين', 'الهدوء بعد الساعة ١١ مساء'],
        rulesEn: ['No smoking', 'Quiet hours after 11 PM'],
      },
      { Authorization: `Bearer ${providerId}:OWNER` },
    );

    expect(newListing.status).toBe(201);
    const listingId = newListing.body.data.id;
    expect(newListing.body.data.approvalStatus).toBe('PENDING_APPROVAL');

    // -----------------------------------------------------------------------
    // STEP 5: Admin Approves Listing in Moderation Queue (F13, F29)
    // -----------------------------------------------------------------------
    const pendingListings = await client.get('/api/v1/admin/moderation/properties', {
      Authorization: `Bearer ${admin.id}:ADMIN`,
    });
    expect(pendingListings.body.data.some((p: any) => p.id === listingId)).toBe(true);

    const approveListing = await client.post(
      `/api/v1/admin/moderation/properties/${listingId}/review`,
      { approved: true },
      { Authorization: `Bearer ${admin.id}:ADMIN` },
    );
    expect(approveListing.status).toBe(200);
    expect(approveListing.body.data.approvalStatus).toBe('APPROVED');
    expect(approveListing.body.data.isActive).toBe(true);

    // -----------------------------------------------------------------------
    // STEP 6: Public Search Discovery & Haversine Ranking (F14, F15)
    // -----------------------------------------------------------------------
    const searchRes = await client.get(
      '/api/v1/search?universityId=univ-cairo&areaId=area-dokki&maxPriceEgp=3000',
    );
    expect(searchRes.status).toBe(200);
    const discovered = searchRes.body.data.find((p: any) => p.id === listingId);
    expect(discovered).toBeDefined();
    expect(discovered.distanceToUniversityKm).toBeDefined();

    // -----------------------------------------------------------------------
    // STEP 7: Audit Log Verification for Administrative Actions (F30)
    // -----------------------------------------------------------------------
    const auditLogs = await client.get('/api/v1/admin/audit-logs', {
      Authorization: `Bearer ${admin.id}:ADMIN`,
    });
    expect(auditLogs.status).toBe(200);
    const kycLog = auditLogs.body.data.find(
      (l: any) => l.action === 'KYC_APPROVED' && l.targetId === providerId,
    );
    const listingLog = auditLogs.body.data.find(
      (l: any) => l.action === 'LISTING_APPROVED' && l.targetId === listingId,
    );

    expect(kycLog).toBeDefined();
    expect(kycLog.adminId).toBe(admin.id);
    expect(listingLog).toBeDefined();
    expect(listingLog.adminId).toBe(admin.id);
  });
});
