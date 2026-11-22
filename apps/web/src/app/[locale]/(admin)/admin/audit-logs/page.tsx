'use client';

import React, { useState } from 'react';
import { Shield, Lock, RotateCcw, ArrowRightLeft } from 'lucide-react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Input } from '../../../../../components/ui/input';

interface AuditLogItem {
  id: string;
  adminId: string;
  adminName: string;
  actionType: string;
  targetType: string;
  targetId: string;
  ipAddress: string;
  timestamp: string;
  details: Record<string, any>;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
}

export default function AdminAuditLogsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterTarget, setFilterTarget] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Initial audit entries reflecting live platform mutations
  const [logs] = useState<AuditLogItem[]>([
    {
      id: 'log-001',
      adminId: 'admin-super',
      adminName: 'مدير المنصة الرئيسي (Super Admin)',
      actionType: 'KYC_APPROVE',
      targetType: 'KYC_DOCUMENT',
      targetId: 'doc-kyc-0912',
      ipAddress: '197.38.14.22',
      timestamp: '2026-11-21T21:40:12Z',
      details: {
        providerId: 'provider-pending-kyc',
        documentType: 'NATIONAL_ID',
        decision: 'APPROVE',
      },
      beforeState: { verificationStatus: 'PENDING', isIdVerified: false },
      afterState: { verificationStatus: 'VERIFIED', isIdVerified: true },
    },
    {
      id: 'log-002',
      adminId: 'admin-moderator',
      adminName: 'مراقب الجودة (Operations Moderator)',
      actionType: 'PROPERTY_APPROVE',
      targetType: 'PROPERTY',
      targetId: 'prop-dokki-building',
      ipAddress: '156.204.88.91',
      timestamp: '2026-11-21T20:15:00Z',
      details: {
        approvalStatus: 'APPROVED',
        isActive: true,
        moderationNote: 'تمت مطابقة رخصة العقار وعنوان الدقي بنجاح',
      },
      beforeState: { approvalStatus: 'PENDING_APPROVAL', isActive: false },
      afterState: { approvalStatus: 'APPROVED', isActive: true },
    },
    {
      id: 'log-003',
      adminId: 'admin-super',
      adminName: 'مدير المنصة الرئيسي (Super Admin)',
      actionType: 'PROPERTY_SUSPEND',
      targetType: 'PROPERTY',
      targetId: 'prop-fake-scam-01',
      ipAddress: '197.38.14.22',
      timestamp: '2026-11-21T18:30:25Z',
      details: {
        reason: 'تكرار شكاوى الطلاب بشأن صور مضللة وغير مطابقة للواقع',
        approvalStatus: 'SUSPENDED',
      },
      beforeState: { approvalStatus: 'APPROVED', isActive: true },
      afterState: { approvalStatus: 'SUSPENDED', isActive: false, reason: 'صور مضللة' },
    },
    {
      id: 'log-004',
      adminId: 'admin-super',
      adminName: 'مدير المنصة الرئيسي (Super Admin)',
      actionType: 'USER_SUSPEND',
      targetType: 'USER',
      targetId: 'user-violator-332',
      ipAddress: '197.38.14.22',
      timestamp: '2026-11-21T16:10:44Z',
      details: {
        status: 'SUSPENDED',
        reason: 'انتهاك سياسة التواصل وإرسال رسائل غير لائقة',
      },
      beforeState: { status: 'ACTIVE' },
      afterState: { status: 'SUSPENDED', reason: 'سلوك مخالف لشروط الاستخدام' },
    },
    {
      id: 'log-005',
      adminId: 'admin-super',
      adminName: 'مدير المنصة الرئيسي (Super Admin)',
      actionType: 'PLATFORM_SETTING_UPDATE',
      targetType: 'PLATFORM_SETTING',
      targetId: 'global',
      ipAddress: '127.0.0.1',
      timestamp: '2026-11-21T14:00:00Z',
      details: {
        updatedKeys: ['maxActiveBookingsPerStudent', 'bookingExpirationHours'],
      },
      beforeState: { maxActiveBookingsPerStudent: 2, bookingExpirationHours: 72 },
      afterState: { maxActiveBookingsPerStudent: 3, bookingExpirationHours: 48 },
    },
  ]);

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'ALL' && log.actionType !== filterAction) return false;
    if (filterTarget !== 'ALL' && log.targetType !== filterTarget) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTarget = log.targetId.toLowerCase().includes(q);
      const matchAdmin =
        log.adminId.toLowerCase().includes(q) || log.adminName.toLowerCase().includes(q);
      const matchAction = log.actionType.toLowerCase().includes(q);
      if (!matchTarget && !matchAdmin && !matchAction) return false;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'KYC_APPROVE':
        return <Badge variant="success">{isAr ? 'اعتماد توثيق KYC' : 'KYC Approved'}</Badge>;
      case 'KYC_REJECT':
        return <Badge variant="danger">{isAr ? 'رفض توثيق KYC' : 'KYC Rejected'}</Badge>;
      case 'PROPERTY_APPROVE':
        return <Badge variant="success">{isAr ? 'اعتماد إعلان عقار' : 'Listing Approved'}</Badge>;
      case 'PROPERTY_SUSPEND':
        return <Badge variant="danger">{isAr ? 'تعليق إعلان عقار' : 'Listing Suspended'}</Badge>;
      case 'USER_SUSPEND':
        return <Badge variant="destructive">{isAr ? 'حظر / تعليق حساب' : 'User Suspended'}</Badge>;
      case 'USER_REACTIVATE':
        return <Badge variant="success">{isAr ? 'إعادة تفعيل حساب' : 'User Reactivated'}</Badge>;
      case 'PLATFORM_SETTING_UPDATE':
        return (
          <Badge variant="primary">{isAr ? 'تحديث إعدادات المنصة' : 'Settings Updated'}</Badge>
        );
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Immutability Attestation */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {isAr
                  ? 'سجل التدقيق الأمني غير القابل للتعديل'
                  : 'Immutable Audit Trail & Action Logs'}
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              {isAr
                ? 'سجل مركزي محمي بتريجر قاعدة بيانات PostgreSQL (BR-ADM-002) يوثق كافة القرارات الإدارية والتحويلات'
                : 'Central audit log guarded by PostgreSQL trigger (BR-ADM-002) capturing all administrative mutations'}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-emerald-800 text-xs font-semibold">
            <Lock className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <div>
              <div>{isAr ? 'حماية تامة ضد التعديل أو الحذف' : 'Strict Immutability Enforced'}</div>
              <div className="text-[10px] text-emerald-600 font-mono">
                PostgreSQL Trigger Active
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'البحث بالمعرف أو المشرف' : 'Search by ID or Admin'}
                </label>
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={
                    isAr ? 'ابحث برقم الإعلان أو المشرف...' : 'Search target ID or admin...'
                  }
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'نوع الإجراء الإداري' : 'Action Type'}
                </label>
                <select
                  value={filterAction}
                  onChange={e => setFilterAction(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="ALL">{isAr ? 'جميع الإجراءات' : 'All Actions'}</option>
                  <option value="KYC_APPROVE">{isAr ? 'اعتماد توثيق KYC' : 'KYC Approve'}</option>
                  <option value="KYC_REJECT">{isAr ? 'رفض توثيق KYC' : 'KYC Reject'}</option>
                  <option value="PROPERTY_APPROVE">
                    {isAr ? 'اعتماد إعلان' : 'Property Approve'}
                  </option>
                  <option value="PROPERTY_SUSPEND">
                    {isAr ? 'تعليق إعلان' : 'Property Suspend'}
                  </option>
                  <option value="USER_SUSPEND">{isAr ? 'تعليق مستخدم' : 'User Suspend'}</option>
                  <option value="PLATFORM_SETTING_UPDATE">
                    {isAr ? 'إعدادات المنصة' : 'Platform Settings'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'نوع الكيان المستهدف' : 'Target Entity'}
                </label>
                <select
                  value={filterTarget}
                  onChange={e => setFilterTarget(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="ALL">{isAr ? 'جميع الكيانات' : 'All Target Entities'}</option>
                  <option value="KYC_DOCUMENT">{isAr ? 'مستندات KYC' : 'KYC Documents'}</option>
                  <option value="PROPERTY">
                    {isAr ? 'العقارات والإعلانات' : 'Properties / Listings'}
                  </option>
                  <option value="USER">{isAr ? 'حسابات المستخدمين' : 'User Accounts'}</option>
                  <option value="PLATFORM_SETTING">
                    {isAr ? 'إعدادات النظام' : 'Platform Settings'}
                  </option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Entries List */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800">
              {isAr
                ? `السجلات المطابقة (${filteredLogs.length})`
                : `Filtered Audit Logs (${filteredLogs.length})`}
            </CardTitle>
            <span className="text-xs text-slate-500 font-mono">UTC Timestamped</span>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                {isAr
                  ? 'لا توجد سجلات تطابق شروط التصفية الحالية'
                  : 'No audit records match the current filters.'}
              </div>
            ) : (
              filteredLogs.map(log => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all shadow-sm space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {getActionBadge(log.actionType)}
                        <span className="font-bold text-slate-900">{log.adminName}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded">
                          {log.targetType}: {log.targetId}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-500">
                        <span className="font-mono text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          IP: {log.ipAddress}
                        </span>
                        <span className="font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                        </span>
                      </div>
                    </div>

                    {/* Quick summary line */}
                    <div className="text-xs text-slate-600 flex items-center justify-between pt-1">
                      <span className="line-clamp-1">
                        {log.details.reason
                          ? `${isAr ? 'السبب' : 'Reason'}: ${log.details.reason}`
                          : log.details.moderationNote
                            ? `${isAr ? 'ملاحظة المراجعة' : 'Note'}: ${log.details.moderationNote}`
                            : isAr
                              ? 'تم تنفيذ الإجراء بنجاح وتوثيقه في السجل'
                              : 'Action completed and permanently recorded'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="text-orange-600 hover:text-orange-700 font-semibold text-xs ml-2 cursor-pointer"
                      >
                        {isExpanded
                          ? isAr
                            ? 'إخفاء الفروقات ▲'
                            : 'Hide Diff ▲'
                          : isAr
                            ? 'عرض الفروقات (Diff) ▼'
                            : 'View Diff ▼'}
                      </button>
                    </div>

                    {/* Expandable Before/After JSON Diff Inspector */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                          <div className="font-bold text-red-700 mb-1 flex items-center gap-1.5">
                            <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                            <span>{isAr ? 'الحالة السابقة (Before State)' : 'Before State'}</span>
                          </div>
                          <pre className="text-[11px] text-red-900 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.beforeState || {}, null, 2)}
                          </pre>
                        </div>

                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                          <div className="font-bold text-emerald-700 mb-1 flex items-center gap-1.5">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isAr ? 'الحالة الجديدة (After State)' : 'After State'}</span>
                          </div>
                          <pre className="text-[11px] text-emerald-900 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.afterState || log.details || {}, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
