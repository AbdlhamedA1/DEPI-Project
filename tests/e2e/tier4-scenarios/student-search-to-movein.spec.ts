/**
 * Tier 4 Scenario 1 (S1): Relocating Student Search-to-Move-In Complete Journey
 * Features Exercised: F1, F2, F7, F14, F15, F16, F19, F21, F23, F24, F25, F26, F27
 * Domain Complexity: High
 *
 * Acceptance Criteria:
 * Relocating Assiut student registers with Cairo Univ, verifies OTP, searches within 3km of Dokki,
 * filters for room under 3500 EGP, submits request, contacts revealed, chats with owner,
 * both confirm agreement, contacts revealed, student reviews after move-in, owner responds.
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_PROVIDERS } from '../../fixtures/users.fixture';

describe('Tier 4 Scenario 1: Relocating Student Search-to-Move-In (S1)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  it('S1-E2E: Complete student lifecycle from registration, search, booking, chat, confirmation to review', async () => {
    // -----------------------------------------------------------------------
    // STEP 1: Student Phone OTP Request & Verification (F1)
    // -----------------------------------------------------------------------
    const studentPhone = '+201066778899';
    const otpReq = await client.post('/api/v1/auth/otp/request', { phone: studentPhone });
    expect(otpReq.status).toBe(200);
    expect(otpReq.body.data.message).toBe('OTP sent successfully');

    const otpVerify = await client.post('/api/v1/auth/otp/verify', {
      phone: studentPhone,
      code: '123456',
    });
    expect(otpVerify.status).toBe(200);
    expect(otpVerify.body.data.verified).toBe(true);
    const verificationToken = otpVerify.body.data.token;

    // -----------------------------------------------------------------------
    // STEP 2: Student Registration with Mandatory Cairo University Association (F2, F7)
    // -----------------------------------------------------------------------
    const regStudent = await client.post('/api/v1/students/register', {
      nameAr: 'إبراهيم محمود عبد الله',
      nameEn: 'Ibrahim Mahmoud Abdallah',
      email: 'ibrahim.mahmoud@students.cu.edu.eg',
      phone: studentPhone,
      gender: 'MALE',
      universityId: 'univ-cairo',
      faculty: 'Engineering',
      academicYear: 1,
      originGovernorateId: 'gov-assiut',
      enrollmentProofDocUrl: 'https://secure-docs.housing.eg/students/ibrahim-cert.pdf',
    });
    expect(regStudent.status).toBe(201);
    const studentId = regStudent.body.data.id;
    expect(regStudent.body.data.universityId).toBe('univ-cairo');
    expect(regStudent.body.data.originGovernorateId).toBe('gov-assiut');

    // -----------------------------------------------------------------------
    // STEP 3: Multi-Filter Search near Cairo University Campus in Dokki (F7, F14, F15)
    // -----------------------------------------------------------------------
    const searchRes = await client.get(
      '/api/v1/search?universityId=univ-cairo&areaId=area-dokki&maxDistanceKm=3&maxPriceEgp=3500&genderPolicy=MALE_ONLY',
    );
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBeGreaterThan(0);

    const targetProperty = searchRes.body.data[0];
    expect(targetProperty.id).toBe('prop-dokki-building');
    expect(targetProperty.basePriceEgp).toBeLessThanOrEqual(3500);
    expect(targetProperty.distanceToUniversityKm).toBeLessThanOrEqual(3.0);

    // -----------------------------------------------------------------------
    // STEP 4: Submit Booking Request for Bed B1 in Unit 101 (F16)
    // -----------------------------------------------------------------------
    const targetBedId = 'bed-dokki-101-b1';
    const bookReq = await client.post(
      '/api/v1/booking-requests',
      {
        propertyId: targetProperty.id,
        portionType: 'BED',
        portionId: targetBedId,
        proposedMoveInDate: '2026-10-01',
        proposedDurationUnit: 'MONTHLY',
        studentNotes: 'طالب في كلية الهندسة جامعة القاهرة من أسيوط، أرغب في سكن هادئ للدراسة.',
      },
      { Authorization: `Bearer ${studentId}:STUDENT` },
    );
    expect(bookReq.status).toBe(201);

    const bookingRequestId = bookReq.body.data.bookingRequest.id;
    const conversationId = bookReq.body.data.conversation.id;

    // -----------------------------------------------------------------------
    // STEP 5: Verify Mutual Contact Disclosure Transparency (F23)
    // -----------------------------------------------------------------------
    const contacts = bookReq.body.data.mutualContacts;
    expect(contacts).toBeDefined();
    expect(contacts.student.phone).toBe(studentPhone);
    expect(contacts.student.nameEn).toBe('Ibrahim Mahmoud Abdallah');
    expect(contacts.provider.nameEn).toBeDefined();
    expect(contacts.provider.phone).toBeDefined();

    // -----------------------------------------------------------------------
    // STEP 6: Direct 1:1 Messaging Tied to Request (F24)
    // -----------------------------------------------------------------------
    const provider = TEST_PROVIDERS[0]; // provider-mohamed-owner
    const studentMsg = await client.post(
      `/api/v1/conversations/${conversationId}/messages`,
      { text: 'السلام عليكم يا حاج محمد، هل يمكنني القدوم للمعاينة يوم الخميس القادم؟' },
      { Authorization: `Bearer ${studentId}:STUDENT` },
    );
    expect(studentMsg.status).toBe(201);

    const providerMsg = await client.post(
      `/api/v1/conversations/${conversationId}/messages`,
      { text: 'أهلاً بك يا ابني، تنور في أي وقت بعد صلاة العصر.' },
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(providerMsg.status).toBe(201);

    // -----------------------------------------------------------------------
    // STEP 7: Student Confirms Mutual Agreement with Contract Document (F21)
    // -----------------------------------------------------------------------
    const contractDocUrl = 'https://secure-docs.housing.eg/agreements/contract-ibrahim-101.pdf';
    const studentAgree = await client.post(
      `/api/v1/booking-requests/${bookingRequestId}/confirm-agreement`,
      { agreementDocUrl: contractDocUrl },
      { Authorization: `Bearer ${studentId}:STUDENT` },
    );
    expect(studentAgree.status).toBe(200);
    expect(studentAgree.body.data.confirmedBooking.studentAgreed).toBe(true);

    // -----------------------------------------------------------------------
    // STEP 8: Provider Confirms Mutual Agreement -> Status Becomes CONFIRMED (F21, F22)
    // -----------------------------------------------------------------------
    const providerAgree = await client.post(
      `/api/v1/booking-requests/${bookingRequestId}/confirm-agreement`,
      {},
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(providerAgree.status).toBe(200);
    expect(providerAgree.body.data.confirmedBooking.status).toBe('CONFIRMED');

    // Bed B1 is now unavailable
    const bedAvail = await client.get(
      `/api/v1/properties/${targetProperty.id}/portions/BED/${targetBedId}/availability`,
    );
    expect(bedAvail.body.data.isAvailable).toBe(false);

    // -----------------------------------------------------------------------
    // STEP 9: Post-Move-In Review Submission (F26)
    // -----------------------------------------------------------------------
    const reviewRes = await client.post(
      '/api/v1/reviews',
      {
        bookingRequestId,
        rating: 5,
        comment: 'السكن ممتاز جداً، قريب من الجامعة والإنترنت سريع والمالك متعاون للغاية.',
      },
      { Authorization: `Bearer ${studentId}:STUDENT` },
    );
    expect(reviewRes.status).toBe(201);
    const reviewId = reviewRes.body.data.id;
    expect(reviewRes.body.data.rating).toBe(5);

    // -----------------------------------------------------------------------
    // STEP 10: Provider Single Response to Review (F27)
    // -----------------------------------------------------------------------
    const responseRes = await client.post(
      `/api/v1/reviews/${reviewId}/response`,
      {
        responseText: 'شكراً جزيلاً يا إبراهيم، ربنا يوفقك في دراستك بكلية الهندسة.',
      },
      { Authorization: `Bearer ${provider.id}:OWNER` },
    );
    expect(responseRes.status).toBe(201);
    expect(responseRes.body.data.response.responseText).toContain('شكراً جزيلاً يا إبراهيم');
  });
});
