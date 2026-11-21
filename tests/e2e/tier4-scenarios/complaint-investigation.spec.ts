/**
 * Tier 4 Scenario 4 (S4): Fraudulent Listing Report & Admin Investigation Lifecycle
 * Features Exercised: F14 (Search & Discovery), F28 (User Complaint Submission),
 * F29 (Admin Moderation Queues), F30 (Immutable Administrative Audit Logging)
 * Domain Complexity: Medium
 *
 * Acceptance Criteria:
 * Student encounters a misleading listing with fake amenities in Shatby. Submits text report.
 * Admin opens ticket, marks UNDER_REVIEW, requests provider edits, and suspends listing.
 * Suspended listing is immediately unsearchable. Immutable audit log captures before/after diffs.
 */

import { describe, it, beforeEach, expect } from '../../harness/test-runner';
import { ApiContractClient } from '../../harness/api-contract-client';
import { TEST_STUDENTS, TEST_ADMINS } from '../../fixtures/users.fixture';

describe('Tier 4 Scenario 4: Fraudulent Listing Complaint & Moderation (S4)', () => {
  let client: ApiContractClient;

  beforeEach(() => {
    client = new ApiContractClient();
  });

  it('S4-E2E: Complete complaint lifecycle from submission, admin investigation, listing takedown, and audit trail', async () => {
    const student = TEST_STUDENTS[2]; // student-omar in Alexandria
    const admin = TEST_ADMINS[0];
    const reportedPropertyId = 'prop-shatby-villa';

    // -----------------------------------------------------------------------
    // STEP 1: Verify Property is Initially Visible in Search Results
    // -----------------------------------------------------------------------
    const initialSearch = await client.get('/api/v1/search?areaId=area-shatby');
    expect(initialSearch.status).toBe(200);
    expect(initialSearch.body.data.some((p: any) => p.id === reportedPropertyId)).toBe(true);

    // -----------------------------------------------------------------------
    // STEP 2: Student Submits Text-Only Complaint Against Property (F28)
    // -----------------------------------------------------------------------
    const complaintRes = await client.post(
      '/api/v1/reports',
      {
        targetEntityType: 'PROPERTY',
        targetEntityId: reportedPropertyId,
        reason: 'MISLEADING_LISTING',
        description:
          'الإعلان يذكر وجود مصعد وتكييف مركزي وإطلالة بحرية مباشرة، ولكن بعد المعاينة تبين عدم وجود مصعد والغرفة تطل على منور داخلي.',
      },
      { Authorization: `Bearer ${student.id}:STUDENT` },
    );
    expect(complaintRes.status).toBe(201);
    const complaintId = complaintRes.body.data.id;
    expect(complaintRes.body.data.status).toBe('NEW');
    expect(complaintRes.body.data.reporterId).toBe(student.id);

    // -----------------------------------------------------------------------
    // STEP 3: Admin Reviews Complaint & Marks UNDER_REVIEW (F29, F30)
    // -----------------------------------------------------------------------
    const underReviewRes = await client.patch(
      `/api/v1/reports/${complaintId}/status`,
      {
        status: 'UNDER_REVIEW',
        resolutionNotes: 'تم فتح تحقيق والتواصل مع المالك لمطابقة الصور على أرض الواقع.',
      },
      { Authorization: `Bearer ${admin.id}:ADMIN` },
    );
    expect(underReviewRes.status).toBe(200);
    expect(underReviewRes.body.data.status).toBe('UNDER_REVIEW');
    expect(underReviewRes.body.data.adminResolutionNotes).toContain('تم فتح تحقيق');

    // -----------------------------------------------------------------------
    // STEP 4: Admin Suspends Misleading Property Listing (F29, F30)
    // -----------------------------------------------------------------------
    const suspendRes = await client.post(
      `/api/v1/admin/moderation/properties/${reportedPropertyId}/suspend`,
      {
        reason: 'تم تعليق الإعلان لمخالفة معايير الشفافية واحتوائه على معلومات وصور مضللة.',
      },
      { Authorization: `Bearer ${admin.id}:ADMIN` },
    );
    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.approvalStatus).toBe('SUSPENDED');
    expect(suspendRes.body.data.isActive).toBe(false);

    // -----------------------------------------------------------------------
    // STEP 5: Verify Suspended Property is Removed from Public Search (F14)
    // -----------------------------------------------------------------------
    const searchAfterSuspension = await client.get('/api/v1/search?areaId=area-shatby');
    expect(searchAfterSuspension.body.data.some((p: any) => p.id === reportedPropertyId)).toBe(
      false,
    );

    // -----------------------------------------------------------------------
    // STEP 6: Admin Closes Complaint with Resolution Verdict (F28, F30)
    // -----------------------------------------------------------------------
    const closeRes = await client.patch(
      `/api/v1/reports/${complaintId}/status`,
      {
        status: 'CLOSED',
        resolutionNotes:
          'تم إيقاف الإعلان نهائياً وإلزام المالك بتعديل البيانات والصور قبل طلب إعادة التفعيل.',
      },
      { Authorization: `Bearer ${admin.id}:ADMIN` },
    );
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data.status).toBe('CLOSED');

    // -----------------------------------------------------------------------
    // STEP 7: Verify Immutable Administrative Action Audit Logs (F30)
    // -----------------------------------------------------------------------
    const auditRes = await client.get('/api/v1/admin/audit-logs', {
      Authorization: `Bearer ${admin.id}:ADMIN`,
    });
    expect(auditRes.status).toBe(200);

    const logs = auditRes.body.data;
    // Verify suspension log
    const suspensionLog = logs.find(
      (l: any) => l.action === 'LISTING_SUSPENDED' && l.targetId === reportedPropertyId,
    );
    expect(suspensionLog).toBeDefined();
    expect(suspensionLog.adminId).toBe(admin.id);
    expect(suspensionLog.beforeState.approvalStatus).toBe('APPROVED');
    expect(suspensionLog.afterState.approvalStatus).toBe('SUSPENDED');
    expect(suspensionLog.timestamp).toBeDefined();

    // Verify complaint updates log
    const complaintLogs = logs.filter(
      (l: any) => l.action === 'COMPLAINT_STATUS_UPDATE' && l.targetId === complaintId,
    );
    expect(complaintLogs.length).toBeGreaterThanOrEqual(2); // UNDER_REVIEW and CLOSED
  });
});
