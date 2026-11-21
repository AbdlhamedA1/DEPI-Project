import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';

export default function AdminVerificationsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'طلبات التحقق والتوثيق (KYC)' : 'KYC Document Verifications'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>
              {isAr ? 'الطلبات المعلقة للمراجعة والتدقيق' : 'Pending Verification Queue'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">حسن خليل (مالك)</span>
                  <Badge variant="warning">{isAr ? 'قيد المراجعة' : 'Pending Review'}</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? 'المستند: بطاقة رقم قومي + عقد ملكية عمارة الدقي'
                    : 'Document: National ID + Title Deed'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button size="sm">{isAr ? 'اعتماد التوثيق' : 'Approve'}</Button>
                <Button variant="danger" size="sm">
                  {isAr ? 'رفض' : 'Reject'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
