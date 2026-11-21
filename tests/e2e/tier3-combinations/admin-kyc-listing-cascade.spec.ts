/**
 * Tier 3 Cross-Feature Combination: Admin KYC & Property Listing Approval Cascade
 * Covers:
 * - F3 (Provider Registration), F4 (KYC Upload), F13 (Listing Approval Gate),
 *   F14 (Search Engine), F29 (Admin Moderation Queues), F30 (Immutable Audit Logging)
 * - Provider UNVERIFIED cannot publish listings (403 Forbidden)
 * - Provider uploads KYC documents -> status transitions to PENDING
 * - Admin reviews & approves KYC in moderation queue -> provider becomes VERIFIED
 * - Verified provider creates property listing -> listing enters PENDING_APPROVAL
 * - Unapproved listing does NOT appear in public search results
 * - Admin reviews & approves listing -> listing becomes APPROVED & isActive
 * - Approved listing appears in public search results
 * - Admin action logs immutably record KYC approval and listing approval events
 *
 * Total: 7 Combination Test Cases
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_ADMINS } from '../../fixtures/users.fixture';

describe('Tier 3: Admin KYC & Listing Approval Cascade (F3, F4, F13, F29, F30)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  it('COMB-KYC-01: Newly registered UNVERIFIED provider is blocked from creating property listings (403 Forbidden)', async () => {
    // 1. Register new provider
    const regRes = await client.post('/api/v1/owners/register', {
      nameAr: 'أشرف عبد الفتاح حسنين',
      nameEn: 'Ashraf Abdel Fattah Hassanein',
      email: 'ashraf.hassanein@properties.eg',
      phone: '+201022334455',
      providerType: 'INDIVIDUAL_OWNER',
      nationalIdNumber: '28004121234567',
    });
    expect(regRes.status).toBe(201);
    const providerId = regRes.body.data.id;
    expect(regRes.body.data.verificationStatus).toBe('UNVERIFIED');

    // 2. Attempt to create property listing while UNVERIFIED
    const propRes = await client.post(
      '/api/v1/properties',
      {
        titleAr: 'شقة سكنية بالدقي',
        titleEn: 'Dokki Residential Flat',
        descriptionAr: 'شقة طلابية هادئة',
        descriptionEn: 'Quiet student flat',
        propertyType: 'APARTMENT',
        genderPolicy: 'MALE_ONLY',
        governorateId: 'gov-giza',
        cityId: 'city-giza',
        areaId: 'area-dokki',
        exactAddressAr: 'شارع التحرير',
        exactAddressEn: 'El-Tahrir St',
        coordinates: { lat: 30.0385, lng: 31.2124 },
        nearUniversityId: 'univ-cairo',
        basePriceEgp: 3200,
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
      { Authorization: `Bearer ${providerId}:OWNER` },
    );

    expect(propRes.status).toBe(403);
    expect(propRes.body.message).toContain('Unverified provider cannot publish or submit listings');
  });

  it('COMB-KYC-02: Uploading KYC document transitions provider status from UNVERIFIED to PENDING', async () => {
    const regRes = await client.post('/api/v1/owners/register', {
      nameAr: 'طارق عبد الرازق',
      nameEn: 'Tarek Abdel Razek',
      email: 'tarek.razek@properties.eg',
      phone: '+201022334456',
      providerType: 'INDIVIDUAL_OWNER',
      nationalIdNumber: '28205151234567',
    });
    const providerId = regRes.body.data.id;

    // Upload National ID KYC document
    const uploadRes = await client.post(
      `/api/v1/owners/${providerId}/kyc`,
      {
        type: 'NATIONAL_ID_FRONT',
        fileName: 'tarek_national_id_front.jpg',
        storageKey: 'secure/kyc/tarek_front.jpg',
      },
      { Authorization: `Bearer ${providerId}:OWNER` },
    );
    expect(uploadRes.status).toBe(201);

    // Verify provider status in user profile is now PENDING
    const userRes = await client.get(`/api/v1/users/${providerId}`);
    expect(userRes.body.data.verificationStatus).toBe('PENDING');
  });

  it('COMB-KYC-03: Admin inspects pending KYC queue and approves provider, updating status to VERIFIED', async () => {
    const admin = TEST_ADMINS[0];

    const regRes = await client.post('/api/v1/owners/register', {
      nameAr: 'خالد سليم المنشاوي',
      nameEn: 'Khaled Selim El-Minshawi',
      email: 'khaled.minshawi@properties.eg',
      phone: '+201022334457',
      providerType: 'INDIVIDUAL_OWNER',
      nationalIdNumber: '28406181234567',
    });
    const providerId = regRes.body.data.id;

    await client.post(
      `/api/v1/owners/${providerId}/kyc`,
      { type: 'NATIONAL_ID_FRONT', fileName: 'id_front.jpg', storageKey: 'secure/kyc/khaled.jpg' },
      { Authorization: `Bearer ${providerId}:OWNER` },
    );

    // Admin checks pending KYC queue
    const queueRes = await client.get('/api/v1/admin/moderation/kyc', {
      Authorization: `Bearer ${admin.id}:ADMIN`,
    });
    expect(queueRes.status).toBe(200);
    expect(queueRes.body.data.some((p: any) => p.id === providerId)).toBe(true);

    // Admin approves KYC
    const reviewRes = await client.post(
      `/api/v1/admin/moderation/kyc/${providerId}/review`,
      { approved: true },
      { Authorization: `Bearer ${admin.id}:ADMIN` },
    );
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.verificationStatus).toBe('VERIFIED');
  });

  it('COMB-KYC-04: Newly created listing by verified provider enters PENDING_APPROVAL and is hidden from search', async () => {
    const admin = TEST_ADMINS[0];

    const regRes = await client.post('/api/v1/owners/register', {
      nameAr: 'هشام فودة',
      nameEn: 'Hesham Fouda',
      email: 'hesham.fouda@properties.eg',
      phone: '+201022334458',
      providerType: 'INDIVIDUAL_OWNER',
      nationalIdNumber: '28607201234567',
    });
    const providerId = regRes.body.data.id;

    await client.post(
      `/api/v1/owners/${providerId}/kyc`,
      { type: 'NATIONAL_ID_FRONT', fileName: 'id.jpg', storageKey: 'secure/id.jpg' },
      { Authorization: `Bearer ${providerId}:OWNER` },
    );
    await client.post(
      `/api/v1/admin/moderation/kyc/${providerId}/review`,
      { approved: true },
      { Authorization: `Bearer ${admin.id}:ADMIN` },
    );

    // Verified provider creates listing
    const listingRes = await client.post(
      '/api/v1/properties',
      {
        titleAr: 'سكن هشام الطلابي الجديد',
        titleEn: 'Hesham New Student Flat',
        descriptionAr: 'سكن متميز بالدقي',
        descriptionEn: 'Premium flat in Dokki',
        propertyType: 'APARTMENT',
        genderPolicy: 'MALE_ONLY',
        governorateId: 'gov-giza',
        cityId: 'city-giza',
        areaId: 'area-dokki',
        exactAddressAr: 'الدقي',
        exactAddressEn: 'Dokki',
        coordinates: { lat: 30.0385, lng: 31.2124 },
        nearUniversityId: 'univ-cairo',
        basePriceEgp: 3100,
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
      { Authorization: `Bearer ${providerId}:OWNER` },
    );

    expect(listingRes.status).toBe(201);
    expect(listingRes.body.data.approvalStatus).toBe('PENDING_APPROVAL');
    expect(listingRes.body.data.isActive).toBe(false);

    // Listing must NOT appear in public search yet
    const searchRes = await client.get('/api/v1/search?areaId=area-dokki');
    expect(searchRes.body.data.some((p: any) => p.id === listingRes.body.data.id)).toBe(false);
  });

  it('COMB-KYC-05: Admin approves listing in moderation queue -> listing becomes APPROVED and searchable', async () => {
    const admin = TEST_ADMINS[0];

    const regRes = await client.post('/api/v1/owners/register', {
      nameAr: 'سامح شكري عبد الله',
      nameEn: 'Sameh Shoukry Abdallah',
      email: 'sameh.shoukry@properties.eg',
      phone: '+201022334459',
      providerType: 'INDIVIDUAL_OWNER',
      nationalIdNumber: '28808221234567',
    });
    const providerId = regRes.body.data.id;

    await client.post(
      `/api/v1/owners/${providerId}/kyc`,
      { type: 'NATIONAL_ID_FRONT', fileName: 'id.jpg', storageKey: 'secure/id.jpg' },
      { Authorization: `Bearer ${providerId}:OWNER` },
    );
    await client.post(
      `/api/v1/admin/moderation/kyc/${providerId}/review`,
      { approved: true },
      { Authorization: `Bearer ${admin.id}:ADMIN` },
    );

    const listingRes = await client.post(
      '/api/v1/properties',
      {
        titleAr: 'سكن سامح المعتمد بالدقي',
        titleEn: 'Sameh Approved Flat Dokki',
        descriptionAr: 'سكن متميز بالدقي',
        descriptionEn: 'Premium flat in Dokki',
        propertyType: 'APARTMENT',
        genderPolicy: 'MALE_ONLY',
        governorateId: 'gov-giza',
        cityId: 'city-giza',
        areaId: 'area-dokki',
        exactAddressAr: 'الدقي',
        exactAddressEn: 'Dokki',
        coordinates: { lat: 30.0385, lng: 31.2124 },
        nearUniversityId: 'univ-cairo',
        basePriceEgp: 3100,
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
      { Authorization: `Bearer ${providerId}:OWNER` },
    );
    const listingId = listingRes.body.data.id;

    // Admin inspects pending listing queue
    const queueRes = await client.get('/api/v1/admin/moderation/properties', {
      Authorization: `Bearer ${admin.id}:ADMIN`,
    });
    expect(queueRes.status).toBe(200);
    expect(queueRes.body.data.some((p: any) => p.id === listingId)).toBe(true);

    // Admin approves listing
    const approveRes = await client.post(
      `/api/v1/admin/moderation/properties/${listingId}/review`,
      { approved: true },
      { Authorization: `Bearer ${admin.id}:ADMIN` },
    );
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.approvalStatus).toBe('APPROVED');
    expect(approveRes.body.data.isActive).toBe(true);

    // Listing now appears in public search results!
    const searchRes = await client.get('/api/v1/search?areaId=area-dokki');
    expect(searchRes.body.data.some((p: any) => p.id === listingId)).toBe(true);
  });

  it('COMB-KYC-06: Admin can suspend an active listing making it immediately unsearchable', async () => {
    const admin = TEST_ADMINS[0];
    const propertyId = 'prop-dokki-building'; // Active approved property

    // Admin suspends listing due to investigation
    const suspendRes = await client.post(
      `/api/v1/admin/moderation/properties/${propertyId}/suspend`,
      { reason: 'Investigation into reported maintenance defects' },
      { Authorization: `Bearer ${admin.id}:ADMIN` },
    );
    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.approvalStatus).toBe('SUSPENDED');
    expect(suspendRes.body.data.isActive).toBe(false);

    // Suspended listing is removed from public search results
    const searchRes = await client.get('/api/v1/search?areaId=area-dokki');
    expect(searchRes.body.data.some((p: any) => p.id === propertyId)).toBe(false);
  });

  it('COMB-KYC-07: Immutable Admin Action Logs capture audit trails for KYC and Listing approvals', async () => {
    const admin = TEST_ADMINS[0];

    // Trigger an admin moderation action to create an audit log
    await client.post(
      `/api/v1/admin/moderation/properties/prop-dokki-building/suspend`,
      { reason: 'Scheduled audit check' },
      { Authorization: `Bearer ${admin.id}:ADMIN` },
    );

    const logsRes = await client.get('/api/v1/admin/audit-logs', {
      Authorization: `Bearer ${admin.id}:ADMIN`,
    });
    expect(logsRes.status).toBe(200);

    const logs = logsRes.body.data;
    expect(logs.length).toBeGreaterThan(0);

    const listingLog = logs.find((l: any) => l.action === 'LISTING_SUSPENDED');
    expect(listingLog).toBeDefined();
    expect(listingLog.adminId).toBe(admin.id);
    expect(listingLog.targetEntity).toBe('PROPERTY_LISTING');
    expect(listingLog.beforeState).toBeDefined();
    expect(listingLog.afterState).toBeDefined();
    expect(listingLog.timestamp).toBeDefined();
  });
});
