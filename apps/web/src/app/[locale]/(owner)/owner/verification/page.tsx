import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';

export default function OwnerVerificationPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'توثيق هوية المالك وسندات الملكية' : 'KYC Verification & Title Deeds'}
        </h1>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{isAr ? 'حالة التوثيق الرسمية' : 'Official Verification Status'}</CardTitle>
            <Badge variant="success">{isAr ? 'موثق ومعتمد ✓' : 'Verified & Approved ✓'}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              {isAr
                ? 'تم التحقق من بطاقة الرقم القومي وعقد ملكية العقار بنجاح بواسطة فريق العمليات.'
                : 'Your National ID and ownership deed have been successfully verified by our trust and safety operations team.'}
            </p>

            <div className="p-4 border border-slate-200 rounded-lg text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'نوع المستند:' : 'Document Type:'}</span>
                <span className="font-semibold">
                  {isAr ? 'بطاقة الرقم القومي + عقد ملكية مسجل' : 'National ID + Registered Deed'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {isAr ? 'تاريخ الاعتماد:' : 'Approval Date:'}
                </span>
                <span className="font-semibold">10 أغسطس 2026</span>
              </div>
            </div>

            <Button variant="outline">{isAr ? 'تحديث المستندات' : 'Update Documents'}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
