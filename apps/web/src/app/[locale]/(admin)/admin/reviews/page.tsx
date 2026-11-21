import React from 'react';
import { Locale } from '../../../../../i18n/config';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';

export default function AdminReviewsPage({ params }: { params: { locale: Locale } }) {
  const isAr = params.locale === 'ar';

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAr ? 'إدارة ومراجعة التقييمات' : 'Review Moderation'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>
              {isAr ? 'تقييمات الطلاب قيد المراجعة' : 'Pending Student Reviews'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-bold">تقييم 5 نجوم بواسطة الطالب: أحمد علي</p>
                <p className="text-sm text-slate-600">
                  &quot;سكن هادئ ونظيف جداً والمالك محترم ومتعاون&quot;
                </p>
              </div>
              <Button size="sm">{isAr ? 'اعتماد النشر' : 'Approve'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
