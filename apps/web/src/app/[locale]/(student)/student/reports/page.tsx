import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';

export default function StudentReportsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'البلاغات والشكاوى' : 'Reports & Disputes'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>
              {isAr ? 'تقديم بلاغ عن عقار أو مخالفة' : 'File a Report or Dispute'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              {isAr
                ? 'إذا لاحظت أي معلومات مضللة أو سلوك غير لائق من مالك، يمكنك إرسال بلاغ فوري للإدارة للتحقيق واتخاذ الإجراءات.'
                : 'If you encounter inaccurate listing details or improper conduct, file an incident report for administration review.'}
            </p>
            <Button variant="danger">{isAr ? 'تقديم بلاغ جديد' : 'Submit New Report'}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
