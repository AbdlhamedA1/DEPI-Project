import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

export default function AdminAuditLogsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'سجل العمليات والتدقيق الأمني' : 'System Audit Logs'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>
              {isAr ? 'آخر النشاطات الإدارية المسجلة' : 'Recent Admin Activities'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between">
              <span>[2026-11-21 00:15:32] ADMIN_APPROVE_KYC: User #312 verified by Admin #1</span>
              <Badge variant="success">OK</Badge>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between">
              <span>
                [2026-11-20 22:40:10] PROPERTY_PUBLISHED: Property #108 published by Admin #2
              </span>
              <Badge variant="success">OK</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
