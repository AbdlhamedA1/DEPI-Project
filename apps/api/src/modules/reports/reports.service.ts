import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { AdminService } from '../admin/admin.service';
import { ReportStatus, ReportReason } from '@repo/shared-types';

export interface ReportRecord {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedPropertyId?: string;
  reportedReviewId?: string;
  targetType?: string;
  targetId?: string;
  reason: string;
  description: string;
  category?: string;
  details?: string;
  evidenceUrls?: string[];
  status: ReportStatus | string;
  adminNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ReportsService {
  private reports: ReportRecord[] = [];

  constructor(
    private readonly adminService: AdminService,
    @Optional()
    @Inject(DATABASE_CONNECTION)
    private readonly pool?: Pool,
  ) {}

  async create(data: any, currentUser?: any): Promise<ReportRecord> {
    const reporterId = currentUser?.id || data.reporterId || 'mock-user-1';

    const desc = data.description || data.details || data.reasonText || '';
    if (!desc || !desc.trim()) {
      throw new BadRequestException('تفاصيل البلاغ مطلوبة ولا يمكن أن تكون فارغة');
    }

    const report: ReportRecord = {
      id: randomUUID(),
      reporterId,
      reportedUserId: data.reportedUserId,
      reportedPropertyId: data.reportedPropertyId,
      reportedReviewId: data.reportedReviewId,
      targetType: data.targetType || (data.reportedPropertyId ? 'PROPERTY' : 'USER'),
      targetId: data.targetId || data.reportedPropertyId || data.reportedUserId || randomUUID(),
      reason: data.reason || ReportReason.MISLEADING_INFO,
      description: desc.trim(),
      category: data.category || data.reason,
      details: desc.trim(),
      evidenceUrls: data.evidenceUrls || [],
      status: ReportStatus.NEW,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.reports.unshift(report);

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO reports (
            id, reporter_id, reported_user_id, reported_property_id, reported_review_id,
            target_type, target_id, reason, details, evidence_urls, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            report.id,
            report.reporterId,
            report.reportedUserId || null,
            report.reportedPropertyId || null,
            report.reportedReviewId || null,
            report.targetType,
            report.targetId,
            report.reason,
            report.details,
            report.evidenceUrls || [],
            report.status,
            report.createdAt,
            report.updatedAt,
          ],
        );
      } catch {}
    }

    return report;
  }

  async findAll(): Promise<ReportRecord[]> {
    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, reporter_id as "reporterId", reported_user_id as "reportedUserId",
                  reported_property_id as "reportedPropertyId", reported_review_id as "reportedReviewId",
                  target_type as "targetType", target_id as "targetId", reason, details,
                  details as "description", evidence_urls as "evidenceUrls", status,
                  admin_notes as "adminNotes", resolved_by as "resolvedBy",
                  resolved_at as "resolvedAt", created_at as "createdAt", updated_at as "updatedAt"
           FROM reports ORDER BY created_at DESC`,
        );
        if (res.rows.length > 0) return res.rows;
      } catch {}
    }

    return this.reports;
  }

  async findByReporter(reporterId: string): Promise<ReportRecord[]> {
    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, reporter_id as "reporterId", reported_user_id as "reportedUserId",
                  reported_property_id as "reportedPropertyId", reported_review_id as "reportedReviewId",
                  target_type as "targetType", target_id as "targetId", reason, details,
                  details as "description", evidence_urls as "evidenceUrls", status,
                  admin_notes as "adminNotes", resolved_by as "resolvedBy",
                  resolved_at as "resolvedAt", created_at as "createdAt", updated_at as "updatedAt"
           FROM reports WHERE reporter_id = $1 ORDER BY created_at DESC`,
          [reporterId],
        );
        if (res.rows.length > 0) return res.rows;
      } catch {}
    }

    return this.reports.filter(r => r.reporterId === reporterId);
  }

  async findById(id: string): Promise<ReportRecord> {
    const rep = this.reports.find(r => r.id === id);
    if (rep) return rep;

    if (this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT id, reporter_id as "reporterId", reported_user_id as "reportedUserId",
                  reported_property_id as "reportedPropertyId", reported_review_id as "reportedReviewId",
                  target_type as "targetType", target_id as "targetId", reason, details,
                  details as "description", evidence_urls as "evidenceUrls", status,
                  admin_notes as "adminNotes", resolved_by as "resolvedBy",
                  resolved_at as "resolvedAt", created_at as "createdAt", updated_at as "updatedAt"
           FROM reports WHERE id = $1`,
          [id],
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch {}
    }

    throw new NotFoundException('البلاغ غير موجود');
  }

  async updateStatus(
    id: string,
    newStatus: string,
    adminNotes?: string,
    currentAdmin?: any,
  ): Promise<ReportRecord> {
    const report = await this.findById(id);

    const previousStatus = report.status;
    report.status = newStatus;
    if (adminNotes) report.adminNotes = adminNotes;
    report.updatedAt = new Date();

    const adminId = currentAdmin?.id || 'a0000000-0000-0000-0000-000000000001';

    if (
      newStatus === ReportStatus.RESOLVED ||
      newStatus === ReportStatus.CLOSED ||
      newStatus === ReportStatus.RESPONDED
    ) {
      report.resolvedBy = adminId;
      report.resolvedAt = new Date();
    }

    if (this.pool) {
      try {
        await this.pool.query(
          `UPDATE reports
           SET status = $1, admin_notes = $2, resolved_by = $3,
               resolved_at = CASE WHEN $1 IN ('RESOLVED', 'CLOSED', 'RESPONDED') THEN NOW() ELSE resolved_at END,
               updated_at = NOW()
           WHERE id = $4`,
          [newStatus, adminNotes || report.adminNotes || null, report.resolvedBy || null, id],
        );
      } catch {}
    }

    // Synchronous immutable admin action audit logging (BR-ADM-002 / F28-05)
    await this.adminService.logAdminAction(
      adminId,
      `REPORT_STATUS_UPDATE_${newStatus}`,
      'REPORT',
      id,
      {
        previousStatus,
        newStatus,
        adminNotes,
      },
    );

    return report;
  }
}
